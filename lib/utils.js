const path = require('path');
const os = require('os');
const uuid = require('uuid');
const fs = require('fs-extra');

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

  async download(toFilePath, page, run) {
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

    await fs.move(path.resolve(tmpFolder, file), toFilePath);
    await fs.remove(tmpFolder);
  }

  sleep(ms){
    return new Promise(resolve=>{
        setTimeout(resolve, ms);
    });
  }

}

module.exports = new Utils();