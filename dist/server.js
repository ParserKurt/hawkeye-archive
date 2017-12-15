"uses strict";
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var http = require('http');
const express = require("express");
var fs = require('fs');
// var bodyParser = require('body-parser');
express = require('express');
var app = express();
app.locals.moment = require('moment');
// app.use(express.static("../ShareIt-Client"));
// var server = http.Server(app);
// var io = require('socket.io')(server);
// var port = process.env.port || 8080;
var mongodb = require('mongodb');
var MongoClient = require('mongodb').MongoClient, assert = require('assert');
// Connection URL
var url = 'mongodb://test-ui.sendtextnow.com:27017/aprm-test';
// Use connect method to connect to the Server
MongoClient.connect(url, function (err, db) {
    if (err)
        throw err;
    db.collection("transactions").find({}, { createdAt: { $gte: new Date("2012-01-12T20:15:31Z") } }).limit(1000).toArray(function (err, result) {
        if (err)
            throw err;
        console.log(result);
        db.close();
        console.log('done');
    });
});
