  
  import moment from 'moment';
  import log from '../utils/logger.js';

export const predefinedButtons = (prefix) => {
    const buttons = [
      { text: '1', callback_data: `${prefix}_1` },
      { text: '2', callback_data: `${prefix}_2` },
      { text: '5', callback_data: `${prefix}_5` },
      { text: '10', callback_data: `${prefix}_10` },
      { text: '20', callback_data: `${prefix}_20` },
      { text: '25', callback_data: `${prefix}_25` },
      { text: '50', callback_data: `${prefix}_50` },
      { text: '100', callback_data: `${prefix}_100` },
      { text: '200', callback_data: `${prefix}_200` },
      { text: '250', callback_data: `${prefix}_200` },
      { text: '500', callback_data: `${prefix}_500` },
      { text: '1000', callback_data: `${prefix}_1000` },
    ];
  
    const inlineKeyboard = [];
    for (let i = 0; i < buttons.length; i += 2) {
      inlineKeyboard.push(buttons.slice(i, i + 2));
    }
  
    return inlineKeyboard;
  };


export const sendKeysDocument = async (ctx, keys, country, prefix, totalPrice, quantity) => {
  const keysString = keys.map(key => `${key.number}|${key.mm}|${key.yyyy}|${key.code}|${key.otherinfo || ''}`).join('\n');
  const currentDate = moment().format('YYYYMMDD');
  const filename = `${currentDate}_${quantity}_keys_${country}${prefix ? `_${prefix}` : ''}_${totalPrice.toFixed(2)}.txt`;

  await ctx.replyWithDocument({
    source: Buffer.from(keysString, 'utf-8'),
    filename: filename,
  });

  log(`Successfully sent ${quantity} keys${prefix ? ` with prefix ${prefix}` : ''} to user with ID ${ctx.from.id} for country ${country}. Filename: ${filename}`);
};