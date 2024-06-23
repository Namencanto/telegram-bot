'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Deposits', 'pay_amount', {
      type: Sequelize.DECIMAL(12, 8),
      allowNull: false,
    });
    await queryInterface.addColumn('Deposits', 'pay_currency', {
      type: Sequelize.STRING(50),
      allowNull: false,
    });
    await queryInterface.removeColumn('Deposits', 'invoice_url');
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Deposits', 'pay_amount');
    await queryInterface.removeColumn('Deposits', 'pay_currency');
    await queryInterface.addColumn('Deposits', 'invoice_url', {
      type: Sequelize.STRING,
      allowNull: false,
    });
},
};
