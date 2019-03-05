const path = require('path');
const os = require('os');
const uuid = require('uuid');
const fs = require('fs-extra');
const parse = require('csv-parse');

class Utils {

  objToQs(obj) {
    let tmp = [];
    for( let key in obj ) {
      tmp.push(`${key}=${encodeURIComponent(obj[key])}`);
    }
    return '?'+tmp.join('&');
  }

  newDate(year, month, day) {
    return new Date(year, month-1, day, 12, 0, 0, 0);
  }

  async download(toFilePathBase, page, run) {
    let tmpFolder = path.join(os.tmpdir(), uuid.v4());
    let tmpFile = path.resolve(tmpFolder, '.crdownload');

    await fs.mkdir(tmpFolder);
    await page._client.send(
      'Page.setDownloadBehavior', { 
        behavior: 'allow', 
        downloadPath: tmpFolder
      }
    );

    await run();

    if( fs.existsSync(tmpFile) ) {
      while( fs.existsSync(tmpFile) ) {
        await this.sleep(500);
      }
    } else {
      await this.sleep(500);
    }

    let file = fs.readdirSync(tmpFolder)[0];
    let type = await this.getCsvType(path.resolve(tmpFolder, file));

    let toFile = toFilePathBase+'-'+type+'.csv';
    console.log('Writing', toFile);

    if( fs.existsSync(toFile) ) await fs.remove(toFile);
    await fs.move(path.resolve(tmpFolder, file), toFile);
    await fs.remove(tmpFolder);
  }

  getCsvType(file) {
    return new Promise((resolve, reject) => {
      let csvStr = fs.readFileSync(file, 'utf-8');
      parse(csvStr, (error, result) => {
        if( error ) return reject(error);
        try {
          resolve(result[0][1]
            .toLowerCase()
            .replace(/ /g, '-')
            .replace(/[^0-9a-z-_]/g, '') 
          )
        } catch(e) {
          reject(e);
        }
      })  
    });
  }

  sleep(ms){
    return new Promise(resolve=>{
        setTimeout(resolve, ms);
    });
  }

}

module.exports = new Utils();