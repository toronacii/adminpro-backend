const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');

const loginRoutes = require('./routes/login');
const usersRoutes = require('./routes/users');
const hospitalRoutes = require('./routes/hospital');
const doctorRoutes = require('./routes/doctor');
const searchRoutes = require('./routes/search');
const uploadRoutes = require('./routes/upload');

const appRoutes = require('./routes/app');

var app = express();

app.use('/uploads', express.static(__dirname + '/uploads'));

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    next();
  });

mongoose.connection.openUri("mongodb://localhost:27017/hospital-db", (err, res) => {
    if (err) throw err;
    console.log("Database on port 27017: \x1b[32m%s\x1b[0m", "online");
});

app.use('/login', loginRoutes);
app.use('/users', usersRoutes);
app.use('/hospitals', hospitalRoutes);
app.use('/doctors', doctorRoutes);
app.use('/search', searchRoutes);
app.use('/upload', uploadRoutes);

app.use('/', appRoutes);

app.listen(3000, () => {
    console.log("Running on port 3000: \x1b[32m%s\x1b[0m", "online");
});