const mongoose = require('mongoose');


const bugSchema = new mongoose.Schema({

    NumeroDeBug: {
        type: Number,
        unique: true,
        required: true
    },
    Titre: {
        type: String,
        required: true
    },
    Description: {
        type: String,
        required: true
    },
    Courriel: {
        type: String
    },
    Date: {
        type: Date,
        default: Date.now
    }
});

const Bug = mongoose.model('Bug', bugSchema);

module.exports = Bug;
