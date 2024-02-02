const mongoose = require("mongoose");

const RegistroArchivoEDISchema = new mongoose.Schema({
  NombreArchivo :{
    type     : String,
    required : false
  },
  FechaCarga : {
    type     : Date,
    required : false
  },
  Activo : {
    type     : Number,
    required : false
  },
  Ultimo : {
    type : Number,
    required  : false
  },
  Tipo : {
    type : String,
    required : false
  },
  Procesado : {
    type : Number,
    required : false
  }
},{
    timestamps :true
});

const RegistroArchivo = mongoose.model('RegistroArchivoEDI', RegistroArchivoEDISchema);
module.exports = RegistroArchivo;
