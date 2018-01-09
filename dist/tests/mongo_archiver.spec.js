"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Promise = require("bluebird");
const moment = require("moment-timezone");
let MongoArchiver = require("../lib/mongo_archiver");
const chai_1 = require("chai");
let fs = Promise.promisifyAll(require("fs"));
const winston = require("winston");
let logger = new (winston.Logger)({
    transports: [
        new (winston.transports.Console)({ colorize: true })
    ]
});
const path = require("path");
let config = {
    db: {
        mongo: {
            staging: {
                host: 'staging-ui.sendtextnow.com',
                port: '27017',
                database: 'aprm-test',
                collections: {
                    transaction: {
                        name: 'transactions',
                        filter_field: 'createdAt'
                    },
                    files: {
                        name: 'files',
                        filter_field: 'createdAt'
                    }
                },
                destination_db: {
                    host: 'staging-ui.sendtextnow.com',
                    port: '27017',
                    database: 'he-staging-archive'
                }
            },
        }
    },
    dir: {
        output: path.join(__dirname + "/../../dist/mongodump")
    },
    options: {
        livedb: {
            archive: 90,
            purge: 1
        },
        archivedb: {
            purge: 1
        }
    }
};
describe("mongodb archiving and purging tool", () => {
    it("should be able to connect to a mongodb", (done) => {
        let mongoarchiver = new MongoArchiver({
            config: config
        });
        let conn = mongoarchiver.conn(config.db.mongo.staging, false);
        chai_1.expect(conn).to.not.equal(false);
        done();
    });
    it("it should be able to archive a collection", (done) => {
        let mongoarchiver = new MongoArchiver({
            config: config
        });
        // set date parameters
        let today = new Date();
        let t = moment(today).tz('Asia/Manila').format('HHmmss');
        let dir_date = moment(today).tz('Asia/Manila').format('YYYY-MM-DD');
        today.setMonth(today.getMonth() - config.options.livedb.archive);
        let from = today.getTime();
        let dbobj = {};
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
        let path = __dirname + "/sample_dump/";
        let mongoarchiver = new MongoArchiver({
            config: config
        });
        let dbobj = {};
        dbobj.destination_db = {
            host: "staging-ui.sendtextnow.com",
            port: "27017",
            database: "he-staging-archive"
        };
        dbobj.database = "aprm-test";
        dbobj.dump_file = path;
        return mongoarchiver.restore(dbobj);
    });
    it("it should be able to purge data from mongodb", () => {
        let mongoarchiver = new MongoArchiver({
            config: config
        });
        let dbobj = {
            host: 'staging-ui.sendtextnow.com',
            port: '27017',
            database: 'newdb',
            collections: {
                transactions: {
                    name: 'transactions',
                    filter_field: 'createdAt'
                },
                files: {
                    name: 'files',
                    filter_field: 'createdAt'
                }
            },
            destination_db: {
                host: 'staging-ui.sendtextnow.com',
                port: '27017',
                database: 'he-staging-archive'
            }
        };
        return mongoarchiver.pre_purge(dbobj);
    });
});
