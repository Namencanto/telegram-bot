import { Key, Stock } from '../config/models.js';
import db from '../config/index.js';
import log from '../utils/logger.js';

const stockService = {
  addKeys: async (keys, country) => {
    const { id: stock_id } = await Stock.findOne({ where: { country }});
    const promises = keys.map(async (key) => {
      const elements = key.split('|').map(part => part.trim());
      
      await Key.create({
        number: elements[0],
        mm: elements[1],
        yyyy: elements[2],
        code: elements[3],
        otherinfo: elements.length > 4 ? elements.slice(4).join('|') : null,
        stock_id,
      });
    });
    await Promise.all(promises);
  },
  getKeys: async (country, quantity) => {
    log(`Checking availability of ${quantity} keys for country ${country}.`);
    const stocks = await Stock.findAll({
      where: { country },
      include: [{
        model: Key,
        as: 'Keys',
        where: { used: false },
        required: true
      }],
      limit: quantity,
    });
  
    const availableKeys = stocks.flatMap(stock => stock.Keys);
  
    if (availableKeys.length < quantity) {
      log(`Not enough keys available for country ${country}. Requested: ${quantity}, Available: ${availableKeys.length}`);
      return null; // No available keys found
    }
  
    // Update keys as used
    const keyIds = availableKeys.map(key => key.id);
    await Key.update({ used: true }, { where: { id: keyIds } });
  
    log(`Found and marked ${availableKeys.length} keys as used for country ${country}`);
    return availableKeys.map(key => ({
      number: key.number,
      mm: key.mm,
      yyyy: key.yyyy,
      code: key.code,
      otherinfo: key.otherinfo || ''
    }));
  },
  buyKeys: async (user, country, quantity) => {
    log(`User with ID ${user.id} is buying ${quantity} keys for country ${country}.`);
    const keys = await stockService.getKeys(country, quantity);
    if (!keys) {
      log(`Purchase failed for user with ID ${user.id}: Not enough keys available.`);
      return null; // Not enough keys available
    }
  
    log(`Successfully marked ${quantity} keys as used for user with ID ${user.id}.`);
  
    return keys.map(key => `${key.number}|${key.mm}|${key.yyyy}|${key.code}|${key.otherinfo || ''}`.replace(/\|+$/, ''));
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
        'normal_price',
        'bulk_price',
        'bulk_threshold',
        [db.sequelize.fn('COUNT', db.sequelize.col('Keys.id')), 'count']
      ],
      include: [{
        as: 'Keys',
        model: Key,
        attributes: [],
        where: { used: false }
      }],
      group: ['Stocks.country', 'Stocks.normal_price', 'Stocks.bulk_price', 'Stocks.bulk_threshold', 'Stocks.id']
    });

    return stock.map(s => ({
      country: s.country,
      count: s.dataValues.count,
      normalPrice: parseFloat(s.dataValues.normal_price).toFixed(2),
      bulkPrice: parseFloat(s.dataValues.bulk_price).toFixed(2),
      bulkThreshold: s.dataValues.bulk_threshold,
    }));
  }
};

export default stockService;
