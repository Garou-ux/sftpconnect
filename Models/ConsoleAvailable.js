const mongoose = require("mongoose");

const consoleAvailableSchema = new mongoose.Schema({
    console:{
      type: String,
      required: true
    },
    available:{
      type: Number,
      required: true
    }
});

const consoleAvailableModel = mongoose.model('console_available', consoleAvailableSchema);
module.exports = consoleAvailableModel;