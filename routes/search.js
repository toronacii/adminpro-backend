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

app.get('/:collection/:term', ({ query, params }, res) => {

    let limit = query.limit && Number(query.limit);
    let offset = query.offset && Number(query.offset);

    let regExp = new RegExp(params.term, 'i');
    let promise;

    switch (params.collection) {
        case 'users':
            promise = searchPaginatedUsers(regExp, limit, offset);
        break;
        case 'hospitals':
            promise = searchPaginatedHospitals(regExp, limit, offset);
        break;
        case 'doctors':
            promise = searchPaginatedDoctors(regExp, limit, offset);
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

function searchPaginatedUsers(regExp, limit, offset) {
    return searchPaginated(() => {
        return User.find({}).or([ { name: regExp, email: regExp } ]) 
    }, limit, offset, 'users');
}

function searchHospitals(regExp) {
    return search(() => {
        return Hospital.find({ name: regExp })
            .populate('user', 'name email role') 
    }, 'hospitals')
}

function searchPaginatedHospitals(regExp, limit, offset) {
    return searchPaginated(() => {
        return Hospital.find({ name: regExp })
            .populate('user', 'name email role')
    }, limit, offset, 'hospitals');
}

function searchDoctors(regExp) {
    return search(() => {
        return Doctor.find({ name: regExp })
            .populate('hospital', 'name')
            .populate('user', 'name email role') 
    }, 'doctors')
}

function searchPaginatedDoctors(regExp, limit, offset) {
    return searchPaginated(() => {
        return Doctor.find({ name: regExp })
            .populate('hospital', 'name')
            .populate('user', 'name email role') 
    }, limit, offset, 'doctors');
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

function searchPaginated(modelQueryFn, limit, offset, collectionName) {
    return new Promise((resolve, reject) => {
        modelQueryFn()
            .limit(limit)
            .skip(offset)
            .exec((err, collection) => {
                if (err) {
                    return reject({
                        message: `Error getting ${ collectionName }`,
                        errors: err
                    })
                }
                modelQueryFn()
                    .count({}, (err, total) => {
                        if (err) return reject(err);
                        return resolve({
                            limit,
                            offset,
                            total,
                            results: collection
                        });
                    })
            })
    });
}

module.exports = app;