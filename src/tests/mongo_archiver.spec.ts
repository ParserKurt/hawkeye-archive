"use strict";

import * as Promise from "bluebird";
import * as moment from "moment-timezone";
let MongoArchiver : any = require("../lib/mongo_archiver");
import {expect as expect} from "chai";
let fs : any = Promise.promisifyAll(require("fs"));

import * as winston from "winston";
let logger = new (winston.Logger)({
    transports: [
        new (winston.transports.Console)({colorize: true})
    ]
});

import * as path from "path";
let config = {
    db : {
        mongo : {
            staging : {
                host : 'staging-ui.sendtextnow.com',
                port : '27017',
                database : 'aprm-test',
                collections : {
                    transaction : {
                        name : 'transactions',
                        filter_field : 'createdAt'
                    },
                    files : {
                        name : 'files',
                        filter_field : 'createdAt'
                    }
                },
                destination_db : {
                    host : 'staging-ui.sendtextnow.com',
                    port : '27017',
                    database : 'he-staging-archive'
                }
            },
            // local : {
            //     host : '127.0.0.1',
            //     port : '27017',
            //     database : 'he-staging',
            //     collections : [
            //         'cdrs'
            //     ],
            //     destination_db : {
            //         host : '127.0.0.1',
            //         port : '27017',
            //         database : 'aprm-test-archive'
            //     }
            // }
        }
    },
    dir : {
        output : path.join(__dirname + "/../../dist/mongodump")
    },
    options : {
        livedb : {  // in months
            archive : 90,
            purge : 90
        },
        archivedb : {   // in months
            purge : 180
        }
    }
};

describe("mongodb archiving and purging tool", () => {

    it("should be able to connect to a mongodb", (done) => {
        let mongoarchiver : any = new MongoArchiver({
            config : config
        });
        let conn = mongoarchiver.conn(config.db.mongo.staging,false);
        expect(conn).to.not.equal(false);
        done();
    });

    it("it should be able to archive a collection", (done) => {
        let mongoarchiver : any = new MongoArchiver({
            config : config
        });

        // set date parameters
        let today : any = new Date();
        let t : any = moment(today).tz('Asia/Manila').format('HHmmss');
        let dir_date : any = moment(today).tz('Asia/Manila').format('YYYY-MM-DD');
        today.setMonth(today.getMonth() - config.options.livedb.archive);
        let from : any = today.getTime();

        let dbobj : any = {};

        dbobj.host = config.db.mongo.staging.host;
        dbobj.port = config.db.mongo.staging.port;
        dbobj.database = config.db.mongo.staging.database;
        dbobj.collection = "transactions";
        dbobj.collection_filter = "createdAt";
        dbobj.dir_date = dir_date;
        dbobj.archive_time = t;
        dbobj.from = from;

        // for restore purposes
        dbobj.destination_db = config.db.mongo.staging.destination_db;

        // let archiver = mongoarchiver.archive(dbobj);
        // return archiver;

        mongoarchiver.archive(dbobj).then(done());

        // return mongoarchiver.archive(dbobj)
        //     .then((res) => {
        //         expect(res).to.not.equal(false);
        //         logger.info("res here...", res);
        //         return res;
        //     }).then((res) => {
        //         // check if dump files were created
        //         let path : string = config.dir.output + "/" + dir_date + "/" + t + "/" + config.db.mongo.staging.database + "/";
        //         fs.readdir(path, (err,  files) => {
        //             expect(files.length).to.not.equal(0);
        //             // done();
        //         });
        //     });
    });

    it("it should be able to restore the mongodump file", () => {

        let path : string = __dirname + "/sample_dump/";

        let mongoarchiver : any = new MongoArchiver({
            config : config
        });

        let dbobj : any = {};
        dbobj.destination_db = {
            host : "staging-ui.sendtextnow.com",
            port : "27017",
            database : "he-staging-archive"
        };
        dbobj.database = "aprm-test";
        dbobj.dump_file = path;

        return mongoarchiver.restore(dbobj);
    });

    it("it should be able to purge data from mongodb", () => {
        let mongoarchiver : any = new MongoArchiver({
            config : config
        });

        let dbobj : any = {};
        dbobj.destination_db = {
            host : "staging-ui.sendtextnow.com",
            port : "27017",
            database : "he-staging-archive"
        };
        dbobj.collections = {
            transactions : {
                name : 'transactions',
                filter_field : 'createdAt'
            },
        };

        return mongoarchiver.pre_purge(dbobj);
    });
});