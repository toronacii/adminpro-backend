const express = require('express');
const fs = require('fs');
const fileUpload = require('express-fileupload');
const HttpStatus = require('http-status-codes');

const User = require('../models/user');
const Doctor = require('../models/doctor');
const Hospital = require('../models/hospital');

var app = express();

app.use(fileUpload());

app.put('/:resource/:id', ({ files, params }, res) => {
    
    let resources = ['hospital', 'doctor', 'user'];
    if (!resources.includes(params.resource)) {
        return res.status(HttpStatus.NOT_FOUND)
            .json({
                message: `Only save images to ${ resources.join(', ') }`,
                errors: { message: `Only save images to ${ resources.join(', ') }` }
            })
    }

    if (!files) {
        return res.status(HttpStatus.NOT_FOUND)
            .json({
                message: 'No file received',
                errors: { message: 'No file received' }
            })
    }

    let file = files.image;
    let splitName = file.name.split('.');
    let extension = splitName[splitName.length - 1];

    const validExtensions = ['png', 'jpg', 'gif', 'jepg'];

    if (!validExtensions.includes(extension)) {
        return res.status(HttpStatus.NOT_FOUND)
            .json({
                message: `No valid extension, extensions valids are ${ validExtensions.join(', ') }`,
                errors: { message: `No valid extension, extensions valids are ${ validExtensions.join(', ') }` }
            })
    }

    let filename = `${ params.id }-${ new Date().getMilliseconds() }.${ extension }`;
    let path = `uploads/${ params.resource }s/${ filename }`;

    file.mv(path, err => {
        if (err) {
            res.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .json({
                    message: `Cannot move file`,
                    errors: err
                })
        }

        uploadByResource(params.resource, params.id, path, res);
    });
});

function uploadByResource(resource, id, path, res) {
    let Model;
    switch(resource) {
        case 'user': Model = User; break;
        case 'hospital': Model = Hospital; break;
        case 'doctor': Model = Doctor; break;
    }

    Model.findById(id, (err, model) => {
        if (err) {
            return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
                message: `Error finding ${ resource } with id ${ id }`,
                errors: err
            })
        }

        if (!model) {
            return res.status(HttpStatus.NOT_FOUND).json({
                message: `The model with id ${ id } does not exists`,
                errors: err
            })
        }

        if (model.avatar && fs.existsSync(__dirname + '/../' + model.avatar)) {
            fs.unlink(model.avatar);
        }

        model.avatar = path;

        model.save((err, modelUpdated) => {
            if (err) {
                return res.status(HttpStatus.BAD_REQUEST).json({
                    message: `Error relating image to ${ resource }`,
                    errors: err
                })
            }
            return res.json(modelUpdated);
        })
    })
}

module.exports = app;