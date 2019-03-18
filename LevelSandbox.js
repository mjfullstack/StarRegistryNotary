/* ===== Persist data with LevelDB ==================
|  Learn more: level: https://github.com/Level/level |
/===================================================*/

const level = require('level');
const chainDB = './chaindata';

class LevelSandbox {

    constructor() {
        this.db = level(chainDB);
    }

    // Get data from levelDB with key (Promise)
    getLevelDBData(key){
        let self = this;
        return new Promise(function(resolve, reject) {
            // Add your code here, remember in Promises you need to resolve() or reject()
            self.db.get(key, (err, data) => {
                // console.log("getLevelDBData: data obj: ", JSON.parse(data));
                if(err){
                    if (err.type == 'NotFoundError') {
                        console.log(`getLevelDBData: S/B NotFoundError; err.type = ${err.type}`)
                        resolve(undefined);
                    }else {
                        console.log('Block ' + key + ' get failed', err);
                        reject(err);
                    }
                } else {
                    // console.log(`getLevelDBData: Block with key of ${key} got value JSON.parse(data) ${JSON.parse(data)}`); // Still gets [object Object], why is TBD
                    // console.log("getLevelDBData: JSON.parse(data).hash: ", JSON.parse(data).hash);
                    // console.log("getLevelDBData: JSON.parse(data).height: ", JSON.parse(data).height);
                    // console.log("getLevelDBData: JSON.parse(data).body: ", JSON.parse(data).body);
                    // console.log("getLevelDBData: JSON.parse(data).time: ", JSON.parse(data).time);
                    // console.log("getLevelDBData: JSON.parse(data).previousBlockHash: ", JSON.parse(data).previousBlockHash);
                    resolve(JSON.parse(data)); // JSON.parse IS REQ'D
                }
            });
        });
    }

    // Add data to levelDB with key and value (Promise)
    addLevelDBData(key, value) {
        let self = this;
        return new Promise(function(resolve, reject) {
            // Add your code here, remember in Promises you need to resolve() or reject() 
            self.db.put(key, value, function(err) {
                if (err) {
                    console.log('Block ' + key + ' submission failed', err);
                    reject(err);
                }
                //////////////////////////////////////////////////////////////////////////////
                // RETRIEVE FROM DATABASE WHAT WAS JUST PUT THERE (Write then READ to confirm)
                //////////////////////////////////////////////////////////////////////////////
                self.db.get(key, (err, data) => {
                    // console.log("addLevelDBData: data obj: ", JSON.parse(data));
                    if(err){
                        if (err.type == 'NotFoundError') {
                            console.log(`addLevelDBData: S/B NotFoundError; err.type = ${err.type}`)
                            resolve(undefined);
                        }else {
                            console.log('addLevelDBData: Block ' + key + ' get failed', err);
                            reject(err);
                        }
                    } else {
                        // console.log(`addLevelDBData: Block with key of ${key} got value JSON.parse(data) ${JSON.parse(data)}`); // Still gets [object Object], why is TBD
                        // console.log("addLevelDBData: JSON.parse(data).hash: ", JSON.parse(data).hash);
                        // console.log("addLevelDBData: JSON.parse(data).height: ", JSON.parse(data).height);
                        // console.log("addLevelDBData: JSON.parse(data).body: ", JSON.parse(data).body);
                        // console.log("addLevelDBData: JSON.parse(data).time: ", JSON.parse(data).time);
                        // console.log("addLevelDBData: JSON.parse(data).previousBlockHash: ", JSON.parse(data).previousBlockHash);
                        resolve(JSON.parse(data)); // JSON.parse IS REQ'D
                    }
                });
            });
        });
    }

    // Method that returns the height
    getBlocksCount() {
        let self = this;
        // Add your code here; MJ FullStack, 2/23/19
        let blkCount = 0;
        return new Promise(function(resolve, reject) {
            self.db.createReadStream()
            .on('data', function (data) {
            // console.log(`getBlocksCount: ${data.key} = ${data.value}`)
            blkCount++;
            })
            .on('error', function (err) {
            console.log('Oh my!', err)
            reject(err)
            })
            .on('close', function () { // LAST action
                // console.log(`Stream CLOSED. blkCount: ${blkCount}`)
                resolve(blkCount)
            })
            .on('end', function () {
            // console.log(`Stream ended.`)
            })
        })
    }

    // Get data from levelDB via HASH (Promise)
    getLevelDBDataByHash(hash){
        let self = this;
        return new Promise(function(resolve, reject) {
            // Add your code here, remember in Promises you need to resolve() or reject()
            let resultsByHash = [];
            self.db.createReadStream()
            .on('data', function (data) {
                if ( data.hash === hash ) {
                    console.log(`getLevelDBDataByHash: Hash2FIND is: ${hash}`)
                    console.log(`getLevelDBDataByHash: Blockdata is: ${data}`)
                    console.log(`getLevelDBDataByHash: BlockHASH is: ${data.hash}`)
                    resultsByHash.push(data);
                } else {
                    console.log(`getLevelDBDataByHash: Did NOT find HASH: ${hash}`);
                }
            })
            .on('error', function (err) {
                console.log('Oh my! getLevelDBDataByHash saw an error: ', err)
                reject(err)
            })
            .on('close', function () { // LAST action
                resolve(resultsByHash)
            })
            .on('end', function () {
            })
        })
    }

    // Get data from levelDB via WALLETT ADDRESS (Promise)
    getLevelDBDataByAddr(addr) {
        let self = this;
        return new Promise(function(resolve, reject) {
            // Add your code here, remember in Promises you need to resolve() or reject()
            let resultsByAddr = [];
            self.db.createReadStream()
            .on('data', function (data) {
                const parsedData = data; // JSON.parse(data);
                // if ( parsedData.body.address === addr ) {
                    console.log(`getLevelDBDataByAddr: Addr2FIND is: ${addr}`);
                    console.log(`getLevelDBDataByAddr: BLOCKdata is: `, parsedData);
                    console.log(`getLevelDBDataByAddr: BlockADDR is: `, parsedData.body);
                    resultsByAddr.push(data);
                // } else {
                //     console.log(`getLevelDBDataByAddr: Did NOT find Wallet Address: ${addr}; data: `, data);
                // }
            })
            .on('error', function (err) {
                console.log('Oh my! getLevelDBDataByAddr saw an error: ', err)
                reject(err)
            })
            .on('close', function () { // LAST action
                resolve(resultsByAddr)
            })
            .on('end', function () {
            })
        })
    }

}

module.exports.LevelSandbox = LevelSandbox;
