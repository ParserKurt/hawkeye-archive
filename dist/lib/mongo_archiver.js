"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _ = require("lodash");
const Promise = require("bluebird");
const child_process_1 = require("child_process");
const moment = require("moment-timezone");
const fs = require("fs-extra");
const winston = require("winston");
let logger = new (winston.Logger)({
    transports: [
        new (winston.transports.Console)({ colorize: true })
    ]
});
class MongoArchiver {
    constructor(params) {
        this.config = params.config;
        // logger.info('construct', this.config);
        // process.exit(1);
        this.dir = this.config.dir.output;
        this.db_obj = this.config.db.mongo;
        this.today = params.d || new Date();
        this.t = params.t || moment(this.today).tz('Asia/Manila').format('HHmmss');
        this.dir_date = moment(this.today).tz('Asia/Manila').format('YYYY-MM-DD');
        this.today.setMonth(this.today.getMonth() - (this.config.options.livedb.archive || 3));
        this.from = this.today.getTime();
    }
    conn(params, purge) {
        return new Promise((resolve, reject) => {
            let MongoClient = Promise.promisifyAll(require('mongodb').MongoClient);
            let url = "mongodb://" + params.host + ":" + params.port + "/" + params.database;
            // Use connect method to connect to the Server
            MongoClient.connect(url, function (err, db) {
                if (err) {
                    logger.warn(err.message);
                    resolve(false);
                }
                else {
                    logger.info("successfully connected to: " + params.host);
                    if (purge) {
                        resolve(db);
                    }
                    else {
                        db.close();
                        resolve(params);
                    }
                }
            });
        });
    }
    start() {
        let mongoarchiver = this;
        return new Promise((resolve, reject) => {
            let tasks = [];
            _.forEach(Object.keys(this.db_obj).map(key => this.db_obj[key]), function (db) {
                tasks.push(mongoarchiver.conn(db, false));
            });
            Promise.map(tasks, (res) => {
                if (res) {
                    return mongoarchiver.pre_process(res);
                }
            }, { concurrency: 1 })
                .then(() => {
                resolve(true);
            }).catch((err) => {
                logger.error(err.message);
                resolve(false);
            });
        });
    }
    pre_process(params) {
        let mongoarchiver = this;
        return new Promise((resolve, reject) => {
            let tasks = [];
            let collections_str = "";
            _.forEach(params.collections, (collection) => {
                collections_str += ',' + collection.name;
                let dbobj = {};
                dbobj.host = params.host;
                dbobj.port = params.port;
                dbobj.database = params.database;
                dbobj.collection = collection.name;
                dbobj.collection_filter = collection.filter_field;
                dbobj.dir_date = this.dir_date;
                dbobj.archive_time = this.t;
                dbobj.from = this.from;
                // for restore purposes
                dbobj.destination_db = params.destination_db;
                tasks.push(mongoarchiver.archive(dbobj));
            });
            logger.info("preparing to dump [" + collections_str.substr(1, collections_str.length) + "]");
            Promise.map(tasks, (task) => {
                return task;
            }, { concurrency: 1 })
                .then((res) => {
                logger.info("starting restore");
                return this.restore(params);
                // resolve(true);
            }).then(() => {
                logger.info("purging...");
                return this.pre_purge(params);
            }).then(() => {
                resolve(true);
            }).catch((err) => {
                logger.error(err.message);
                resolve(false);
            });
        });
    }
    archive(params) {
        // let mongoarchiver = this;
        return new Promise((resolve, reject) => {
            // check directory first
            let d = this.dir + "/" + params.dir_date + "/" + params.archive_time;
            return fs.ensureDir(d)
                .then(() => {
                let jsonString = '{ "' + params.collection_filter + '" : { $lte : new Date(' + params.from + ') } }';
                let command = "mongodump -h " + params.host + " " +
                    "--port " + params.port + " " +
                    "-d " + params.database + " " +
                    "-c " + params.collection + " " +
                    "--query '" + jsonString + "' " +
                    "-o " + d;
                logger.info(command);
                child_process_1.exec(command, (error) => {
                    if (error) {
                        logger.info("cannot perform mongodump: ", error.message);
                        resolve(false);
                    }
                    else {
                        logger.info("dump for " + params.collection + " successful");
                        resolve(params);
                    }
                }).stdout.on('data', (data) => {
                    logger.info(data);
                });
            }).catch((err) => {
                logger.error("cannot perform mongodump: ", err.message);
                resolve(false);
            });
        });
    }
    restore(params) {
        return new Promise((resolve, reject) => {
            // check directory first
            let d = this.dir + "/" + this.dir_date + "/" + this.t + "/" + params.database;
            return fs.ensureDir(d)
                .then(() => {
                this.conn({
                    host: params.destination_db.host,
                    port: params.destination_db.port,
                    database: params.destination_db.database
                }, false).then((res) => {
                    if (!res) {
                        resolve(false);
                    }
                    let command = "mongorestore -h " + params.destination_db.host + " " +
                        "--port " + params.destination_db.port + " " +
                        "-d " + params.destination_db.database + " " + d;
                    child_process_1.exec(command, (error) => {
                        if (error) {
                            logger.info("cannot perform mongorestore: ", error.message);
                            resolve(false);
                        }
                        else {
                            logger.info("mongorestore for " + params.database + " successful", "restored to " + params.destination_db.database);
                            resolve(true);
                        }
                    }).stdout.on('data', (data) => {
                        logger.info(data);
                    });
                });
            }).catch((err) => {
                logger.error("cannot perform mongorestore: ", err.message);
                resolve(false);
            });
        });
    }
    pre_purge(params) {
        return new Promise((resolve, reject) => {
            this.conn({
                host: params.destination_db.host,
                port: params.destination_db.port,
                database: params.destination_db.database
            }, true)
                .then((db) => {
                let tasks = [];
                _.forEach(params.collections, (collection) => {
                    tasks.push(this.purge({ db: db, collection: collection.name }));
                });
                Promise.map(tasks, (task) => {
                    return task;
                }, { concurrency: 1 })
                    .then(() => {
                    db.close();
                    resolve(true);
                }).catch((err) => {
                    logger.error(err.message);
                    resolve(false);
                });
            });
        });
    }
    purge(params) {
        return new Promise((resolve, reject) => {
            params.db.collection(params.collection).deleteMany({}, (err, obj) => {
                if (err) {
                    logger.error(params.collection, "collection cannot be purged", err.message);
                    resolve(false);
                }
                else {
                    logger.info(params.collection, "collection purge successful");
                    resolve(true);
                }
            });
        });
    }
}
module.exports = MongoArchiver;
