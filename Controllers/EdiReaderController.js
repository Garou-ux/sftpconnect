require('./MongoConnection');
require('dotenv').config();
const fs = require('fs').promises;
const path = require('path');
const events = require('events');
const eventEmitter = events.EventEmitter;
var schedule     = require('node-schedule');
var self, carpetaServidor, RegistroArchivoEdiModel, EdiRequirementsModel, EdiTotalTransactionsModel;

function EdiController( data ){
    eventEmitter.call(this);
    self = this;
    carpetaServidor = process.env.CAPETA_STORAGE_LOCAL;
    EdiRequirementsModel = require('../Models/EdiRequirementsModel');
    RegistroArchivoEdiModel    = require('../Models/RegistroArchivoEDIModel');
    EdiTotalTransactionsModel  = require('../Models/EdiTotalTransactionsModel');
};

EdiController.prototype.getFilesFromPath = async ( path ) =>{
    return await fs.readdir(path);
};

EdiController.prototype.getTipoArchivo = async  ( filePath ) => {
    const data = await fs.readFile(filePath, 'utf8');
    const segments = data.split('\x1C');
    let stSegment = segments[2].split('*');
    return stSegment[1];
};

EdiController.prototype.existsRegistroArchivo = async ( fileName ) => {
    let query = {
        NombreArchivo: fileName,
        Activo: 1
    };
    return RegistroArchivoEdiModel.findOne(query);
};

EdiController.prototype.saveRegistroArchivo = async (fileName, type) => {
    try {
        let currentDate  = new Date().toJSON().slice(0, 10);
        const newRegistro = new RegistroArchivoEdiModel({
            NombreArchivo: fileName,
            FechaCarga   : currentDate,
            Activo       : 1,
            Ultimo       : 1,
            Tipo         : type,
            Procesado    : 0
          });
        return await newRegistro.save();
    } catch (error) {
        console.log(`error ${error}`);
        return null;    
    }
};

EdiController.prototype.parserEdiDateWithCentury = ( ediDate ) =>{
    let constructDate = null;
    if(ediDate != undefined){
        constructDate = `20${ediDate.substring(2,4)}-${ediDate.substring(4,6)}-${ediDate.substring(6,8)}`;
    }
    return constructDate;
};

EdiController.prototype.parsetEdiDate = ( ediDate ) => {
    let constructDate = null;
    //230920
    if(ediDate != undefined){
        constructDate = `20${ediDate.substring(0,2)}-${ediDate.substring(2,4)}-${ediDate.substring(4,6)}`;
    }
    return constructDate;
};

EdiController.prototype.getActualDate = () => { let date = new Date(); return date.toLocaleString(); }

EdiController.prototype.segmentPlanningScheduleEdi = async ( registroArchivoId, ediString ) => {
    const segments = ediString.split('\x1C');
    isaParts = segments[0].split('*').filter(Boolean);
    const result = {
        ISA: {},
        GS: {}    
    };
    let currentGS = null,
    currentST = null,
    currentBFR = null,
    currentN1 = null,
    ReleaseNumber = null,
    TransactionSet = null,
    ReplaceDocument = null,
    TransactionSetPurposeCode = null,
    ScheduleTypeQualifier = null,
    DocumenteReference = null,
    ShipTo = null,
    ReleaseDate = null,
    PurchaseOrderNumber = null,
    ForecastStartDate = null,
    ForecastEndDate = null,
    ForecastGeneratedDate = null,
    currentLIN = null,
    currentUIT = null,
    FechaRequerimiento = null,
    FechaFinRequerimiento = null,
    QtyRequested = 0,
    FSTQualifier = null,
    FSTTimingQualifier = null,
    SHP_QtyReceived = null,
    SHP_DateReceived = null,
    SHP_CumulativeStartDate = null,
    SHP_CumulativeEndDate = null,
    SHP_CumulativeQtyReceived = null,
    edi_total_transaction= null,
    default_value = null;

    for( let i = 1; i < segments.length; i++){
        const segmentParts = segments[i].split('*').filter(Boolean);
        const segmentType = segmentParts[0];
        if ( ['GS'].includes(segmentType) ){
            currentGS = `${segmentParts[2]}${segmentParts[3]}${segmentParts[4]}${segmentParts[5]}`;
            result.GS[currentGS] = { ST: {} };
        } else if ( ['ST'].includes(segmentType) && currentGS ){
            currentST = segmentParts[2];
            TransactionSet = segmentParts[1];
            result.GS[currentGS].ST[currentST] = {};
        } else if (['BFR', 'N1'].includes(segmentType) && currentGS && currentST ){
            if ( segmentType === 'BFR' && currentST) {
                currentBFR = `${segmentParts[3]}${segmentParts[9]}`;
                ReleaseNumber = segmentParts[3];
                PurchaseOrderNumber =  segmentParts[9];
                ReplaceDocument = segmentParts[3];
                ScheduleTypeQualifier = segmentParts[4];
                TransactionSetPurposeCode = segmentParts[1];
                ForecastStartDate = segmentParts[6];
                ForecastEndDate = segmentParts[7];
                ForecastGeneratedDate = segmentParts[8];
                result.GS[currentGS].ST[currentST][currentBFR] = {};
            } else if ( segmentType === 'N1' && currentST && currentBFR ) {
                currentN1 = segmentParts[1];
                if( segmentParts[1] === 'ST' ){
                    ShipTo = segmentParts[3];
                    result.GS[currentGS].ST[currentST][currentBFR] = {
                        TransactionSet: TransactionSet,
                        ReleaseNumber: ReleaseNumber,
                        DocumenteReference: ReleaseNumber,
                        ShipTo: ShipTo,
                        ReleaseDate: self.parsetEdiDate(ReleaseNumber.substring(13)),
                        PurchaseOrderNumber: PurchaseOrderNumber,
                        ReplaceDocument: ReplaceDocument,
                        ScheduleTypeQualifier: ScheduleTypeQualifier,
                        TransactionSetPurposeCode: TransactionSetPurposeCode,
                        ForecastStartDate: self.parserEdiDateWithCentury(ForecastStartDate),
                        ForecastEndDate: self.parserEdiDateWithCentury(ForecastEndDate),
                        ForecastGeneratedDate: self.parserEdiDateWithCentury(ForecastGeneratedDate),
                        body: {}
                    }
                    let data = {
                        TransactionSet: TransactionSet,
                        ReleaseNumber: ReleaseNumber,
                        DocumenteReference: ReleaseNumber,
                        ShipTo: ShipTo,
                        ReleaseDate: self.parsetEdiDate(ReleaseNumber.substring(13)),
                        PurchaseOrderNumber: PurchaseOrderNumber,
                        ReplaceDocument: ReplaceDocument,
                        ScheduleTypeQualifier: ScheduleTypeQualifier,
                        TransactionSetPurposeCode: TransactionSetPurposeCode,
                        ForecastStartDate: self.parserEdiDateWithCentury(ForecastStartDate),
                        ForecastEndDate: self.parserEdiDateWithCentury(ForecastEndDate),
                        ForecastGeneratedDate: self.parserEdiDateWithCentury(ForecastGeneratedDate),
                    };
                    edi_total_transaction = await self.createEdiTotalTransaction(registroArchivoId, data );

                }
            }
        }else if( ['LIN','UIT','FST','SHP'].includes(segmentType) && currentGS && currentST && currentBFR ){
            if ( segmentType === 'LIN' ){
                currentLIN = segmentParts[2];
                result.GS[currentGS].ST[currentST][currentBFR].body[currentLIN] = { FST: [], shipped: [] };
            } else if( segmentType === 'UIT' && currentLIN ){
                currentUIT = segmentParts[1];
            } else if( segmentType === 'FST' && currentLIN ){
                QtyRequested = segmentParts[1];
                FSTQualifier = segmentParts[2];
                FSTTimingQualifier = segmentParts[3];
                FechaRequerimiento = segmentParts[4];
                result.GS[currentGS].ST[currentST][currentBFR].body[currentLIN].FST.push({
                    PartNumber: currentLIN,
                    MRN: default_value,
                    UnitOfMeasure:currentUIT,
                    PurchaseOrderNumber: PurchaseOrderNumber,
                    FechaRequerimiento: self.parserEdiDateWithCentury(FechaRequerimiento),
                    FechaFinRequerimiento: self.parserEdiDateWithCentury(FechaRequerimiento),
                    QtyRequested: QtyRequested,
                    FSTQualifier: FSTQualifier,
                    FSTTimingQualifier: FSTTimingQualifier,
                    LineSequenceNumber         : default_value,
                    SetNbr                     : default_value,
                    JobNumber                  : default_value,
                    LaborGroup                 : default_value,
                    CommodityGroup             : default_value,
                    AssemblyLine               : default_value,
                    SHP_QtyReceived            : default_value,
                    SHP_DateReceived           : default_value,
                    SHP_CumulativeQtyReceived  : default_value,
                    SHP_CumulativeStartDate    : default_value,
                    SHP_CumulativeEndDate      : default_value,
                });
                let _dat = {
                    PartNumber: currentLIN,
                    MRN: default_value,
                    UnitOfMeasure:currentUIT,
                    PurchaseOrderNumber: PurchaseOrderNumber,
                    FechaRequerimiento: self.parserEdiDateWithCentury(FechaRequerimiento),
                    FechaFinRequerimiento: self.parserEdiDateWithCentury(FechaRequerimiento),
                    QtyRequested: QtyRequested,
                    FSTQualifier: FSTQualifier,
                    FSTTimingQualifier: FSTTimingQualifier,
                    LineSequenceNumber         : default_value,
                    SetNbr                     : default_value,
                    JobNumber                  : default_value,
                    LaborGroup                 : default_value,
                    CommodityGroup             : default_value,
                    AssemblyLine               : default_value,
                    SHP_QtyReceived            : default_value,
                    SHP_DateReceived           : default_value,
                    SHP_CumulativeQtyReceived  : default_value,
                    SHP_CumulativeStartDate    : default_value,
                    SHP_CumulativeEndDate      : default_value,
                };
                await self.createEdiRequirement(edi_total_transaction._doc._id, _dat);
            } else if ( segmentType === 'SHP' && currentLIN ) {
                let qtyQualifier = segmentParts[1];
                if ( qtyQualifier === '01' ) {
                    SHP_QtyReceived = segmentParts[2];
                    SHP_DateReceived = segmentParts[4];
                } else {
                    SHP_CumulativeQtyReceived = segmentParts[2];
                    SHP_CumulativeStartDate = segmentParts[4];
                    SHP_CumulativeEndDate = segmentParts[5];
                    result.GS[currentGS].ST[currentST][currentBFR].body[currentLIN].shipped.push({
                        SHP_QtyReceived: SHP_QtyReceived,
                        SHP_DateReceived: SHP_DateReceived,
                        SHP_CumulativeQtyReceived: SHP_CumulativeQtyReceived,
                        SHP_CumulativeStartDate: SHP_CumulativeStartDate,
                        SHP_CumulativeEndDate: SHP_CumulativeEndDate
                    });
                }
            }
        }
    }
    return result;
};

EdiController.prototype.segmentProductionSequenceEdi = (registroArchivoId, ediString) => {
    const segments = ediString.split('\x1C');
    isaParts = segments[0].split('*').filter(Boolean);
    const result = {
        ISA: { interchangeId: isaParts[6], interchangeDate: isaParts[9], interchangeControlNumber: isaParts[13] },
        GS: {}
    };
    let currentGS = null,
        currentST = null,
        currentLIN = null,
        currentDTM = null,
        currentN1 = null,
        currentBSS = null,
        currentCommodity = null,
        currentQTY = 1,
        currentAssemblyLine,
        currentUIT = null,
        transactionSet = null,
        ScheduleTypeQualifier,
        TransactionSetPurposeCode,
        ReleaseDate,
        edi_total_transaction = null,
        default_value = null;
        let actualQty = 1;

    for (let i = 0; i < segments.length; i++) {
        const segmentParts = segments[i].split('*').filter(Boolean);
        const segmentType = segmentParts[0];

        if (segmentType === 'GS') {
            currentGS = `${segmentParts[0]}${segmentParts[2]}${segmentParts[3]}${segmentParts[4]}`;
            result.GS[currentGS] = { ST: {} };
        } else if (segmentType === 'ST' && currentGS) {
            currentST = segmentParts[2];
            transactionSet = segmentParts[1];
            result.GS[currentGS].ST[currentST] = {};
        } else if (['BSS', 'N1', 'UIT'].indexOf(segmentType) != -1 && currentGS && currentST) {
            if (segmentType === 'BSS' && currentST) {
                currentBSS = segmentParts[7];
                ScheduleTypeQualifier = segmentParts[4];
                TransactionSetPurposeCode = segmentParts[1];
                result.GS[currentGS].ST[currentST][currentBSS] = {}
            } else if (segmentType === 'UIT' && currentGS && currentST && currentBSS) {
                currentUIT = segmentParts[1];
            } else if (segmentType === 'N1' && currentGS && currentST && currentBSS) {
                currentN1 = segmentParts[2];
                let shipto = null;
                if (segmentParts[1] === 'ST') {
                    shipto = segmentParts[3];
                    result.GS[currentGS].ST[currentST][currentBSS] = {
                        TransactionSet: transactionSet,
                        ReleaseNumber: currentBSS,
                        DocumenteReference: currentBSS,
                        ShipTo: shipto,
                        SupplierManufacturer: default_value,
                        ReleaseDate: self.parsetEdiDate(currentBSS.substring(13)),
                        PurchaseOrderNumber: default_value,
                        ReplaceDocument: default_value,
                        ScheduleTypeQualifier: ScheduleTypeQualifier,
                        TransactionSetPurposeCode: TransactionSetPurposeCode,
                        body: {}
                    };
                }
            }
        } else if (['DTM', 'QTY', 'REF', 'LIN'].indexOf(segmentType) != -1 && currentGS && currentST && currentBSS) {
            if (segmentType === 'DTM') {
                currentDTM = segmentParts[3];
                result.GS[currentGS].ST[currentST][currentBSS].body[currentDTM] = { LIN: {} };
            } else if (segmentType === 'REF' && currentDTM) {
                currentAssemblyLine = segmentParts[2];
            } else if (['QTY', 'LIN'].indexOf(segmentType) != -1 && currentDTM) {
                if (segmentType === 'LIN') { 
                    currentLIN = `${segmentParts[2]}${segmentParts[4]}${segmentParts[6]}${segmentParts[8]}${segmentParts[12]}`;
                    currentCommodity =  segmentParts[12];
                    result.GS[currentGS].ST[currentST][currentBSS].body[currentDTM].LIN[currentLIN] = {
                            PartNumber: segmentParts[6],
                            MRN: default_value,
                            UnitOfMeasure: currentUIT,
                            SetNbr: segmentParts[4],
                            LineSequenceNumber: Number(segmentParts[2]),
                            JobNumber: segmentParts[8],
                            LaborGroup: segmentParts[10].trim(),
                            PurchaseOrderNumber: segmentParts[8].trim(),
                            CommodityGroup: segmentParts[12],
                            FechaRequerimiento: self.parserEdiDateWithCentury(currentDTM),
                            FechaFinRequerimiento: self.parserEdiDateWithCentury(currentDTM),
                            QtyRequested: currentQTY,
                            AssemblyLine: Number(currentAssemblyLine),
                            SHP_QtyReceived: default_value,
                            SHP_DateReceived: default_value,
                            SHP_CumulativeQtyReceived: default_value,
                            SHP_CumulativeStartDate: default_value,
                            SHP_CumulativeEndDate: default_value,
                            FSTQualifier: default_value,
                            FSTTimingQualifier: default_value
                    };
                } else if ( segmentType === 'QTY'  && currentDTM && currentLIN && currentCommodity) {
                    if(result.GS[currentGS].ST[currentST][currentBSS].body[currentDTM].LIN[currentLIN] != undefined){
                        result.GS[currentGS].ST[currentST][currentBSS].body[currentDTM].LIN[currentLIN].QtyRequested = Number(segmentParts[2]);
                    }
                }
            }
        }
    }
    return result;
};

EdiController.prototype.createEdiTotalTransaction = async ( registroArchivoId, data ) => {
    let {TransactionSet, ReleaseNumber,DocumenteReference, ShipTo, SupplierManufacturer, ReleaseDate, PurchaseOrderNumber, ReplaceDocument, ScheduleTypeQualifier, TransactionSetPurposeCode } = data;
    const _edi_total_transactions = new EdiTotalTransactionsModel({
        RegistroArchivoId         : registroArchivoId,
        TransactionSet            : TransactionSet,
        ReleaseNumber             : ReleaseNumber,
        DocumenteReference        : DocumenteReference,
        ShipTo                    : ShipTo,
        SupplierManufacturer      : SupplierManufacturer,
        ReleaseDate               : ReleaseDate,
        PurchaseOrderNumber       : PurchaseOrderNumber,
        ReplaceDocument           : ReplaceDocument,
        ScheduleTypeQualifier     : ScheduleTypeQualifier,
        TransactionSetPurposeCode : TransactionSetPurposeCode
      });
     return await _edi_total_transactions.save();
};

EdiController.prototype.createEdiRequirement = async ( edi_total_transaction_id, item) => {
    const edi_requirements = new EdiRequirementsModel({
        edi_total_transaction_id   : edi_total_transaction_id,
        PartNumber                 : item.PartNumber,
        MRN                        : item.MRN,
        UnitOfMeasure              : item.UnitOfMeasure,
        PurchaseOrderNumber        : item.PurchaseOrderNumber,
        FechaRequerimiento         : item.FechaRequerimiento,
        FechaFinRequerimiento      : item.FechaFinRequerimiento,
        QtyRequested               : item.QtyRequested,
        FSTQualifier               : item.FSTQualifier,
        FSTTimingQualifier         : item.FSTTimingQualifier,
        LineSequenceNumber         : item.LineSequenceNumber,
        SetNbr                     : item.SetNbr,
        JobNumber                  : item.JobNumber,
        LaborGroup                 : item.LaborGroup,
        CommodityGroup             : item.CommodityGroup,
        AssemblyLine               : item.AssemblyLine,
        SHP_QtyReceived            : item.SHP_QtyReceived,
        SHP_DateReceived           : item.SHP_DateReceived,
        SHP_CumulativeQtyReceived  : item.SHP_CumulativeQtyReceived,
        SHP_CumulativeStartDate    : item.SHP_CumulativeStartDate,
        SHP_CumulativeEndDate      : item.SHP_CumulativeEndDate,
      });
      return await edi_requirements.save();
};

EdiController.prototype.readProductionSeqEdiToSave =   ( registroArchivoId, jsonEdi ) => {
        let  edi_total_transaction = null;
        Object.keys(jsonEdi.GS).forEach((gsKey) => {
            const gs = jsonEdi.GS[gsKey];

            Object.keys(gs.ST).forEach((stKey) => {
              const st = gs.ST[stKey];
          
              Object.keys(st).forEach((bssKey) => {
                const bss = st[bssKey];
                edi_total_transaction = self.createEdiTotalTransaction(registroArchivoId, bss);
          
                Object.keys(bss.body).forEach((dtmKey) => {
                  const dtm = bss.body[dtmKey];
          
                  Object.keys(dtm.LIN).forEach((linKey) => {
                    const lin = dtm.LIN[linKey];
                    edi_total_transaction.then(
                        (value) => {
                          self.createEdiRequirement(value._doc._id, lin);
                        },
                        (err) => {
                          console.error(err);
                        },
                      );
                  });
                });
              });
            });
          });
};

EdiController.prototype.saveProductionSequenceEdi = async (registroArchivoId, filePath) => {
    let actualDate = self.getActualDate();
    console.log(`Procesando EDI de Tipo 866 Production Sheduling ${actualDate} `);
    try {
      const data = await fs.readFile(filePath, 'utf8');
      let jsonEdi = await self.segmentProductionSequenceEdi(registroArchivoId, data);
      const saved = self.readProductionSeqEdiToSave(registroArchivoId, jsonEdi);
      let finishDate = self.getActualDate();
      console.log(`Finaliza 866 ${finishDate}`);
    } catch (error) {
      console.error('Error procesando EDI 866:', error);
    }
  };

EdiController.prototype.savePlanningSchedule = async (registroArchivoId, filepath) => {
    let actualDate = self.getActualDate();
    console.log(`Procesando EDI de tipo 830 Planning Schedule with Release Capability ${actualDate}`);
    const data = await fs.readFile(filepath, 'utf-8');
    let jsonEdi = await self.segmentPlanningScheduleEdi(registroArchivoId, data);
    let finishDate = self.getActualDate();  
    console.log(`Finaliza 830 ${finishDate}`);  
};

EdiController.prototype.readEdiFiles = async () => {
    let actualDate = self.getActualDate(); 
    console.log(`Comienza Proceso de EDI ${actualDate}`);
    const files = await ediCtrl.getFilesFromPath(carpetaServidor);

    for (const fileName of files) {
        let exists = await self.existsRegistroArchivo(fileName);
        if( exists === null){
            let filePath = `${carpetaServidor}/${fileName}`; 
            let tipoArchivo =  await self.getTipoArchivo(filePath);
            let registroArchivo = await self.saveRegistroArchivo(fileName, tipoArchivo);
            switch (tipoArchivo) {
                case '830':
                    await self.savePlanningSchedule(registroArchivo._doc._id, filePath);
                break;
                case '866':
                    await self.saveProductionSequenceEdi(registroArchivo._doc._id, filePath);
                break;
            }
        }
    }
    let finishDate = self.getActualDate();
    console.log(`Finaliza Proceso de EDI ${finishDate}`);  
};

EdiController.prototype.main = () =>{
    console.log(self.getActualDate());
    //cada hora va a procesarse
     schedule.scheduleJob( {minute:0}, ()=>  {  
         self.readEdiFiles();
     }); 
};

module.exports = EdiController;