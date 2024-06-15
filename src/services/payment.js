import TronWeb from 'tronweb';
import { User, Deposit } from '../config/models.js';
import db from '../config/index.js';
import { Op } from 'sequelize';
import generateQRCode from './qrCode.js';
import bot from '../index.js';
import log from '../utils/logger.js';

const tronWeb = new TronWeb({
  fullHost: process.env.TRON_URL,
  privateKey: process.env.TRON_PRIVATE_KEY,
});

const usdtContractAddress = 'TXLAQ63Xg1NAzckPwKHvzw7CSEmLMEqcdj'; // USDT contract address on testnet

const generateDepositAddress = async (userId, amount) => {
  try {
    const newAccount = await tronWeb.createAccount();
    const depositAddress = newAccount.address.base58;

    const qrCodeUrl = await generateQRCode(depositAddress);

    const deposit = await Deposit.create({
      user_id: userId,
      address: depositAddress,
      amount,
      confirmed: false,
      expires_at: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes from now
    });

    return {qrCodeUrl, depositAddress, depositId: deposit.id};
  } catch (error) {
    log('Error generating deposit address:', error);
    throw error;
  }
};

const getUsdtBalance = async (address) => {
  const contract = await tronWeb.contract().at(usdtContractAddress);
  const balance = await contract.methods.balanceOf(address).call();
  return tronWeb.toDecimal(balance);
};

const checkDeposits = async () => {
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
        const usdtBalance = await getUsdtBalance(deposit.address);
        log(`USDT balance for address ${deposit.address} is ${usdtBalance}. Required: ${deposit.amount}`);
        
        if (usdtBalance >= deposit.amount) {
          await db.sequelize.transaction(async (t) => {
            await deposit.update({ confirmed: true }, { transaction: t });
            const user = await User.findOne({ where: { telegram_id: deposit.user_id }, transaction: t });
            await user.update({ balance: user.balance + deposit.amount }, { transaction: t });
          });

          log(`Deposit ${deposit.id} confirmed for user ${deposit.user_id}.`);
          // Notify user
          bot.telegram.sendMessage(deposit.user_id, `Your deposit of ${deposit.amount} USDT has been confirmed.`);
        } else {
          log(`Deposit ${deposit.id} for user ${deposit.user_id} not confirmed due to insufficient balance.`);
        }
      } catch (error) {
        log.error(`Error processing deposit ${deposit.id} for user ${deposit.user_id}:`, error);
      }
    }
  } catch (error) {
    log.error('Error checking deposits:', error);
  }
};

export { generateDepositAddress, checkDeposits };