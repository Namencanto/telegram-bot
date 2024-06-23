import { User, Stock, Key, Transaction } from "../config/models.js";
import stockService from "../services/stock.js";
import log from "../utils/logger.js";
import { predefinedButtons, sendKeysDocument } from "../utils/helpers.js";

const buyingController = {
  buyCountry: async (ctx) => {
    try {
        const stocks = await Stock.findAll({ attributes: ['country'], group: ['country'] });
    
        if (!stocks.length) {
          log('No countries available in stock.');
          return ctx.reply(ctx.i18n.t('no_countries_available'));
        }
    
        const availableCountries = stocks.map(stock => stock.country);
        const inlineKeyboard = availableCountries.map(country => [{ text: country, callback_data: `country_${country}` }]);
    
        ctx.reply(ctx.i18n.t('choose_country'), {
          reply_markup: {
            inline_keyboard: inlineKeyboard,
          },
        });
      } catch (error) {
        log.error(`Error in buyCountry for user ${ctx.from.id}:`, error);
        ctx.reply(ctx.i18n.t('error_occurred'));
      }
  },
  selectCountry: async (ctx, bot) => {
    try {
        ctx.session.prefixMode = null;

        const country = ctx.match[0].split("_")[1];
        const stock = await Stock.findOne({ where: { country } });
    
        if (!stock) {
          log(`Stock not found for country ${country}.`);
          return ctx.reply(ctx.i18n.t("stock_not_found", { country }));
        }
    
        const availableKeysCount = await Key.count({
          where: {
            stock_id: stock.id,
            used: false,
          },
        });
    
        const responseMessage = `
    ${ctx.i18n.t('country_selection', {
          country,
          normal_price: stock.normal_price,
          bulk_price: stock.bulk_price,
          bulk_threshold: stock.bulk_threshold,
          quantity: availableKeysCount,
        })}
    
    ${ctx.i18n.t('enter_prefix_or_quantity')}
        `;
    
        ctx.reply(responseMessage, {
          reply_markup: {
            inline_keyboard: predefinedButtons(`quantity_${country}`),
          },
        });
    
        ctx.session.countrySelection = { country };
      } catch (error) {
        log.error(`Error in selectCountry for user ${ctx.from.id}:`, error);
        ctx.reply(ctx.i18n.t("error_occurred"));
      }
  },
  selectCountryQuantity: async (ctx) => {
    try {
      const [_, country, qty] = ctx.match[0].split("_");
      if (qty === "custom") {
        ctx.session.customQuantity = { type: "country", country: country };
        return ctx.reply(ctx.i18n.t("custom_quantity", { country: country }));
      }
      const quantity = parseInt(qty, 10);

      if (isNaN(quantity)) {
        return ctx.reply(ctx.i18n.t("invalid_quantity"));
      }

      await buyingController.processCountryPurchase(ctx, country, quantity);
    } catch (error) {
      log.error(
        `Error in selectCountryQuantity for user ${ctx.from.id}:`,
        error
      );
      ctx.reply(ctx.i18n.t("error_occurred"));
    }
  },
  handleCustomCountryQuantity: async (ctx) => {
    if (!ctx.session.customQuantity) {
      return;
    }

    try {
      const { country } = ctx.session.customQuantity;
      const [_,, qty] = ctx.match[0].split("_");
      if (qty === "custom") {
        ctx.session.customQuantity = { type: "country", country: country };
        return ctx.reply(ctx.i18n.t("custom_quantity", { country: country }));
      }
      const quantity = parseInt(qty, 10);


      if (isNaN(quantity) || quantity <= 0) {
        return ctx.reply(ctx.i18n.t("invalid_quantity"));
      }

      ctx.session.customQuantity = null;
      await buyingController.processCountryPurchase(ctx, country, quantity);
    } catch (error) {
      log.error(
        `Error in handleCustomCountryQuantity for user ${ctx.from.id}:`,
        error
      );
      ctx.reply(ctx.i18n.t("error_occurred"));
    }
  },
  processCountryPurchase: async (ctx, country, quantity) => {
    try {
      const user = await User.findOne({ where: { telegram_id: ctx.from.id } });
      const stock = await Stock.findOne({ where: { country } });
      if (!stock) {
        log(`Stock not found for country ${country}.`);
        return ctx.reply(ctx.i18n.t("stock_not_found", { country: country }));
      }

      const pricePerKey =
        quantity >= stock.bulk_threshold
          ? parseFloat(stock.bulk_price)
          : parseFloat(stock.normal_price);
      const totalPrice = pricePerKey * quantity;

      if (user.balance < totalPrice) {
        log(
          `User with ID ${user.id} has insufficient balance. Required: ${totalPrice}, Available: ${user.balance}`
        );
        return ctx.reply(ctx.i18n.t("insufficient_balance"));
      }
      const keys = await stockService.buyKeys(user, country, quantity);
      if (!keys) {
        log(
          `Not enough stock for user with ID ${user.id} requesting ${quantity} keys for country ${country}.`
        );
        return ctx.reply(ctx.i18n.t("not_enough_stock"));
      }

      await user.update({ balance: user.balance - totalPrice });
      log(
        `Updated balance for user with ID ${user.id}. New balance: ${
          user.balance - totalPrice
        }`
      );

      await sendKeysDocument(ctx, keys, country, null, totalPrice, quantity);

      await Transaction.create({
        user_id: user.telegram_id,
        amount: totalPrice,
        type: 'purchase'
      });

      return ctx.reply(
        ctx.i18n.t("current_balance", { balance: user.balance - totalPrice })
      );
    } catch (error) {
      log.error(
        `Error in processCountryPurchase for user ${ctx.from.id}:`,
        error
      );
      ctx.reply(ctx.i18n.t("error_occurred"));
    }
  },
};

export default buyingController;
