const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');

const loginRoutes = require('./routes/login');
const usersRoutes = require('./routes/users');
const hospitalRoutes = require('./routes/hospital');
const doctorRoutes = require('./routes/doctor');
const searchRoutes = require('./routes/search');
const appRoutes = require('./routes/app');

var app = express();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

mongoose.connection.openUri("mongodb://localhost:27017/hospital-db", (err, res) => {
    if (err) throw err;
    console.log("Database on port 27017: \x1b[32m%s\x1b[0m", "online");
});

app.use('/login', loginRoutes);
app.use('/users', usersRoutes);
app.use('/hospitals', hospitalRoutes);
app.use('/doctors', doctorRoutes);
app.use('/search', searchRoutes);
app.use('/', appRoutes);

app.listen(3000, () => {
    console.log("Running on port 3000: \x1b[32m%s\x1b[0m", "online");
});