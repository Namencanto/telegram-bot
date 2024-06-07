import bot from "../index.js";
import stockService from "../services/stock.js";
import fetch from "node-fetch";
import log from "../utils/logger.js";

const parseKeys = (text, fileType) => {
  const delimiter = fileType === "csv" ? "," : "\n";
  const keys = text
    .split(delimiter)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  keys.forEach((key) => {
    const parts = key.split("|");
    if (parts.length < 3 || parts.length > 6) {
      throw new Error("Invalid key format");
    }
  });

  return keys;
};
const adminController = {
  addStock: async (ctx) => {
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
          await stockService.addKeys(keys);
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
};

export default adminController;
