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
    StatutDeBug: {
        type: Boolean,
        default: true
    },
    Date: {
        type: Date,
        default: Date.now
    }
});
module.exports = mongoose.model('Bug', bugSchema)
