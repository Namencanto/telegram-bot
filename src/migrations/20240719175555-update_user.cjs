'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Users', 'lang', {
      type: Sequelize.ENUM,
      values: ['en', 'ru', 'zh'],
      allowNull: false,
      defaultValue: 'en'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Users', 'lang');
    await queryInterface.sequelize.query('DROP TYPE "enum_Users_lang";');
  }
};
