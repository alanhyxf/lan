var Database = require('../persistence/mongo');
var db = new Database();
//var authCheck = require('../auth/basic');
//var getAuthInfo = require('./utils/getAuth');
var mqtt = require("mqtt");


module.exports = function (app) {
  'use strict';
  return function (client_sock) {


    console.log("client comming", client_sock.remoteAddress, client_sock.remotePort);
    // 设置你接受的格式, 
    client_sock.setEncoding("utf8");
    // client_sock.setEncoding("hex"); // 转成二进制的文本编码
    // 客户端断开连接的时候处理,用户断线离开了
    client_sock.on("close", function() {
      console.log("close socket");
    });
   
    function ConvertMqtt(msg){
      var client  = mqtt.connect('mqtt://EG3DYFIS5P.iotcloud.tencentdevices.com',{
        username:'EG3DYFIS5Pdev202101;12010126;8VMXV;1611493674',
        password:'41c3c61ce8c38833bb8d8defb17b1a0394f22903104236aa0c368ce07e41300a;hmacsha256',
        clientId:'dev202101'
      });
     // client.publish('test', 'Hello mqtt ' + (++num), {qos:1},() => console.log(num));
     client.on('connect', function () {
     //   client.subscribe('test');
        client.publish('EG3DYFIS5P/dev202101/event', msg);
        console.log("mqtt con ok");
      });

      client.on('message', function (topic, message) {
        // message is Buffer 
        console.log(message.toString());   
        client.end();
      });
    }
    // 接收到客户端的数据，调用这个函数
    // data 默认是Buffer对象，如果你强制设置为utf8,那么底层会先转换成utf8的字符串，传给你
    // hex 底层会把这个Buffer对象转成二进制字符串传给你
    // 如果你没有设置任何编码 <Buffer 48 65 6c 6c 6f 57 6f 72 6c 64 21>
    // utf8 --> HelloWorld!!!   hex--> "48656c6c6f576f726c6421"
    client_sock.on("data", function(data) {
      console.log(data);
      if ((data.indexOf("C28C0DB26D39331A")!=-1) && (data.indexOf("15B86F2D013B2618")!=-1))
      {
        let dataobj=JSON.parse(data.slice(data.indexOf("{"),data.indexOf("}")+1));
        console.log(dataobj.firmware_version);

        var payload = {
          name: dataobj.device_id,
          token: dataobj.timestamp,
          data: data.slice(data.indexOf("{"),data.indexOf("}")+1)
        };
        db.insert(payload);
        if(dataobj.firmware_version==1)
        {
          client_sock.write("C28C0DB26D39331A{\"msg_type\":2,\"timestamp\":"+parseInt(+new Date()/1000)+"}15B86F2D013B2618");
          ConvertMqtt("C28C0DB26D39331A{\"msg_type\":2,\"timestamp\":"+parseInt(+new Date()/1000)+"}15B86F2D013B2618");
        }
      };
      
   
      //client_sock.end(); // 正常关闭
    });
   
   
    client_sock.on("error", function(err) {
      console.log("error", err);
    });
  }  
};
