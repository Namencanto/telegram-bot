'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Deposits', 'payment_id', {
      type: Sequelize.STRING,
      allowNull: false,
    });
    await queryInterface.addColumn('Deposits', 'full_details', {
      type: Sequelize.JSON,
      allowNull: true,
    });
    await queryInterface.changeColumn('Deposits', 'address', {
      type: Sequelize.STRING,
      allowNull: true,
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Deposits', 'payment_id');
    await queryInterface.removeColumn('Deposits', 'full_details');
    await queryInterface.changeColumn('Deposits', 'address', {
      type: Sequelize.STRING,
      allowNull: false,
    });
},
};
