const express = require('express');
const HttpStatus = require('http-status-codes');
const User = require('../models/user');
const Doctor = require('../models/doctor');
const Hospital = require('../models/hospital');

const app = express();

app.get('/general/:term', ({ params }, res) => {

    let regExp = new RegExp(params.term, 'i');

    let promises = [
        searchUsers(regExp),
        searchHospitals(regExp),
        searchDoctors(regExp)
    ];

    Promise.all(promises)
        .then(responses => {
            return res.json({
                users: responses[0],
                hospitals: responses[1],
                doctors: responses[2]
            });
        })
        .catch(err => {
            return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
                message: err,
                errors: { 
                    message: err
                }
            })
        });
});

app.get('/:collection/:term', ({ params }, res) => {

    let regExp = new RegExp(params.term, 'i');
    let promise;

    switch (params.collection) {
        case 'users':
            promise = searchUsers(regExp);
        break;
        case 'hospitals':
            promise = searchHospitals(regExp);
        break;
        case 'doctors':
            promise = searchDoctors(regExp);
        break;
        default: return res.status(HttpStatus.NOT_FOUND).json({
            message: `cannot search by collection ${ params.collection }`,
            errors: { 
                message: `cannot search by collection ${ params.collection }`
            }
        })
    }

    promise.then(collection => res.json(collection))
        .catch(err => {
            return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
                message: err,
                errors: { 
                    message: err
                }
            })
        });
});

function searchUsers(regExp) {
    return search(() => {
        return User.find({})
            .or([ { name: regExp, email: regExp } ]) 
    }, 'users')
}

function searchHospitals(regExp) {
    return search(() => {
        return Hospital.find({ name: regExp })
            .populate('user', 'name email role') 
    }, 'hospitals')
}

function searchDoctors(regExp) {
    return search(() => {
        return Doctor.find({ name: regExp })
            .populate('hospital', 'name')
            .populate('user', 'name email role') 
    }, 'doctors')
}

function search(modelQueryFn, collectionName) {
    return new Promise((resolve, reject) => {
        modelQueryFn()
            .exec((err, collection) => {
                if (err) {
                    return reject({
                        message: `Error getting ${ collectionName }`,
                        errors: err
                    })
                }
                return resolve(collection)
            })
    });
}

module.exports = app;