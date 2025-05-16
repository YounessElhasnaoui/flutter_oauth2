'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('OAuthClients', {
      id: { // Internal auto-incrementing ID
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      clientId: { // Public client identifier
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      clientSecret: { // For confidential clients
        type: Sequelize.STRING,
        allowNull: false // Will be hashed
      },
      clientName: { // A human-readable name for the client
        type: Sequelize.STRING,
        allowNull: false
      },
      redirectUris: {
        type: Sequelize.ARRAY(Sequelize.STRING), // Supports multiple redirect URIs
        allowNull: false
      },
      grants: {
        type: Sequelize.ARRAY(Sequelize.STRING), // e.g., ['password', 'refresh_token', 'authorization_code']
        allowNull: false
      },
      scope: { // Default scopes allowed for this client (can be a string or array)
        type: Sequelize.STRING, // Or Sequelize.ARRAY(Sequelize.STRING)
        allowNull: true
      },
      userId: { // Optional: If a client is associated with a specific user (e.g., "user's personal client")
        type: Sequelize.INTEGER,
        references: {
          model: 'OAuthUsers', // Name of the target table
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL', // Or 'CASCADE' if client should be deleted with user
        allowNull: true,
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
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('OAuthClients');
  }
};