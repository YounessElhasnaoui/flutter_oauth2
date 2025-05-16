'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Product extends Model {
    static associate(models) {
      // Product belongs to a User (if applicable)
      // Product.belongsTo(models.OAuthUser, {
      //   foreignKey: 'userId',
      //   as: 'owner',
      // });
    }
  }
  Product.init({
    id: {
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      type: DataTypes.INTEGER
    },
    prodName: {
      type: DataTypes.STRING,
      allowNull: false
    },
    prodDesc: {
      type: DataTypes.TEXT
    },
    prodImage: {
      type: DataTypes.STRING
    },
    prodPrice: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        isDecimal: true,
        min: 0.01
      }
    },
    // userId: {
    //   type: DataTypes.INTEGER,
    //   allowNull: true, // Or false if a product must have an owner
    // }
  }, {
    sequelize,
    modelName: 'Product',
    tableName: 'Products',
    timestamps: true,
  });
  return Product;
};