/* ===== ValidAddrObj Classe==============================
|  Class with a constructor for ValidAddrObj			   |
|  ===============================================*/

class ValidatedAddrObj {
  constructor(addr) {
    this.registerStar = true;
    this.status = {
      walletAddress : addr,
      reqTimeStamp : new Date().getTime().toString().slice(0, -3),
      message : `${addr}:${this.reqTimeStamp}:StarRegistry`,
      validationWindow : 4*60, // 4 minutes in second resolution
      messageSignature : true
    }
  }
}


module.exports.ValidatedAddrObj = ValidatedAddrObj;