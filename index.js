const stream = require('./lib/cdec-daily');
const monthlyStream = require('./lib/cdec-monthly');
const utils = require('./lib/utils');
const program = require('commander');

let actions = ['info', 'hourly', 'monthly', 'yearly'];

program
  .arguments('<stationId> <action> [type]')
  .description('Available actions: '+actions.join(', '))
  .option('-d, --date <YYYY-MM-DD>', 'Date for hourly download')
  .option('-m, --month <YYYY-MM>', 'Year-Month for monthly download')
  .option('-m, --month <YYYY-MM>', 'Year-Month for monthly download')
  .option('-y, --year <YYYY>', 'Year for yearly download')
  .action(run)


program
  .parse(process.argv);

function run(stationId, action='', type='', args) {
  if( actions.indexOf(action) === -1 ) {
    return console.log('Available actions: '+actions.join(', '));
  }
  
  if( action === 'info' ) {
    console.log('http://cdec.water.ca.gov/dynamicapp/staMeta?station_id='+stationId);
  } else if( action === 'hourly' ) {
    hourly(stationId, type, args.date);
  } else if( action === 'monthly' ) {
    monthly(stationId, type, args.month);
  } else if( action === 'yearly' ) {
    yearly(stationId, type, args.year);
  }

}

async function hourly(stationId, type, date='') {
  
  if( !date.match(/^\d{4}-\d{2}-\d{2}$/) ) {
    exit('Please specify a date in ISO 8601 format: yyyy-mm-dd');
  }

  let [year, month, day] = date.split('-').map(n => parseInt(n));
  await stream.download(stationId, type, utils.newDate(year, month, day));
}

async function monthly(stationId, type, date='') {
  await monthlyStream.run(stationId, type, date);
}

async function yearly(stationId, type, date='') {
  
  if( !date.match(/^\d{4}$/) ) {
    exit('Please specify a year in format: yyyy');
  }

  for( let i = 1; i <= 12; i++ ) {
    let m = i;
    if( m < 10 ) m = '0'+i;
    await monthlyStream.run(stationId, type, date+'-'+m);
  }
}

// if( process.argv.length <= 3 ) exit('Please provide a station id and date');

// let stationId = process.argv[2];
// let date = process.argv[3];

// if( date === 'info' ) {
//   exit('http://cdec.water.ca.gov/dynamicapp/staMeta?station_id='+stationId);
// } if( !date.match(/^\d{4}-\d{2}-\d{2}$/) ) {
//   exit('Please specify a date in ISO 8601 format: yyyy-mm-dd');
// }

// (async function(){
//   let [year, month, day] = date.split('-').map(n => parseInt(n));
//   await stream.download(stationId, utils.newDate(year, month, day));
// })();

function exit(msg) {
  if( msg ) console.log(msg);
  process.exit();
}