/* ===== MemObj Class ==============================
|  Class with a constructor for MemObj	    		   |
|  ===============================================*/

class MemObj {
  constructor(addr) {
      this.walletAddress = addr,
      this.reqTimeStamp = new Date().getTime().toString().slice(0, -3),
      this.message = `${addr}:${this.reqTimeStamp}:StarRegistry`,
      this.validationWindow = 5*60 // 5 minutes in second resolution
  }
}

module.exports.MemObj = MemObj;