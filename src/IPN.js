import express from 'express';
import log from './utils/logger.js';

const app = express();
const apiKey = process.env.API_KEY; // Twój klucz API

app.use(express.json());

const verifyApiKey = (req, res, next) => {
  const requestApiKey = req.headers['x-api-key'];

  // if (requestApiKey !== apiKey) {
  //   return res.status(401).send('Unauthorized');
  // }

  next();
};
app.all('/payment-notification', (req, res, next) => {
  console.log(`Request method: ${req.method}`);
  console.log(`Request method: ${req.body}`);
  next();
});
// app.all('/payment-notification', verifyApiKey, async (req, res) => {
//   try {
//     const paymentDetails = req.body;
//     console.log('Received payment notification:', paymentDetails);

//     res.status(200).send('Payment processed successfully');
//   } catch (error) {
//     log.error('Error processing payment notification:', error);
//     res.status(500).send('Error processing payment');
//   }
// });

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});

export default app;
