const express = require("express");
const bodyParser = require("body-parser");
// Importing Path
// var path = require("path");


/**
 * Class Definition for the REST API
 */
class BlockAPI {
    /**
     * Constructor that allows initialize the class 
     */
    constructor() {
		this.app = express();
		this.initExpress();
		this.initExpressMiddleWare();
		this.initControllers();
		this.start();
	}

	/**
	 * Initilization of the Express framework
	 */
	initExpress() {
		this.app.set("port", 8000);
	}

	/**
	 * Initialization of the middleware modules
	 */
	initExpressMiddleWare() {
		this.app.use(bodyParser.urlencoded({extended:true}));
		this.app.use(bodyParser.json());
	}

	/**
	 * Initilization of all the controllers
	 */
	initControllers() {
		require("./BlockController.js")(this.app);
		// require("./MempoolController.js")(this.app);
	}

    /**
     * Starting the REST Api application
     */
	start() {
		let self = this;
		this.app.listen(this.app.get("port"), () => {
			console.log(`Server Listening for port: ${self.app.get("port")}`);
		});
	}

}

new BlockAPI();
