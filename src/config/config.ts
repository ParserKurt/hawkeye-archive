import * as path from "path";
let config = {
    db : {
        mongo : {
            staging : {
                host : 'staging-ui.sendtextnow.com',
                port : '27017',
                database : 'aprm-test',
                collections : {
                    transactions : {
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
            staging_b : {
                host : 'staging-ui.sendtextnow.com',
                port : '27017',
                database : 'aprm-test',
                collections : {
                    transactions : {
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
        }
    },
    dir : {
        output : path.join(__dirname + "/../mongodump")
    },
    options : {
        livedb : {  // 3 months or 90 days
            archive : 90,
            purge : 90
        },
        archivedb : {   // 6 months or 180 days
            purge : 180
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