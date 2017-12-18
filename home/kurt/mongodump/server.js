// "uses strict"
// var http = require('http');
// import express = require('express');
// var fs = require('fs');
// // var bodyParser = require('body-parser');
// express = require('express');
// var app = express();
// app.locals.moment = require('moment');
// // app.use(express.static("../ShareIt-Client"));
// // var server = http.Server(app);
// // var io = require('socket.io')(server);
// // var port = process.env.port || 8080;
//
// var mongodb = require('mongodb');
//
// var MongoClient = require('mongodb').MongoClient
//     , assert = require('assert');
//
// // Connection URL
// var url = 'mongodb://test-ui.sendtextnow.com:27017/aprm-test';
// // Use connect method to connect to the Server
// MongoClient.connect(url, function(err, db) {
//     if (err) throw err;
//     db.collection("transactions").find({}, {createdAt : { $gte : new Date("2012-01-12T20:15:31Z") }}).limit(1000).toArray(function(err, result) {
//         if (err) throw err;
//         console.log(result);
//         db.close();
//         console.log('done');
//     });
// });
//
// // var Db = mongodb.Db
// // var Server = mongodb.Server
// // var mongoDb = new Db('hawkeye_staging_fixed', new Server('10.243.15.71', 27017));
// // app.use(session({
// //     secret: 'secret',
// //     store: new MongoStore({db: mongoDb})
// // }));
//
//
//
//
// //
// // // parse application/x-www-form-urlencoded
// // app.use(bodyParser.urlencoded({ extended: false }));
// //
// // // parse application/json
// // app.use(bodyParser.json());
// //
// // app.get('/', (req, res) => {
// //     fs.readFile('index.html',
// //         (err, data) => {
// //             if (err) {
// //                 res.writeHead(500);
// //                 return res.end('Error loading index.html');
// //             }
// //
// //             res.writeHead(200);
// //             res.end(data);
// //         });
// // });
// //
// // io.on('connection', (socket) => {
// //     console.log('a user connected');
// //     socket.on('disconnect', function () {
// //         console.log('user disconnected');
// //     });
// // });
// //
// // server.listen(port, _ => {
// //     console.log('listening on *: ' + port);
// // }); 
