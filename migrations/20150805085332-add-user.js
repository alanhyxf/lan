'use strict';

var models = require('../models');

module.exports = {
  up: function (queryInterface, Sequelize) {
    return queryInterface.bulkInsert('Users', [
      {
      name: 'root',
      password: 'root',
      expiration: '2016-03-03',
      uuid: '84e824cb-bfae-4d95-a76d-51103c556057',
      phone: '12345678901',
      isAdmin: true,
      alias: 'fengda'
      },
      ], {}
    );

    
  },

  down: function (queryInterface, Sequelize) {
    return queryInterface.bulkDelete('Users', null, {});

  }
};
