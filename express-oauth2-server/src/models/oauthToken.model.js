'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class OAuthToken extends Model {
    static associate(models) {
      // Token belongs to a Client
      OAuthToken.belongsTo(models.OAuthClient, {
        foreignKey: 'clientId',
        as: 'client', // Alias for the association
        allowNull: false,
      });
      // Token belongs to a User
      OAuthToken.belongsTo(models.OAuthUser, {
        foreignKey: 'userId',
        as: 'user', // Alias for the association
        allowNull: false,
      });
    }
  }
  OAuthToken.init({
    id: {
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      type: DataTypes.INTEGER
    },
    accessToken: {
      type: DataTypes.STRING(1024),
      allowNull: false,
      unique: true
    },
    accessTokenExpiresAt: {
      type: DataTypes.DATE,
      allowNull: false
    },
    refreshToken: {
      type: DataTypes.STRING(1024),
      allowNull: true,
      unique: true
    },
    refreshTokenExpiresAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    scope: {
      type: DataTypes.STRING, // Or DataTypes.ARRAY(DataTypes.STRING)
      allowNull: true
    },
    clientId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    }
  }, {
    sequelize,
    modelName: 'OAuthToken',
    tableName: 'OAuthTokens',
    timestamps: true,
  });
  return OAuthToken;
};