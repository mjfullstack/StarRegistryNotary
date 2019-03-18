/* ===== MemPool Class ==============================
|  Class with a constructor for MemPool 			   |
|  ===============================================*/

const memObj = require('./ProcObjs');

class MemPool {

  constructor() { // Both Arrays indexed by Wallet Address in reqAddrValidation
    this.addrPool = [],
    this.timeoutPool = []
  }
}

module.exports.MemPool = MemPool;