var Database = require('../persistence/mongo');
var db = new Database();
//var authCheck = require('../auth/basic');
var deviceCheck = require('../auth/deviceCheck');
//var getAuthInfo = require('./utils/getAuth');
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
};

module.exports = function (app) {
  'use strict';
  return function (client_sock) {
    //console.log("client comming", client_sock.remoteAddress, client_sock.remotePort);
    // 设置可接受的格式,  hex为二进制的文本编码
    client_sock.setEncoding("utf8");

    var DeviceInfo = {
      device_id: '',
      signal:'',
      battery:'',
      firmware_version:'',
      product_id:'',
      product_secret:'',
      device_name:'',
      device_secret:'',
      client_id:'',
      status:'',
      mqtt_status:0
    };
    var mqtt_conn,topic,topicInfo;
   


    // 客户端断开连接的时候处理,用户断线离开了

    client_sock.on("close", function() {
      console.log("close socket");
    });


    function MqttInit(DeviceInfo){     

      if(DeviceInfo.mqtt_status==0){ 
        
        var mqtt    = require('mqtt');

        this.MqttOption=function(DeviceInfo){
          let product_id = DeviceInfo.product_id;
          let device_name = DeviceInfo.device_name;
          let device_secret = DeviceInfo.device_secret;
          var signmethod = 'HMAC-SHA256';
          var connid = randomString(5);
          var expiry = Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7;
          let client_id = product_id + device_name;
          let username = client_id + ';' + '12010126' + ';' + connid + ';' + expiry;
          let token = '';
          let password = '';
          if (signmethod === 'HMAC-SHA1') {
            token=cryptojs.HmacSHA1(username, cryptojs.enc.Base64.parse(device_secret))
            password = token + ';' + 'hmacsha1'
          } else {
              token=cryptojs.HmacSHA256(username, cryptojs.enc.Base64.parse(device_secret))
              password = token + ';' + 'hmacsha256'
          }
          return   {
            url:'mqtt://'+product_id+'.iotcloud.tencentdevices.com',
            username:username,
            password:password,
            client_id:client_id
          };
        }

        var mqttclient  = mqtt.connect(this.MqttOption.url,{
          username:this.MqttOption.username,
          password:this.MqttOption.password,
          clientId:this.MqttOption.clientid
        });

        mqttclient.on('connect', function () {
          //订阅presence主题
          DeviceInfo.mqtt_status=1;
          var topic1='$thing/down/property/'+DeviceInfo.product_id+'/'+DeviceInfo.device_name;
          var topic2='$thing/down/action/'+DeviceInfo.product_id+'/'+DeviceInfo.device_name;
          mqttclient.subscribe(topic1);	
          mqttclient.subscribe(topic2);	
        });
         
        mqttclient.on('message', function (topic, message) {
          //收到的消息是一个Buffer
          console.log(message.toString());

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
          //client.end();
        });
        
          
      }
      
      

    }

    function ReplyMessage(msg_type,DeviceInfo) { 

      console.log('ReplyMessage begin:'+msg_type);
      //如果是心跳包，直接返回心跳reply
      if (msg_type==1){   
        topic='$thing/up/event/'+DeviceInfo.product_id+'/'+DeviceInfo.device_name;
        topicInfo={"method":"event_post","clientToken":"123","version":"1.0","eventId":"DeviceReply","type":"info","timestamp":0,"params":{"event":1,"content":DeviceInfo.status}};
        mqttclient.publish(topic, JSON.stringify(topicInfo));

        client_sock.write("C28C0DB26D39331A{\"msg_type\":2,\"timestamp\":"+parseInt(+new Date()/1000)+"}15B86F2D013B2618");
      };  
      //如果是抓拍响应包，把返回的错误信息发送到MQTT EG3DYFIS5P/${deviceName}/event
      if (msg_type==3){       
        topic='$thing/up/event/'+DeviceInfo.product_id+'/'+DeviceInfo.device_name;
        topicInfo={"method":"event_post","clientToken":"123","version":"1.0","eventId":"DeviceReply","type":"info","timestamp":0,"params":{"event":3,"content":DeviceInfo.status}};
        mqttclient.publish(topic, JSON.stringify(topicInfo));
      }; 
      if (msg_type==5){
        topic='$thing/up/event/'+DeviceInfo.product_id+'/'+DeviceInfo.device_name;
        topicInfo={"method":"event_post","clientToken":"123","version":"1.0","eventId":"DeviceReply","type":"info","timestamp":0,"params":{"event":5,"content":DeviceInfo.status}};
        mqttclient.publish(topic, JSON.stringify(topicInfo));
      }; 
      if (msg_type==7){
        topic='$thing/up/event/'+DeviceInfo.product_id+'/'+DeviceInfo.device_name;
        topicInfo={"method":"event_post","clientToken":"123","version":"1.0","eventId":"DeviceReply","type":"info","timestamp":0,"params":{"event":7,"content":DeviceInfo.status}};
        mqttclient.publish(topic, JSON.stringify(topicInfo));
      }; 

      if (msg_type==9){
        topic='$thing/up/event/'+DeviceInfo.product_id+'/'+DeviceInfo.device_name;
        topicInfo={"method":"event_post","clientToken":"123","version":"1.0","eventId":"DeviceReply","type":"info","timestamp":0,"params":{"event":9,"content":DeviceInfo.status}};
        mqttclient.publish(topic, JSON.stringify(topicInfo));
      }; 

      if (msg_type==51){
        topic='$thing/up/event/'+DeviceInfo.product_id+'/'+DeviceInfo.device_name;
        topicInfo={"method":"event_post","clientToken":"123","version":"1.0","eventId":"DeviceReply","type":"info","timestamp":0,"params":{"event":51,"content":DeviceInfo.status}};
        mqttclient.publish(topic, JSON.stringify(topicInfo));
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
      console.log("Incoming IOTCamera Data");      
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

      
      //将来升级为注册指令，可以转换为msg_type处理。
       //已经注册过的设备
      var oldDevice = function (DeviceInfo) {
        console.log("Device Exist："+DeviceInfo.device_id);
        //然后根据数据包类型进行转换 msg_type： 1 心跳包 3 抓拍reply  5 长链接抓拍reply  7 升级包reply 51 配置reply
        
        
         var MqttInitInfo= MqttInit(DeviceInfo,function(err,data){
              if (err) return console.error(err);
              console.log(data.toString());
              console.log('MqttInit end');
              ReplyMessage(dataobj.msg_type,DeviceInfo);
            }
          )
       
        
      };

      var newDevice = function (DeviceInfo) {
      //新注册设备  转发MQTT注册指令
        console.log("Device New:"+DeviceInfo.device_id);
        console.log('Please config new device in Cloud Platform');

      };

      
      deviceCheck(DeviceInfo, oldDevice, newDevice);
      

      //client_sock.end(); // 正常关闭
    });
   
   
    client_sock.on("error", function(err) {
      console.log("error", err);
    });
  }  
};
