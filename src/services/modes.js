import { Key, Stock } from '../config/models.js';
import log from '../utils/logger.js';
import Sequelize from 'sequelize';
import moment from 'moment';

export const handlePrefixMode = async (ctx, country, prefix) => {
  try {
    const stock = await Stock.findOne({ where: { country } });
    if (!stock) {
      log(`Stock not found for country ${country}.`);
      return ctx.reply(ctx.i18n.t("stock_not_found", { country }));
    }

    const availableKeys = await Key.findAll({
      where: {
        stock_id: stock.id,
        used: false,
        number: {
          [Sequelize.Op.like]: `${prefix}%`
        }
      },

    });

    if (availableKeys.length === 0) {
      log(`No keys found with prefix ${prefix} for country ${country}.`);
      return ctx.reply(ctx.i18n.t("no_keys_with_prefix"));
    }

    ctx.reply(ctx.i18n.t('enter_quantity_for_prefix', { prefix }));

    ctx.session.prefixMode = {
      active: true,
      country,
      prefix,
      availableKeys,
      stock
    };
  } catch (error) {
    log.error(`Error in handlePrefixMode for user ${ctx.from.id}:`, error);
    ctx.reply(ctx.i18n.t("error_occurred"));
  }
};

export const generateSixDigitList = async (ctx) => {
  try {
    const country = ctx.match[0].split("_")[2];
    const stock = await Stock.findOne({ where: { country } });

    if (!stock) {
      log(`Stock not found for country ${country}.`);
      return ctx.reply(ctx.i18n.t("stock_not_found", { country }));
    }

    const keys = await Key.findAll({
      where: {
        stock_id: stock.id,
        used: false,
      },
    });

    const sixDigitCounts = keys.reduce((acc, key) => {
      const sixDigit = key.code.slice(0, 6);
      if (!acc[sixDigit]) {
        acc[sixDigit] = 0;
      }
      acc[sixDigit]++;
      return acc;
    }, {});

    const sixDigitList = Object.keys(sixDigitCounts)
      .map(sixDigit => `${sixDigit} * ${sixDigitCounts[sixDigit]}`)
      .join('\n');

    const responseMessage = `
      ${ctx.i18n.t('six_digit_list_title', { country })}\n\n${sixDigitList}
    `;

    ctx.reply(responseMessage);
  } catch (error) {
    log.error(`Error in generateSixDigitList for user ${ctx.from.id}:`, error);
    ctx.reply(ctx.i18n.t("error_occurred"));
  }
};
