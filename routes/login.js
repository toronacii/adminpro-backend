const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const HttpStatus = require('http-status-codes');
const GoogleAuth = require('google-auth-library');

const User = require('../models/user');
const { SEED, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET } = require('../config/constants');

var auth = new GoogleAuth;

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

            return res.json(getUserWithToken(user));
        });
});

app.post('/google', async ({ body }, res) => {
    try {
        let googleUser = await verify(body.token);
        User.findOne({ email: googleUser.email }, (err, user) => {
            if (err) {
                return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
                    message: 'Error finding user',
                    errors: err
                })
            }

            if (user) {
                if (!user.google) {
                    return res.status(HttpStatus.NOT_ACCEPTABLE).json({
                        message: 'Cannot use google authentication, please sign-in with normal authentication',
                        errors: {
                            message: 'Cannot use google authentication, please sign-in with normal authentication'
                        }
                    })
                }

                return res.json(getUserWithToken(user));
            }

            user = new User();
            user.password = `google-auth-${ new Date().getUTCMilliseconds() }`;
            Object.assign(user, googleUser);

            user.save((err, userCreated) => {
                if (err) {
                    return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
                        message: 'Error creating user',
                        errors: err
                    })
                }

                return res.json(getUserWithToken(userCreated));
            });
        });
    } 
    catch (err) {
        res.status(HttpStatus.NOT_FOUND).json({
            message: 'Error signin with google',
            errors: err.stack
        })
    }
});

function getUserWithToken(user) {
    let token = jwt.sign({ user}, SEED, { expiresIn: 14400 });
    user.password = undefined;
    return { token, user }
}

function verify(token) {
    return new Promise((resolve, reject) => {
        var client = new auth.OAuth2(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, '');
        client.verifyIdToken(
            token,
            GOOGLE_CLIENT_ID,
            (err, ticket) => { 
                if (err) return resolve(err);

                let payload = ticket.getPayload();
                return resolve({
                    name: payload.name,
                    email: payload.email,
                    avatar: payload.picture,
                    google: true
                })
            })
    });
}

module.exports = app;