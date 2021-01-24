var Database = require('../persistence/mongo');
var db = new Database();
//var authCheck = require('../auth/basic');
var deviceCheck = require('../auth/deviceCheck');
//var getAuthInfo = require('./utils/getAuth');
var mqtt = require("mqtt");
var model = require('../models');
var crypto = require('crypto');
var util = require('util');
//var HmacSha1 = require('crypto-js/hmac-sha1') ;
//var Base64 = require('crypto-js/enc-base64');
var hash, hmac;

function randomString(len, charSet) {
  charSet = charSet || 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  var randomString = '';
  for (var i = 0; i < len; i++) {
      var randomPoz = Math.floor(Math.random() * charSet.length);
      randomString += charSet.substring(randomPoz, randomPoz + 1);
  }
  return randomString;
}

function getSign(DeviceInfo) {
  var productid = DeviceInfo.product_id;
  var devicename = DeviceInfo.deviceName;
  var devicesecret = DeviceInfo.device_secret;
  var signmethod = 'HMAC-SHA256';
  
  var connid = randomString(5);
  var expiry = Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7;
  var clientid = productid + devicename;
  var username = clientid + ';' + '12010126' + ';' + connid + ';' + expiry;
  var token = '';
  var password = '';

  if (signmethod === 'HMAC-SHA1') {
      token = CryptoJS.HmacSHA1(username, CryptoJS.enc.Base64.parse(devicesecret))
      password = token + ';' + 'hmacsha1'
  } else {
      token = CryptoJS.HmacSHA256(username, CryptoJS.enc.Base64.parse(devicesecret))
      password = token + ';' + 'hmacsha256'
  }

  return  {
    url:productid+'.iotcloud.tencentdevices.com',
    username:username,
    password:password,
    clientid:clientid
  };

}

module.exports = function (app) {
  'use strict';
  return function (client_sock) {


    //console.log("client comming", client_sock.remoteAddress, client_sock.remotePort);
    // 设置可接受的格式,  hex为二进制的文本编码
    client_sock.setEncoding("utf8");
    
    // 客户端断开连接的时候处理,用户断线离开了
    client_sock.on("close", function() {
      console.log("close socket");
    });
   
    var ConvertMqtt= function(msg_type,DeviceInfo) { 

      var Mqttoption =getSign(DeviceInfo);

      
        //根据msg_type处理不同的消息。 1 心跳包 3 抓拍reply  5 长链接抓拍reply  7 升级包reply 51 配置reply  99 注册
      var client  = mqtt.connect(MqttOption.url,{
        username:MqttOption.username,
        password:MqttOption.password,
        clientId:MqttOption.clientid
      });

      if (msg_type==1){
        client.publish(DeviceInfo.product_id+'/'+DeviceInfo.deviceName+'/event', msg_type);
        client.end();
        client_sock.write("C28C0DB26D39331A{\"msg_type\":2,\"timestamp\":"+parseInt(+new Date()/1000)+"}15B86F2D013B2618");
   

      };  
      if (msg_type==3){

      }; 
      if (msg_type==5){

      }; 
      if (msg_type==7){

      }; 
      if (msg_type==51){

      }; 


      if (msg_type==99){
        model.Device.create(deviceobj).then(function (device, err) {
          var http = require('http');
          var querystring = require('querystring');
          var contents = {
            productId:"EG3DYFIS5P",
            deviceName:DeviceInfo.device_id,
            nonce: parseInt(Date.now()/1000),
            timestamp:parseInt(Date.now()/1000)
          };  
          
          var str1format='deviceName=%s&nonce=%d&productId=%s&timestamp=%d';
          var str1=util.format(str1format,contents.deviceName,contents.nonce,contents.productId,contents.timestamp);
          var app_secret='T4VREgDOMYC1y6KsqyJhtr9t';
          var sha1=crypto.createHmac('sha1', app_secret).update(str1).digest('HEX');
          var sign=new Buffer(sha1).toString('base64');
          var str2format='{\"deviceName\":\"%s\",\"nonce\":%d,\"productId\":\"%s\",\"timestamp\":%d,\"signature\":\"%s\"}';
          var str2=util.format(str2format,contents.deviceName,contents.nonce,contents.productId,contents.timestamp,sign);
          var options = {
            host:'ap-guangzhou.gateway.tencentdevices.com',
            path:'/register/dev',
            method:'POST',
            headers:{
                'Content-Type':'application/x-www-form-urlencoded',
                'Content-Length':str2.length
            }
          };          
          var req = http.request(options, function(res){
            res.setEncoding('utf8');
            res.on('data',function(data){
                console.log("data:",data);   //返回值
            });
          });  
          req.write(str2);
          req.end;                     
        });
      }; 

      
    };


    // 接收到客户端的数据，调用这个函数
    client_sock.on("data", function(data) {
      //如果不是合法的数据包，直接关闭连接。
      if ((data.indexOf("C28C0DB26D39331A")==-1) || (data.indexOf("15B86F2D013B2618")==-1)){
         return client_sock.end(); 
         
      };
      //console.log("Incoming IOTCamera Data");      
      let dataobj=JSON.parse(data.slice(data.indexOf("{"),data.indexOf("}")+1));
      console.log("IOTCamera Data Type:"+dataobj.msg_type);

      //数据包保存到mongo里
      var payload = {
        name: dataobj.device_id,
        token: dataobj.timestamp,
        data: data.slice(data.indexOf("{"),data.indexOf("}")+1)
      };
      db.insert(payload);
      

      var DeviceInfo = {
        device_id: msg.device_id,
        signal:msg.signal,
        battery:msg.battery,
        firmware_version:msg.firmware_version,
        product_id:'',
        product_secret:'',
        device_name:'',
        device_secret:'',
        client_id:'',
        status:''
      };



      //将来升级为注册指令，可以转换为msg_type处理。
       //已经注册过的设备
      var oldDevice = function (DeviceInfo) {
          console.log("Device Exist："+DeviceInfo.device_id);
          //然后根据数据包类型进行转换 msg_type： 1 心跳包 3 抓拍reply  5 长链接抓拍reply  7 升级包reply 51 配置reply
          ConvertMqtt(msg_type,DeviceInfo);
      };

      var newDevice = function (DeviceInfo) {
        //新注册设备  转发MQTT注册指令
        console.log("Device New:"+DeviceInfo.device_id);
        ConvertMqtt(99,DeviceInfo);
        ConvertMqtt(msg_type,DeviceInfo);
      };  

      deviceCheck(DeviceInfo.device_id, oldDevice, newDevice);

      //client_sock.end(); // 正常关闭
    });
   
   
    client_sock.on("error", function(err) {
      console.log("error", err);
    });
  }  
};
