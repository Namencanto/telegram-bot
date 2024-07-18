import { User, Deposit } from '../config/models.js';
import db from '../config/index.js';
import { Op } from 'sequelize';
import log from '../utils/logger.js';
import nowPaymentsApi from '../config/nowPaymentsApi.js';
import i18n from '../config/i18n.js';

export const checkDeposits = async (bot) => {
  log('Checking deposits...');
  try {
    const deposits = await Deposit.findAll({
      where: {
        confirmed: false,
        expires_at: { [Op.gt]: new Date(Date.now() - 30 * 60 * 1000) },
      },
    });

    log(`Found ${deposits.length} unconfirmed deposits to check.`);

    for (const deposit of deposits) {
      try {
        log(`Checking deposit ${deposit.id} for user ${deposit.user_id}.`);
        const response = await nowPaymentsApi.get(`/payment/${deposit.payment_id}`);
        const paymentDetails = response.data;

        const user = await User.findOne({ where: { telegram_id: deposit.user_id } });
        const userLang = user.lang;
        const lang = i18n.cloneInstance({ lng: userLang });
        console.log(paymentDetails.actually_paid)
        console.log(paymentDetails)
        if (paymentDetails.payment_status === 'finished') {
          await db.sequelize.transaction(async (t) => {
            await deposit.update({ confirmed: true }, { transaction: t });

            if (paymentDetails.actually_paid >= paymentDetails.pay_amount) {
              await user.update({ balance: +user.balance + +paymentDetails.price_amount * 0.97 }, { transaction: t });
            }
          });

          log(`Deposit ${deposit.id} confirmed for user ${deposit.user_id}.`);
          bot.telegram.sendMessage(deposit.user_id, lang.t('deposit_confirmed', { amount: deposit.amount }));
        } else {
          log(`Deposit ${deposit.id} for user ${deposit.user_id} not confirmed. Payment status: ${paymentDetails.payment_status}`);
        }
      } catch (error) {
        if (error.response && error.response.status === 404) {
          log(`Deposit ${deposit.id} for user ${deposit.user_id} not found.`);
          continue;
        }
        log.error(`Error processing deposit ${deposit.id} for user ${deposit.user_id}:`, error);
      }
    }

    // Check for expired deposits
    const expiredDeposits = await Deposit.findAll({
      where: {
        confirmed: false,
        expires_at: { [Op.lte]: new Date() },
      },
    });

    for (const deposit of expiredDeposits) {
      try {
        await deposit.destroy();
        const user = await User.findOne({ where: { telegram_id: deposit.user_id } });
        const userLang = user.lang;
        const lang = i18n.cloneInstance({ lng: userLang });
        
        bot.telegram.sendMessage(deposit.user_id, lang.t('deposit_expired', { amount: deposit.amount }));
        log(`Deposit ${deposit.id} for user ${deposit.user_id} has expired and was canceled.`);
      } catch (error) {
        log.error(`Error deleting expired deposit ${deposit.id} for user ${deposit.user_id}:`, error);
      }
    }

  } catch (error) {
    log.error('Error checking deposits:', error);
  }
};
