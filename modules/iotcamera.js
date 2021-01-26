var Database = require('../persistence/mongo');
var db = new Database();
//var authCheck = require('../auth/basic');
var deviceCheck = require('../auth/deviceCheck');
//var getAuthInfo = require('./utils/getAuth');
var mqtt = require("mqtt");
var model = require('../models');
var crypto = require('crypto');
var util = require('util');
var cryptojs = require('crypto-js') ;

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
  var product_id = DeviceInfo.product_id;
  var device_name = DeviceInfo.device_name;
  var device_secret = DeviceInfo.device_secret;
  var signmethod = 'HMAC-SHA256';
  
  var connid = randomString(5);
  var expiry = Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7;
  var client_id = product_id + device_name;
  var username = client_id + ';' + '12010126' + ';' + connid + ';' + expiry;
  var token = '';
  var password = '';

  if (signmethod === 'HMAC-SHA1') {
     token=cryptojs.HmacSHA1(username, cryptojs.enc.Base64.parse(device_secret))
    password = token + ';' + 'hmacsha1'
  } else {
     
      token=cryptojs.HmacSHA256(username, cryptojs.enc.Base64.parse(device_secret))
      password = token + ';' + 'hmacsha256'
  }

  return  {
    url:'mqtt://'+product_id+'.iotcloud.tencentdevices.com',
    username:username,
    password:password,
    client_id:client_id
  };

}

module.exports = function (app) {
  'use strict';
  return function (client_sock) {
    console.log("client comming", client_sock.remoteAddress, client_sock.remotePort);
    // 设置可接受的格式,  hex为二进制的文本编码
    client_sock.setEncoding("utf8");
    
    // 客户端断开连接的时候处理,用户断线离开了
    client_sock.on("close", function() {
      console.log("close socket");
    });
   
    var ConvertMqtt= function(msg_type,DeviceInfo) { 

      var MqttOption =getSign(DeviceInfo);

      //console.log(MqttOption.url+'/'+MqttOption.username+'/'+MqttOption.password+'/'+MqttOption.client_id);
        //根据msg_type处理不同的消息。 1 心跳包 3 抓拍reply  5 长链接抓拍reply  7 升级包reply 51 配置reply  99 注册
      var client  = mqtt.connect(MqttOption.url,{
        username:MqttOption.username,
        password:MqttOption.password,
        clientId:MqttOption.clientid
      });

      var topic='';
      var topicInfo='';

      topic='$thing/down/property/'+DeviceInfo.product_id+'/'+DeviceInfo.device_name;
      client.subscribe(topic);	

      



      client.on('connect', function () {
        console.log('MQTT connected.....');

      });
 
      client.on('message', function (topic, message) {
        // message is Buffer
        console.log(topic+':'+message.toString());
        //client.end();
      });

      //如果是心跳包，直接返回心跳reply
      if (msg_type==1){   
        client_sock.write("C28C0DB26D39331A{\"msg_type\":2,\"timestamp\":"+parseInt(+new Date()/1000)+"}15B86F2D013B2618");
      };  
      //如果是抓拍响应包，把返回的错误信息发送到MQTT EG3DYFIS5P/${deviceName}/event
      if (msg_type==3){       
        topic='$thing/up/event/'+DeviceInfo.product_id+'/'+DeviceInfo.device_name;
        topicInfo={"method":"event_post","clientToken":"123","version":"1.0","eventId":"DeviceReply","type":"info","timestamp":0,"params":{"event":3,"err":DeviceInfo.status}};
        client.publish(topic, JSON.stringify(topicInfo));
      }; 
      if (msg_type==5){
        topic='$thing/up/event/'+DeviceInfo.product_id+'/'+DeviceInfo.device_name;
        topicInfo={"method":"event_post","clientToken":"123","version":"1.0","eventId":"DeviceReply","type":"info","timestamp":0,"params":{"event":5,"err":DeviceInfo.status}};
        client.publish(topic, JSON.stringify(topicInfo));
      }; 
      if (msg_type==7){
        topic='$thing/up/event/'+DeviceInfo.product_id+'/'+DeviceInfo.device_name;
        topicInfo={"method":"event_post","clientToken":"123","version":"1.0","eventId":"DeviceReply","type":"info","timestamp":0,"params":{"event":7,"err":DeviceInfo.status}};
        client.publish(topic, JSON.stringify(topicInfo));
      }; 
      if (msg_type==51){
        topic='$thing/up/event/'+DeviceInfo.product_id+'/'+DeviceInfo.device_name;
        topicInfo={"method":"event_post","clientToken":"123","version":"1.0","eventId":"DeviceReply","type":"info","timestamp":0,"params":{"event":51,"err":DeviceInfo.status}};
        client.publish(topic, JSON.stringify(topicInfo));
      }; 
      if (msg_type==99){
        model.Device.create(deviceobj).then(function (device, err) {
          var http = require('http');
          var querystring = require('querystring');
          var contents = {
            productId:DeviceInfo.product_id,
            deviceName:DeviceInfo.device_id,
            nonce: parseInt(Date.now()/1000),
            timestamp:parseInt(Date.now()/1000)
          };  
          
          var str1format='deviceName=%s&nonce=%d&productId=%s&timestamp=%d';
          var str1=util.format(str1format,contents.deviceName,contents.nonce,contents.productId,contents.timestamp);
          var app_secret=DeviceInfo.device_secret;
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
      client.end();

      
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
        device_id: dataobj.device_id,
        signal:dataobj.signal,
        battery:dataobj.battery,
        firmware_version:dataobj.firmware_version,
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
          ConvertMqtt(dataobj.msg_type,DeviceInfo);
      };

      var newDevice = function (DeviceInfo) {
        //新注册设备  转发MQTT注册指令
        console.log("Device New:"+DeviceInfo.device_id);
        ConvertMqtt(99,DeviceInfo);
        ConvertMqtt(dataobj.msg_type,DeviceInfo);
      };  

      deviceCheck(DeviceInfo, oldDevice, newDevice);

      //client_sock.end(); // 正常关闭
    });
   
   
    client_sock.on("error", function(err) {
      console.log("error", err);
    });
  }  
};
