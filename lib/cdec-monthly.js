// Take a cdec csv and prepare for stream format insert
const fs = require('fs-extra');
const path = require('path');
const stream = require('./cdec-daily');
const stringify = require('csv-stringify');
const parse = require('csv-parse');

class CdecMonthly {

  async run(stationId, type, date='') {
    let baseDownloadPath = path.join(process.cwd());

    if( !date.match(/^\d{4}-\d{2}$/) ) {
      return console.log('Please provide month in YYYY-MM format');
    }

    let [year, month] = date.split('-').map(n => parseInt(n));
    date = new Date(year, month-1, 1, 12, 0, 0, 0);

    let downloadPath = path.join(baseDownloadPath, year+'', month+'', stationId);
    await fs.mkdirp(downloadPath);

    while( date.getMonth() === month-1 ) {
      await stream.download(stationId, type, date, downloadPath);
      date = new Date(date.getTime()+(86400*1000));
    }


    this.average(stationId, type, month, year, downloadPath);
  }

  async average(stationId, type, month, year, downloadPath) {
    let date = new Date(year, month-1, 1, 12, 0, 0, 0);
    let monthly = [['data_source', 'station_name', 'date', 
    'measurement_name', 'value', 'measurement_units', 
    'measurement_precision', 'quality_flag']];

    while( date.getMonth() === month-1 ) {
      let file =path.join(downloadPath, `${stationId}-${year}-${month}-${date.getDate()}-${type}.csv`);
      if( !fs.existsSync(file) ) {
        console.warn('Unable to find daily file: '+file);
        date = new Date(date.getTime()+(86400*1000));
        continue;
      }

      let data = await this.readCsv(file);

      let column = 1;
      let units = '';
      for( let i = 0; i < data[0].length; i++ ) {
        if( data[0][i].toLowerCase().indexOf(type) > -1 ) {
          column = i;
          units = data[0][i].toLowerCase().replace(type, '').trim();
          break;
        }
      }

      data.splice(0, 1);

      let total = 0;
      for( let row of data ) {
        total += parseFloat(row[column]);
      }
      monthly.push([
        'CDEC',
        stationId,
        date.toISOString().split('T')[0], 
        type,
        total/data.length,
        units, 
        '', // precision 
        '' // quality_flag
      ]);
      date = new Date(date.getTime()+(86400*1000));
    }

    return this.writeCsv(path.join(downloadPath, `${stationId}-${year}-${month}-${type}.csv`), monthly);
  }

  writeCsv(file, data) {
    return new Promise((resolve, reject) => {
      stringify(data, (error, result) => {
        if( error ) return reject(error);
        fs.writeFileSync(file, result);
        resolve();
      });
    });
  }

  readCsv(file) {
    return new Promise((resolve, reject) => {
      let csvStr = fs.readFileSync(file, 'utf-8');
      parse(csvStr, (error, result) => {
        if( error ) reject(error);
        else resolve(result);
      });
    });
  }

}

module.exports = new CdecMonthly();