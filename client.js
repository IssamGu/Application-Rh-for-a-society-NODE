const mongoose = require('mongoose')
const {ObjectId} = mongoose.Schema.Types

const clientSchema = new mongoose.Schema({

    client_name: {
        type: String,
        required: true
    },

    contact_principal: {
        type:String,
        required:true
    },

    raison_sociale: {
        type:String,
        required:true
    },

    adresse: {
        type:String,
        required:true
    },

    pays: {
        type:String,
    },

    ville: {
        type:String,
    },

    code_postal: {
        type:Number,
    },

    numTelephone: {
        type:Number,
        required:true
    },

    email: {
        type:String,
        required:true
    },

    site_web: {
        type: String
    },

    RIB: {
        type:String,
        required:true
    },

    RC: {
        type:String
    },

    MF: {
        type: String
    },

    Code_TVA: {
        type: Number
    },

    addedBy: {
        type:ObjectId,
        ref:"User"
    },

    versionKey: false
})

mongoose.model("Client", clientSchema)