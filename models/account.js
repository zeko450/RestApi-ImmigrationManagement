const mongoose = require('mongoose')

const accountSchema = new mongoose.Schema({

        Nom: {
                type: String,
                required: true
        },
        Prenom: {
                type: String,
                required: true
        },
        Courriel: {
                type: String,
                required: true,
                unique: true
        },
        Password: {
                type: String,
                required: false,
        },
        TypeDeCompte: {
                type: String,
                required: true,
                default: "usager"
        },
        ListeDeDemande: {
                type: [],
                default: [],
        },
        Date: {
                type: Date,
                default: Date.now
        }
})

module.exports = mongoose.model('Account', accountSchema)