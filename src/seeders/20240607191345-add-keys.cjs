'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const stocks = await queryInterface.sequelize.query(
      'SELECT id, country FROM "Stocks";'
    );

    const stockRows = stocks[0];
    await queryInterface.bulkInsert('Keys', [
      {
        id: '2347fe49-fb6b-4458-b814-755cec1f2310',
        number: '1234-5678-9101',
        mm: '12',
        yyyy: '2025',
        otherinfo1: 'Some info',
        otherinfo2: 'More info',
        otherinfo3: 'Even more info',
        used: false,
        stock_id: stockRows.find(stock => stock.country === 'Canada').id,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: '2347fe49-fb6b-4458-b814-755cec1f2320',
        number: '2345-6789-1011',
        mm: '11',
        yyyy: '2026',
        otherinfo1: 'Some info',
        otherinfo2: 'More info',
        otherinfo3: 'Even more info',
        used: false,
        stock_id: stockRows.find(stock => stock.country === 'UK').id,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: '2347fe49-fb6b-4458-b814-755cec1f2410',
        number: '3456-7890-1121',
        mm: '10',
        yyyy: '2027',
        otherinfo1: 'Some info',
        otherinfo2: 'More info',
        otherinfo3: 'Even more info',
        used: false,
        stock_id: stockRows.find(stock => stock.country === 'USA').id,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    ], {});
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('Keys', null, {});
  }
};
