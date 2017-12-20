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
                    host : '127.0.0.1',
                    port : '27017',
                    database : 'aprm-test-archive'
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
        output : path.join(__dirname + "/../mongodump")
    },
    options : {
        livedb : {  // in months
            archive : 0,
            purge : 3
        },
        archivedb : {   // in months
            purge : 6
        }
    }

    // mongo : {
    //     host : 'staging-ui.sendtextnow.com:',
    //     port : '27017',
    //     collection : 'transactions',
    //     database : 'aprm-test',
    //     out:"/home/kurt/dumps/mongodump",
    //     from:1,
    //     to:"",
    //     destination:"newdb",
    //     buphost:"127.0.0.1:",
    //     source:"/home/kurt/dumps/mongodump/aprm-test/"
    // },
};


module.exports = config;