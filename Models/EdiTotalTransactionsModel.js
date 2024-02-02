const mongoose = require('mongoose');

const Schema_edi_total_transactions =  new mongoose.Schema({
    TransactionSet:{
        type     : String,
        required : true,
       },
       ReleaseNumber:{
        type     : String,
        required : false
       },
       DocumenteReference: {
        type     : String,
        required : true
       },
       ShipTo :{
        type     : String,
        required : false
       },
       SupplierManufacturer : {
        type     : String,
        required : false
       },
       ReleaseDate:{
         type     : String,
         required : true
       },
       PurchaseOrderNumber:{
         type     : String,             /**Número de identificación del pedido Número asignado por el Comprador. ******Nota: si en el detalle del numero de parte se agrega la po, se usa esa, si no, este campo(esto aplica para el 830)*** */ 
         required : false
       },
       ReplaceDocument:{
        type     : String,
        required : false
       },
       ScheduleTypeQualifier:{
        type     : String,                /**Código que identifica el tipo de fechas utilizadas al definir un plazo de envío o entrega en un programación o previsión (DL Basado en la entrega, SH Basado en envíos)*/
        required : false                  
       },
       TransactionSetPurposeCode:{
        type     : String,                /**Código que identifica el propósito del conjunto de transacciones (Cambio, Reemplazo) */
        required : false
       },
       ForecastStartDate : {
        type     : String,
        required : false
       },
       ForecastEndDate:{
        type     : String,
        required : false
       },
       ForecastGeneratedDate:{
        type     : String,
        required : false
       },
       RegistroArchivoId:{
        type     : String,
        required : true
       },
       TotalNumpartes :{
        type     : Number,
        required : false
       }
},
{
    timestamps : true
}
);

const edi_total_transactions_mongo = mongoose.model('edi_total_transactions',Schema_edi_total_transactions);
module.exports = edi_total_transactions_mongo;