/* View Level DB Contents */

// Importing the module 'level'
const level = require('level');
// Declaring the folder path that store the data
const chainDB = './chaindata';
const util = require('util');

// Function to view what is in the LOCAL Level DB Database
function printLevelDB() {
  let self = this;
  this.db = level(chainDB);
  // By MJ FullStack, 2/25/19
  let blkCount = 0;
  return new Promise(function(resolve, reject) {
    self.db.createReadStream( {keys: true})
      .on('data', function (data) {
        console.log("\nprintLevelDB: key: ", data.key);
        console.log("printLevelDB: value:\n", JSON.parse(data.value));
        // if (data) {
        //   console.log(`data.value.hash: ${JSON.parse(data.value).hash}`);
        //   console.log(`data.value.height: ${JSON.parse(data.value).height}`);
        //   console.log(`data.value.body: ${JSON.parse(data.value).body}`);
        //   console.log(`data.value.time: ${JSON.parse(data.value).time}`);
        //   console.log(`data.value.previousBlockHash: ${JSON.parse(data.value).previousBlockHash}`);
        // }
        blkCount++;
      })
      .on('error', function (err) {
        console.log('Oh my!', err)
        reject(err)
      })
      .on('close', function () {
        console.log(`Stream closed. blkCount: ${blkCount}`)
        resolve(blkCount)
      })
      .on('end', function () {
        console.log(`Stream ended.`);
      })
  })
}

// Call the function
printLevelDB();
