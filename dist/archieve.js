const { spawn } = require('child_process');
var toDate = new Date();
toDate.setMilliseconds(toDate.getMilliseconds());
var to = toDate.toISOString();
var fromDate = new Date();
fromDate.setMonth(fromDate.getMonth() - 6);
var from = fromDate.toISOString();
var datenow = new Date();
// console.log(datenow.getMonth());
// return false;
console.log('from date ->', from);
console.log('to date ->', to);
console.log('command-----', "mongoexport --host test-ui.sendtextnow.com:27017 --db aprm-test --collection transactions --limit 10 --query  '{ \"date\":{\"$gte\":\"" + from + "\",\"$lte\":\"" + to + "\"} }' --out example.json");
// const ls = spawn("mongoexport --host test-ui.sendtextnow.com:27017 --db aprm-test --collection transactions --limit 10 --query  '{ \"date\":{\"$gte\":\""+from+"\",\"$lte\":\""+to+"\"} }' --out example.json");
const ls = spawn('mongoexport', ['--host', 'test-ui.sendtextnow.com:27017', '--db', 'aprm-test', '--collection', 'transactions', '--limit', '10', '--out', 'example.json', '--query', "{ \"date\":{\"$gte\":\"" + from + "\",\"$lte\":\"" + to + "\"} }"]);
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
