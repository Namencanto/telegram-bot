import { Deposit, Transaction, User } from '../config/models.js';
import log from '../utils/logger.js';
import stockService from '../services/stock.js';

const userController = {
  start: async (ctx) => {
    try {
      ctx.session.prefixMode = false;
      ctx.session.countrySelection = false;
      ctx.session.awaitingDepositAmount = false;
      
    const user = await User.findOne({ where: { telegram_id: ctx.from.id } });
    if (!user) {
      await User.create({ telegram_id: ctx.from.id });
    }

    const currentLang = ctx.i18n.language || 'en';
    let languageButtons = [];

    if (currentLang === 'en') {
      languageButtons = [
        { text: ctx.i18n.t('set_lang_ru') },
        { text: ctx.i18n.t('set_lang_zh') },
      ];
    } else if (currentLang === 'ru') {
      languageButtons = [
        { text: ctx.i18n.t('set_lang_en') },
        { text: ctx.i18n.t('set_lang_zh') },
      ];
    } else {
      languageButtons = [
        { text: ctx.i18n.t('set_lang_en') },
        { text: ctx.i18n.t('set_lang_ru') },
      ];
    }

   ctx.reply(ctx.i18n.t('welcome'), {
      reply_markup: {
        keyboard: [
          [languageButtons[0], languageButtons[1]],
          [{ text: ctx.i18n.t('buy_country') }],
          [{ text: ctx.i18n.t('query_stock') }],
          [{ text: ctx.i18n.t('deposit_funds') }],
          [{ text: ctx.i18n.t('account_info') }],
        ],
        resize_keyboard: true,
        one_time_keyboard: false,
      },
    });
  } catch (error) {
    log.error(`Error in start for user ${ctx.from.id}:`, error);
    ctx.reply(ctx.i18n.t('error_occurred'));
  }
  },
  accountInfo: async (ctx) => {
    try {
      let user = await User.findOne({ where: { telegram_id: ctx.from.id } });
    if (!user) {
      user = await User.create({ telegram_id: ctx.from.id });
      return ctx.reply(ctx.i18n.t('account_details', {
        id: user.telegram_id,
        username: ctx.from.username || 'N/A',
        registrationDate: user.createdAt.toLocaleString(),
        totalPurchaseQuantity: 0,
        totalPurchaseAmount: '0.00',
        balance: '0.00',
      }));
    }

    const transactionsCount = await Transaction.count({ where: { user_id: user.telegram_id, type: 'purchase' } });
    const totalPurchaseAmount = await Transaction.sum('amount', { where: { user_id: user.telegram_id, type: 'purchase' } }) || 0;
    ctx.reply(ctx.i18n.t('account_details', {
      id: user.telegram_id,
      username: `${ctx.from?.first_name} ${ctx.from?.last_name}`,
      registrationDate: user.createdAt.toLocaleString(),
      totalPurchaseQuantity: transactionsCount,
      totalPurchaseAmount: totalPurchaseAmount.toFixed(2),
      balance: user.balance,
    }));
    } catch (error) {
      log.error(`Error in accountInfo for user ${ctx.from.id}:`, error);
      ctx.reply(ctx.i18n.t('error_occurred'));
    }
  },
  queryStock: async (ctx) => {
    const userId = ctx.from.id;
    log(`User ${userId} requested current stock.`);
    try {
      const stock = await stockService.getStock();
      const stockMessage = stock.map(s => ctx.i18n.t('stock_info', {
        country: s.country,
        count: s.count,
        normalPrice: s.normalPrice,
        bulkPrice: s.bulkPrice,
        bulkThreshold: s.bulkThreshold,
      })).join('\n');
      
      log(`Current stock for user ${userId}: \n${stockMessage}`);
      ctx.reply(stockMessage);
    } catch (error) {
      log(`Error fetching stock for user ${userId}:`, error);
      ctx.reply(ctx.i18n.t('error_occurred'));
    }
  },
  depositFunds: async (ctx) => {
    try {
      const user = await User.findOne({ where: { telegram_id: ctx.from.id } });
      if (!user) {
        await User.create({ telegram_id: ctx.from.id });
      }
      ctx.reply(ctx.i18n.t('enter_amount'));
      ctx.session.awaitingDepositAmount = true;
    } catch (error) {
      log.error(`Error in depositFunds for user ${ctx.from.id}:`, error);
      ctx.reply(ctx.i18n.t('error_occurred'));
    }
  },
  cancelDeposit: async (ctx) => {
    try {
      const depositId = ctx.match[0].split('_')[2];
      const deposit = await Deposit.findOne({ where: { id: depositId, confirmed: false } });

      if (!deposit) {
        log(`Deposit not found or already confirmed for ID ${depositId}.`);
        return ctx.reply(ctx.i18n.t('deposit_not_found_or_confirmed'));
      }

      await deposit.destroy();
      log(`Deposit with ID ${depositId} has been canceled.`);

      ctx.reply(ctx.i18n.t('deposit_canceled'));
    } catch (error) {
      log.error(`Error in cancelDeposit for user ${ctx.from.id}:`, error);
      ctx.reply(ctx.i18n.t('error_occurred'));
    }
  },
};

export default userController;
