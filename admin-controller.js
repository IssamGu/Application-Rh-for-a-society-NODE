const mongoose = require('mongoose')
const Admin = mongoose.model('Admin')
const bcrypt = require ('bcryptjs')
const jwt = require ('jsonwebtoken')
const nodemailer = require ('nodemailer')
const sendGridTransport = require ('nodemailer-sendgrid-transport')
const _ = require('lodash')
require ('dotenv').config();

const transporter = nodemailer.createTransport(sendGridTransport({
    sendMail: true,
    auth: {
        api_key: process.env.apiKey
    }
}))

/** admin sign in */
exports.admin_login = (req, res) => {
    const {email, password} = req.body
    if (!email || !password) {
        res.status(422).json({error: "please add email or password"})
    }
    Admin.findOne({email:email})
    .then(savedAdmin => {
        if(!savedAdmin){
            return res.status(422).json({error: "Invalid email or password"})
        }
        bcrypt.compare(password,savedAdmin.password)
        .then(doMatch => {
            if(doMatch){
                
                const token = jwt.sign({ _id:savedAdmin._id}, process.env.jwtSecret||"test123", {
                    expiresIn: '15m',
                })
                res.cookie('admin_token', token, { 
                    maxAge: 15*60*1000,
                    secure: false, // set to true if pproduction / https
                    httpOnly: true,
                })
                console.log("success:", token)
                res.json({savedAdmin,token})
            }
            else{
                return res.status(422).json({error:"invalid email or password"})
            }
        })
        .catch((error) => { 
            console.log(error)
        })
    })
}

/** ajouter un administrateur */
exports.add_admin = (req, res) => {
    const {email,password,username} = req.body
    if (!username || !email || !password) {
       return res.status(422).json({error: "please add all the fields"})
    }
    Admin.findOne({username: username})
    .then((savedAdmin) => {
        if(savedAdmin){
            return res.status(422).json({error:"user already exits with that username"})
        }
        bcrypt.hash(password, 12)
        .then(hashedpassword => {
            const admin = new Admin({
                username,
                email,
                password:hashedpassword
            })
            admin.save()
            .then(admin => {
                transporter.sendMail({
                    to:admin.email,
                    from:"guizmir.issam@sesame.com.tn",
                    subject:"Création de compte pour administrateur",
                    html:"<h1>Welcome to my demo administrator !</h1>"
                }).then((res) => console.log("Successfully sent"))
                .catch((err) => console.log("Failed ", err))
                res.json({message: "saved succesfully"})
            })
            .catch(err => {
                console.log(err)
            })
        })
    })
    .catch(err => {
        console.log(err)
    })
}

/** supprimer un administateur */
exports.delete_admin = (req, res) => {
    const id = mongoose.Types.ObjectId(req.params.id)
    Admin.findByIdAndDelete(id)
        .then((result) => {
            res.send(result)
        })
        .catch((error) => {
            console.log("error when deleting the administrator: ", error)
        })
}

/** oubli de mot de passe */
exports.forgot_password = (req, res) => {
    const {email} = req.body;
    Admin.findOne({email}, (err, admin) => {
        if(err || !admin) {
            return res.status(422).json({error: "User dont exists with that email"})
        }

        const token = jwt.sign({_id: admin._id}, 'testResetJWT', {expiresIn: '20m'})
        const data = {
            to: email, 
            from: "guizmi.issam@sesame.com.tn",
            subject: "password reset",
            html: `
            <p>You requested for password reset</p>
            <h5>Cliquez sur le <a href="http://localhost:4200/reset-password/${token}">lien</a>suivant</h5>
            `
        }
        return admin.updateOne({resetLink: token}, (err, success) => {
            if(err) {
                return res.status(422).json({error: "reset password link error"})
            } else {
                transporter.sendMail(data)
                .then(result => {
                    res.json({message: "Email has been sent"})
                })
                .catch(error => {
                    console.log(error)
                })
            }
        })

    })
}

/** modifier le mot de passe oublié */
exports.reset_password = (req, res) => {
    const {resetLink, newPass} = req.body // checking if reset link sent from the client side exists in database
    if(resetLink) {
        jwt.verify(resetLink, 'testResetJWT', (error, decodedData) => {   // decoding the token
            if (error) {
                return res.status(401).json({error: "Incorrect token or it is expired."})
            } 
            Admin.findOne({resetLink}, (err, admin) => {
                if (err || !admin) {
                    return res.status(401).json({error: "User with this token does not exist"})
                }
                bcrypt.hash(newPass, 12)
                .then(hashedpassword => {
                    const obj = {
                        password: hashedpassword
                    }
                    admin = _.extend(admin, obj)

                    admin.save()
                        .then(admin => {
                            transporter.sendMail({
                                to:admin.email, 
                                from: "guizmir.issam@sesame.com.tn",
                                subject: "Modification du mot de passe",
                                html: `
                                <p>Modification du mot de passe</p>
                                <h4>Votre mot de passe a été modifié avec succés</h4>
                                `
                            })
                            res.status(200).json({message:"Your password has been changed"})
                        })
                        .catch((error) => {
                            res.status(401).json({error: "reset password error"})
                        })
                })
            })
        }) 
    } else {
        return res.status(401).json({error: "Authentication error!!"})
    }
}

/** modifier le mot de passe */
exports.change_password = (req, res) => {
    const idtest = req.admin._id
    const id = mongoose.Types.ObjectId(req.params.id)
    const {newPass} = req.body
    Admin.findById(idtest, (err, user) => {
        bcrypt.hash(newPass, 12)
            .then(hashedpassword => {
                const obj = {
                    password: hashedpassword
                }
                user = _.extend(user, obj)

                user.save()
                .then(user => {
                    transporter.sendMail({
                    to: user.email, 
                    from: "guizmir.issam@sesame.com.tn",
                    subject: "Modification du mot de passe",
                    html: `
                    <p>Modification du mot de passe</p>
                    <h4>Votre mot de passe a été modifié avec succés</h4>
                    `
                    })
                    res.status(200).json({message:"Your password has been changed"})
                })
                .catch((error) => {
                    res.status(401).json({error: "reset password error"})
            })
        })
    })
}

/** show admin profile */
exports.show_profile = (req, res) => {
    const id = req.admin._id
    Admin.findById(id)
         .then((result) => {
            res.send(result)
        })
        .catch((error) => {
            console.log("Error getting the profile", error)
        })
}