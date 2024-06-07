import QRCode from "qrcode";
import log from '../utils/logger.js';

const generateQRCode = async (text) => {
  try {
    const url = await QRCode.toDataURL(text);
    return url;
  } catch (err) {
    log.error('Error generating QR code:', err);
  }
};

export default generateQRCode;
