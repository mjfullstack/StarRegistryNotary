const SHA256 = require('crypto-js/sha256');
const MemObj = require('./MemObj');
const ValidatedAddrObj = require('./ValidatedAddrObj');
const bitcoinMessage = require('bitcoinjs-message')
var path = require("path");
const BlockClass = require('./Block.js');
const BlockChain = require("./BlockChain");
const hex2ascii = require("hex2ascii")

// Instantiate the blockchain...
let myBlockChain  = new BlockChain.Blockchain();

/**
 * Controller Definition to encapsulate routes to work with blocks
 */
class MempoolController {
  /**
   * Constructor to create a new BlockController,
   * you need to initialize here all your endpoints
   * @param {*} app 
   */
  constructor(app) {
    this.app = app;
    this.tempMempool = [];
    this.timeoutReqs = [];
    this.mempoolValid = [];
    this.addrRequestValidation();
    this.sigRequestValidation();
    this.addStarData();
    this.getBlockByHash();
    this.getBlockByAddr();
    this.getBlockByIndex();
    // this.removeValidationReq();
    // this.setAddrValReqTimeout();
    this.landingPage();

  }

  // Request WALLET ADDRESS Validation
  addrRequestValidation() {
    this.app.post("/requestValidation", (req, res) => {
      // Add your code here
      let self = this;
      let newAddrValReq = new MemObj.MemObj(req.body.data); // Wallet Address from req.body
      console.log(`newAddrValReq.reqTimeStamp at NEW: ${newAddrValReq.reqTimeStamp}`);
//////// console.log(`req.requestTimeStamp: ${req.requestTimeStamp}`); // UNDEFINED
      const currentTime = new Date().getTime().toString().slice(0, -3);
      console.log(`currentTime: ${currentTime}`); // Same as NEW ABOVE
      console.log("req.body.data: ", req.body.data); // Wallet Address
      /*****************************************
       * Check if this is the same address
       * being re-submitted within timeout period...
       *****************************************/
      if ( self.tempMempool[req.body.data] ) {
        const resStatus = "This wallet address is already in the address validation queue. Existing Request: ";
        const status = 200;
        const resBody = self.tempMempool[req.body.data];
        resBody.warning = resStatus;
        console.log(resStatus, resBody.walletAddress);
        res.status(status).send(resBody);
        return
      } else {
        // Set Return Message Contents
        // newAddrValReq.walletAddress = req.body.data; // PASSED ABOVE!!!
        console.log(`newAddrValReq.message: ${newAddrValReq.message}`);
        const timeElapsed = currentTime - newAddrValReq.reqTimeStamp;
        const timeRemaining = newAddrValReq.validationWindow/1000 - timeElapsed; 
        console.log(`timeElapsed: ${timeElapsed}; timeRemaining: ${timeRemaining}`);
        // Put MemObj in Mempool ARRAY
        self.tempMempool[newAddrValReq.walletAddress] = newAddrValReq;
        console.log("PUT IN: self.tempMempool[newAddrValReq.walletAddress]: ", self.tempMempool[newAddrValReq.walletAddress]);
        // Set Timeout and Place in timeoutReqs ARRAY
        self.timeoutReqs[newAddrValReq.walletAddress] =  setTimeout( () => {
          // console.log("BEFORE: self.timeoutReqs[newAddrValReq.walletAddress]: ", self.timeoutReqs[newAddrValReq.walletAddress]);
          // console.log("BEFORE: self.tempMempool[newAddrValReq.walletAddress]: ", self.tempMempool[newAddrValReq.walletAddress]);
          // self.timeoutReqs[newAddrValReq.walletAddress] = null;
          // console.log(`\nAddress Validation Request Timed Out!\n`);
          // console.log("self.timeoutReqs[newAddrValReq.walletAddress]: ", self.timeoutReqs[newAddrValReq.walletAddress]);
          // console.log("self.tempMempool[newAddrValReq.walletAddress]: ", self.tempMempool[newAddrValReq.walletAddress]);
          // self.tempMempool[newAddrValReq.walletAddress] = null;
        }, timeRemaining);
        // console.log("self.timeoutReqs[newAddrValReq.walletAddress]: ", self.timeoutReqs[newAddrValReq.walletAddress]);
        res.send(newAddrValReq);
        /*****************************************
         * TODO: Re-Factor timeout code...
         * 
         *****************************************/
        self.callDisplayArrays(60000, 5, self.tempMempool, self.timeoutReqs, self.mempoolValid, newAddrValReq.walletAddress);
      }
    }) // ends this.app.get
  } // ends addrRequestValidation


  // Request SIGNATURE Validation
  sigRequestValidation() {
    this.app.post("/validate", (req, res) => {
      // Add your code here
      let self = this;
      const sigVerAddr = req.body.address;
      const sigVerSig = req.body.signature;
      if ( self.tempMempool[sigVerAddr] ) {
        const sigVerMsg  = self.tempMempool[sigVerAddr].message
        console.log("sigRequestValidation: self.tempMempool[sigVerAddr].walletAddress: ", self.tempMempool[sigVerAddr].walletAddress);
        console.log("sigRequestValidation: sigVerAddr: ", sigVerAddr); // Address of Signature to verify from REQ
        // Message to verify from ARRAY entry
        console.log("sigRequestValidation: self.tempMempool[sigVerAddr].message: ", self.tempMempool[req.body.address].message);
        console.log("sigRequestValidation: sigVerMsg: ", sigVerMsg); // Messavge to verify from ARRAY
        // Signature to verify from REQ
        console.log("sigRequestValidation: sigVerSig: ", sigVerSig); // Signature to verify from REQ
        /*****************************************
         *  Signature Verification code...
         *****************************************/
        try {
          let sigIsValid = bitcoinMessage.verify(sigVerMsg, sigVerAddr, sigVerSig); // Library call...
          console.log(`sigRequestValidation: sigIsValid: ${sigIsValid}`)
          if ( sigIsValid ) {
            // Set Return Message Contents
            let validAddrObj = new ValidatedAddrObj.ValidatedAddrObj(sigVerAddr); // Verified Address from req.body
            console.log("sigRequestValidation: validAddrObj: ", validAddrObj);
            // Put MemObj in Mempool ARRAY
            self.mempoolValid[sigVerAddr] = validAddrObj;
            console.log("PUT IN: sigRequestValidation: self.mempoolValid[sigVerAddr]: ", self.mempoolValid[sigVerAddr]);
            res.send(validAddrObj);
            // self.tempMempool[sigVerAddr] = null;
            self.timeoutReqs[sigVerAddr] = null;
        } else {
            res.send("Signature NOT valid!\n \
            Re-enter Signature or\n \
            Re-start with Address Verification step");
          }
        }
        catch (error) { 
          if (error) {
            console.log("bitcoinMessage.verify saw error: ", error);
            res.send("bitcoinMessage.verify saw error: ", error);
          }
        }
      } else {
        console.log("sigRequestValidation TIMED OUT!\n \
        Re-start with Address Verification step");
        res.send("Signature Validation Timed Out!\n \
        Re-start with Address Verification step");
      }
    }) // ends this.app.get
  } // ends sigRequestValidation

  // Add NEW STAR to BLOCKCHAIN
  addStarData() {
    this.app.post("/addStarData", (req, res) => {
      // Add your code here
      let self = this;
      console.log("addStarData req.body: ", req.body)
      const starDataAddr = req.body.address;
      const starDataDEC = req.body.star.dec;
      const starDataRA = req.body.star.ra;
      const starDataStory = req.body.star.story;
      console.log("addStarData: starDataAddr: ", starDataAddr);
      console.log("addStarData: starDataDEC: ", starDataDEC);
      console.log("addStarData: starDataRA: ", starDataRA);
      console.log("addStarData: starDataStory: ", starDataStory);

        /*****************************************
       * TODO: Check for only ONE STAR per request
       * to add a block to the chain...
       * 
       *****************************************/
      let blockBody = {
        address: starDataAddr,
        star: {
          dec: starDataDEC,
          ra: starDataRA,
          storyENCODED: Buffer(starDataStory).toString('hex')
        }
      }
      try {
        myBlockChain.getBlockHeight().then ((totalHeight) => {
          console.log(`BlockController: height = ${totalHeight}`);
          let blockNew = new BlockClass.Block(blockBody);
          blockNew.height = totalHeight;
          blockNew.hash = SHA256(JSON.stringify(blockNew)).toString();
          console.log(`blockNew: `, blockNew);
          myBlockChain.addBlock(blockNew).then( (addedBlock) => {
            // Add DECODED story as property to object returned...
            addedBlock.body.star.storyDECODED = hex2ascii(addedBlock.body.star.storyENCODED);
            console.log("then #1: addStarData: addedBlock: ", addedBlock);
            res.send(addedBlock);
          // }).then( (addedBlock) => {
          //   console.log("then #2: addStarData: addedBlock: ", addedBlock);
          })
          .catch((error) => {
            console.log("addStarData saw error", error);
          });
        })
      }
      catch (err) {
        console.log(`addStarData addBlock: Saw error ${err}`)
      }
    })
  }

/*****************************************************************
 * Assignment Section Titled:
 * Additional Functionalities
 ******************************************************************/  

    /**
   * Implement a GET Endpoint to retrieve a block by HASH
   */
  getBlockByHash() {
    this.app.get("/hash/:hash", (req, res) => {
      // Add your code here
      let hash = req.params.hash;
      myBlockChain.getBlockByHash(hash).then( (rtnBlockByHash) => {
        let rtnBlockByHashParsed = [];
        rtnBlockByHash.map ( (item, idx) => {
          console.log("rtnBlockByHashParsed MAP item.key: ", item.key);
          rtnBlockByHashParsed.push(JSON.parse(item.value))
        })
        rtnBlockByHashParsed.map( (item, idx) => {
          if (item.height) {
            // Add DECODED story as property to object returned...
            console.log("\nrtnBlockByHashParsed MAP item.height: ", item.height);
            console.log("rtnBlockByHashParsed item.body.star.storyENCODED: ", item.body.star.storyENCODED);
            item.body.star.storyDECODED = hex2ascii(item.body.star.storyENCODED);
            console.log("rtnBlockByHashParsed with storyDECODED item: ", item); 
          }
        })
        if ( !rtnBlockByHash ) {
          res.send(`No such Block with Hash of: ${hash}`);
          return
        } else {
          res.send(rtnBlockByHashParsed);
        }
      })
      .catch( (err) => {
        console.log(`MempoolController getBlockByHash: Saw error ${err}`)
      })
    })
  }


  /**
   * Implement a GET Endpoint to retrieve a block by WALLET ADDRESS
   */
  getBlockByAddr() {
    this.app.get("/addr/:addr", (req, res) => {
      // Add your code here
      let addr = req.params.addr;
      myBlockChain.getBlockByAddr(addr).then( (rtnBlockByAddr) => {
        let rtnBlockByAddrParsed = [];
        rtnBlockByAddr.map( (item, idx)  => {
          console.log("rtnBlockByAddrParsed MAP item.key: ", item.key);
          rtnBlockByAddrParsed.push( JSON.parse(item.value) );
        })
        rtnBlockByAddrParsed.map( (item, idx) => {
          if (item.height) {
            // Add DECODED story as property to object returned...
            console.log("\nrtnBlockByAddrParsed MAP item.height: ", item.height);
            console.log("rtnBlockByAddrParsed item.body.star.storyENCODED: ", item.body.star.storyENCODED);
            item.body.star.storyDECODED = hex2ascii(item.body.star.storyENCODED);
            console.log("rtnBlockByAddrParsed with storyDECODED item: ", item); 
          }
        })
        if ( !rtnBlockByAddr ) {
          res.send(`No such Block with Wallet Address of: ${addr}`);
          return
        } else {
          res.send(rtnBlockByAddrParsed);
        }
      })
      .catch( (err) => {
        console.log(`MempoolController getBlockByAddr: Saw error ${err}`)
      })
    })
  }


/**
   * Implement a GET Endpoint to retrieve a block by HEIGHT
   */
  getBlockByIndex() {
    this.app.get("/block/:index", (req, res) => {
      // Add your code here
      myBlockChain.getBlockHeight().then( (totalHeight) => {
        let index = req.params.index;
        console.log(`MempoolController: height = ${totalHeight}`);
        if (index >= totalHeight) {
            console.log(`index = ${index}; totalHeight: ${totalHeight}`);
            res.send(`No such Block: ${index}; Max Height: ${totalHeight -1 }`);
        } else {
          console.log(`req.params: `, req.params);
          console.log(`req.params.index: `, req.params.index);
          myBlockChain.getBlock(index).then( (gotBlock) => {
            console.log(`\ngetBlockByIndex: myBlockChain.getBlock[${index}] = `, gotBlock);
            // Add DECODED story as property to object returned...
            gotBlock.body.star.storyDECODED = hex2ascii(gotBlock.body.star.storyENCODED);
            console.log("getBlockByIndex: add DECODED story gotBlock: ", gotBlock, "\n");
            res.send(gotBlock);
          });
        }
      })
      .catch( (err) => {
        console.log(`MempoolController getBlockByIndex: Saw error ${err}`)
      })
    })
  }


  // setAddrValReqTimeout(addrValReqObj) {
  //   let self = this;
  //     // Calculate time values
  //     const currentTime = new Date().getTime().toString().slice(0,3);
  //     // const timeElapsed = currentTime - addrValReqObj.reqTimeStamp;
  //     // const timeRemaining = addrValReqObj.validationWindow/1000 - timeElapsed; 
    
  //   self.timeoutReqs[addrValReqObj.walletAddress] = setTimeout( () => {
  //     self.removeValidationReq(addrValReqObj.walletAddress)},
  //     timeRemaining);
  // } 

  // removeValidationReq(addr) {
  //   let self = this;
  //   self.tempMempool[addr] = null;
  //   self.timeoutReqs[addr] = null;
  // }

  callDisplayArrays(delay, count, arr1, arr2, arr3, walletAddress) {
    (function theLoop (i) {
      setTimeout(function () {
        // alert("Cheese!");
        let self = this;
        console.log("The Cheese #"+i+"!");
        console.log("ARR_1: self.tempMempool[walletAddress]: ", arr1[walletAddress]);
        console.log("ARR_2: self.timeoutReqs[walletAddress]: ", arr2[walletAddress]);
        console.log("ARR_3: self.mempoolValid[walletAddress]: ", arr3[walletAddress]);
        if (--i) {          // If i > 0, keep going
          if (i === 1) {
            arr1[walletAddress] = null;
            arr2[walletAddress] = null;
          }
          if (  (arr1[walletAddress] === null) ||
                (arr2[walletAddress] === null) ) {
            console.log("callDisplayArrays: Timer Exiting...")
            return
          // } else {
          }
          theLoop(i);       // Call the loop again, and pass it the current value of i
        }
      }, delay);
    })(count); // SELF-CALLING!!!
  }

  landingPage() {
    this.app.get(["/", "/block"], (req, res) => {
      // console.log(`request.body: `, req.body);
      // Basic route that sends the user first to the Landing Page
      res.sendFile(path.join(__dirname, "landingPage.html"));
    })
  }
  
}

/**
 * Exporting the Mempool class
 * @param {*} app 
 */
// Exporting a parameter via exporting a function 
// https://stackoverflow.com/questions/39331788/passing-parameters-to-module-exports-in-nodejs
module.exports = (app) => { return new MempoolController(app);}
