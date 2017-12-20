"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// make sure to install the following first: sudo apt install mongodb-clients
const MongoArchiver = require("./lib/mongo_archiver");
let ha = new MongoArchiver();
ha.start()
    .then(() => {
    console.log("done");
}).catch((err) => {
    console.log(err.message);
});
