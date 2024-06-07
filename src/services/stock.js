import { Key, Stock } from '../config/models.js';
import db from '../config/index.js';
import log from '../utils/logger.js';

const stockService = {
  addKeys: async (keys) => {
    const promises = keys.map(async (key) => {
      const [number, mm, yyyy, country, price, otherinfo1, otherinfo2, otherinfo3] = key.split('|').map(part => part.trim());
      const newKey = await Key.create({
        number,
        mm,
        yyyy,
        otherinfo1: otherinfo1 || null,
        otherinfo2: otherinfo2 || null,
        otherinfo3: otherinfo3 || null,
      });
      return await Stock.create({
        key_id: newKey.id,
        country,
        price: parseFloat(price),
      });
    });
    await Promise.all(promises);
  },
  getKeys: async (country, quantity) => {
    log(`Fetching ${quantity} keys for country ${country}.`);
    const stocks = await Stock.findAll({
      where: { country, '$Key.used$': false },
      include: [{ model: Key, where: { used: false } }],
      limit: quantity,
    });

    const keyIds = stocks.map(stock => stock.key_id);
    await Key.update({ used: true }, { where: { id: keyIds } });

    return stocks.map(stock => {
      const key = stock.Key;
      return `${key.number}|${key.mm}|${key.yyyy}|${stock.country}|${stock.price}|${key.otherinfo1 || ''}|${key.otherinfo2 || ''}|${key.otherinfo3 || ''}`.replace(/\|+$/, '');
    });
  },
  getBulkKeys: async (quantity) => {
    log(`Fetching ${quantity} bulk keys.`);
    const stocks = await Stock.findAll({
      where: { '$Key.used$': false },
      include: [{ model: Key, where: { used: false } }],
      limit: quantity,
    });

    const keyIds = stocks.map(stock => stock.key_id);
    await Key.update({ used: true }, { where: { id: keyIds } });

    return stocks.map(stock => {
      const key = stock.Key;
      return `${key.number}|${key.mm}|${key.yyyy}|${stock.country}|${stock.price}|${key.otherinfo1 || ''}|${key.otherinfo2 || ''}|${key.otherinfo3 || ''}`.replace(/\|+$/, '');
    });
  },
  getStock: async () => {
    log('Fetching current stock.');
    const stock = await Stock.findAll({
      attributes: [
        'country',
        [db.sequelize.fn('COUNT', db.sequelize.col('Keys.id')), 'count'],
        [db.sequelize.fn('AVG', db.sequelize.col('Stocks.price')), 'avgPrice']
      ],
      include: [{
        model: Key,
        attributes: [],
        where: { used: false }
      }],
      group: ['Stocks.country', 'Stocks.id']
    });
    return stock.map(s => ({
      country: s.country,
      count: s.dataValues.count,
      avgPrice: parseFloat(s.dataValues.avgPrice).toFixed(2),
    }));
  },
};

export default stockService;
