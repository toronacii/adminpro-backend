const express = require('express');
const mongoose = require('mongoose');

var app = express();

mongoose.connection.openUri("mongodb://localhost:27017/hospital-db", (err, res) => {
    if (err) throw err;
    console.log("Database on port 27017: \x1b[32m%s\x1b[0m", "online");
})

app.get('/', (req, res) => {
    res.status(200).send("Working");
});

app.listen(3000, () => {
    console.log("Running on port 3000: \x1b[32m%s\x1b[0m", "online");
});