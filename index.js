let stream = require('./lib/CdecStream');
let utils = require('./lib/utils');

if( process.argv.length <= 3 ) exit('Please provide a station id and date');

let stationId = process.argv[2];
let date = process.argv[3];

if( !date.match(/^\d{4}-\d{2}-\d{2}$/) ) {
  exit('Please specify a date in ISO 8601 format: yyyy-mm-dd');
}

(async function(){
  let [year, month, day] = date.split('-').map(n => parseInt(n));
  await stream.download(stationId, utils.newDate(year, month, day));
})();

function exit(msg) {
  if( msg ) console.log(msg);
  process.exit();
}