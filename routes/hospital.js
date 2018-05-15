const express = require('express');
const HttpStatus = require('http-status-codes');
const Hospital = require('../models/hospital');
const authenticationMiddleware = require('../middlewares/authentication');

const app = express();

app.get('/', ({ query }, res) => {

    let limit = query.limit && Number(query.limit);
    let offset = query.offset && Number(query.offset);

    Hospital.find({})
        .populate('user', 'name email')
        .limit(limit)
        .skip(offset)
        .exec((err, hospitals) => {
            if (err) {
                return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
                    message: 'Error getting hospitals',
                    errors: err
                })
            }
            
            Hospital.count({}, (err, total) => {
                return res.json({
                    limit,
                    offset,
                    total,
                    results: hospitals
                });
            })
        })
});

app.post('/', authenticationMiddleware.verifyToken, ({ body, user }, res) => {

    let hospital = new Hospital({
        name: body.name,
        avatar: body.avatar,
        user: user._id
    });

    hospital.save((err, hospitalCreated) => {
        if (err) {
            return res.status(HttpStatus.BAD_REQUEST).json({
                message: 'Error creating hospital',
                errors: err
            })
        }

        return res.status(HttpStatus.CREATED)
            .json(hospitalCreated);
    })
});

app.put('/:id', authenticationMiddleware.verifyToken, ({ params, body }, res) => {

    Hospital.findById(params.id, (err, hospital) => {
        if (err) {
            return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
                message: `Error finding hospital with id ${ params.id }`,
                errors: err
            })
        }

        if (!hospital) {
            return res.status(HttpStatus.NOT_FOUND).json({
                message: `The hospital with id ${ params.id } does not exists`,
                errors: err
            })
        }

        if (body.name && body.name !== hospital.name) {
            hospital.name = body.name;
        }
        if (body.avatar && body.avatar !== hospital.avatar) {
            hospital.avatar = body.avatar;
        }

        hospital.save((err, hospitalUpdated) => {
            if (err) {
                return res.status(HttpStatus.BAD_REQUEST).json({
                    message: `Error updating hospital with id ${ params.id }`,
                    errors: err
                })
            }
            return res.json(hospitalUpdated);
        })
    })
});

app.delete('/:id', authenticationMiddleware.verifyToken, ({ params }, res) => {
    Hospital.findByIdAndRemove(params.id, (err, hospitalDeleted) => {
        if (err) {
            return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
                message: `Error deleting hospital with id ${ params.id }`,
                errors: err
            })
        }
        if (hospitalDeleted) {
            return res.json(hospitalDeleted);
        }

        return res.status(HttpStatus.NOT_FOUND).json({
            message: `The hospital with id ${ params.id } does not exists`,
            errors: {
                message: `The hospital with id ${ params.id } does not exists`,
            }
        });
    })
});

module.exports = app;