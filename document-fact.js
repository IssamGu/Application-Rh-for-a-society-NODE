const mongoose = require('mongoose')
const {ObjectId, Decimal128} = mongoose.Schema.Types

const documentFactSchema = mongoose.Schema({
    type: {
        type: String,
        required: true
    },
    client_name: {
        type: String,
        //ref: "Client"
    },
    created_by: {
        type: ObjectId,
        ref: "User"
    },
    description: {
        type: String
    },
    date_creation: {
        type: Date,
        //required: true
    },
    devise: {
        type: String
    },
    signature_electronique: {
        type: String
    },
    timbre_fiscal: {
        type: Boolean
    },
    taux_tva: {
        type: Decimal128
    },

    articles: Array,

    documentLink: {
        type: String
    },
    withLink: {
        type: Boolean
    },
    versionKey: false

})

mongoose.model("documentFact", documentFactSchema)