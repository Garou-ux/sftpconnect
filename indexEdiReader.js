const ediController = require('./Controllers/EdiReaderController');
const app             = require("express")();
const http            = require('http').Server(app);

http.listen(2520, ( req, res ) => {
    ediCtrl = new ediController();
    ediCtrl.main();
});