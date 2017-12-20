"use strict";

// make sure to install the following first: sudo apt install mongodb-clients

import * as MongoArchiver from "./lib/mongo_archiver";

let ha = new MongoArchiver();
ha.start()
    .then(() => {
        console.log("done");
    }).catch((err) => {
        console.log(err.message);
});