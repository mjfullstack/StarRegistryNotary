/* ===== MemObj Class ==============================
|  Class with a constructor for MemObj			   |
|  ===============================================*/

class MemObj {
  constructor(addr) {
      this.walletAddress = addr,
      this.message = addr + ":StarRegistry",
      this.reqTimeStamp = new Date().getTime().toString().slice(0, -3),
      this.validationWindow = 5*60*1000 // 5 minutes in millisecond resolution
  }
}

module.exports.MemObj = MemObj;