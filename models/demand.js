const mongoose = require('mongoose')

const demandSchema = new mongoose.Schema({

    NumeroDeDemande: {
        type: Number,
        required: true,
        startAt: 1, 
        incrementBy: 1,
        unique: true
    },
    Etude: {
        type: String,
        required: true
    },
    Profession: {
        type: String,
        required: true
    },
    Statut: {
        type: String,
        required: true
    },
    Pays: {
        type: String,
        required: true
    },
    Ville: {
        type: String,
        required: true
    },
    Telephone: {
        type: String,
        required: true
    },
    DatedeNaissance: {
        type: Date,
        required: true
    },
    Description: {
        type: String,
        required: true
    },
    Communication: {
        type: String,
        required: true,
    },
    Courriel: {
        type: String
    },
    NumeroDeConfirmation: {
        type: Number,
        startAt: 1, 
        incrementBy: 1,
        unique: true
    },
    Date: {
        type: Date,
        default: Date.now
    }
})
module.exports = mongoose.model('Demand', demandSchema)
