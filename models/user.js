'use strict';
module.exports = (sequelize, DataTypes) => {
  var User = sequelize.define('User', {
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        notEmpty: true
      }
    },
    email: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notEmpty: true
      }
    },
    address: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notEmpty: true
      }
    },
    privateKey:  {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notEmpty: true
      }
    },
    defaultGasLimit: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        notEmpty: true
      }
    },
    mnemonic: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notEmpty: true
      }
    },
    balance: DataTypes.INTEGER,
    tokens: {
      type: DataTypes.VIRTUAL,
      set: function (val) {
       // Remember to set the data value, otherwise it won't be validated
       this.setDataValue('tokens', val);
     }
   }
  });


  return User;
};
