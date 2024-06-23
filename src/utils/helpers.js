  
  import moment from 'moment';
  import log from '../utils/logger.js';

export const predefinedButtons = (prefix) => {
    const buttons = [
      { text: '1', callback_data: `${prefix}_1` },
      { text: '2', callback_data: `${prefix}_2` },
      { text: '5', callback_data: `${prefix}_5` },
      { text: '10', callback_data: `${prefix}_10` },
      { text: '25', callback_data: `${prefix}_25` },
      { text: '50', callback_data: `${prefix}_50` },
      { text: '100', callback_data: `${prefix}_100` },
      { text: '200', callback_data: `${prefix}_200` },
    ];
  
    const inlineKeyboard = [];
    for (let i = 0; i < buttons.length; i += 2) {
      inlineKeyboard.push(buttons.slice(i, i + 2));
    }
  
    return inlineKeyboard;
  };


export const sendKeysDocument = async (ctx, keys, country, prefix, totalPrice, quantity) => {
  const currentDate = moment().format('YYYYMMDD');
  const filename = `${currentDate}_${quantity}_keys_${country}${prefix ? `_${prefix}` : ''}_${totalPrice.toFixed(2)}.txt`;

  await ctx.replyWithDocument({
    source: Buffer.from(keys.join('\n'), 'utf-8'),
    filename: filename,
  });

  log(`Successfully sent ${quantity} keys${prefix ? ` with prefix ${prefix}` : ''} to user with ID ${ctx.from.id} for country ${country}. Filename: ${filename}`);
};

export const sendDepositDetails = async (ctx, deposit, ongoing = false) => {
  let message = '';

  if (ongoing) {
    message += `${ctx.i18n.t('ongoing_deposit_message')}\n`;
  }

  message += `
    \n${ctx.i18n.t('actual_payment_amount', { amount: deposit.pay_amount, currency: deposit.pay_currency.toUpperCase() })}
    \n${ctx.i18n.t('payment_address', { address: deposit.address })}
    \n\n⚠️${ctx.i18n.t('transfer_warning')}
    \n⚠️${ctx.i18n.t('payment_timeout')}
  `;

  await ctx.replyWithPhoto(
    { source: Buffer.from(deposit.qrCodeUrl.split(',')[1], 'base64') },
    {
      caption: message,
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [{ text: ctx.i18n.t('cancel_deposit'), callback_data: `cancel_deposit_${deposit.id}` }],
        ],
      },
    }
  );
};

export const checkPaymentDifference = (paymentDetails, deposit) => {
  console.log(deposit)
  console.log(paymentDetails)
  const payAmount = paymentDetails.outcome_amount;
  const depositAmount = deposit.amount;

  const difference = Math.abs(depositAmount - payAmount);
  const percentageDifference = (difference / depositAmount) * 100;

  if (percentageDifference > 10) {
    log(`Deposit ID: ${deposit.id} - Deposit Amount: ${depositAmount}, Paid Amount: ${payAmount}, Difference: ${difference}, Percentage Difference: ${percentageDifference.toFixed(2)}%`);
    throw new Error('Payment amount differs from deposit amount by more than 1%');
  }
}