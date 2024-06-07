import { User } from '../config/models.js';
import stockService from '../services/stock.js';
import { generateDepositAddress } from '../services/payment.js';
import log from '../utils/logger.js';

const predefinedButtons = (prefix) => {
  return [
    [{ text: '1', callback_data: `${prefix}_1` }],
    [{ text: '2', callback_data: `${prefix}_2` }],
    [{ text: '5', callback_data: `${prefix}_5` }],
    [{ text: '10', callback_data: `${prefix}_10` }],
    [{ text: '20', callback_data: `${prefix}_20` }],
    [{ text: '25', callback_data: `${prefix}_25` }],
    [{ text: '50', callback_data: `${prefix}_50` }],
    [{ text: '100', callback_data: `${prefix}_100` }],
    [{ text: '200', callback_data: `${prefix}_200` }],
    [{ text: '500', callback_data: `${prefix}_500` }],
    [{ text: '1000', callback_data: `${prefix}_1000` }],
    [{ text: 'Custom', callback_data: `${prefix}_custom` }]
  ];
};

const userController = {
  start: async (ctx) => {
    try {
      const user = await User.findOne({ where: { telegram_id: ctx.from.id } });
      if (!user) {
        await User.create({ telegram_id: ctx.from.id });
      }

      ctx.reply(ctx.i18n.t('welcome'), {
        reply_markup: {
          inline_keyboard: [
            [{ text: ctx.i18n.t('buy_country'), callback_data: 'buy_country' }],
            [{ text: ctx.i18n.t('buy_bulk'), callback_data: 'buy_bulk' }],
            [{ text: ctx.i18n.t('query_stock'), callback_data: 'query_stock' }],
            [{ text: ctx.i18n.t('deposit_funds'), callback_data: 'deposit_funds' }],
            [{ text: ctx.i18n.t('check_balance'), callback_data: 'check_balance' }]
          ]
        }
      });
    } catch (error) {
      log.error(`Error in start for user ${ctx.from.id}:`, error);
      ctx.reply(ctx.i18n.t('error_occurred'));
    }
  },
  buyCountry: (ctx) => {
    try {
      ctx.reply(ctx.i18n.t('choose_country'), {
        reply_markup: {
          inline_keyboard: [
            [{ text: 'USA', callback_data: 'country_USA' }],
            [{ text: 'Canada', callback_data: 'country_Canada' }],
            [{ text: 'UK', callback_data: 'country_UK' }],
          ]
        }
      });
    } catch (error) {
      log.error(`Error in buyCountry for user ${ctx.from.id}:`, error);
      ctx.reply(ctx.i18n.t('error_occurred'));
    }
  },
  selectCountry: async (ctx) => {
    try {
      const country = ctx.match[0].split('_')[1];
      ctx.reply(ctx.i18n.t('enter_quantity'), {
        reply_markup: {
          inline_keyboard: predefinedButtons(`quantity_${country}`)
        }
      });
    } catch (error) {
      log.error(`Error in selectCountry for user ${ctx.from.id}:`, error);
      ctx.reply(ctx.i18n.t('error_occurred'));
    }
  },
  selectQuantity: async (ctx) => {
    try {
      const [_, country, qty] = ctx.match[0].split('_');
      if (qty === 'custom') {
        ctx.session.customQuantity = { type: 'country', country: country };
        return ctx.reply(ctx.i18n.t('custom_quantity', { country: country }));
      }
      const quantity = parseInt(qty, 10);

      if (isNaN(quantity)) {
        return ctx.reply(ctx.i18n.t('invalid_quantity'));
      }

      let user = await User.findOne({ where: { telegram_id: ctx.from.id } });
      if (!user) {
        user = await User.create({ telegram_id: ctx.from.id });
      }

      const pricePerKey = 5.00;
      const totalPrice = pricePerKey * quantity;

      if (user.balance < totalPrice) {
        return ctx.reply(ctx.i18n.t('insufficient_balance'));
      }

      await user.update({ balance: user.balance - totalPrice });
      const keys = await stockService.getKeys(country, quantity);
      if (keys.length < quantity) {
        return ctx.reply(ctx.i18n.t('not_enough_stock'));
      }

      ctx.reply(ctx.i18n.t('purchase_successful'), { document: { source: Buffer.from(keys.join('\n'), 'utf-8'), filename: 'keys.txt' } });
    } catch (error) {
      log.error(`Error in selectQuantity for user ${ctx.from.id}:`, error);
      ctx.reply(ctx.i18n.t('error_occurred'));
    }
  },
  customQuantity: async (ctx) => {
    try {
      const country = ctx.match[0].split('_')[1];
      ctx.session.customQuantity = { type: 'country', country: country };
      ctx.reply(ctx.i18n.t('custom_quantity_prompt'));
    } catch (error) {
      log.error(`Error in customQuantity for user ${ctx.from.id}:`, error);
      ctx.reply(ctx.i18n.t('error_occurred'));
    }
  },
  handleCustomQuantity: async (ctx) => {
    if (!ctx.session.customQuantity) {
      return;
    }

    try {
      const { type, country } = ctx.session.customQuantity;
      const quantity = parseInt(ctx.message.text, 10);

      if (isNaN(quantity) || quantity <= 0) {
        return ctx.reply(ctx.i18n.t('invalid_quantity'));
      }

      let user = await User.findOne({ where: { telegram_id: ctx.from.id } });
      if (!user) {
        user = await User.create({ telegram_id: ctx.from.id });
      }

      const pricePerKey = type === 'country' ? 5.00 : 4.50;
      const totalPrice = pricePerKey * quantity;

      if (user.balance < totalPrice) {
        return ctx.reply(ctx.i18n.t('insufficient_balance'));
      }

      await user.update({ balance: user.balance - totalPrice });
      const keys = type === 'country' ? await stockService.getKeys(country, quantity) : await stockService.getBulkKeys(quantity);
      if (keys.length < quantity) {
        return ctx.reply(ctx.i18n.t('not_enough_stock'));
      }

      ctx.reply(ctx.i18n.t('purchase_successful'), { document: { source: Buffer.from(keys.join('\n'), 'utf-8'), filename: 'keys.txt' } });
      ctx.session.customQuantity = null; // Clear session after handling
    } catch (error) {
      log.error(`Error in handleCustomQuantity for user ${ctx.from.id}:`, error);
      ctx.reply(ctx.i18n.t('error_occurred'));
    }
  },
  buyBulk: (ctx) => {
    try {
      ctx.reply(ctx.i18n.t('bulk_quantity'), {
        reply_markup: {
          inline_keyboard: predefinedButtons('bulk')
        }
      });
    } catch (error) {
      log.error(`Error in buyBulk for user ${ctx.from.id}:`, error);
      ctx.reply(ctx.i18n.t('error_occurred'));
    }
  },
  selectBulkQuantity: async (ctx) => {
    try {
      const [_, qty] = ctx.match[0].split('_');
      if (qty === 'custom') {
        return ctx.reply(ctx.i18n.t('custom_bulk_quantity_prompt'));
      }
      const quantity = parseInt(qty, 10);
      console.log(quantity)
      if (isNaN(quantity)) {
        return ctx.reply(ctx.i18n.t('invalid_quantity'));
      }

      let user = await User.findOne({ where: { telegram_id: ctx.from.id } });
      if (!user) {
        user = await User.create({ telegram_id: ctx.from.id });
      }

      const pricePerKey = 4.50;
      const totalPrice = pricePerKey * quantity;

      if (user.balance < totalPrice) {
        return ctx.reply(ctx.i18n.t('insufficient_balance'));
      }

      await user.update({ balance: user.balance - totalPrice });
      const keys = await stockService.getBulkKeys(quantity);
      if (keys.length < quantity) {
        return ctx.reply(ctx.i18n.t('not_enough_stock'));
      }

      ctx.reply(ctx.i18n.t('purchase_successful'), { document: { source: Buffer.from(keys.join('\n'), 'utf-8'), filename: 'keys.txt' } });
    } catch (error) {
      log.error(`Error in selectBulkQuantity for user ${ctx.from.id}:`, error);
      ctx.reply(ctx.i18n.t('error_occurred'));
    }
  },
  customBulkQuantity: async (ctx) => {
    try {
      ctx.reply(ctx.i18n.t('custom_bulk_quantity_prompt'));
      bot.on('text', async (ctx) => {
        try {
          const quantity = parseInt(ctx.message.text, 10);
          if (isNaN(quantity) || quantity <= 0) {
            return ctx.reply(ctx.i18n.t('invalid_quantity'));
          }

          let user = await User.findOne({ where: { telegram_id: ctx.from.id } });
          if (!user) {
            user = await User.create({ telegram_id: ctx.from.id });
          }

          const pricePerKey = 4.50;
          const totalPrice = pricePerKey * quantity;

          if (user.balance < totalPrice) {
            return ctx.reply(ctx.i18n.t('insufficient_balance'));
          }

          await user.update({ balance: user.balance - totalPrice });
          const keys = await stockService.getBulkKeys(quantity);
          if (keys.length < quantity) {
            return ctx.reply(ctx.i18n.t('not_enough_stock'));
          }

          ctx.reply(ctx.i18n.t('purchase_successful'), { document: { source: Buffer.from(keys.join('\n'), 'utf-8'), filename: 'keys.txt' } });
        } catch (error) {
          log.error(`Error in customBulkQuantity for user ${ctx.from.id}:`, error);
          ctx.reply(ctx.i18n.t('error_occurred'));
        }
      });
    } catch (error) {
      log.error(`Error in customBulkQuantity for user ${ctx.from.id}:`, error);
      ctx.reply(ctx.i18n.t('error_occurred'));
    }
  },
  queryStock: async (ctx) => {
    const userId = ctx.from.id;
    log(`User ${userId} requested current stock.`);
    try {
      const stock = await stockService.getStock();
      const stockMessage = stock.map(s => `Country: ${s.country}, Count: ${s.count}, Average Price: $${s.avgPrice}`).join('\n');
      log(`Current stock for user ${userId}: \n${stockMessage}`);
      ctx.reply(stockMessage);
    } catch (error) {
      log(`Error fetching stock for user ${userId}:`, error);
      ctx.reply(ctx.i18n.t('error_occurred'));
    }
  },
  depositFunds: async (ctx, bot) => {
    try {
      const user = await User.findOne({ where: { telegram_id: ctx.from.id } });
      if (!user) {
        await User.create({ telegram_id: ctx.from.id });
      }
      ctx.reply(ctx.i18n.t('enter_amount'));
      bot.on('text', async (ctx) => {
        try {
          const amount = parseFloat(ctx.message.text);
          if (isNaN(amount) || amount <= 0) {
            return ctx.reply(ctx.i18n.t('invalid_amount'));
          }

          const qrCodeUrl = await generateDepositAddress(ctx.from.id, amount);
          const base64Data = qrCodeUrl.replace(/^data:image\/png;base64,/, "");
          const qrCodeBuffer = Buffer.from(base64Data, 'base64');
          ctx.replyWithPhoto({ source: qrCodeBuffer }, { caption: ctx.i18n.t('deposit_caption', { amount }) });
        } catch (error) {
          log.error(`Error generating deposit address for user ${ctx.from.id}:`, error);
          ctx.reply(ctx.i18n.t('error_occurred'));
        }
      });
    } catch (error) {
      log.error(`Error in depositFunds for user ${ctx.from.id}:`, error);
      ctx.reply(ctx.i18n.t('error_occurred'));
    }
  },
  checkBalance: async (ctx) => {
    try {
      let user = await User.findOne({ where: { telegram_id: ctx.from.id } });
      if (!user) {
        user = await User.create({ telegram_id: ctx.from.id });
        return ctx.reply(ctx.i18n.t('current_balance', { balance: 0 }));
      }
      ctx.reply(ctx.i18n.t('current_balance', { balance: user.balance }));
    } catch (error) {
      log.error(`Error in checkBalance for user ${ctx.from.id}:`, error);
      ctx.reply(ctx.i18n.t('error_occurred'));
    }
  }
};

export default userController;
