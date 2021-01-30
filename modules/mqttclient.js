
var mqtt = require("mqtt");
var crypto = require('crypto');
var util = require('util');
var cryptojs = require('crypto-js') ;
var hash, hmac;


function MqttConn(DeviceInfo,client_sock) {
    'use strict';

    var Client;
    var conn_status=0;
  
   
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

    var MqttOption=  {
      url:'mqtt://'+product_id+'.iotcloud.tencentdevices.com',
      username:username,
      password:password,
      client_id:client_id
    };
    
    
    Client= mqtt.connect(MqttOption.url,{
          username:MqttOption.username,
          password:MqttOption.password,
          clientId:MqttOption.clientid
      });
        
    Client.on('message', function (topic, message) {
      // message is Buffer
      console.log(topic+':'+message.toString());
      //client.end();
      //message:{"method":"action","clientToken":"1ea48e5644ce4582b1558b8e8926e3e6","actionId":"CAM","timestamp":1611666092,"params":{"action":0,"http_url":"www","count":1}}
      //var TopicObj=JSON.parse(topic);
      var IOTObj=JSON.parse(message);
      if(IOTObj.method=="action"){

          //return IOTObj.actionId;
          //拍照指令
          if(IOTObj.actionId=="CAM"){  
            var sformat=util.format("C28C0DB26D39331A{\"msg_type\":4,\"timestamp\":%s,\"action\":%d,\"http_url\":\"%s\",\"count\":%d}15B86F2D013B2618",parseInt(+new Date()/1000),IOTObj.params.action,IOTObj.params.http_url,IOTObj.params.count);
            client_sock.write(sformat);
          };

          //配置
          if(IOTObj.actionId=="CONFIG"){  
            var sformat=util.format("C28C0DB26D39331A{\"msg_type\":52,\"timestamp\":%s,\"conn_id\":0,\"app\":\"%s\",\"host\":\"%s\",\"port\":%d,\"opt\":%d,\"inteval\":%s,\"upload_url\":\"%s\",\"audio_vol\":%d,\"led_level\":%d,\"at_cmds\":\"%s\"}15B86F2D013B2618",parseInt(+new Date()/1000),IOTObj.params.app,IOTObj.params.host,IOTObj.params.port,IOTObj.params.opt,IOTObj.params.inteval,IOTObj.params.upload_url,IOTObj.params.audio_vol,IOTObj.params.led_level,IOTObj.params.at_cmds);
            client_sock.write(sformat);
          };
          //重启
          if(IOTObj.actionId=="Reboot"){  
            var sformat=util.format("C28C0DB26D39331A{\"msg_type\":50,\"timestamp\":%s}15B86F2D013B2618",parseInt(+new Date()/1000));
            client_sock.write(sformat);
          };

          if(IOTObj.actionId=="CAMNow"){  
            var sformat=util.format("C28C0DB26D39331A{\"msg_type\":6,\"timestamp\":%s}15B86F2D013B2618",parseInt(+new Date()/1000));
            client_sock.write(sformat);
          };

          if(IOTObj.actionId=="Update"){  
            var sformat=util.format("C28C0DB26D39331A{\"msg_type\":8,\"timestamp\":%s,\"firmware_url\":%s,\"update_version\":%s,\"firmware_md5\":%s}15B86F2D013B2618",parseInt(+new Date()/1000),IOTObj.params.firmware_url,IOTObj.params.update_version,IOTObj.params.firmare_md5);
            client_sock.write(sformat);
          };
          if(IOTObj.actionId=="UploadLog"){  
            var sformat=util.format("C28C0DB26D39331A{\"msg_type\":10,\"timestamp\":%s,\"http_url\":%s}15B86F2D013B2618",parseInt(+new Date()/1000),IOTObj.params.http_url);
            client_sock.write(sformat);
          };
      };
    });
      
    Client.on('connect', function (topic, message) {
      // message is Buffer
      //console.log(topic+':'+message.toString());    
      var topic1='$thing/down/property/'+DeviceInfo.product_id+'/'+DeviceInfo.device_name;
      var topic2='$thing/down/action/'+DeviceInfo.product_id+'/'+DeviceInfo.device_name;
      Client.subscribe(topic1);	
      Client.subscribe(topic2);	
    });



    function randomString(len, charSet) {
      charSet = charSet || 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      var randomString = '';
      for (var i = 0; i < len; i++) {
          var randomPoz = Math.floor(Math.random() * charSet.length);
          randomString += charSet.substring(randomPoz, randomPoz + 1);
      }
      return randomString;
    };
    

    //console.log(MqttOption.url+'/'+MqttOption.username+'/'+MqttOption.password+'/'+MqttOption.client_id);
      //根据msg_type处理不同的消息。 1 心跳包 3 抓拍reply  5 长链接抓拍reply  7 升级包reply 51 配置reply  99 注册
  

    this.set_publish= function(topic,message){
      console.log('mqtt status:'+Client.connected);
      Client.publish(topic,message);
    };
 
};

module.exports=MqttConn;