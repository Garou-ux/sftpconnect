require('./MongoConnection');
var events   = require('events');
var schedule = require('node-schedule');
const fs     = require('fs');
const Client = require('ssh2-sftp-client');
const _ = require("lodash");
const io = require('socket.io-client');
const redis = require('ioredis');
const socket_reading_port = "http://localhost:3000";
var EventEmitter = events.EventEmitter;
var rule         = new schedule.RecurrenceRule();
var EnvData;
var _Conexion;
var self;
var _client;
const fileNames = [];
var dif = [];
let intentos = 0;
let ArchivosLocales = [], ArchivosDescargables = [], Descarga = false, logEdiErrorsModel, consoleAvailableModel;



function ConectSFTP(data){
  logEdiErrorsModel = require("../Models/LogEdiErrors");
  consoleAvailableModel = require("../Models/ConsoleAvailable");

  EventEmitter.call(this);
      EnvData = data;
      _Conexion = {
          host : EnvData.SFTP_HOST_CONWAY,
          port : EnvData.SFTP_PORT_CONWAY,
      username : EnvData.SFTP_USERNAME_CONWAY,
      password : EnvData.SFTP_PASSWORD_CONWAY,
      retries : 2 //reintentos de conexion
    };
    self = this;
    _client = new Client();
}

 ConectSFTP.prototype.MainFunction = () => {
    rule.minute = new schedule.Range(0, 59, 30);
    schedule.scheduleJob( rule , ()=>{
    _client.connect(_Conexion)
    .then(async () => {
         console.log(`Buscando Archivos en carpeta ${EnvData.CARPTETA_MAIN}`);
        const files = await _client.list(EnvData.CARPTETA_MAIN);
        //local
       let CarpetaADescargar  = EnvData.CAPETA_STORAGE_LOCAL;


       //obtenemos los archivos existentes de nuestro storage
      const al = await self.GetArchivosLocales(CarpetaADescargar);
      //ahora los pasamos a un objeto
      al.forEach(NombreArchivo => {
        ArchivosLocales.push({NombreArchivo : NombreArchivo});
      });
      //Lo mismo con los archivos del sftp
      for(const file of files){
        /* Tipos de Archivos
              d : Carpeta
              - : archivo
              l : link
        */
          if(file.type === '-') {     //solo pasamos archivos
          fileNames.push({
          NombreArchivo : file.name
          });
        }
        }
        //obtenemos el objeto con las diferencias de archivos
        dif = _.differenceWith(	fileNames, ArchivosLocales, _.isEqual);
       console.log(dif.length);
      // return;
      if(dif.length <= 0){
         console.log('No Hay Archivos nuevos para descargar :c');
         return;
      }else{
      Descarga = true;
     console.log(`Lista Obtenida Correctamente, Iniciando Descarga a Carpeta ${CarpetaADescargar}`);

        for(const file of dif){
            const remoteFile = EnvData.CARPTETA_MAIN+'/'+file.NombreArchivo;
            const localFile =  CarpetaADescargar + file.NombreArchivo; 
            try {
              await _client.fastGet(remoteFile, localFile); //descargamos los archivos del sftp a nuetra carpeta local
              ArchivosDescargables.push({
                ArchivoRemoto : remoteFile,
                ArchivoLocal : localFile
              });
            }
            catch(err) { 
              console.error('Descarga Fallida :c :', err);
            };
        }
      }
    })
    .catch( async (e) => {
      if( intentos <= 3){
        self.MainFunction();
      }

      if( intentos > 3 ){
        console.log(e.stack );
        const [, lineno, colno] = e.stack.match(/(\d+):(\d+)/);
          const newLog = new logEdiErrorsModel({
            msg: e.message,
            file: 'SftpConexion.js',
            line: lineno,
            fullMsg: e.stack
        });
        newLog.save();
        let exists = await consoleAvailableModel.findOneAndUpdate({console: 'SftpConexion'}, {$set:{available: 0}}, { new: true });
        if( exists === null ){
          let newA = new consoleAvailableModel({
            console: 'SftpConexion',
            available: 0
          });
          newA.save();
        }
      }
      intentos += 1;
    })
    .finally(() => {
      Descarga ? (
        console.log(`Descarga Finalizada c:`),
        console.log(`Lista de Archivos Descargados...`),
        console.log(fileNames)
      ) : null;
      console.log(`Desconectando de sft ${_Conexion.host}.....`);
      _client.end(); //cerramos la conexion
      var D = new Date();
      var Hoy = D.toLocaleString();
      console.log(`Desconectado Correctamente ${Hoy}`);
    });
  }); 
}

//obtiene los archivos locales en una carpeta especifica
ConectSFTP.prototype.GetArchivosLocales = async (CarpetaLocal) =>{
  return await fs.promises.readdir(CarpetaLocal);
}
  module.exports = ConectSFTP;