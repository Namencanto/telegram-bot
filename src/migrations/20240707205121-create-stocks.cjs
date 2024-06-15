'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('Stocks', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      country: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      normal_price: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
      },
      bulk_price: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
      },
      bulk_threshold: {
        type: Sequelize.BIGINT,
        allowNull: false,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('Stocks');
  },
};
