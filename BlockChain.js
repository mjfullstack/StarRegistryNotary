/* ===== Blockchain Class ==========================
|  Class with a constructor for new blockchain 		|
|  ================================================*/

const SHA256 = require('crypto-js/sha256');
const LevelSandbox = require('./LevelSandbox.js');
const Block = require('./Block.js');

class Blockchain {

    constructor() {
        this.bd = new LevelSandbox.LevelSandbox(); // Where did "bd" come from (vs. db, dB, DB, chainDB)?
        this.generateGenesisBlock();
    }

    // Helper method to create a Genesis Block (always with height= 0)
    // You have to options, because the method will always execute when you create your blockchain
    // you will need to set this up statically or instead you can verify if the height !== 0 then you
    // will not create the genesis block
    generateGenesisBlock() {
        // Add your code here
        let self = this;
        let newBlock = new Block.Block("Genesis Block - First block in the chain for UDACITY Project 4, Star Registry / Notary by MJFullStack - Genesis block");
        self.bd.getBlocksCount().then((currentHeight) => {
            if (currentHeight === 0) {
                self.addBlock(newBlock).then((savedBlock) => {
                    // console.log(`genGenBlk: savedBlock = ${JSON.parse(savedBlock)}`);
                    // console.log(`genGenBlk: savedBlock = ${savedBlock}`);
                    // console.log(`genGenBlk: savedBlock.hash = ${JSON.parse(savedBlock).hash}`);
                    // console.log(`genGenBlk: savedBlock.height = ${JSON.parse(savedBlock).height}`);
                    // console.log(`genGenBlk: savedBlock.body = ${JSON.parse(savedBlock).body}`);
                    // console.log(`genGenBlk: savedBlock.time = ${JSON.parse(savedBlock).time}`);
                    // console.log(`genGenBlk: savedBlock.previousBlockHash = ${JSON.parse(savedBlock).previousBlockHash}`);
                    return (savedBlock)
                })
                    .catch(function (err) {
                        console.log("genGenBlk: Saw Error: ", err);
                    })
            }
        })
    }

    // Get block height, it is a helper method that return the height of the blockchain
    getBlockHeight() {
        // Add your code here
        // Calls LevelSandbox.getBlocksCount()
        let self = this;
        return new Promise(function (resolve, reject) {
            resolve(self.bd.getBlocksCount());
        })
            .catch((error) => {
                reject(`getBlockHeight: Saw error ${error}`);
            })
    }

    // Add new block
    addBlock(newBlock) {
        // Add your code here
        let self = this;
        return new Promise(function (resolve, reject) {
            self.bd.getBlocksCount().then((count) => {
                newBlock.height = count;
                // console.log(`addBlock got height: ${newBlock.height}`)
                newBlock.time = new Date().getTime().toString().slice(0, -3); // Slice OFF the last 3 (mS) characters to get a UTC time
                if (newBlock.height > 0) { // All other blocks BESIDES Genesis Block gets in here
                    self.bd.getLevelDBData(newBlock.height - 1).then((prevBlock) => {
                        newBlock.previousBlockHash = prevBlock.hash;
                        // Copy of else leg below to KEEP within this .then
                        newBlock.hash = SHA256(JSON.stringify(newBlock)).toString();
                        self.bd.addLevelDBData(newBlock.height, JSON.stringify(newBlock)).then((block) => { // This ADDS the block to the chain!
                            // console.log("addBlock: Added this newBlock: \n", block);
                            resolve(block);
                        })
                    });
                } else { // GENESIS Block ONLY
                    newBlock.hash = SHA256(JSON.stringify(newBlock)).toString();
                    self.bd.addLevelDBData(newBlock.height, JSON.stringify(newBlock)).then((block) => { // This ADDS the block to the chain!
                        console.log("addBlock: Added this newBlock: \n", block);
                        resolve(block);
                    })
                }
            })
                .catch(function (err) {
                    reject(err);
                    console.log("addBlock: Saw Error: ", err);
                })
        })
    }

    // Get Block By HASH
    getBlockByHash(hash) {
        // Add your code here
        let self = this;
        return new Promise(function (resolve, reject) {
            self.bd.getLevelDBDataByHash(hash).then((gotBlock) => {
                console.log(`myBlockChain: getBlockByHash: Retrieved Block ${hash}. Contents are ...\n`, gotBlock);
                resolve(gotBlock);
            })
            .catch((err) => {
                if (err) {
                    console.log(`myBlockChain: getBlockByHash: Saw error  ${err}`);
                    reject(err);
                }
            })
        })
    }

    // Get Block By WALLET ADDRESS
    getBlockByAddr(addr) {
        // Add your code here
        let self = this;
        return new Promise(function (resolve, reject) {
            self.bd.getLevelDBDataByAddr(addr).then((gotBlock) => {
                console.log(`myBlockChain: getBlockByAddr: Retrieved Block By ADDRESS ${addr}. Contents are ...\n`, gotBlock);
                resolve(gotBlock);
            })
            .catch((err) => {
                if (err) {
                    console.log(`myBlockChain: getBlockByAddr: Saw error  ${err}`);
                    reject(err);
                }
            })
        })
    }

    // Get Block By Height
    getBlock(height) {
        // Add your code here
        let self = this;
        return new Promise(function (resolve, reject) {
            self.bd.getLevelDBData(height).then((gotBlock) => {
                // console.log(`myBlockChain: getBlock: Retrieved Block ${height}. Contents are ...\n`, gotBlock);
                resolve(gotBlock);
            })
                .catch((err) => {
                    if (err) {
                        console.log(`getBlock: Saw error  ${err}`);
                        reject(err);
                    }
                })
        })
    }

    // Validate if Block is being tampered by Block Height
    validateBlock(height) {
        // Add your code here
        let self = this;
        return new Promise(function (resolve, reject) {
            self.getBlock(height).then((gotBlock) => {
                // console.log(`\nvalidateBlock: Retrieved Block ${height}. Contents are ...\n`, gotBlock);
                // Re-calculate the hash from existing block's data after saving and 
                // clearing this copies hash...
                let savedGotBlockHash = gotBlock.hash;
                gotBlock.hash = '';
                let reCalcHash = SHA256(JSON.stringify(gotBlock)).toString();
                console.log(`120: validateBlock: Retrieved Block ${height} savedGotBlockHash === reCalcHash: ${savedGotBlockHash === reCalcHash}\n RE-CALC'D hash is: ${reCalcHash}`);
                if (savedGotBlockHash === reCalcHash) {
                    resolve(true)
                } else {
                    resolve(false);
                }
            })
                .catch((err) => {
                    if (err) {
                        console.log(`validateBlock: Saw error  ${err}`);
                        reject(err);
                    }
                })
        })
    }


    // Validate Blockchain
    async validateChain() {
        // Add your code here
        try {
            let self = this;
            let chainValid = true;
            let validBlockCount = 0;
            let badBlockCount = 0;
            let checkBlockHash = '';
            let nextBlockPrevHash = '';
            let validLastBlock = false;
            let blockErrors = [];
            let blockIsValid = false;
            let totalHeight = await self.getBlockHeight();
            for (let i = 0; i < totalHeight; i++) {
                console.log(`\n152: Validating Chain at block ${i}`);
                // blockErrors.forEach(error => {
                //     console.log(`154 validateChain blockErrors[i]: [${i}]: ${error}`);
                // });
                if (i === (totalHeight - 1)) { // Last Block, DON'T check NEXT block
                    blockIsValid = await self.validateBlock(i)
                    if (blockIsValid) {
                        validBlockCount++;
                        validLastBlock = true;
                    }
                    console.log(`\n162: FINAL RESULTS from validateChain:
     totalHeight:     ${totalHeight}
     validLastBlock:  ${validLastBlock}
     badBlockCount:   ${badBlockCount}
     validBlockCount: ${validBlockCount}`)
                    if (validLastBlock &&
                        (badBlockCount === 0) &&
                        (validBlockCount === totalHeight)) {
                        console.log(`\n169: validateChain: NO Block Errors Found;   Bad Block Count: ${badBlockCount}; Valid Block Count: ${validBlockCount}; Total Height: ${totalHeight}. CHAIN VALID is ${chainValid}!`);
                        return blockErrors;
                    } else {
                        if (!validLastBlock) {
                            blockErrors.push(`Block Error at Heigth ${i}; Bad Block Count: ${badBlockCount}; Valid Block Count: ${validBlockCount}; Total Height: ${totalHeight}`);
                            console.log(`173 validateChain: Block Error at Heigth ${i}; Bad Block Count: ${badBlockCount}; Valid Block Count: ${validBlockCount}; Total Height: ${totalHeight}`);
                        }
                        return blockErrors;
                    }
                } else { // ALL Blocks EXCEPT last block
                    blockIsValid = await self.validateBlock(i);
                    console.log(`178: validateChain: blockIsValid: ${blockIsValid}`);
                    if (blockIsValid) {
                        let checkBlock = await self.getBlock(i);
                        checkBlockHash = checkBlock.hash;
                        let nextBlock = await self.getBlock(i + 1);
                        nextBlockPrevHash = nextBlock.previousBlockHash;
                        console.log(`184: [i]=${i}     checkBlockHash:    ${checkBlockHash}`)
                        console.log(`185: [i+1]=${i + 1}   nextBlockPrevHash: ${nextBlockPrevHash}`)
                        console.log(`186: [i]=${i}     checkBlockHash === nextBlockPrevHash: ${checkBlockHash === nextBlockPrevHash}`);
                        if (checkBlockHash === nextBlockPrevHash) {
                            validBlockCount++;
                        } else {
                            badBlockCount = badBlockCount + 1;
                            chainValid = false;
                            blockErrors.push(`Block Error at Heigth ${i}; Bad Block Count: ${badBlockCount}; Valid Block Count: ${validBlockCount}; Total Height: ${totalHeight}`);
                            console.log(`193: validateChain: Block Error at Heigth ${i}; Bad Block Count: ${badBlockCount}; Valid Block Count: ${validBlockCount}; Total Height: ${totalHeight}`);
                        }
                    } else {
                        badBlockCount++;
                        chainValid = false;
                        blockErrors.push(`Block Error at Heigth ${i}; Bad Block Count: ${badBlockCount}; Valid Block Count: ${validBlockCount}; Total Height: ${totalHeight}`);
                        console.log(`199 validateChain: Block Error at Heigth ${i}; Bad Block Count: ${badBlockCount}; Valid Block Count: ${validBlockCount}; Total Height: ${totalHeight}`);
                    }
                }
            }; // End of for loop
        }
        catch (error) {
            console.log(`validateChain: Saw Error ${error}`);
        }
    }


    // Utility Method to Tamper a Block for Test Validation
    // This method is for testing purpose
    _modifyBlock(height, block) {
        let self = this;
        return new Promise((resolve, reject) => {
            self.bd.addLevelDBData(height, JSON.stringify(block).toString()).then((blockModified) => {
                resolve(blockModified);
            }).catch((err) => { console.log(err); reject(err) });
        });
    }

}

module.exports.Blockchain = Blockchain;
