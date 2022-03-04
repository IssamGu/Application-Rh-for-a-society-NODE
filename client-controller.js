const mongoose = require('mongoose')
const Client = mongoose.model('Client')

/** add a client */
exports.add_client = (req, res) => {
    const {client_name, contact_principal, raison_sociale, adresse, numTelephone, email, RIB, RC, MF, site_web, Code_TVA, pays, ville, code_postal} = req.body
    if(!client_name || !contact_principal || !raison_sociale || !adresse || !numTelephone || !email || !RIB || !ville || !pays || !code_postal){
        return res.status(422).json({error: "Please add all the fields"})
    }
    req.user.password = undefined
    const client = new Client({
        client_name, 
        contact_principal,
        raison_sociale,
        adresse,
        pays,
        ville,
        code_postal,
        numTelephone,
        email,
        RIB,
        RC,
        MF,
        site_web,
        Code_TVA,
        addedBy:req.user
    })
    client.save().then(result => {
        res.send(result)
    })
    .catch(err => {
        console.log(err)
    })
}

/** get all clients */
exports.get_all_client = (req, res) => {
    Client.find()
    .populate("addedBy","_id nom prenom")
    .then((result) => {
        res.send(result)
    })
    .catch((err) => {
        console.log(err)
    })
}

/** update client information */
exports.update_client = (req, res) => {
    const id = mongoose.Types.ObjectId(req.params.id)
    const updates = req.body
    const options = {new: true}
    Client.findByIdAndUpdate(id, updates, options)
       .then((result) => {
           res.send(result)
       })
       .catch((error) => {
           console.log("error when updating the client: ", error)
       })
}

/** delete a client */
exports.delete_client = (req, res) => {
    const id = mongoose.Types.ObjectId(req.params.id)
    Client.findByIdAndDelete(id)
        .then((result) => {
            res.send(result)
        })
        .catch((error) => {
            console.log("error when deleting the client: ", error)
        })
}