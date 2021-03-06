# Lan IoT Server


> Internet of Things Server Layer with CoAP, WebSocket, MQTT, HTTP Protocol.

Inspired by [Qest](https://github.com/mcollina/qest) 

Test on Node Version: ``v5``,``v6``

## Architecture: 

![IoT Struct](docs/struct.png)



## Lan Server Layer:

![Lan Struct](docs/iot.jpg)

## 配置

默认配置:

```javascript
{
  "encrypt": "crypto",
  "db_url": "mongodb://localhost:27017/lan",
  "db_collection": "documents",
  "db_collection_user": "user",
  "modules": [
    "coap",
    "http",
    "mqtt",
    "websocket",
    "iotcamera"
  ],
  "port": {
    "http": 8899,
    "websocket": 8898,
    "coap": 5683,
    "mqtt": 1883,
    "iotcamera":8890
  },
  "logging" :true,
  "secret": "keyboard cat"
}
```

encrypt: ["crypto", "bcrypt"]

modules: ["coap", "http", "mqtt", "websocket","iotcamera"]

Use ``bcrypt``, please install it:

    npm install --save bcrypt



## 安装(Setup)

``必装``:

1. MongoDB -> NoSQL: 数据存储
2. Sqlite || MySQL || PostgreSQL || MariaDB || MSSQL -> SQL: 存储用户信息

然后:

1.Clone

	git clone https://github.com/alanhyxf/lan --recursive

2.安装依赖

    npm install
    bower install 
    
3.修改config下的配置

    /config.json 数据库配置
    /default.json Lan系统配置   

4.数据库初始化

    npm install -g sequelize-cli
    sequelize db:migrate
    
5.Start Cron 
    
    node jobs/cron.js
    
6.运行
 
    npm start    
    
## Setup

``require``: Install

1. ``MongoDB``
2. Sqlite || MySQL || PostgreSQL || MariaDB || MSSQL -> SQL: save user info

Then.

1.Install dependencies

    npm install

Or Just Production only:

    npm install --production

2.Setup Database

    sequelize db:migrate 

    
3.Start Cron
 
    node jobs/cron.js

4.Run

    npm start

## Test With Tool

### HTTP 

Get 
    
    curl --user root:root -X GET -H "Content-Type: application/json" http://localhost:8899/topics/root

PUT/POST - cUrl

    curl --user root:root -X PUT -d '{ "dream": 1 }' -H "Content-Type: application/json" http://localhost:8899/topics/root

### MQTT 

Publish - Mosquitto

    mosquitto_pub -u root -P root -h localhost -d -t lettuce -m "Hello, MQTT. This is my first message."

Subscribe - Mosquitto

    mosquitto_sub -t message -h localhost -u root -P root

### CoAP 

POST/PUT - libcoap

    coap-client -e "{message: 'hello,world}" -m put coap://127.0.0.1/topic?root:root

GET - libcoap

    coap-client -m get coap://127.0.0.1:5683/topic?root:root
    
GET/POST/PUT - Copper
    
1. Visit [coap://127.0.0.1:5683/topic?root:root](coap://127.0.0.1:5683/topic?root:root)

GET: Click ``GET``

POST: Type on ``Outgoing``, Click ``POST``

### WebSocket

Message

    node test_scripts/ws_test.js

### iotcCamera 


## Auth

Standalone (单机)

``User`` -> ``SQL Database`` (Auth)

``SQL Database`` -> ``NoSQL`` (Save) 

Multi 

``User`` -> ``SQL Database`` (Save)

``SQL Database`` -> ``NoSQL`` (Cron Job || MQ)
 
``User`` -> ``NoSQL`` (Auth && Save)

## License

This code is distributed under the MIT license.

