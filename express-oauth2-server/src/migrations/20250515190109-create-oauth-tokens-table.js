'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('OAuthTokens', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      accessToken: {
        type: Sequelize.STRING(1024), // Increased length for potentially longer tokens
        allowNull: false,
        unique: true
      },
      accessTokenExpiresAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
      refreshToken: {
        type: Sequelize.STRING(1024), // Increased length
        allowNull: true, // Refresh tokens are optional depending on the grant
        unique: true
      },
      refreshTokenExpiresAt: {
        type: Sequelize.DATE,
        allowNull: true
      },
      scope: { // Store the scope granted with this token
        type: Sequelize.STRING, // Or Sequelize.ARRAY(Sequelize.STRING)
        allowNull: true
      },
      clientId: { // Foreign Key to OAuthClients
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'OAuthClients', // Name of the target table
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE' // If client is deleted, its tokens are too
      },
      userId: { // Foreign Key to OAuthUsers
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'OAuthUsers', // Name of the target table
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE' // If user is deleted, their tokens are too
      },
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

    // Add indexes for faster lookups
    await queryInterface.addIndex('OAuthTokens', ['accessToken']);
    await queryInterface.addIndex('OAuthTokens', ['refreshToken']);
    await queryInterface.addIndex('OAuthTokens', ['clientId']);
    await queryInterface.addIndex('OAuthTokens', ['userId']);
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('OAuthTokens');
  }
};