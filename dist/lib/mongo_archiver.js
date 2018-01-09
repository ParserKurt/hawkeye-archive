"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// import * as config from "./config/config";
// let config = require("../config/config");
const shelljs = require("shelljs");
const _ = require("lodash");
const Promise = require("bluebird");
const child_process_1 = require("child_process");
const moment = require("moment-timezone");
const fs = require("fs-extra");
Promise.promisifyAll(shelljs);
const winston = require("winston");
let logger = new (winston.Logger)({
    transports: [
        new (winston.transports.Console)({ colorize: true })
    ]
});
class MongoArchiver {
    constructor(params) {
        this.config = params.config;
        this.dir = this.config.dir.output;
        this.db_obj = this.config.db.mongo;
        this.base_date = params.d || new Date();
        // set archiving date for prod
        this.archiving_date_prod = new Date();
        this.archiving_date_prod.setDate(this.base_date.getDate() - (this.config.options.livedb.archive || 90));
        // set purge date for prod
        this.purge_date_prod = new Date();
        this.purge_date_prod.setDate(this.base_date.getDate() - (this.config.options.livedb.purge || 90));
        // set purge dates
        this.purge_date_archive = new Date();
        this.purge_date_archive.setDate(this.base_date.getDate() - (this.config.options.archivedb.purge || 180));
        this.t = params.t || moment(this.archiving_date_prod).tz('Asia/Manila').format('HHmmss');
        this.dir_date = moment(this.archiving_date_prod).tz('Asia/Manila').format('YYYY-MM-DD');
        this.from = this.archiving_date_prod.getTime();
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
            }, { concurrency: 1 }).then(() => {
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
            }, { concurrency: 1 }).then((res) => {
                logger.info("starting restore");
                return this.restore(params);
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
        return new Promise((resolve, reject) => {
            // check directory first
            let d = this.dir + "/" + params.dir_date + "/" + params.archive_time;
            fs.ensureDir(d).then(() => {
                let jsonString = '{ "' + params.collection_filter + '" : { $lte : new Date(' + params.from + ') } }';
                let command = "mongodump -h " + params.host + " " +
                    "--port " + params.port + " " +
                    "-d " + params.database + " " +
                    "-c " + params.collection + " " +
                    "--query '" + jsonString + "' " +
                    "-o " + d;
                logger.info(command);
                child_process_1.exec(command, (error, stdout, stderr) => {
                    if (error) {
                        throw new Error(`exec error: ${error}`);
                    }
                    logger.info("mongodump successful : db=", params.database, "; collection:", params.collection);
                    return params;
                });
            }).then((res) => {
                if (res === void 0 && res !== false) {
                    resolve(params);
                }
                else {
                    throw new Error("mongodump result is : " + res);
                }
            }).catch((err) => {
                logger.error("cannot perform mongodump: ", err.message);
                return Promise.resolve(false);
            });
        });
    }
    restore(params) {
        return new Promise((resolve, reject) => {
            // check directory first
            let d = params.dump_file || this.dir + "/" + this.dir_date + "/" + this.t + "/" + params.database;
            fs.ensureDir(d).then(() => {
                return this.conn({
                    host: params.destination_db.host,
                    port: params.destination_db.port,
                    database: params.destination_db.database
                }, false);
            }).then((res) => {
                if (!res) {
                    throw new Error("cannot find directory " + d);
                }
                let command = "mongorestore -h " + params.destination_db.host + " " +
                    "--port " + params.destination_db.port + " " +
                    "-d " + params.destination_db.database + " " + d;
                // "-d " + params.destination_db.database + " src/tests/sample_dump/";
                logger.info(command);
                // using spawn
                // let com : any = child_proc.spawn("mongorestore", ['--host',''+params.destination_db.host+'', '--port', ''+params.destination_db.port+'', '--db',''+params.destination_db.database+'',''+d+'']);
                // com.stdout.on('data', (data) => {
                //     logger.info(`stdout: ${data}`);
                // });
                //
                // com.stderr.on('data', (data) => {
                //     logger.info(`stderr: ${data}`);
                // });
                // com.on('exit', (code) => {
                //     logger.info(`>>> child process exited with code ${code}`);
                //     return true;
                // });
                //
                // return false;
                child_process_1.exec(command, (error, stdout, stderr) => {
                    if (error) {
                        logger.info(`exec error: ${error}`);
                        throw new Error("cannot execute");
                    }
                    logger.info("mongorestore for " + params.database + " successful", "restored to " + params.destination_db.database);
                    return true;
                });
            }).then((res) => {
                if (res === void 0 && res !== false) {
                    resolve(params);
                }
                else {
                    throw new Error("mongorestor result is : " + res);
                }
            }).catch((err) => {
                logger.error("cannot perform mongorestore: ", err.message);
                resolve(false);
            });
        });
    }
    pre_purge(params) {
        let tasks = [];
        return new Promise((resolve, reject) => {
            this.conn({
                host: params.host,
                port: params.port,
                database: params.database
            }, true).then((db) => {
                _.forEach(params.collections, (collection) => {
                    tasks.push(this.purge({ type: "prod", db: db, collection: collection.name, filter_field: collection.filter_field }));
                });
                return tasks;
            }).then((tasks) => {
                this.conn({
                    host: params.destination_db.host,
                    port: params.destination_db.port,
                    database: params.destination_db.database
                }, true).then((db) => {
                    _.forEach(params.collections, (collection) => {
                        tasks.push(this.purge({ type: "archive", db: db, collection: collection.name, filter_field: collection.filter_field }));
                    });
                    return tasks;
                }).then((tasks) => {
                    Promise.map(tasks, (task) => {
                        return task;
                    }, { concurrency: 1 })
                        .then(() => {
                        // db.close();
                        resolve(true);
                    }).catch((err) => {
                        logger.error(err.message);
                        resolve(false);
                    });
                });
            });
        });
    }
    purge(params) {
        return new Promise((resolve, reject) => {
            let to_be_deleted = (params.type === "archive") ? this.purge_date_archive : this.purge_date_prod;
            // let filter : any = "'" + params.filter_field + "' : { $lte : new Date('" + to_be_deleted + "') }";
            let filter = {};
            filter[params.filter_field] = {
                '$lte': to_be_deleted
            };
            logger.info(filter);
            params.db.collection(params.collection).deleteMany(filter, (err, obj) => {
                if (err) {
                    logger.error(params.collection, "collection cannot be purged", err.message);
                    params.db.close();
                    resolve(false);
                }
                else {
                    logger.info(params.collection, "collection purge successful");
                    params.db.close();
                    resolve(true);
                }
            });
        });
    }
}
module.exports = MongoArchiver;
