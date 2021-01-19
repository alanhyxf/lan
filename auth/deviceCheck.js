var model = require('../models');


module.exports = function (deviceInfo, oldDevice, newDevice) {
  'use strict';
  model.Device.findOne({where: {device_id: deviceInfo.device_id}}).then(function (device) {
    if (!device) {
      return newDevice(deviceInfo);
    } else {
      return oldDevice(deviceInfo);
    }
 
  });
};