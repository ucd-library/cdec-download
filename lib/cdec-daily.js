const puppeteer = require('puppeteer');
const utils = require('./utils');
const path = require('path');
const fs = require('fs-extra');
const moment = require('moment');
const stringify = require('csv-stringify');
const parse = require('csv-parse');

class CdecDaily {

  constructor() {
    this.BASE_URL = 'http://cdec.water.ca.gov/dynamicapp/QueryF';
    this.months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']; 
    this.MAX_ATTEMPTS = 3;
  }

  async download(sensorId, type, date, toDir) {


    let fileBase = path.resolve(toDir || process.cwd(), `${sensorId}-${date.getFullYear()}-${date.getMonth()+1}-${date.getDate()}`);
    let file = fileBase+'-'+type+'.csv';

    if( fs.existsSync(file) ) {
      return console.log(`File exists: ${file}`);
    }
    
    let browser = await puppeteer.launch();
    let page = await browser.newPage();

    for( let i = 0; i < this.MAX_ATTEMPTS; i++ ) {
      try {
        await this.attemptDownload(page, sensorId, type, date, file);
        break;
      } catch(e) {
        console.log('Failed attempt: '+(i+1));
      }
    }

    await browser.close();
  }

  async attemptDownload(page, sensorId, type, date, file) {
    let qs = {
      s: sensorId,
      d: this._formatDate(date),
      span: '24hour'
    };
    
    await page.goto(this.BASE_URL+utils.objToQs(qs));

    let tables = await page.evaluate(type => {
      return [].slice
        .call(document.querySelectorAll('.dataTables_wrapper thead > tr > th  i  a'))
        .filter(ele => ele.innerText.toLowerCase().trim() === type)
        .map(ele => {
          let tmp = [];
          while( !ele.classList.contains('dataTables_wrapper') ) {
            ele = ele.parentElement;
            if( ele === null ) return tmp;
          }
          return ele.id;
        });
    }, type);

    if( tables.length === 0 ) {
      return console.log(`no data for: ${sensorId} ${type} ${date}`);
    } else if( tables[0] === null ) {
      return console.log(`no data for: ${sensorId} ${type} ${date}`);
    } 

    await utils.download(
      file, page,
      () => page.$eval( `#${tables[0]} .buttons-csv`, btn => btn.click() )
    );

    await this._formatData(file, type);
  }

  async _formatData(file, type) {
    let data = await this.readCsv(file);
    let columns = [0];
    let daily = [];

    for( let i = 0; i < data[0].length; i++ ) {
      if( data[0][i].toLowerCase().indexOf(type) > -1 ) {
        columns.push(i);
        break;
      }
    }

    let tz = data[0][0].replace('DATE / TIME', '');
    daily.push(['DATETIME', data[0][columns[1]]]);
    data.splice(0, 1);
  
    for( let row of data ) {
      row[0] = moment(row[0]+' '+tz, 'MM/DD/YYYY hh:mm Z').toISOString();
      row = row.filter((v, i) => {
        return (columns.indexOf(i) > -1);
      });
      daily.push(row);
    }

    await this.writeCsv(file, daily);
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

  _formatDate(date) {
    let day = date.getDate();
    if( day < 10 ) day = '0'+day;

    let month = this.months[date.getMonth()];
    let year = date.getFullYear();

    return `${day}-${month}-${year} 23:39`;
  }

}

module.exports = new CdecDaily();