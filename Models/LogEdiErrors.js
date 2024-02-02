const mongoose = require("mongoose");

const logEdiErrorsSchema = new mongoose.Schema({
    msg:{
      type: String,
      required: true
    },
    file:{
        type: String,
        required: true
    },
    line:{
        type: String,
        required: true
    },
    fullMsg:{
        type: String,
        required: true
    }

},{
    timestamps: true
});

const logEdiErrorsModel = mongoose.model('log_edi_errors', logEdiErrorsSchema);
module.exports = logEdiErrorsModel;