import depositService from "../services/deposit.js";
import { sendDepositDetails } from "../utils/helpers.js";
import log from "../utils/logger.js";

const depositController = {
  createDeposit: async (ctx, amount, currency) => {
    try {
      if (isNaN(amount) || amount <= 0) {
        return ctx.reply(ctx.i18n.t("invalid_amount"));
      }
      if (amount < process.env.MIN_DEPOSIT_AMOUNT) {
        ctx.reply(ctx.i18n.t("amount_minimal_error", { minAmount: process.env.MIN_DEPOSIT_AMOUNT }));
        ctx.reply(ctx.i18n.t("enter_amount_again"));
        return (ctx.session.awaitingDepositAmount = true);
      }
      const userId = ctx.from.id;

      let data = await depositService.createDeposit(
        ctx,
        userId,
        amount,
        currency
      );
      if (data?.deposit) {
        data.deposit.qrCodeUrl = data.qrCodeUrl;
        await sendDepositDetails(ctx, data.deposit);
      }
    } catch (error) {
      log.error(
        `Error generating deposit address for user ${ctx.from.id}:`,
        error
      );
      ctx.reply(ctx.i18n.t("error_occurred"));
    }
  },

  cancelDeposit: async (ctx) => {
    try {
      const depositId = ctx.match[1];

      const success = await depositService.cancelDeposit(depositId);

      if (success) {
        return ctx.reply(ctx.i18n.t("deposit_canceled"));
      } else {
        return ctx.reply(ctx.i18n.t("deposit_not_found_or_confirmed"));
      }
    } catch (error) {
      log.error(`Error canceling deposit for user ${ctx.from.id}:`, error);
      ctx.reply(ctx.i18n.t("error_occurred"));
    }
  },
};

export default depositController;
