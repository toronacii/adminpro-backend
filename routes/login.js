const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const HttpStatus = require('http-status-codes');

const User = require('../models/user');
const SEED = require('../config/constants').SEED;

const app = express();

app.post('/', ({ body }, res) => {
    User.findOne({ email: body.email })
        .select('+password')
        .exec((err, user) => {
            if (err) {
                return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
                    message: 'Error finding users',
                    errors: err
                })
            }
            if (!user || !bcrypt.compareSync(body.password, user.password)) {
                return res.status(HttpStatus.NOT_FOUND).json({
                    message: 'Invalid login',
                    errors: err
                })
            }
            user.password = undefined;
            let token = jwt.sign({ user}, SEED, { expiresIn: 14400 });
            return res.json({
                token,
                user
            });
        });
});

module.exports = app;