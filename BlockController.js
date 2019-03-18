const SHA256 = require('crypto-js/sha256');
const BlockClass = require('./Block.js');
const BlockChain = require('./BlockChain.js');
var path = require("path");

// Instantiate the blockchain...
let myBlockChain  = new BlockChain.Blockchain();
// let myMempool     = new memPool.Mempool();

/**
 * Controller Definition to encapsulate routes to work with blocks
 */
class BlockController {

  /**
   * Constructor to create a new BlockController,
   * you need to initialize here all your endpoints
   * @param {*} app 
   */
  constructor(app) {
    this.app = app;
    // this.blocks = [];
    // this.initializeMockData();
    this.getBlockByIndex();
    this.postNewBlock();
  }

  /**
   * Implement a GET Endpoint to retrieve a block by index
   */
  getBlockByIndex() {
    this.app.get("/block/:index", (req, res) => {
      // Add your code here
      myBlockChain.getBlockHeight().then( (totalHeight) => {
        let index = req.params.index;
        console.log(`BlockController: height = ${totalHeight}`);
        if (index >= totalHeight) {
            console.log(`index = ${index}; totalHeight: ${totalHeight}`);
            res.send(`No such Block: ${index}; Max Height: ${totalHeight -1 }`);
        } else {
          console.log(`req.params: `, req.params);
          console.log(`req.params.index: `, req.params.index);
          myBlockChain.getBlock(index).then( (gotBlock) => {
            console.log(`myBlockChain.getBlock[${index}] = `, gotBlock);
            res.send(gotBlock);
          });
        }
      })
      .catch( (err) => {
        console.log(`BlockController getBlockByIndex: Saw error ${err}`)
      })
    })
  }

  /**
   * Implement a POST Endpoint to add a new Block
   */
  postNewBlock() {
    this.app.post("/block", (req, res) => {
      // Add your code here
      let self = this;
      myBlockChain.getBlockHeight().then ((totalHeight) => {
      console.log(`BlockController: height = ${totalHeight}`);
        let blockNew = new BlockClass.Block(req.body);
        blockNew.height = totalHeight;
        blockNew.hash = SHA256(JSON.stringify(blockNew)).toString();
        console.log(`blockNew: `, blockNew);
        myBlockChain.addBlock(blockNew).then( () => {
            res.send(blockNew);
        })
      })
      .catch( (err) => {
        console.log(`BlockController postNewBlock: Saw error ${err}`)
      })
    })
  }

}

/**
 * Exporting the BlockController class
 * @param {*} app 
 */
module.exports = (app) => { return new BlockController(app);}