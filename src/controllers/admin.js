import stockService from "../services/stock.js";
import fetch from "node-fetch";
import log from "../utils/logger.js";
import { User } from "../config/models.js";
import { Op } from "sequelize";

const parseKeys = (text, fileType) => {
  const delimiter = fileType === "csv" ? "," : "\n";
  const keys = text
    .split(delimiter)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  keys.forEach((key) => {
    const parts = key.split("|");
    if (parts.length < 3) {
      throw new Error("Invalid key format");
    }
  });

  return keys;
};
const adminController = {
  addStock: async (ctx, bot, country) => {
    try {
      if (!ctx.state.isAdmin) {
        log(`Unauthorized admin access attempt by: ${ctx.from.id}`);
        return ctx.reply(ctx.i18n.t("not_authorized"));
      }

      ctx.reply(ctx.i18n.t("upload_stock_file"));
      bot.on("document", async (ctx) => {
        try {
          const fileId = ctx.message.document.file_id;
          const fileUrl = await bot.telegram.getFileLink(fileId);
          const response = await fetch(fileUrl.href);
          const keysText = await response.text();
          const fileType = ctx.message.document.file_name
            .split(".")
            .pop()
            .toLowerCase();

          if (!["txt", "csv"].includes(fileType)) {
            throw new Error(ctx.i18n.t("unsupported_file_format"));
          }

          const keys = parseKeys(keysText, fileType);
          await stockService.addKeys(keys, country);
          ctx.reply(ctx.i18n.t("stock_updated"));
        } catch (error) {
          log.error(`Error processing file for user ${ctx.from.id}:`, error);
          ctx.reply(ctx.i18n.t("error_updating_stock", { message: error.message }));
        }
      });
    } catch (error) {
      log.error("Error adding stock:", error);
      ctx.reply(ctx.i18n.t("error_occurred"));
    }
  },

  broadcastMessage: async (ctx, bot) => {
    try {
      if (!ctx.state.isAdmin) {
        log(`Unauthorized admin access attempt by: ${ctx.from.id}`);
        return ctx.reply(ctx.i18n.t("not_authorized"));
      }
      console.log(ctx.message.photo)
      let messageToSend = ctx.message.text ? ctx.message.text.replace('/broadcast', '').trim() : null;
      const photoToSend = ctx.message.photo ? ctx.message.photo[ctx.message.photo.length - 1].file_id : null;

      if (!messageToSend && !photoToSend) {
        return ctx.reply(ctx.i18n.t("provide_message_to_broadcast"));
      }

      const users = await User.findAll({
        where: {
          telegram_id: {
            [Op.in]: process.env.ADMIN_TELEGRAM_IDS.split(',').map(id => id.trim())
          }
        }
      });

      for (const user of users) {
        try {
          if (photoToSend) {
            console.log(messageToSend)
            await bot.telegram.sendPhoto(user.telegram_id, photoToSend, {
              caption: messageToSend,
              parse_mode: 'Markdown'
            });
          } else {
            await bot.telegram.sendMessage(user.telegram_id, messageToSend, { parse_mode: 'Markdown' });
          }
        } catch (error) {
          log.error(`Failed to send message to ${user.telegram_id}:`, error);
        }
      }

      ctx.reply(ctx.i18n.t("message_broadcasted"));
    } catch (error) {
      log.error("Error broadcasting message:", error);
      ctx.reply(ctx.i18n.t("error_occurred"));
    }
  },
};

export default adminController;
