const express = require('express');
const HttpStatus = require('http-status-codes');
const Doctor = require('../models/doctor');
const authenticationMiddleware = require('../middlewares/authentication');

const app = express();

app.get('/', ({ query }, res) => {

    let limit = query.limit && Number(query.limit);
    let offset = query.offset && Number(query.offset);

    Doctor.find({})
        .populate('user', 'name email')
        .populate('hospital')
        .limit(limit)
        .skip(offset)
        .exec((err, doctors) => {
            if (err) {
                return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
                    message: 'Error getting doctors',
                    errors: err
                })
            }
            Doctor.count({}, (err, total) => {
                return res.json({
                    limit,
                    offset,
                    total,
                    results: doctors
                });
            })
        })
});

app.post('/', authenticationMiddleware.verifyToken, ({ body, user }, res) => {

    let doctor = new Doctor({
        name: body.name,
        avatar: body.avatar,
        hospital: body.hospitalId,
        user: user._id
    });

    doctor.save((err, doctorCreated) => {
        if (err) {
            return res.status(HttpStatus.BAD_REQUEST).json({
                message: 'Error creating doctor',
                errors: err
            })
        }

        return res.status(HttpStatus.CREATED)
            .json(doctorCreated);
    })
});

app.put('/:id', authenticationMiddleware.verifyToken, ({ params, body }, res) => {

    Doctor.findById(params.id, (err, doctor) => {
        if (err) {
            return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
                message: `Error finding doctor with id ${ params.id }`,
                errors: err
            })
        }

        if (!doctor) {
            return res.status(HttpStatus.NOT_FOUND).json({
                message: `The doctor with id ${ params.id } does not exists`,
                errors: err
            })
        }

        if (body.name && body.name !== doctor.name) {
            doctor.name = body.name;
        }
        if (body.avatar && body.avatar !== doctor.avatar) {
            doctor.avatar = body.avatar;
        }
        if (body.hospitalId && body.hospitalId !== doctor.hospitalId) {
            doctor.hospitalId = body.hospitalId;
        }

        doctor.save((err, doctorUpdated) => {
            if (err) {
                return res.status(HttpStatus.BAD_REQUEST).json({
                    message: `Error updating doctor with id ${ params.id }`,
                    errors: err
                })
            }
            return res.json(doctorUpdated);
        });
    })
});

app.delete('/:id', authenticationMiddleware.verifyToken, ({ params }, res) => {
    Doctor.findByIdAndRemove(params.id, (err, doctorDeleted) => {
        if (err) {
            return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
                message: `Error deleting doctor with id ${ params.id }`,
                errors: err
            })
        }
        if (doctorDeleted) {
            return res.json(doctorDeleted);
        }

        return res.status(HttpStatus.NOT_FOUND).json({
            message: `The doctor with id ${ params.id } does not exists`,
            errors: {
                message: `The doctor with id ${ params.id } does not exists`,
            }
        });
    })
});

module.exports = app;