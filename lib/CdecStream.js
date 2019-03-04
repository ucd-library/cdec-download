const puppeteer = require('puppeteer');
const utils = require('./utils');
const path = require('path');

class CdecStream {

  constructor() {
    this.BASE_URL = 'http://cdec.water.ca.gov/dynamicapp/QueryF';
    this.months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']; 
  }

  async download(sensorId, date) {
    let qs = {
      s: sensorId,
      d: this._formatDate(date),
      span: '24hour'
    };
    
    let browser = await puppeteer.launch();
    let page = await browser.newPage();

    await page.goto(this.BASE_URL+utils.objToQs(qs));

    let file = path.resolve(process.cwd(), `${sensorId}-${date.getFullYear()}-${date.getMonth()+1}-${date.getDate()}.csv`);
    
    await utils.download(
      file, page,
      () => page.$eval( '#DataTables_Table_0_wrapper .buttons-csv', btn => btn.click() )
    );

    await browser.close();
  }

  _formatDate(date) {
    let day = date.getDate();
    if( day < 10 ) day = '0'+day;

    let month = this.months[date.getMonth()];
    let year = date.getFullYear();

    return `${day}-${month}-${year} 23:39`;
  }


}

module.exports = new CdecStream();