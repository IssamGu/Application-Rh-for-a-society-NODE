const mongoose = require ('mongoose')
const {ObjectId} = mongoose.Schema.Types

const congeSchema = new mongoose.Schema ({

    startDate: {
        type:Date,
        required:true
    },
    endDate: {
        type:Date,
        required:true
    },
    nombreJour: {
        type:Number,
        required:true
    },
    type: {
        type:String,
        required:true
    },
    statut: {
        type:String,
        default: "en attente"
    },
    empNom: {
        type:ObjectId,
        ref:"User"
    },
    idEvent: {
        type:String
    },
    just: {
        type: Buffer 
    }
})

mongoose.model("Conge", congeSchema)