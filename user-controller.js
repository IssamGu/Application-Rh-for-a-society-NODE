const mongoose = require('mongoose')
const User = mongoose.model('User')
const bcrypt = require ('bcryptjs')
const nodemailer = require ('nodemailer')
const sendGridTransport = require ('nodemailer-sendgrid-transport')

/** transporter for sendgrid */
const transporter = nodemailer.createTransport(sendGridTransport({
    sendMail: true,
    auth: {
        api_key: process.env.apiKey
    }
}))

/** get employees list: responsable RH + admin */
exports.user_list = function (req, res) {
    User.find()
    .then((result) => {
        res.send(result)
    })
    .catch((error) => {
        console.log("can't get the list of employees", error)
    })
}

/** get the employee by his id */
exports.get_user = function (req, res) {
    const id = mongoose.Types.ObjectId(req.params.id)
    User.findById(id)
        .then((result) => {
            res.send(result)
        })
        .catch((error) => {
            console.log("Error getting the profile", error)
        })
}

/** add an employee: admin + responsable RH */
exports.add_user = function (req, res) {
    const {email,password,nom,prenom,dateNaissance,numTelephone,cin,sexe,fonction,salaire, ID_CNSS, nbEnfants, statutConjuguale, role,ville,pays,experience,skills, date_rec,date_cin} = req.body
    if (!nom || !prenom || !email || !password || !dateNaissance || !cin  || !fonction ) {
       return res.status(422).json({error: "please add all the fields"})
    }
    User.findOne({email:email})
    .then((savedUser) => {
        if(savedUser){
            return res.status(422).json({error:"user already exits with that email"})
        }
        bcrypt.hash(password, 12)
        .then(hashedpassword => {
            const user = new User({
                nom,
                prenom,
                email,
                password:hashedpassword,
                dateNaissance,
                numTelephone,
                cin,
                date_cin,
                sexe,
                fonction,
                ID_CNSS,
                role,
                date_rec
            })
            user.save()
            .then(user => {
                transporter.sendMail({
                    to:user.email,
                    from:"guizmir.issam@sesame.com.tn",
                    subject:"Création de compte",
                    html:"<h1>Welcome to my demo</h1>"
                }).then((res) => console.log("Successfully sent"))
                .catch((err) => console.log("Failed ", err))
                res.json({message: "saved succesfully"})
            })
            .catch(error => {
                res.status(422).json({error:"can't send the email", error})
            })
        })
    })
    .catch(err => {
        console.log(err)
    })   
}

/** delete an employee account: admin + responsable RH */
exports.delete_user = function (req, res) {
    const id = mongoose.Types.ObjectId(req.params.id)
    User.findByIdAndDelete(id)
      .then( () => {
          res.send("successfully deleted")
      })
      .catch( (err) => {
          console.log(err)
      })
}

/** update an employee account: admin + responsable RH + employee */
exports.update_user = function (req, res) {
    const id = mongoose.Types.ObjectId(req.params.id)
    const updates = req.body
    const options = {new: true}
    User.findByIdAndUpdate(id, updates, options) 
       .then((result) => {
           res.status(200).send(result)
       })
       .catch((error) => {
           console.log("Error when updating the user",error)
       })
}

