const jwt = require ('jsonwebtoken')
const mongoose = require('mongoose')
const User = mongoose.model("User")
const _ = require('lodash')
const R = require('ramda');

module.exports = (req, res, next) => {
    const {authorization} = req.headers
    if (!authorization) {
        res.status(401).json({error: "you must be logged in"})
    }
    const token = authorization.replace("Bearer ","")
    jwt.verify(token, process.env.jwtSecret, (error, payload) => {
        if (error) {
            res.status(401).json({error: "you must be logged in"})
        }
        const {_id} = payload
        User.findById(_id, {"password": 0}).then(userData => {
            
            req.user = userData;
            next()
        })    
        
    })
}