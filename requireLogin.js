const jwt = require ('jsonwebtoken')
const mongoose = require('mongoose')
const User = mongoose.model("User")

module.exports = (req,res,next) => {
    const token = req.cookies.token
    //console.log(token)
    jwt.verify(token, process.env.jwtSecret, (err,payload) =>{
        if(err){
            return res.status(401).json({error: "you must be logged in"})
        }

        const {_id} = payload
        User.findById(_id).then(userData => {
            req.user = userData
            next()
        })    
    })
}