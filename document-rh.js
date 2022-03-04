const mongoose = require('mongoose')
const {ObjectId} = mongoose.Schema.Types

const documentRhSchema = mongoose.Schema({
    type: {
        type: String
    },
    dateDemande: {
        type: Date
    },
    dateEnvoi: {
        type: Date
    },
    commentaire: {
        type: String
    },
    titre: {
        type: String
    },
    askedBy: {
        type: ObjectId,
        ref: "User"
    },
    documentLink: {
        type: String
    },
    withLink: {
        type: Boolean
    },
    statut: {
        type: String,
        default: "en attente"
    },
    versionKey: false
})

mongoose.model('documentRh', documentRhSchema)