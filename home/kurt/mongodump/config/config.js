let config = {
    mongo: {
        host: '127.0.0.1',
        port: '27017',
        collection: 'transactions',
        database: 'aprm-test',
        out: "/home/kurt/dumps/mongodump",
        from: 6,
        to: "",
    },
};
module.exports = config;
