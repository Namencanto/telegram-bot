'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.bulkInsert('Stocks', [
      {
        id: '2347fe49-fb6b-4458-b814-755cec1f2317',
        country: 'Canada',
        price: 5.00,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: '2347fe49-fb6b-4458-b814-755cec1f2313',
        country: 'UK',
        price: 4.50,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: '2347fe49-fb6b-4458-b814-755cec1f2311',
        country: 'USA',
        price: 5.50,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    ], {});
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('Stocks', null, {});
  }
};
