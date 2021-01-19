var Database = require('../persistence/mongo');
var db = new Database();
//var authCheck = require('../auth/basic');
var deviceCheck = require('../auth/deviceCheck');
//var getAuthInfo = require('./utils/getAuth');
var mqtt = require("mqtt");
var model = require('../models');
const crypto = require('crypto');


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
   
    var ConvertMqtt= function(msg) {

      var DeviceInfo = {
        device_id: msg.device_id,
        signal:msg.signal,
        battery:msg.battery,
        firmware_version:msg.firmware_version       

      };

      var oldDevice = function (deviceInfo) {
      //已经注册过的设备
        console.log("Device Exist："+deviceInfo.device_id);
      };
    
      var newDevice = function (deviceInfo) {
        //新注册设备  
        console.log("Device New:"+deviceInfo.device_id);
        model.Device.build(deviceInfo)
          .validate()
          .then(function (err) {
          if (err) {
            return err.errors; 
          }
        });

        

        model.Device.create(deviceInfo).then(function (device, err) {
          var http = require('http');
          var querystring = require('querystring');
          var contents = {
            productId:'EG3DYFIS5P',
            deviceName:device.device_id,
            nonce:crypto.randomBytes(16).toString('base64'),
            timestamp:Date.now()
          };  
          let  str1= [contents.deviceName,contents.nonce,contents.productId,contents.timestamp].sort().join('');
          let  str2= 'productId='+contents.productId+'&'+'deviceName='+contents.deviceName+'&'+'nonce='+contents.nonce+'&'+'timestamp='+contents.timestamp+'&'+'signature='+str1;
          var app_secret='T4VREgDOMYC1y6KsqyJhtr9t';
          contents["signature"] = crypto.createHmac('sha1', app_secret).update(str2).digest('hex').toString('base64'); 
          var contentstr = querystring.stringify(contents); 

          var options = {
            host:'ap-guangzhou.gateway.tencentdevices.com',
            path:'/register/dev',
            method:'POST',
            headers:{
                'Content-Type':'application/x-www-form-urlencoded',
                'Content-Length':contentstr.length
            }
          };
          
          var req = http.request(options, function(res){
            res.setEncoding('utf8');
            res.on('data',function(data){
                console.log("data:",data);   //一段html代码
            });
          });
  
          req.write(contents);
          req.end;


                     
        });

        

        
      };
   
    
      deviceCheck(DeviceInfo, oldDevice, newDevice);

      var client  = mqtt.connect('mqtt://EG3DYFIS5P.iotcloud.tencentdevices.com',{
        username:'EG3DYFIS5Pdev202101;12010126;8VMXV;1611493674',
        password:'41c3c61ce8c38833bb8d8defb17b1a0394f22903104236aa0c368ce07e41300a;hmacsha256',
        clientId:DeviceInfo.device_id
      });

       client.publish('EG3DYFIS5P/dev202101/event', msg);
       client.end();
    }
    // 接收到客户端的数据，调用这个函数
    // data 默认是Buffer对象，如果你强制设置为utf8,那么底层会先转换成utf8的字符串，传给你
    // hex 底层会把这个Buffer对象转成二进制字符串传给你
    // 如果你没有设置任何编码 <Buffer 48 65 6c 6c 6f 57 6f 72 6c 64 21>
    // utf8 --> HelloWorld!!!   hex--> "48656c6c6f576f726c6421"
    client_sock.on("data", function(data) {
      console.log("Incoming IOTCamera Data");
      if ((data.indexOf("C28C0DB26D39331A")!=-1) && (data.indexOf("15B86F2D013B2618")!=-1))
      {
        let dataobj=JSON.parse(data.slice(data.indexOf("{"),data.indexOf("}")+1));
        console.log("IOTCamera Data Type:"+dataobj.msg_type);

        /*
        var payload = {
          name: dataobj.device_id,
          token: dataobj.timestamp,
          data: data.slice(data.indexOf("{"),data.indexOf("}")+1)
        };
        db.insert(payload);
        */

        if(dataobj.msg_type==1)
        {
          client_sock.write("C28C0DB26D39331A{\"msg_type\":2,\"timestamp\":"+parseInt(+new Date()/1000)+"}15B86F2D013B2618");
          var msg = {
            msg_type:2,
            device_id: dataobj.device_id,
            signal:dataobj.signal,
            battery:dataobj.battery,
            firmware_version:dataobj.firmware_version,
            timestamp: parseInt(+new Date()/1000)
          };       
          ConvertMqtt(msg);
        }
      };
      
   
      //client_sock.end(); // 正常关闭
    });
   
   
    client_sock.on("error", function(err) {
      console.log("error", err);
    });
  }  
};
