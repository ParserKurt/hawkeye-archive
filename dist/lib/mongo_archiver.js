"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// import * as config from "./config/config";
let config = require("../config/config");
const _ = require("lodash");
const Promise = require("bluebird");
const winston = require("winston");
const child_process_1 = require("child_process");
const moment = require("moment-timezone");
const fs = require("fs-extra");
let logger = new (winston.Logger)({
    transports: [
        new (winston.transports.Console)({ colorize: true })
    ]
});
class MongoArchiver {
    constructor() {
        this.db_obj = config.db.mongo;
        this.today = new Date();
        this.t = moment(this.today).tz('Asia/Manila').format('HHmmss');
        this.dir_date = moment(this.today).tz('Asia/Manila').format('YYYY-MM-DD');
        this.today.setMonth(this.today.getMonth() - config.options.livedb.archive);
        this.from = this.today.getTime();
    }
    conn(params) {
        return new Promise((resolve, reject) => {
            let MongoClient = require('mongodb').MongoClient;
            let url = "mongodb://" + params.host + ":" + params.port + "/" + params.database;
            // Use connect method to connect to the Server
            MongoClient.connect(url, function (err, db) {
                if (err) {
                    logger.warn(err.message);
                    resolve(false);
                }
                else {
                    logger.info("successfully connected to: " + params.host);
                    db.close();
                    resolve(params);
                }
            });
        });
    }
    start() {
        let mongoarchiver = this;
        return new Promise((resolve, reject) => {
            let tasks = [];
            let dbs = this.db_obj;
            _.forEach(Object.keys(dbs).map(key => dbs[key]), function (db) {
                logger.info("here...", dbs);
                tasks.push(mongoarchiver.conn(db));
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
        logger.info("pre_process params here...", params);
        return new Promise((resolve, reject) => {
            let tasks = [];
            let collections_str = "";
            _.forEach(params.collections, (collection) => {
                collections_str += ',' + collection.name;
                let mongodb = {};
                // logger.info('collection here...', collection);
                mongodb.host = params.host;
                mongodb.port = params.port;
                mongodb.database = params.database;
                mongodb.collection = collection.name;
                mongodb.collection_filter = collection.filter_field;
                mongodb.dir_date = this.dir_date;
                mongodb.archive_time = this.t;
                mongodb.from = this.from;
                // for restore purposes
                mongodb.restore = params.destination_db;
                tasks.push(mongoarchiver.archive(mongodb));
            });
            logger.info("starting mongo archive script for " + params.host + " [" + collections_str.substr(1, collections_str.length) + "]");
            Promise.map(tasks, (task) => {
                return task;
            }, { concurrency: 1 })
                .then((res) => {
                logger.info('check params here...', res);
                resolve(true);
                // restore here...
            }).catch((err) => {
                logger.error(err.message);
                resolve(false);
            });
        });
    }
    archive(params) {
        let mongoarchiver = this;
        return new Promise((resolve, reject) => {
            // check directory first
            let dir = config.dir.output + "/" + params.dir_date + "/" + params.archive_time;
            return fs.ensureDir(dir)
                .then(() => {
                let jsonString = '{ "' + params.collection_filter + '" : { $lte : new Date(' + params.from + ') } }';
                let command = "mongodump -h " + params.host + " " +
                    "--port " + params.port + " " +
                    "-d " + params.database + " " +
                    "-c " + params.collection + " " +
                    "--query '" + jsonString + "' " +
                    "-o " + dir;
                child_process_1.exec(command, (error) => {
                    if (error) {
                        logger.info("cannot perform mongodump: ", error.message);
                        resolve(false);
                    }
                    else {
                        logger.info("mongodump for " + params.collection + " successful");
                        resolve(params);
                    }
                });
            }).catch((err) => {
                logger.error("cannot perform mongodump: ", err.message);
                resolve(false);
            });
        });
    }
    restore() {
        return new Promise((resolve, reject) => {
        });
    }
    purge() {
        return new Promise((resolve, reject) => {
        });
    }
}
module.exports = MongoArchiver;
