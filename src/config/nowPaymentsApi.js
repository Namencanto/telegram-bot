import axios from 'axios';
import { config } from 'dotenv';
config();

const nowPaymentsApi = axios.create({
  baseURL: process.env.NOWPAYMENTS_API_URL,
  headers: {
    'x-api-key': process.env.NOWPAYMENTS_API_KEY,
    'Content-Type': 'application/json',
  },
});

export default nowPaymentsApi;
