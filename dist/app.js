"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// make sure to install the following first: sudo apt install mongodb-clients
let config = require("./config/config");
const winston = require("winston");
let logger = new (winston.Logger)({
    transports: [
        new (winston.transports.Console)({ colorize: true })
    ]
});
let MongoArchiver = require("./lib/mongo_archiver");
let ha = new MongoArchiver({
    config: config
});
logger.info("starting app for mongo archiving and purging");
ha.start()
    .then(() => {
    console.log("done");
}).catch((err) => {
    console.log(err.message);
});
