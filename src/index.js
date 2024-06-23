import { config } from 'dotenv';
config();
import { Telegraf } from 'telegraf';
import TelegrafSessionLocal from 'telegraf-session-local';
import { initializeDatabase } from './config/index.js';
import userController from './controllers/user.js';
import buyingController from './controllers/buying.js';
import adminController from './controllers/admin.js';
import depositController from './controllers/deposit.js';
import log from './utils/logger.js';
import i18n from './config/i18n.js';
import handleTextInput from './middlewares/handleTextInput.js';
import { setupCronJobs } from './jobs/index.js';
import IPN from './IPN.js'
import express from 'express';

const botToken = process.env.BOT_TOKEN;
export const bot = new Telegraf(botToken);

const localSession = new TelegrafSessionLocal();
bot.use(localSession.middleware());

const app = express();

app.use(express.json());

const setupAdminMiddleware = (bot, adminIds) => {
  bot.use((ctx, next) => {
    const userId = ctx.from.id.toString();
    if (adminIds.includes(userId)) {
      ctx.state.isAdmin = true;
    }
    return next();
  });
};

// todo fix the logic of changing languages, it works when the language is set by default, but after changing the buttons do not work
const setupLanguageMiddleware = (bot) => {
  bot.use(async (ctx, next) => {
    const lang = ctx?.i18n?.language || ctx.from.language_code || 'en';
    ctx.i18n = i18n.cloneInstance();
    ctx.i18n.changeLanguage(lang);
    await next();
  });
};

const setupBotCommands = (bot) => {
  bot.start((ctx) => userController.start(ctx));
  bot.action(/country_.*/, (ctx) => buyingController.selectCountry(ctx, bot));
  bot.action(/quantity_.*/, (ctx) => buyingController.selectCountryQuantity(ctx));
  bot.action(/custom_.*/, (ctx) => buyingController.handleCustomCountryQuantity(ctx));
  bot.action(/cancel_deposit_.*/, (ctx) => userController.cancelDeposit(ctx));
  bot.action(/^currency_/, async (ctx) => {
    const currency = ctx.match.input.replace('currency_', '');
    const amount = ctx.session.depositAmount;

    if (!amount || isNaN(amount) || amount <= 0) {
      return ctx.reply(ctx.i18n.t('invalid_amount'));
    }
  
    try {
      await depositController.createDeposit(ctx, amount, currency);
    } catch (error) {
      log.error(`Error handling deposit creation for user ${ctx.from.id}:`, error);
      return ctx.reply(ctx.i18n.t('error_occurred'));
    }
  });
  bot.command('addstock', (ctx) => adminController.addStock(ctx));

  bot.on('text', (ctx) => handleTextInput(ctx, bot));
};

const startApp = async () => {
  try {
    const db = await initializeDatabase();
    await db.sequelize.authenticate();
    console.log('Connection has been established successfully.');

    const adminIds = process.env.ADMIN_TELEGRAM_IDS.split(',').map(id => id.trim());

    setupAdminMiddleware(bot, adminIds);
    setupLanguageMiddleware(bot);
    setupBotCommands(bot);

    setupCronJobs(bot);
    
    app.use(IPN);

    log('Bot is running...');
    await bot.launch();


  } catch (err) {
    log.error('Bot launch error', err);
  }
};

startApp();

export default bot;
