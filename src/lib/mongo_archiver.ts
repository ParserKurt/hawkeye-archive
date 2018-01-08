"use strict";

// import * as config from "./config/config";
// let config = require("../config/config");
import * as shelljs from "shelljs";
import * as _ from "lodash";
import * as Promise from "bluebird";

import {exec as exec} from "child_process";
import * as child_proc from "child_process";

import * as moment from "moment-timezone";
import * as fs from "fs-extra";

Promise.promisifyAll(shelljs);

import * as winston from "winston";
let logger = new (winston.Logger)({
    transports: [
        new (winston.transports.Console)({colorize: true})
    ]
});

class MongoArchiver{
    config : any;
    db_obj : any;
    dir : string;
    today : any;
    t : any;
    dir_date : any;
    from : any;

    constructor(params){
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

    conn(params, purge) : any{
        return new Promise((resolve, reject)=> {

            let MongoClient : any = Promise.promisifyAll(require('mongodb').MongoClient);
            let url : string = "mongodb://" + params.host + ":" + params.port + "/" + params.database;

            // Use connect method to connect to the Server
            MongoClient.connect(url, function(err, db) {
                if (err){
                    logger.warn(err.message);
                    resolve(false);
                } else {
                    logger.info("successfully connected to: " + params.host);
                    if(purge) {
                        resolve(db);
                    } else {
                        db.close();
                        resolve(params);
                    }
                }

            });
        });
    }

    start() : any{
        let mongoarchiver = this;
        return new Promise((resolve, reject)=> {

            let tasks : any = [];


            _.forEach(Object.keys(this.db_obj).map(key => this.db_obj[key]), function(db) {
                tasks.push(mongoarchiver.conn(db, false));
            });

            Promise.map(tasks, (res) => {
                if(res){
                    return mongoarchiver.pre_process(res);
                }
            }, {concurrency : 1})
                .then(() => {
                    resolve(true);
                }).catch((err) => {
                logger.error(err.message);
                resolve(false);
            });
        });
    }

    pre_process(params) : any {
        let mongoarchiver = this;

        return new Promise((resolve, reject) => {

            let tasks : any = [];
            let collections_str : string = "";

            _.forEach(params.collections,(collection) => {
                collections_str += ',' + collection.name;
                let dbobj : any = {};

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
            }, {concurrency : 1})
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

    archive(params) : any {
        // let mongoarchiver = this;
        return new Promise((resolve, reject) => {
            // check directory first
            let d : string = this.dir + "/" + params.dir_date + "/" + params.archive_time;
            fs.ensureDir(d).then(() => {

                let jsonString : string = '{ "' + params.collection_filter + '" : { $lte : new Date(' + params.from + ') } }';

                let command : string = "mongodump -h " + params.host + " " +
                    "--port " + params.port + " " +
                    "-d " + params.database + " " +
                    "-c " + params.collection + " " +
                    "--query '" + jsonString + "' " +
                    "-o " + d;

                logger.info(command);

                exec(command, (error, stdout, stderr) => {
                    if (error) {
                        throw new Error(`exec error: ${error}`);
                    }
                    logger.info("mongodump successful : db=", params.database, "; collection:", params.collection);
                    return params;
                });

            }).then((res) => {
                if(res === void 0 && res !== false){
                    resolve(params);
                }else{
                    throw new Error("mongodump result is : " + res);
                }
            }).catch((err) => {
                logger.error("cannot perform mongodump: ", err.message);
                return Promise.resolve(false);
            });
        });
    }

    restore(params) : any {
        return new Promise((resolve, reject) => {

            // check directory first
            let d : string = params.dump_file || this.dir + "/" + this.dir_date + "/" + this.t + "/" + params.database;

            fs.ensureDir(d).then(() => {
                return this.conn({
                   host : params.destination_db.host,
                   port : params.destination_db.port,
                   database : params.destination_db.database
                }, false);
            }).then((res) => {
                if(!res){
                    throw new Error("cannot find directory " + d);
                }

                let command : string = "mongorestore -h " + params.destination_db.host + " " +
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

                exec(command, (error, stdout, stderr) => {
                    if (error) {
                        logger.info(`exec error: ${error}`);
                        throw new Error("cannot execute");
                    }
                    logger.info("mongorestore for " + params.database + " successful", "restored to " + params.destination_db.database);
                    return true;
                });

            }).then((res) => {
                if(res === void 0 && res !== false){
                    resolve(params);
                }else{
                    throw new Error("mongorestor result is : " + res);
                }
            }).catch((err) => {
                logger.error("cannot perform mongorestore: ", err.message);
                resolve(false);
            });
        });
    }

    pre_purge(params) : any {
        return new  Promise((resolve, reject) => {
            this.conn({
                host : params.destination_db.host,
                port : params.destination_db.port,
                database : params.destination_db.database
            }, true)
                .then((db) => {
                    let tasks : any = [];
                    _.forEach(params.collections, (collection) => {
                        tasks.push(this.purge({db : db, collection : collection.name}));
                    });

                    Promise.map(tasks, (task) => {
                        return task;
                    }, {concurrency : 1})
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

    purge(params) : any {
        return new Promise((resolve, reject) => {
            params.db.collection(params.collection).deleteMany({ }, (err, obj) => {
                if(err) {
                    logger.error(params.collection, "collection cannot be purged", err.message);
                    resolve(false);
                }else{
                    logger.info(params.collection, "collection purge successful");
                    resolve(true);
                }
            })
        });
    }
}

module.exports = MongoArchiver;