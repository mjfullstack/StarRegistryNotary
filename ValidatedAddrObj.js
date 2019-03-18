/* ===== ValidAddrObj Classe==============================
|  Class with a constructor for ValidAddrObj			   |
|  ===============================================*/

class ValidatedAddrObj {
  constructor(addr) {
    this.registerStar = true;
    this.status = {
      walletAddress : addr,
      message : addr + ":StarRegistry",
      reqTimeStamp : new Date().getTime().toString().slice(0, -3),
      validationWindow : 4*60*1000, // 4 minutes in millisecond resolution
      messageSignature : true
    }
  }
}


module.exports.ValidatedAddrObj = ValidatedAddrObj;