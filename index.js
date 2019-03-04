let stream = require('./lib/CdecStream');
let utils = require('./lib/utils');

(async function(){

  await stream.download('MPD', utils.newDate(2019, 2, 5));

})();