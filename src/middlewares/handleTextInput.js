import { Key, User } from '../config/models.js';
import adminController from '../controllers/admin.js';
import buyingController from '../controllers/buying.js';
import userController from '../controllers/user.js';
import depositService from '../services/deposit.js';
import { handlePrefixMode } from '../services/modes.js';
import generateQRCode from '../services/qrCode.js';
import { sendDepositDetails, sendKeysDocument } from '../utils/helpers.js';
import log from '../utils/logger.js';

const handleTextInput = async (ctx, bot) => {
    const text = ctx.message.text;

    // Check if a delay is already in progress
    if (ctx.session.delayInProgress) {
      return ctx.reply(ctx.i18n.t('too_many_requests'));
  }

  // Set delay in progress
  ctx.session.delayInProgress = true;

  // Delay for 1 second
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Reset delay in progress
  ctx.session.delayInProgress = false;

      // Check if the user is in broadcast mode
  if (ctx.session.broadcasting) {
    ctx.session.broadcasting = false; // Reset the session state
    return adminController.broadcastMessage(ctx, bot);
  }

    // Check if the text matches any of the commands
    const commandHandlers = {
      'buy_country': buyingController.buyCountry,
      'query_stock': userController.queryStock,
      'deposit_funds': async (ctx) => {
        let ongoingDeposit = await depositService.checkOngoingDeposit(ctx.from.id);

        if (ongoingDeposit) {
          const qrCodeUrl = await generateQRCode(ongoingDeposit.address);
          ongoingDeposit.qrCodeUrl = qrCodeUrl;
          return await sendDepositDetails(ctx, ongoingDeposit, true)
        }
        ctx.session.awaitingDepositAmount = true;
        return ctx.reply(ctx.i18n.t('enter_amount'));
      },
      'account_info': userController.accountInfo,
    };
  
    const command = Object.keys(commandHandlers).find((key) => ctx.i18n.t(key) === text);
    if (command) {
      return commandHandlers[command](ctx);
    }
  
     // Check if the text matches any language change
  if (text === ctx.i18n.t('set_lang_en')) {
    ctx.i18n.changeLanguage('en');
    ctx.session.language = 'en';
    await userController.start(ctx);
  } else if (text === ctx.i18n.t('set_lang_ru')) {
    ctx.session.language = 'ru';
    ctx.i18n.changeLanguage('ru');
    await userController.start(ctx);
  } else if (text === ctx.i18n.t('set_lang_zh')) {
    ctx.session.language = 'zh';
    ctx.i18n.changeLanguage('zh');
    await userController.start(ctx);
  }
  
// Handle deposit amount input
if (ctx.session.awaitingDepositAmount) {
  ctx.session.awaitingDepositAmount = false;
  const amount = parseFloat(text);
  if (isNaN(amount) || amount <= 0) {
    return ctx.reply(ctx.i18n.t('invalid_amount'));
  }

  ctx.session.depositAmount = amount;

  return ctx.reply(ctx.i18n.t('choose_currency'), {
    reply_markup: {
      inline_keyboard: [
        [{ text: 'USDT (ERC20)', callback_data: 'currency_usdterc20' }],
        [{ text: 'USDT (SOL)', callback_data: 'currency_usdtsol' }],
        [{ text: 'BTC', callback_data: 'currency_btc' }],
        [{ text: 'ETH', callback_data: 'currency_eth' }],
        [{ text: 'SOL', callback_data: 'currency_sol' }],
        [{ text: 'LTC', callback_data: 'currency_ltc' }]
      ],
    },
  });
}

    // Prefix mode logic
  if (ctx.session && ctx.session.prefixMode && ctx.session.prefixMode.active) {
    const { country, prefix, availableKeys, stock } = ctx.session.prefixMode;
    const quantity = parseInt(ctx.message.text.trim(), 10);

    if (isNaN(quantity) || quantity <= 0) {
      return ctx.reply(ctx.i18n.t('invalid_quantity'));
    }

    if (availableKeys.length < quantity) {
      log(`Not enough keys available with prefix ${prefix} for country ${country}. Requested: ${quantity}, Available: ${availableKeys.length}`);
      return ctx.reply(ctx.i18n.t("not_enough_stock"));
    }

    const user = await User.findOne({ where: { telegram_id: ctx.from.id } });
    if (!user) {
      return ctx.reply(ctx.i18n.t("error_occurred"));
    }
    const specialPriceMultiplier = process.env.SPECIAL_PRICE_MULTIPLIER;

    const specialPrice = parseFloat(stock.normal_price) * +specialPriceMultiplier;
    const totalPrice = specialPrice * quantity;

    if (user.balance < totalPrice) {
      log(`User with ID ${user.id} has insufficient balance. Required: ${totalPrice}, Available: ${user.balance}`);
      return ctx.reply(ctx.i18n.t("insufficient_balance"));
    }

    await user.update({ balance: user.balance - totalPrice });
    await Key.update({ used: true }, { where: { id: availableKeys.slice(0, quantity).map(key => key.id) } });

    await sendKeysDocument(ctx, availableKeys.slice(0, quantity), country, prefix, totalPrice, quantity);

    ctx.reply(ctx.i18n.t('current_balance', { balance: (user.balance - totalPrice).toFixed(2) }));

    ctx.session.prefixMode.active = false;
  } else if (ctx.session && ctx.session.countrySelection) {
    const country = ctx.session.countrySelection.country;
    const input = ctx.message.text.trim();
    console.log(ctx)
    if (/^\d{6}$/.test(input)) {
      await handlePrefixMode(ctx, country, input);
    } else {
      const quantity = parseInt(input, 10);
      console.log(quantity)
    console.log(ctx)
    if (isNaN(quantity) || quantity <= 0) {
        ctx.reply(ctx.i18n.t('invalid_quantity'));
        ctx.session.countrySelection = { country }; // Retain the country selection state
      } else {
        await buyingController.processCountryPurchase(ctx, country, quantity);
      }
    }
  }
};

export default handleTextInput;
