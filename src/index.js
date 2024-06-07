import { config } from 'dotenv';
config();
import { Telegraf } from 'telegraf';
import TelegrafSessionLocal from 'telegraf-session-local';
import { initializeDatabase } from './config/index.js';
import userController from './controllers/user.js';
import adminController from './controllers/admin.js';
import log from './utils/logger.js';
import { checkDeposits } from './services/payment.js';
import i18n from './config/i18n.js';

const botToken = process.env.BOT_TOKEN;
const bot = new Telegraf(botToken);

const localSession = new TelegrafSessionLocal();
bot.use(localSession.middleware());

const startApp = async () => {
  try {
    const db = await initializeDatabase();

    await db.sequelize.authenticate();
    console.log('Connection has been established successfully.');

    // Middleware to handle language detection and translation
    bot.use(async (ctx, next) => {
      const lang = ctx.from.language_code || 'en';
      ctx.i18n = i18n.cloneInstance();
      ctx.i18n.changeLanguage(lang);
      await next();
    });

    bot.start((ctx) => userController.start(ctx));
    bot.action('buy_country', (ctx) => userController.buyCountry(ctx));
    bot.action(/country_.*/, (ctx) => userController.selectCountry(ctx));
    bot.action(/quantity_.*/, (ctx) => userController.selectQuantity(ctx));
    bot.action(/custom_.*/, (ctx) => userController.customQuantity(ctx));
    bot.action('buy_bulk', (ctx) => userController.buyBulk(ctx));
    bot.action(/bulk_.*/, (ctx) => userController.selectBulkQuantity(ctx));
    bot.action('bulk_custom', (ctx) => userController.customBulkQuantity(ctx));
    bot.action('query_stock', (ctx) => userController.queryStock(ctx));
    bot.action('deposit_funds', (ctx) => userController.depositFunds(ctx, bot));
    bot.action('check_balance', (ctx) => userController.checkBalance(ctx));
    bot.on('text', (ctx) => userController.handleCustomQuantity(ctx)); // Add this line

    const adminIds = process.env.ADMIN_TELEGRAM_IDS.split(',').map(id => id.trim());

    bot.use((ctx, next) => {
      if (ctx.update.message && adminIds.includes(ctx.update.message.from.id.toString())) {
        ctx.state.isAdmin = true;
      }
      return next();
    });

    bot.command('addstock', (ctx) => adminController.addStock(ctx));

    await bot.launch();
    log('Bot is running...');

    checkDeposits();

  } catch (err) {
    log.error('Bot launch error', err);
  }
};

startApp();

setInterval(checkDeposits, 60000);

export default bot;
