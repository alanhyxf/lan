var model = require('../models');


module.exports = function (DeviceInfo, oldDevice, newDevice) {
  'use strict';
  model.Device.findOne({where: {device_id: DeviceInfo.device_id}}).then(function (device) {
    if (!device) {
      return newDevice(DeviceInfo);
    } else {
      return oldDevice(DeviceInfo);
    }
 
  });
};