const jwt = require('jsonwebtoken');
const HttpStatus = require('http-status-codes');

const SEED = require('../config/constants').SEED;

module.exports.verifyToken = (req, res, next) => {
    let token = req.query.token;

    jwt.verify(token, SEED, (err, payload) => {
        if (err) {
            return res.status(HttpStatus.UNAUTHORIZED)
                .json({
                    message: 'Invalid token',
                    errors: err
                })
        }
        req.user = payload.user;
        next();
    });
}