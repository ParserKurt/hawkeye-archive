"use strict";

// import * as config from "./config/config";
let config = require("../config/config");
import * as spawn  from "child_process";
import * as _ from "lodash";
import * as Promise from "bluebird";
import * as winston from "winston";
import {exec as exec} from "child_process";
import * as moment from "moment-timezone";
import * as fs from "fs-extra";

let logger = new (winston.Logger)({
    transports: [
        new (winston.transports.Console)({colorize: true})
    ]
});

class MongoArchiver{

    db_obj : any;

    today : any;
    t : any;
    dir_date : any;
    from : any;

    constructor(){
        this.db_obj = config.db.mongo;

        this.today = new Date();
        this.t = moment(this.today).tz('Asia/Manila').format('HHmmss');
        this.dir_date = moment(this.today).tz('Asia/Manila').format('YYYY-MM-DD');
        this.today.setMonth(this.today.getMonth() - config.options.livedb.archive);
        this.from = this.today.getTime();
    }

    conn(params) : any{
        return new Promise((resolve, reject)=> {

            let MongoClient : any = require('mongodb').MongoClient;
            let url : string = "mongodb://" + params.host + ":" + params.port + "/" + params.database;
            // Use connect method to connect to the Server
            MongoClient.connect(url, function(err, db) {
                if (err){
                    logger.warn(err.message);
                    resolve(false);
                } else {
                    logger.info("successfully connected to: " + params.host);
                    db.close();
                    resolve(params);

                }

            });
        });
    }

    start() : any{
        let mongoarchiver = this;
        return new Promise((resolve, reject)=> {

            let tasks : any = [];
            let dbs : any = this.db_obj;


            _.forEach(Object.keys(dbs).map(key => dbs[key]), function(db) {
                logger.info("here...", dbs);
                tasks.push(mongoarchiver.conn(db));
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

        logger.info("pre_process params here...", params);

        return new Promise((resolve, reject) => {

            let tasks : any = [];
            let collections_str : string = "";

            _.forEach(params.collections,(collection) => {
                collections_str += ',' + collection.name;
                let mongodb : any = {};
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
            }, {concurrency : 1})
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

    archive(params) : any {
        let mongoarchiver = this;
        return new Promise((resolve, reject) => {
            // check directory first
            let dir : string = config.dir.output + "/" + params.dir_date + "/" + params.archive_time;
            return fs.ensureDir(dir)
                .then(() => {

                    let jsonString : string = '{ "' + params.collection_filter + '" : { $lte : new Date(' + params.from + ') } }';

                    let command : string = "mongodump -h " + params.host + " " +
                        "--port " + params.port + " " +
                        "-d " + params.database + " " +
                        "-c " + params.collection + " " +
                        "--query '" + jsonString + "' " +
                        "-o " + dir;

                    exec(command, (error) => {
                        if(error){
                            logger.info("cannot perform mongodump: ", error.message);
                            resolve(false);
                        }else{
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

    restore() : any{
        return new Promise((resolve, reject) => {

        });
    }

    purge() : any{
        return new Promise((resolve, reject)=> {

        });
    }
}

module.exports = MongoArchiver;