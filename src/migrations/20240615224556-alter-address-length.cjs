'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn('Deposits', 'address', {
      type: Sequelize.STRING(1024), // Increase the length to 1024
      allowNull: false,
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn('Deposits', 'address', {
      type: Sequelize.STRING(255), // Revert the length back to 255
      allowNull: false,
    });
  },
};
