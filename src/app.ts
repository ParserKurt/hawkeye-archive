"use strict";

// make sure to install the following first: sudo apt install mongodb-clients
import * as winston from "winston";
let logger = new (winston.Logger)({
    transports: [
        new (winston.transports.Console)({colorize: true})
    ]
});

let MongoArchiver = require("./lib/mongo_archiver");


let ha = new MongoArchiver();
logger.info("starting app for mongo archiving and purging");
ha.start()
    .then(() => {
        console.log("done");
    }).catch((err) => {
        console.log(err.message);
});