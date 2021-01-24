var model = require('../models');


module.exports = function (DeviceInfo, oldDevice, newDevice) {
  'use strict';
  model.Device.findOne({where: {device_id: DeviceInfo.device_id}}).then(function (device) {
    if (!device) {

      return newDevice(DeviceInfo);
    } else {

      DeviceInfo.product_id=device.device_id;
      DeviceInfo.product_secret=device.product_secret;
      DeviceInfo.device_name=device.device_name;
      DeviceInfo.device_secret=device.device_secret;
      return oldDevice(DeviceInfo);
    }
 
  });
};

