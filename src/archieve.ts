const configs = require("./config/config");
const { spawn } = require('child_process');

let cfdate = configs.mongo.from;
var fromDate = new Date();
fromDate.setMonth(fromDate.getMonth() - cfdate);
var from = fromDate.toISOString();

// var datenow = new Date();
// console.log(datenow.getMonth());

console.log('from date ->',from);
// console.log('to date ->',to);
console.log('command-----',"--host','"+configs.mongo.host+"'"+configs.mongo.port+"','--db','"+configs.mongo.database+"', '--collection','"+configs.mongo.collection+"','--out','"+configs.mongo.out+"'");


// const ls = spawn("mongoexport --host test-ui.sendtextnow.com:27017 --db aprm-test --collection transactions --limit 10 --query  '{ \"date\":{\"$gte\":\""+from+"\",\"$lte\":\""+to+"\"} }' --out example.json");

const ls = spawn('mongodump',['--host',''+configs.mongo.host+''+configs.mongo.port+'','--db',''+configs.mongo.database+'', '--collection',''+configs.mongo.collection+'','--out',''+configs.mongo.out+'']);

console.log("exporting...");

        ls.stdout.on('data', (data) => {
            console.log(`stdout: ${data}`);
        });


        ls.stderr.on('data', (data) => {
            console.log(`stderr: ${data}`);
        });

        ls.on('close', (code) => {
            console.log(`child process exited with code ${code}`);
        });

console.log("done exporting...");
console.log("archiving...");

// mongorestore --host 127.0.0.1 --db newdb   /home/kurt/dumps/mongodump/aprm-test

const lsarc = spawn('mongorestore',['--host',''+configs.mongo.buphost+''+configs.mongo.port+'','--db',''+configs.mongo.destination+'',''+configs.mongo.source+'']);

        lsarc.stdout.on('data', (data) => {
            console.log(`stdout: ${data}`);
        });


        lsarc.stderr.on('data', (data) => {
            console.log(`stderr: ${data}`);
        });

        lsarc.on('close', (code) => {
            console.log(`child process exited with code ${code}`);
        });

console.log("done archiving...");