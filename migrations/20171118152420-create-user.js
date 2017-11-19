'use strict';
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('Users', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      userId: {
        allowNull: false,
        type: Sequelize.TEXT
      },
      email: {
        allowNull: false,
        type: Sequelize.TEXT
      },
      address: {
        allowNull: false,
        type: Sequelize.TEXT
      },
      privateKey: {
        allowNull: false,
        type: Sequelize.TEXT
      },
      defaultGasLimit: {
        allowNull: false,
        type: Sequelize.INTEGER
      },
      mnemonic: {
        allowNull: false,
        type: Sequelize.TEXT
      },
      balance: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },
  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable('Users');
  }
};
