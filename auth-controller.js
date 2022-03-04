const mongoose = require('mongoose')
const User = mongoose.model('User')
const bcrypt = require ('bcryptjs')
const nodemailer = require ('nodemailer')
const sendGridTransport = require ('nodemailer-sendgrid-transport')
const jwt = require ('jsonwebtoken')
const _ = require('lodash')

const transporter = nodemailer.createTransport(sendGridTransport({
    sendMail: true,
    auth: {
        api_key: process.env.apiKey
    }
}))

/** signin */
exports.signin = function (req, res) {
    const {email, password} = req.body
    if (!email || !password) {
        res.status(422).json({error: "please add email or password"})
    }
    User.findOne({email:email})
    .then(savedUser => {
        if(!savedUser){
            return res.status(422).json({error: "Invalid email or password"})
        }
        bcrypt.compare(password,savedUser.password)
        .then(doMatch => {
            if(doMatch){
                
                const token = jwt.sign({ _id: savedUser._id}, process.env.jwtSecret, {
                    expiresIn: '45m',
                })
                res.json({savedUser, token})
            }
            else {
                return res.status(422).json({error:"invalid email or password"})
            }
        })
        .catch(err => { 
            console.log(err)})
    })
}

/** click forgot password */
exports.forgot_password = function (req, res) {
    const {email} = req.body;
    User.findOne({email}, (err, user) => {
        if(err || !user) {
            console.log(email)
            return res.status(422).json({error: "User dont exists with that email"})
        }

        const token = jwt.sign({_id: user._id}, 'testResetJWT', {expiresIn: '30m'})
        const data = {
            to: email, 
            from: "guizmir.issam@sesame.com.tn",
            subject: "Demande de modification de mot de passe",
            html: `
            <p>Vous avez demandé la modification de votre mot passe</p>
            <h5>Cliquez sur le <a href="http://localhost:4200/reset-password/${token}">lien</a>suivant</h5>
            `
        }
        return user.updateOne({resetLink: token}, (err, success) => {
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

/** reset the password */
exports.reset_password = function (req, res) {
    const {resetLink, newPass} = req.body // checking if reset link sent from the client side exists in database
    if(resetLink) {
        jwt.verify(resetLink, 'testResetJWT', (error, decodedData) => {   // decoding the token
            if (error) {
                return res.status(401).json({error: "Incorrect token or it is expired."})
            } 
            User.findOne({resetLink}, (err, user) => {
                if (err || !user) {
                    return res.status(401).json({error: "User with this token does not exist"})
                }
                if(newPass.length < 6) {
                    return res.status(401).json({error:"Incorrect length"})
                }
                bcrypt.hash(newPass, 12)
                .then(hashedpassword => {
                    const obj = {
                        password: hashedpassword
                    }
                    user = _.extend(user, obj)

                    console.log(hashedpassword)
                    console.log(user)
                    user.save()
                        .then(savedUser => {
                            console.log(savedUser)
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
                            console.log(error, "bassem")
                            res.status(401).json({error: "reset password error"})
                        })
                })
                .catch((error) => {
                    console.log(error)
                })
            })
        }) 
    } else {
        return res.status(401).json({error: "Authentication error!!"})
    }
}

/** change your password */
exports.change_password = function (req, res) {
    const idtest = req.user._id
    const {newPass} = req.body
    User.findById(idtest, (err, user) => {
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

/** show profile */
exports.get_profile = function (req, res) {
    const id = req.user._id
    User.findById(id)
         .then((result) => {
            res.send(result)
        })
        .catch((error) => {
            console.log("Error getting the profile", error)
        })
}

/** logout */
exports.logout = function (req, res) {
    //req.session.destroy()
    res.clearCookie('token').send()
}