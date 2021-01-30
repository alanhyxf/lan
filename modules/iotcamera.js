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




module.exports = function (app) {
  'use strict';
  return function (client_sock) {
    //console.log("client comming", client_sock.remoteAddress, client_sock.remotePort);
    // 设置可接受的格式,  hex为二进制的文本编码

    let DeviceInfo = {
      device_id: '',
      signal:'',
      battery:'',
      firmware_version:'',
      product_id:'',
      product_secret:'',
      device_name:'',
      device_secret:'',
      client_id:'',
      status:''
    };
    let MqttConn=require('./mqttclient');
    
    client_sock.setEncoding("utf8");
    let mqtt_conn=new MqttConn(DeviceInfo,client_sock);
    let topic,topicInfo;
    // 客户端断开连接的时候处理,用户断线离开了
    client_sock.on("close", function() {
      console.log("close socket");
    });



    function ConvertMqtt(msg_type,DeviceInfo,client_sock) { 
      
      //如果是心跳包，直接返回心跳reply
      if (msg_type==1){   
        topic='$thing/up/event/'+DeviceInfo.product_id+'/'+DeviceInfo.device_name;
        topicInfo={"method":"event_post","clientToken":"123","version":"1.0","eventId":"DeviceReply","type":"info","timestamp":0,"params":{"event":1,"content":DeviceInfo.status}};
        mqtt_conn.set_publish(topic, JSON.stringify(topicInfo));

        client_sock.write("C28C0DB26D39331A{\"msg_type\":2,\"timestamp\":"+parseInt(+new Date()/1000)+"}15B86F2D013B2618");
      };  
      //如果是抓拍响应包，把返回的错误信息发送到MQTT EG3DYFIS5P/${deviceName}/event
      if (msg_type==3){       
        topic='$thing/up/event/'+DeviceInfo.product_id+'/'+DeviceInfo.device_name;
        topicInfo={"method":"event_post","clientToken":"123","version":"1.0","eventId":"DeviceReply","type":"info","timestamp":0,"params":{"event":3,"content":DeviceInfo.status}};
        mqtt_conn.set_publish(topic, JSON.stringify(topicInfo));
      }; 
      if (msg_type==5){
        topic='$thing/up/event/'+DeviceInfo.product_id+'/'+DeviceInfo.device_name;
        topicInfo={"method":"event_post","clientToken":"123","version":"1.0","eventId":"DeviceReply","type":"info","timestamp":0,"params":{"event":5,"content":DeviceInfo.status}};
        mqtt_conn.set_publish(topic, JSON.stringify(topicInfo));
      }; 
      if (msg_type==7){
        topic='$thing/up/event/'+DeviceInfo.product_id+'/'+DeviceInfo.device_name;
        topicInfo={"method":"event_post","clientToken":"123","version":"1.0","eventId":"DeviceReply","type":"info","timestamp":0,"params":{"event":7,"content":DeviceInfo.status}};
        mqtt_conn.set_publish(topic, JSON.stringify(topicInfo));
      }; 

      if (msg_type==9){
        topic='$thing/up/event/'+DeviceInfo.product_id+'/'+DeviceInfo.device_name;
        topicInfo={"method":"event_post","clientToken":"123","version":"1.0","eventId":"DeviceReply","type":"info","timestamp":0,"params":{"event":9,"content":DeviceInfo.status}};
        mqtt_conn.set_publish(topic, JSON.stringify(topicInfo));
      }; 

      if (msg_type==51){
        topic='$thing/up/event/'+DeviceInfo.product_id+'/'+DeviceInfo.device_name;
        topicInfo={"method":"event_post","clientToken":"123","version":"1.0","eventId":"DeviceReply","type":"info","timestamp":0,"params":{"event":51,"content":DeviceInfo.status}};
        mqtt_conn.set_publish(topic, JSON.stringify(topicInfo));
      }; 
      if (msg_type==99){
        model.Device.create(DeviceInfo).then(function (device, err) {
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
      //client.end();    
    };
    
 


    // 接收到客户端的数据，调用这个函数
    client_sock.on("data", function(data) {
      //如果不是合法的数据包，直接关闭连接。
      if ((data.indexOf("C28C0DB26D39331A")==-1) || (data.indexOf("15B86F2D013B2618")==-1)){
         return client_sock.end(); 
         
      };
      //console.log("Incoming IOTCamera Data");      
      let dataobj=JSON.parse(data.slice(data.indexOf("{"),data.indexOf("}")+1));
      //console.log("IOTCamera Data Type:"+dataobj.msg_type);

      //数据包保存到mongo里
      var payload = {
        name: dataobj.device_id,
        token: dataobj.timestamp,
        data: data.slice(data.indexOf("{"),data.indexOf("}")+1)
      };
      db.insert(payload);
      
      DeviceInfo.device_id=dataobj.device_id;
      DeviceInfo.signal=dataobj.signal;
      DeviceInfo.battery=dataobj.battery;
      DeviceInfo.firmware_version=dataobj.firmware_version;
      DeviceInfo.err=dataobj.err;
      DeviceInfo.timestamp=dataobj.timestamp;
      DeviceInfo.temp_cpu=dataobj.temp_cpu;
      DeviceInfo.temp_env=dataobj.temp_env;
      DeviceInfo.status=util.format('{\"err\":%d,\"firmware_version\":%s,\"device_id\":%s,\"timestamp\":%d,\"battery\":%f,\"signal\":%s,\"temp_env\":%d,\"temp_cpu\":%d}',DeviceInfo.err,DeviceInfo.firmware_version,DeviceInfo.device_id,DeviceInfo.timestamp,DeviceInfo.battery,DeviceInfo.signal,DeviceInfo.temp_env,DeviceInfo.temp_cpu)
      if(dataobj.msg_type==5){
        console.log(dataobj.Image);
      }


      //将来升级为注册指令，可以转换为msg_type处理。
       //已经注册过的设备
      var oldDevice = function (DeviceInfo) {
          console.log("Device Exist："+DeviceInfo.device_id);
          //然后根据数据包类型进行转换 msg_type： 1 心跳包 3 抓拍reply  5 长链接抓拍reply  7 升级包reply 51 配置reply
          ConvertMqtt(dataobj.msg_type,DeviceInfo,client_sock);
      };

      var newDevice = function (DeviceInfo) {
        //新注册设备  转发MQTT注册指令
        console.log("Device New:"+DeviceInfo.device_id);
        ConvertMqtt(99,DeviceInfo,client_sock).then(function(){
          ConvertMqtt(dataobj.msg_type,DeviceInfo,client_sock);
        });
        
      };  

      deviceCheck(DeviceInfo, oldDevice, newDevice);

      //client_sock.end(); // 正常关闭
    });
   
   
    client_sock.on("error", function(err) {
      console.log("error", err);
    });
  }  
};
