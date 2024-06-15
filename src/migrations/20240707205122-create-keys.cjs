'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('Keys', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        allowNull: false,
        primaryKey: true,
      },
      number: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      mm: {
        type: Sequelize.STRING(2),
        allowNull: false,
      },
      yyyy: {
        type: Sequelize.STRING(4),
        allowNull: false,
      },
      code: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      otherinfo: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      used: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      stock_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'Stocks',
          key: 'id',
        },
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
    await queryInterface.dropTable('Keys');
  },
};
