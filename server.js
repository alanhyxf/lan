var configure=require("./app").configure;
var _ = require('underscore');
var net = require("net");
var mqtt = require("mqtt");
var coap = require("coap");
var WebSocketServer = require('ws').Server;

var config = require('config');

start = function (opts, callback) {
  var app = configure();

  

  app.listen(config.get('port.http'), function () {
    console.log("http server run on port %d", config.get('port.http'));
  });

  if (_.include(app.config.get('modules'), 'websocket')) {
    var webSocketServer = new WebSocketServer({port: config.get('port.websocket')});
    app.websocket(webSocketServer);
    console.log("websocket server listening on port %d", config.get('port.websocket'));
  }

  if (_.include(app.config.get('modules'), 'coap')) {
    coap.createServer(app.coap).listen(config.get('port.coap'), function () {
      console.log("coap server listening on port %d", config.get('port.coap'));
    });
  }

  if (_.include(app.config.get('modules'), 'mqtt')) {
    mqtt.MqttServer(app.mqtt).listen(config.get('port.mqtt'), function () {
      console.log("mqtt server listening on port %d", config.get('port.mqtt'));
    });
  }

  if (_.include(app.config.get('modules'), 'iotcamera')) {
    net.createServer(app.iotcamera).listen(config.get('port.iotcamera'), function () {
      console.log("iotcamera server listening on port %d", config.get('port.iotcamera'));
    });
  }


  return app;
};

if (require.main.filename === __filename) {
  start();
}

module.exports.start = start;
