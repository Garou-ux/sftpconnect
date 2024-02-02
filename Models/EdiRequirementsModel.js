const mongoose = require("mongoose");

const edi_requirements_schema = new mongoose.Schema({
  edi_total_transaction_id:{
    type     : String,
    required : true
   }, 
   PartNumber :{
     type     : String,
     required : false
   },
   MRN : {
     type : String,
     required : false
   },
   UnitOfMeasure:{
    type     : String,
    required : false
   },
   PurchaseOrderNumber:{
     type     : String,             /**Número de identificación del pedido Número asignado por el Comprador. ******Nota: si en el detalle del numero de parte se agrega la po, se usa esa, si no, este campo*** */ 
     required : false
   },
   FechaRequerimiento:{
     type     : String,
     required : false
   },
   FechaFinRequerimiento:{
      type    : String,
      required: false
   },
   QtyRequested:{
     type     : String,
     required : false
   },
   FSTQualifier:{
     type     : String,
     required : false
   },
   FSTTimingQualifier:{
    type      : String,
    required  : false
   },
   LineSequenceNumber:{
    type      : String,
    required  : false
   },
   SetNbr:{
    type      : String,
    required  : false
   },
   JobNumber:{
     type     : String,
     required : false
   },
   LaborGroup:{
    type      : String,
    required  : false
   },
   CommodityGroup:{
    type      : String,
    required  : false
   },
   AssemblyLine:{
    type      : String,
    required  : false
   },
   SHP_QtyReceived:{
    type     : Number,
    required : false            /** ==========> ejemplo La última cantidad recibida fue de 650 piezas el 23/10/91 */
   },
   SHP_DateReceived:{
    type     : String,
    required : false
   },
   SHP_CumulativeQtyReceived:{
    type     : Number,
    required : false
   },                            /**=========> EJEMPLO   La cantidad acumulada recibida desde el 1/11/90 hasta el10/23/91 es de 10300 piezas. */
   SHP_CumulativeStartDate : {
    type     : String,
    required : false
   },
   SHP_CumulativeEndDate : {
    type     : String,
    required : false
   },
},
   {
    timestamps: true,
   }
);

const edi_requirements_model = mongoose.model('edi_requirements', edi_requirements_schema); 
module.exports = edi_requirements_model;