const mongoose = require('mongoose')
const Conge = mongoose.model("Conge")
const User = mongoose.model('User')
const {google} = require('googleapis')
const {OAuth2} = google.auth
const { gmail } = require('googleapis/build/src/apis/gmail')


/** calendar configuration */
const oAuth2Client = new OAuth2 (
    process.env.ID_CLIENT,
    process.env.KEY
)
oAuth2Client.setCredentials({
    refresh_token: '1//04LSCJ_JiuNFICgYIARAAGAQSNwF-L9Ir-g9-_tzmK4Wmy3kLe1XCxRTQ96sAxE8GtRu5UeSHXzX2lMiPJF_eymO1TbPvEZ6nSEw'
})
const calendar = google.calendar({version: 'v3', auth: oAuth2Client})


/** for everybody - calendrier de tous les conges */
exports.get_all_conge = (req, res) => {
    Conge.find()
    .populate("empNom","nom prenom email")
    .then((result) => {
        res.send(result)
        console.log(result)
    })
    .catch((err) => {
        console.log(err)
    })
}

/** for employee demander - un congé */
exports.ask_conge = (req, res) => {
    const {startDate, endDate, type} = req.body
    if(!startDate || !endDate || !type){
        return res.status(422).json({error: "Please add all the fields"})
    }
    const diffTime = new Date(endDate) - new Date(startDate)
    const diffDays = diffTime / (1000 * 3600 * 24)
    req.user.password = undefined
    const conge = new Conge({ 
        startDate,
        endDate,
        nombreJour: diffDays,
        type,
        empNom: req.user,
        
    })
    conge.save().then(result => {
        res.json({congé:result})
    })
    .catch(err => {
        console.log(err)
    })
}

/** for manager - gerer les demandes de congés  */
exports.manage_conge = (req, res) => {
    const id = mongoose.Types.ObjectId(req.params.id);
    const updates = req.body;
    const options = {new: true}
    Conge.findByIdAndUpdate(id, updates, options)
    .populate("empNom", "email")
    .then((result) => {
        
        const eventStartDate = result.startDate
        const eventEndDate = result.endDate
        const email = result.empNom.email
        const type = result.type
        if (req.body.statut == "Validé") {

            if (type == 'Congé Maladie') {
                const eventMaladie = {
                    summary: `Congé Maladie`,
                                description: `This is the description`,
                                start: {
                                    dateTime: eventStartDate,
                                    timeZone: 'Africa/Tunis'
                                },
                                end: {
                                    dateTime: eventEndDate,
                                    timeZone: 'Africa/Tunis'
                                },
                                colorId: 1,
                                attendees: [{
                                    email: email
                                }]
                }
                insertEvent(eventMaladie)
                    .then((resultId) => {
                        Conge.findByIdAndUpdate(id, {idEvent: resultId}, options)
                            .then((resultinsert) => {
                                console.log("success")
                                return res.send(resultinsert)
                            })
                            .catch((err) => {
                                console.log(err)
                            })
                    })
                    .catch((err) =>{
                        console.log(err)
                    })

            } else if (type == "Congé Familial" ) {
                const eventFamilial = {
                    summary: `Congé Familial`,
                                description: `This is the description`,
                                start: {
                                    dateTime: eventStartDate,
                                    timeZone: 'Africa/Tunis'
                                },
                                end: {
                                    dateTime: eventEndDate,
                                    timeZone: 'Africa/Tunis'
                                },
                                colorId: 1,
                                attendees: [{
                                    email: email
                                }]
                }
                insertEvent(eventFamilial)
                    .then((resultId) => {
                        Conge.findByIdAndUpdate(id, {idEvent: resultId}, options)
                            .then((resultinsert) => {
                                console.log("success")
                                return res.send(resultinsert)
                            })
                            .catch((err) => {
                                console.log(err)
                            })
                    })
                    .catch((err) =>{
                        console.log(err)
                    })

            } else {
                const event = {
                    summary: `Congé`,
                    description: `This is the description`,
                    start: {
                        dateTime: eventStartDate,
                        timeZone: 'Africa/Tunis'
                    },
                    end: {
                        dateTime: eventEndDate,
                        timeZone: 'Africa/Tunis'
                    },
                    colorId: 1,
                    attendees: [{
                        email: email
                    }]
                }
                insertEvent(event)
                    .then((resultId) => {
                       Conge.findByIdAndUpdate(id, {idEvent: resultId}, options)
                        .then((resultinsert) => {
                            console.log("success")
                            return res.send(resultinsert)
                        })
                        .catch((err) => {
                            console.log(err)
                        })
                    })
                    .catch((err) =>{
                       console.log(err)
                    })
            }
            
        } else if (req.body.statut === "Annulé") {
            const idEvent = result.idEvent
            console.log(idEvent)
            deleteEvent(idEvent)
            .then((resultDelete) => {
                return res.status(200).json({message: "succes"})
            })
            .catch((err) => {
                console.log(err)
            })         
        } else {
            return res.send(result)
        }
          
    }) 
    .catch((err) => {
        console.log(err)
    })
}

exports.asked_by_me = (req, res) => {
    Conge.find({empNom:req.user._id})
    .populate("empNom","nom prenom")
    .then((result) => {
        res.send(result)
    })
    .catch(err => {
        console.log(err)
    })
}

/** insert event into google calendar */
const insertEvent = async (event) => {
    try {
        let response = await calendar.events.insert({
            calendarId: 'primary',
            resource: event,
            sendNotifications : true
        })
        if (response['status'] == 200 && response['statusText'] == 'OK') {
            return (response.data.id)
            
        } else {
            return 0
        }
    } catch (error) {
        console.log(`Error at insert --> ${error}`)
        return 0
    }
}

/** delete event from google calendar using the event id */
const deleteEvent = async (eventId) => {

    try {
        let response = await calendar.events.delete({
            calendarId: 'primary',
            eventId: eventId
        })
        if (response.data == '') {
            return 1
        } else {
            return 0
        }
    } catch (error) {
        console.log(`Error at deleteEvent --> ${error}`)
    }
}

exports.delete_conge = (req, res) => {

}

exports.get_MyNonTreatedConge = (req, res) => {
    Conge.find({empNom: req.user._id})
    .populate("empNom", "nom prenom")
    .then((result) => {
        const myConges = result.filter(object => object.statut == "en attente")
        res.send(myConges)
    })
    .catch((error) => {
        console.log(error)
    })
}

exports.getNonTreatedConge = (req, res) => {
    Conge.find()
    .populate("empNom", "nom prenom")
    .then((result) => {
        const allConges = result.filter(object => object.statut == "en attente")
        res.send(allConges)
    })
    .catch((error) => {
        console.log(error)
    })
}