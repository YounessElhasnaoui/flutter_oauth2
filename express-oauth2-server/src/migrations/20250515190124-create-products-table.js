'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Products', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      prodName: {
        type: Sequelize.STRING,
        allowNull: false
      },
      prodDesc: {
        type: Sequelize.TEXT // Use TEXT for longer descriptions
      },
      prodImage: {
        type: Sequelize.STRING
      },
      prodPrice: {
        type: Sequelize.DECIMAL(10, 2), // Better for currency than DOUBLE
        allowNull: false
      },
      // Optional: If products are tied to a user (creator/owner)
      // userId: {
      //   type: Sequelize.INTEGER,
      //   references: {
      //     model: 'OAuthUsers',
      //     key: 'id',
      //   },
      //   onUpdate: 'CASCADE',
      //   onDelete: 'SET NULL', // Or 'RESTRICT' or 'CASCADE' based on business logic
      //   allowNull: true,
      // },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Products');
  }
};