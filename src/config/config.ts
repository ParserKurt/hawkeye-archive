let config = {
    mongo : {
        host : 'staging-ui.sendtextnow.com:',
        port : '27017',
        collection : 'transactions',
        database : 'aprm-test',
        out:"/home/kurt/dumps/mongodump",
        from:1,
        to:"",
        destination:"newdb",
        buphost:"127.0.0.1:",
        source:"/home/kurt/dumps/mongodump/aprm-test/"
    },
};


module.exports = config;