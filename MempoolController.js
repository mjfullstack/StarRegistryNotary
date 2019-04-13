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
    // this.removeAddrVailidationReq();
    this.sigRequestValidation();
    this.addStarData();
    this.getBlockByHash();
    this.getBlockByAddr();
    this.getBlockByIndex();
    // this.removeValidationReq();
    // this.setAddrValReqTimeout();
    this.landingPage();
  }

  /**
   *  Request WALLET ADDRESS Validation
   */
  addrRequestValidation() {
    this.app.post("/requestValidation", (req, res) => {
      // Add your code here
      let addr = req.body.address; // Correct
      console.log("addr::", addr);
      let self = this;
      /*****************************************
       * Check if this is the same address
       * being re-submitted within timeout period...
       *****************************************/
      console.log("addrRequestValidation self.tempMempool[addr]: ", self.tempMempool[addr] );
      if ( self.tempMempool[addr] ) {
        let resStatus = "This wallet address is already in the address validation queue. Existing Request: ";
        let status = 200;
        let currentTime = new Date().getTime().toString().slice(0, -3);
        console.log(`currentTime: ${currentTime}`);
        let timeElapsed = currentTime - self.tempMempool[addr].reqTimeStamp;
        let timeRemaining = self.tempMempool[addr].validationWindow - timeElapsed; 
        console.log(`timeElapsed: ${timeElapsed}; timeRemaining: ${timeRemaining}`);
        // const resBody = JSON.parse(JSON.stringify(self.tempMempool[addr])); // LOST ADDR
        let resBody = new MemObj.MemObj(addr); // Wallet Address from req.body.address
        resBody.reqTimeStamp = self.tempMempool[addr].reqTimeStamp;
        resBody.message = self.tempMempool[addr].message;
        if (timeRemaining > 0) {
          resBody.validationWindow = timeRemaining;
          console.log("resBody.validationWindow: ", resBody.validationWindow, "resBody.walletAddress: ", resBody.walletAddress);
          console.log("self.tempMempool[addr].validationWindow: ", self.tempMempool[addr].validationWindow);
          resBody.warning = resStatus;
          console.log(resStatus, resBody.walletAddress);
          res.status(status).send(resBody);
          return
        } else {  // For the case where the validationWindow is designed to be less than
                  // the associated timer (For Testing... not executed in this project...)
          let currentResubmitTimeout = new Date().getTime().toString().slice(0, -3);
          console.log(`addrRequestValidation: On-Click - REMOVE TIMER... currentResubmitTimeout: ${currentResubmitTimeout}`);
          resBody.validationWindow = 0;
          self.removeAddrVailidationReq(addr);
          console.log("Now send response for 'Request timed out... ' ");
          status = 408;
          resStatus = "This wallet address Request timed out... ";
          console.log(resStatus, resBody.walletAddress);
          res.status(status).send(resBody);
          return
        }
      } else {
        let newAddrValReq = new MemObj.MemObj(addr); // Wallet Address from req.body.address
        console.log(`newAddrValReq.reqTimeStamp at NEW: ${newAddrValReq.reqTimeStamp}`);
        // Set Return Message Contents
        console.log(`newAddrValReq.message: ${newAddrValReq.message}`);
        // Put MemObj in Mempool ARRAY
        self.tempMempool[newAddrValReq.walletAddress] = newAddrValReq;
        console.log("PUT IN: self.tempMempool[newAddrValReq.walletAddress]: ", self.tempMempool[newAddrValReq.walletAddress]);
        // Set Timeout and Place in timeoutReqs ARRAY
        console.log("newAddrValReq.validationWindow: ", newAddrValReq.validationWindow);
        let toReqsDelay = newAddrValReq.validationWindow;
        console.log("toReqsDelay: ", toReqsDelay);
        ////  NO TIMER SET HERE, SEE BELOW   /////
        // self.timeoutReqs[newAddrValReq.walletAddress] =  setTimeout( function () {
        //   self.removeAddrVailidationReq.bind(self, newAddrValReq.walletAddress);
        // }, toReqsDelay * 1000 ); // 30 VS 60 seconds for debug
        ////  NO TIMER SET HERE, SEE BELOW   /////
        res.send(newAddrValReq);
        // Display Timer, 1 second interval updates to console.log on node server.
        // TIMER SET / PUT INTO ARRAY INSIDE THIS CALL HERE...
        self.callDisplayArrays(60000, 5, self.tempMempool, self.timeoutReqs, self.mempoolValid, newAddrValReq.walletAddress);
      }
    }) // ends this.app.get
  } // ends addrRequestValidation
  // ADDR: 1B5niobweEWa7VFApb6fZhDN2rGzpZga88

  /**
   *  REMOVE wallet address Validation Request
   */
  removeAddrVailidationReq(walletAddress) {
    // Re-Factored timeout code...
    let self = this;
    console.log("Re-Factored timeout code...");
    // console.log("toReqsDelay: ", toReqsDelay);
    let currentTimeRAddrValReq = new Date().getTime().toString().slice(0, -3);
    console.log(`currentTimeRAddrValReq: ${currentTimeRAddrValReq}`);
    console.log("BEFORE NULL: self.tempMempool[newAddrValReq.walletAddress]: ", self.tempMempool[walletAddress]);
    console.log("BEFORE NULLself.timeoutReqs[newAddrValReq.walletAddress]: ", self.timeoutReqs[walletAddress]);
    console.log("addrRequestValidation TIMEOUT!!! Clear both tempMempool and timeoutReqs since time has expired");
    self.tempMempool[walletAddress] = null; // Clear both once time has expired
    self.timeoutReqs[walletAddress] = null;
    console.log("AFTER  NULL: self.tempMempool[newAddrValReq.walletAddress]: ", self.tempMempool[walletAddress]);
    console.log("AFTER  NULL: self.timeoutReqs[newAddrValReq.walletAddress]: ", self.timeoutReqs[walletAddress]);
  }

  /**
   *  Request SIGNATURE Validation
   */
  sigRequestValidation() {
    this.app.post("/message-signature/validate", (req, res) => {
      // Add your code here
      let self = this;
      const sigVerAddr = req.body.address;
      const sigVerSig = req.body.signature;
      let sigVerStatus = 200;
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
        try { // Library call...
          let sigIsValid = bitcoinMessage.verify(sigVerMsg, sigVerAddr, sigVerSig).then( () => {
            console.log(`sigRequestValidation: sigIsValid: ${sigIsValid}`)
            if ( sigIsValid ) {
              // Check Time Window...
              let currentTimeSigValid = new Date().getTime().toString().slice(0, -3);
              console.log(`sigRequestValidation: STORE VALID OBJECT and REMOVE TIMER... currentTimeSigValid: ${currentTimeSigValid}`);
              let timeElapsedSigValid = currentTimeSigValid - self.tempMempool[addr].reqTimeStamp; // ORIG Req Start Time
              let timeRemainingSigValid = self.tempMempool[addr].validationWindow - timeElapsedSigValid; 
              console.log(`timeElapsedSigValid: ${timeElapsedSigValid}; timeRemainingSigValid: ${timeRemainingSigValid}`);
              // ONLY if BOTH Sig Valid and within the validationWindow of 5 minutes...
              if ( timeRemainingSigValid > 0 ){
                // Set Return Message Contents
                let validAddrObj = new ValidatedAddrObj.ValidatedAddrObj(sigVerAddr); // Verified Address from req.body
                validAddrObj.validationWindow = timeRemainingSigValid;
                console.log("sigRequestValidation: validAddrObj: ", validAddrObj);
                // Put MemObj in Mempool ARRAY
                self.mempoolValid[sigVerAddr] = validAddrObj;
                console.log("PUT IN: sigRequestValidation: self.mempoolValid[sigVerAddr]: ", self.mempoolValid[sigVerAddr]);
                res.status(sigVerStatus).send(validAddrObj);
                self.removeAddrVailidationReq(sigVerAddr);
              }
            } else {
              res.status(sigVerStatus).send("Signature NOT valid!\n \
                Signature NOT valid!\n \
                Re-enter Signature or\n \
                Re-start with Address Verification step");
            }
          }); // End of THEN after Library call...
        }
        catch (error) { 
          if (error) {
            sigVerStatus = 412; // Precondition Failed, my choice since error.status was undefined
            console.log("bitcoinMessage.verify saw error: ", sigVerStatus);
            res.status(sigVerStatus).send({ sigVerError: "bitcoinMessage.verify saw error: 'Precondition Failed'-MWJ " });
          }
        }
      } else {
        sigVerStatus = 408;
        console.log("sigRequestValidation TIMED OUT!\n \
        Re-start with Address Verification step");
        res.status(sigVerStatus).send("Signature Validation Timed Out!\n \
        Re-start with Address Verification step");
      }
    }) // ends this.app.get
  } // ends sigRequestValidation
  // ADDR: 1B5niobweEWa7VFApb6fZhDN2rGzpZga88

  /**
   *  Add NEW STAR to BLOCKCHAIN
   */
  addStarData() {
    this.app.post("/block", (req, res) => {
      // Add your code here
      let self = this;
      let validateAddrState = false;
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
       * Check for only ONE STAR per request
       * to add a block to the chain...
       * 
       *****************************************/

      if ( self.mempoolValid[starDataAddr] ) {
        console.log("addStarData: starDataAddr: ", starDataAddr)
        console.log("addStarData: self.mempoolValid[starDataAddr]: ", self.mempoolValid[starDataAddr]);
        console.log("addStarData: self.mempoolValid[starDataAddr].registerStar: ", self.mempoolValid[starDataAddr].registerStar);
        console.log("addStarData: self.mempoolValid[starDataAddr].status.messageSignature: ", self.mempoolValid[starDataAddr].status.messageSignature);
        if ( self.mempoolValid[starDataAddr].registerStar &&
             self.mempoolValid[starDataAddr].status.messageSignature ) {
              validateAddrState = true;
              console.log("addStarData: validateAddrState S/B true: ", validateAddrState);
        } else {
          console.log("addStarData: validateAddrState S/B false: ", validateAddrState);
        }
      } else {
        console.log("addStarData: self.mempoolValid[starDataAddr] NOT FOUND!!!");
        console.log("addStarData: validateAddrState S/B false: ", validateAddrState);
      }
      let chkForOneBodyOnlyArray = [];
      chkForOneBodyOnlyArray.push(req.body);
      console.log("chkForOneBodyOnlyArray.length : ", chkForOneBodyOnlyArray.length);
      chkForOneBodyOnlyArray.map( (item, idx ) => {
        console.log("chkForOneBodyOnlyArray : idx: ", idx, "item: ", item);
        console.log("chkForOneBodyOnlyArray : item.address: ", item.address);
        console.log("chkForOneBodyOnlyArray : item.star: ", item.star);
        let chkForOneStarOnlyArray = [];
        chkForOneStarOnlyArray.push(item.star);
        console.log("chkForOneStarOnlyArray.length : ", chkForOneStarOnlyArray.length);
        console.log("chkForOneBODYOnlyINSIDEoneStarArray.length : ", chkForOneBodyOnlyArray.length);
        if( ( chkForOneStarOnlyArray.length !== 1 ) &&
              chkForOneBodyOnlyArray.length !== 1 ) {
                console.log("Will return here, more than one body or more than one star in a body!!!")
                res.send("Extra Data in Body or Star... ABORTING!!!");
                return
        } else {
          chkForOneStarOnlyArray.map( (starItem, starIdx) => {
            console.log( "chkForOneStarOnlyArray: starIndex", starIdx, "(BODY ITEM).address: ", item.address);
            console.log("chkForOneStarOnlyArray: starItem.dec: ", starItem.dec, "starItem.ra: ", starItem.ra);
            console.log("chkForOneStarOnlyArray: starItem.story: ", starItem.story);
          })
        }
      })
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
          if ( validateAddrState ) {
            myBlockChain.addBlock(blockNew).then( (addedBlock) => {
              // Add valid state to block being sent to frontend
              addedBlock.blockIsValid = true;
              // Add DECODED story as property to object returned...
              addedBlock.body.star.storyDECODED = hex2ascii(addedBlock.body.star.storyENCODED);
              console.log("then #1: addStarData: addedBlock: ", addedBlock);
              res.send(addedBlock);
            })
            .catch((error) => {
              console.log("addStarData saw error", error);
            });
          } else {
              // Add valid state to block being sent to frontend
              blockNew.blockIsValid = false;
              blockNew.body.star.storyDECODED = "ERROR: Address has not been validated!";
              blockNew.hash = "ERROR: Address has not been validated!";
              res.send( blockNew) ;
          }
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
    this.app.get("/stars/hash:hash", (req, res) => {
      // Add your code here
      let hash = req.params.hash;
      console.log("hash: :", hash)
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
    this.app.get("/stars/address:addr", (req, res) => {
      // Add your code here
      let addr = req.params.addr;
      console.log("addr: ", addr);
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
  // ADDR: 1B5niobweEWa7VFApb6fZhDN2rGzpZga88

  /**
   *  TIMER / Monitor Timeouts as it counts down
   */
  callDisplayArrays(delay, count, arr1, arr2, arr3, walletAddress) {
    let self = this;
    self.timeoutReqs[walletAddress] =  (function theLoop (i) {
      setTimeout(function () {
        // alert("Cheese!");
        console.log("The Cheese #"+i+"!");
        let currentTimeCheese = new Date().getTime().toString().slice(0, -3);
        console.log(`callDisplayArrays i=${i}: currentTimeCheese: ${currentTimeCheese}`);
        // console.log("ARR_1: self.tempMempool[walletAddress]: ", arr1[walletAddress]);
        // console.log("ARR_2: self.timeoutReqs[walletAddress]: ", arr2[walletAddress]);
        // console.log("ARR_3: self.mempoolValid[walletAddress]: ", arr3[walletAddress]);
        if (i--) {          // If i > 0, keep going
          if (i === 0) {
            console.log(`callDisplayArrays i=${i}: TIMEOUT, INSIDE i === 0: currentTimeCheese: ${currentTimeCheese}`);
            self.removeAddrVailidationReq(walletAddress);
            // arr1[walletAddress] = null;
            // arr2[walletAddress] = null;
          }
          if (  (arr1[walletAddress] === null) ||
                (arr2[walletAddress] === null) ) {
            console.log(`callDisplayArrays i=${i}: Saw Nulls, Timer Exiting... currentTimeCheese: ${currentTimeCheese};`);
            return
          // } else {
          }
          theLoop(i);       // Call the loop again, and pass it the current value of i
        }
      }, delay);
    })(count); // SELF-CALLING!!!
  }

  /**
   *  First Page hit / served when URL is hit
   */
  landingPage() {
    this.app.get("/", (req, res) => {
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
