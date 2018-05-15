const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const hospitalSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    avatar: {
        type: String
    },
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    }
});

module.exports = mongoose.model('Hospital', hospitalSchema);