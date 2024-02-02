const mongoose = require('mongoose'); 
//local
// const uri = 'mongodb://localhost:27017/dbg';

//prod
const uri = 'mongodb://localhost:27017/DBGConway'

mongoose.connect(uri, {
//   useNewUrlParser: true,
//   useUnifiedTopology: true
});

const conn = mongoose.connection;

conn.on('error', () => console.error.bind(console, 'connection error'));

conn.once('open', () => console.info('Connection to Database is successful'));

module.exports = conn;