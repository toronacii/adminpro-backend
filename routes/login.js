const express = require('express');
const bcrypt = require('bcryptjs');
const HttpStatus = require('http-status-codes');
const User = require('../models/user');

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
            return res.json(user);
        });
});

module.exports = app;