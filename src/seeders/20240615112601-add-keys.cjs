'use strict';
const { v4: uuidv4 } = require('uuid');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const keys = [];
    const stockIds = [
      '2347fe49-fb6b-4458-b814-755cec1f2317',
      '2347fe49-fb6b-4458-b814-755cec1f2313',
      '2347fe49-fb6b-4458-b814-755cec1f2311'
    ];

    for (let i = 0; i < 10000; i++) {
      keys.push({
        id: uuidv4(),
        number: Math.floor(100000000000 + Math.random() * 900000000000).toString(),
        mm: ('0' + Math.floor(Math.random() * 12 + 1)).slice(-2),
        yyyy: (Math.floor(Math.random() * 10) + 25).toString(),
        code: ('0000' + Math.floor(Math.random() * 10000)).slice(-4),
        otherinfo: null,
        used: false,
        stock_id: stockIds[Math.floor(Math.random() * stockIds.length)],
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    await queryInterface.bulkInsert('Keys', keys, {});
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('Keys', null, {});
  }
};
