var config = require('config');


'use strict';
module.exports = function (sequelize, DataTypes) {
  

  var Device = sequelize.define('Device', {
    id: {
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      type: DataTypes.INTEGER
    },
    device_id: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: true,
        isUnique: function (value, next) {
          Device.find({
            where: {device_id: value}
          }).done(function (error, device) {
            if (error) {
              return next(error)
            }
            if (device) {
              console.log('Device is already in use!');
              return next('Device is already in use!')
            }
            next()
          })
        }
      }
    },
    
    //signal: DataTypes.STRING,
    //firmware_version: DataTypes.STRING,
    //battery: DataTypes.STRING
    product_id:DataTypes.STRING,
    product_secret:DataTypes.STRING,
    device_name:DataTypes.STRING,
    device_secret:DataTypes.STRING,
    client_id:DataTypes.STRING,
    status:DataTypes.INTEGER
  }, {
    classMethods: {
      associate: function (models) {
      },
      findByDevice_Id: function (deviceid) {
        return this.find({where: {idevice_id: deviceid}});
      }
    },
    
    
  });

  return Device;
};
