const express = require('express');
const fileUpload = require('express-fileupload');
const HttpStatus = require('http-status-codes');

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
    let path = `./uploads/${ params.resource }s/${ filename }`;

    file.mv(path, err => {
        if (err) {
            res.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .json({
                    message: `Cannot move file`,
                    errors: err
                })
        }

        res.status(200).send("ok");
    });
});

module.exports = app;