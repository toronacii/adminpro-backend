const express = require('express');
const bcrypt = require('bcryptjs');
const HttpStatus = require('http-status-codes');
const User = require('../models/user');
const authenticationMiddleware = require('../middlewares/authentication');

const app = express();

app.get('/', ({ query }, res) => {

    let limit = query.limit && Number(query.limit);
    let offset = query.offset && Number(query.offset);

    User.find({})
        .limit(limit)
        .skip(offset)
        .exec((err, users) => {
            if (err) {
                return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
                    message: 'Error gettings users',
                    errors: err
                })
            }
            User.count({}, (err, total) => {
                return res.json({
                    limit,
                    offset,
                    total,
                    results: users
                });
            })
        })
});

app.post('/', authenticationMiddleware.verifyToken, ({ body }, res) => {

    let user = new User({
        name: body.name,
        email: body.email,
        password: body.password && bcrypt.hashSync(body.password, 10),
        avatar: body.avatar,
        role: body.role ? body.role.toUpperCase() : undefined
    });

    user.save((err, userCreated) => {
        if (err) {
            return res.status(HttpStatus.BAD_REQUEST).json({
                message: 'Error creating user',
                errors: err
            })
        }
        delete userCreated.password;
        return res.status(HttpStatus.CREATED)
            .json(userCreated);
    })
});

app.put('/:id', authenticationMiddleware.verifyToken, ({ params, body }, res) => {

    User.findById(params.id, (err, user) => {
        if (err) {
            return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
                message: `Error finding user with id ${ params.id }`,
                errors: err
            })
        }

        if (!user) {
            return res.status(HttpStatus.NOT_FOUND).json({
                message: `The user with id ${ params.id } does not exists`,
                errors: err
            })
        }

        if (body.name && body.name !== user.name) {
            user.name = body.name;
        }
        if (body.email && body.email !== user.email) {
            user.email = body.email;
        }
        let role = body.role && body.role.toUpperCase();
        if (role && body.role !== user.role) {
            user.role = role;
        }

        user.save((err, userUpdated) => {
            if (err) {
                return res.status(HttpStatus.BAD_REQUEST).json({
                    message: `Error updating user with id ${ params.id }`,
                    errors: err
                })
            }
            delete userUpdated.password;
            return res.json(userUpdated);
        })
    })
});

app.delete('/:id', authenticationMiddleware.verifyToken, ({ params }, res) => {
    User.findByIdAndRemove(params.id, (err, userDeleted, other) => {
        if (err) {
            return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
                message: `Error deleting user with id ${ params.id }`,
                errors: err
            })
        }
        if (userDeleted) {
            delete userDeleted.password;
            return res.json(userDeleted);
        }

        return res.status(HttpStatus.NOT_FOUND).json({
            message: `The user with id ${ params.id } does not exists`,
            errors: {
                message: `The user with id ${ params.id } does not exists`,
            }
        });
    })
});

module.exports = app;