var app  = require('express')();
var http = require('http').Server(app);
require('dotenv').config()
var _sftp = require('./Controllers/SftpConexion.js');
var D = new Date();
var Hoy = D.toLocaleString();
const io = require('socket.io-client');
const redis = require('ioredis');
const socket_reading_port = "http://localhost:3000";

const connectSocket = {
    connectUser : ( _socket, from = '' ) => {
        let data = { 
            estacion_id : 'adminplc'  , 
            identificador: _socket.id, 
            from : from 
        };
        _socket.emit('registeruser', data);
    },
    socketClientListening: () => {
      try {
        const socket = io.connect(socket_reading_port, {
          reconnect: true
      })
      connectSocket.connectUser(socket);
      socket.on('connect', function (socket) {
      });
      socket.on('reconnecting',(msg) =>{
          connectSocket.connectUser(socket,'reconnecting');
      });
      socket.on('SftpConexion', function(data){       
          let { reboot } = data;
          if(reboot){
            schedule.cancelJob();
            sftpconect.MainFunction();
          }
    }); 
      } catch (error) {
        console.log(error)
      }
    }   
  };

http.listen(process.env.SFTP_HTTP_PORT, (req, res)=>{
sftpconect = new _sftp(process.env);
console.log(`Obteniendo Archivos EDI para descargar ${Hoy}`);
connectSocket.socketClientListening();
sftpconect.MainFunction();
});