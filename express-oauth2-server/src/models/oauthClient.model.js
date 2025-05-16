'use strict';
const { Model } = require('sequelize');
const bcrypt = require('bcrypt'); // For hashing client secrets

module.exports = (sequelize, DataTypes) => {
  class OAuthClient extends Model {
    // Instance method to compare client secrets
    async isValidSecret(secret) {
      return bcrypt.compare(secret, this.clientSecret);
    }

    static associate(models) {
      // Client has many Tokens
      OAuthClient.hasMany(models.OAuthToken, {
        foreignKey: 'clientId',
        as: 'tokens',
        onDelete: 'CASCADE',
      });
      // Client belongs to a User (optional owner)
      OAuthClient.belongsTo(models.OAuthUser, {
        foreignKey: 'userId',
        as: 'owner', // or 'user'
        allowNull: true,
      });
    }
  }
  OAuthClient.init({
    id: {
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      type: DataTypes.INTEGER
    },
    clientId: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: {
        args: true,
        msg: 'Client ID already in use!'
      }
    },
    clientSecret: {
      type: DataTypes.STRING,
      allowNull: false
    },
    clientName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    redirectUris: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: false,
      validate: {
        notEmpty(value) {
          if (!value || value.length === 0) {
            throw new Error('Redirect URIs cannot be empty.');
          }
          // Optionally, validate URI format here if needed
        }
      }
    },
    grants: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: false,
      validate: {
        notEmpty(value) {
          if (!value || value.length === 0) {
            throw new Error('Grants cannot be empty.');
          }
          // You could add more validation to check if grants are valid types
        }
      }
    },
    scope: {
      type: DataTypes.STRING, // Or DataTypes.ARRAY(DataTypes.STRING)
      allowNull: true
    },
    userId: { // Foreign Key to OAuthUsers (optional owner)
      type: DataTypes.INTEGER,
      allowNull: true,
    }
  }, {
    sequelize,
    modelName: 'OAuthClient',
    tableName: 'OAuthClients',
    timestamps: true,
    hooks: {
      beforeCreate: async (client) => {
        if (client.clientSecret) {
          const salt = await bcrypt.genSalt(10);
          client.clientSecret = await bcrypt.hash(client.clientSecret, salt);
        }
      },
      beforeUpdate: async (client) => {
        if (client.changed('clientSecret') && client.clientSecret) {
          const salt = await bcrypt.genSalt(10);
          client.clientSecret = await bcrypt.hash(client.clientSecret, salt);
        }
      }
    }
  });
  return OAuthClient;
};