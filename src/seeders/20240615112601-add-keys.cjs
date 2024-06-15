'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.bulkInsert('Keys', [
      {
        id: '2347fe49-fb6b-4458-b814-755cec1f2300', // Generate a UUID for the record
        number: '748378731117',
        mm: '01',
        yyyy: '26',
        code: '6965',
        otherinfo: null, // No other info provided
        used: false,
        stock_id: '2347fe49-fb6b-4458-b814-755cec1f2317', // Replace with a valid stock id
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: '2347fe49-fb6b-4458-b814-755cec1f2301', // Generate a UUID for the record
        number: '109010948544',
        mm: '02',
        yyyy: '27',
        code: '0742',
        otherinfo: null, // No other info provided
        used: false,
        stock_id: '2347fe49-fb6b-4458-b814-755cec1f2317', // Replace with a valid stock id
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: '2347fe49-fb6b-4458-b814-755cec1f2302', // Generate a UUID for the record
        number: '684634860372',
        mm: '10',
        yyyy: '28',
        code: '3757',
        otherinfo: 'nclcs@example.com|SC|7908252|dxvah@another.com', // Combine additional info into a single field
        used: false,
        stock_id: '2347fe49-fb6b-4458-b814-755cec1f2313', // Replace with a valid stock id
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: '2347fe49-fb6b-4458-b814-755cec1f2303', // Generate a UUID for the record
        number: '276921808972',
        mm: '11',
        yyyy: '29',
        code: '3997',
        otherinfo: null, // No other info provided
        used: false,
        stock_id: '2347fe49-fb6b-4458-b814-755cec1f2311', // Replace with a valid stock id
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ], {});
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('Keys', null, {});
  }
};
