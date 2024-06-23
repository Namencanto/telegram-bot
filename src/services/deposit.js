import { Op } from "sequelize";
import { Deposit } from "../config/models.js";
import nowPaymentsApi from "../config/nowPaymentsApi.js";
import log from "../utils/logger.js";
import moment from "moment";
import generateQRCode from "./qrCode.js";
console.log(process.env.APP_URL)
const depositService = {
  createDeposit: async (ctx, userId, amount, currency) => {
    try {
      const paymentData = {
        price_amount: amount,
        price_currency: "usd",
        pay_currency: currency,
        order_id: `order_${userId}_${Date.now()}`,
        order_description: "Deposit for user",
        ipn_callback_url: `${process.env.APP_URL}/payment-notification`,
      };

      const invoiceResponse = await nowPaymentsApi.post(
        "/invoice",
        paymentData
      );
      if (!invoiceResponse?.data?.id) {
        throw new Error("Failed to create payment");
      }
      const invoicePaymentData = {
        iid: invoiceResponse.data.id,
        pay_currency: currency,
      };

      const invoicePaymentResponse = await nowPaymentsApi.post(
        "/invoice-payment",
        invoicePaymentData
      );

      if (!invoicePaymentResponse?.data?.pay_address) {
        throw new Error("Failed to create payment");
      }

      const qrCodeUrl = await generateQRCode(
        invoicePaymentResponse.data.pay_address
      );
      console.log(invoiceResponse.data)
      const deposit = await Deposit.create({
        user_id: userId,
        amount,
        payment_id: invoicePaymentResponse.data.payment_id,
        address: invoicePaymentResponse.data.pay_address,
        pay_amount: invoicePaymentResponse.data.pay_amount,
        pay_currency: invoicePaymentResponse.data.pay_currency,
        expires_at: moment().add(30, "minutes").toDate(),
        full_details: invoicePaymentResponse.data,
      });

      return { deposit, qrCodeUrl };
    } catch (error) {
      if (error.response?.data?.code === "AMOUNT_MINIMAL_ERROR") {
        await ctx.reply(ctx.i18n.t("amount_minimal_error"));
        await ctx.reply(ctx.i18n.t("enter_amount_again"));
        ctx.session.awaitingDepositAmount = true;
      } else {
        log.error("Error creating deposit:", error);
        throw error;
      }
    }
  },

  checkOngoingDeposit: async (userId) => {
    const ongoingDeposit = await Deposit.findOne({
      where: {
        user_id: userId,
        confirmed: false,
        expires_at: { [Op.gt]: new Date() },
      },
    });

    return ongoingDeposit;
  },

  cancelDeposit: async (depositId) => {
    try {
      const deposit = await Deposit.findOne({
        where: { id: depositId, confirmed: false },
      });

      if (!deposit) {
        throw new Error("Deposit not found or already confirmed.");
      }

      await deposit.destroy();

      return true;
    } catch (error) {
      log.error("Error canceling deposit:", error);
      throw error;
    }
  },
};

export default depositService;
