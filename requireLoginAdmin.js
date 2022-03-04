const jwt = require ('jsonwebtoken')
const mongoose = require('mongoose')
const Admin = mongoose.model("Admin")

module.exports = (req,res,next) => {
    const token = req.cookies.admin_token
    console.log(token)
    jwt.verify(token, process.env.jwtSecret, (err,payload) =>{
        if(err){
            return res.status(401).json({error: "you must be logged in"})
        }

        const {_id} = payload
        Admin.findById(_id).then(adminData => {
            req.admin = adminData
            next()
        })    
    })
}