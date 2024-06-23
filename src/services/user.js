import { User } from '../config/models.js';
import log from '../utils/logger.js';
// import nowPaymentsApi from '../config/nowPaymentsApi.js';

const userService = {
  createUser: async (ctx) => {
    // await nowPaymentsApi.post('/sub-partner/balance', { name: ctx.from.id })
    await User.create({ telegram_id: ctx.from.id });
    log(`Created new user with telegram ID ${ctx.from.id}.`);
  },
};

export default userService;
