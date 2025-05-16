'use strict';
const { Model } = require('sequelize');
const bcrypt = require('bcrypt');

module.exports = (sequelize, DataTypes) => {
  class OAuthUser extends Model {
    // Instance method to compare passwords
    async isValidPassword(password) {
      return bcrypt.compare(password, this.password);
    }

    static associate(models) {
      // User has many Tokens
      OAuthUser.hasMany(models.OAuthToken, {
        foreignKey: 'userId',
        as: 'tokens',
        onDelete: 'CASCADE', // If user is deleted, their tokens are too
      });
      // User can own/be associated with multiple Clients (optional)
      OAuthUser.hasMany(models.OAuthClient, {
        foreignKey: 'userId',
        as: 'clients', // If a user "owns" clients
      });
      // User can have many Products (if applicable)
      // OAuthUser.hasMany(models.Product, {
      //   foreignKey: 'userId',
      //   as: 'products',
      // });
    }
  }
  OAuthUser.init({
    id: {
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      type: DataTypes.INTEGER
    },
    username: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: {
        args: true,
        msg: 'Username already in use!'
      }
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false
    },
    name: {
      type: DataTypes.STRING,
      allowNull: true
    },
    email: {
      type: DataTypes.STRING,
      allowNull: true, // Make false if mandatory
      unique: {
        args: true,
        msg: 'Email address already in use!'
      },
      validate: {
        isEmail: {
          args: true,
          msg: 'Please enter a valid email address'
        }
      }
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    }
    // createdAt and updatedAt are handled by Sequelize by default if not specified here
    // but our migration adds defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
  }, {
    sequelize,
    modelName: 'OAuthUser', // Singular model name
    tableName: 'OAuthUsers', // Explicitly set table name (plural)
    timestamps: true, // Enable createdAt and updatedAt
    hooks: {
      beforeCreate: async (user) => {
        if (user.password) {
          const salt = await bcrypt.genSalt(10);
          user.password = await bcrypt.hash(user.password, salt);
        }
      },
      beforeUpdate: async (user) => {
        if (user.changed('password') && user.password) {
          const salt = await bcrypt.genSalt(10);
          user.password = await bcrypt.hash(user.password, salt);
        }
      }
    }
  });
  return OAuthUser;
};