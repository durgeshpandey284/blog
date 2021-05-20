var mongoose = require('mongoose');

var imageSchema = new mongoose.Schema({
    img: String,
    profileid: {
        type: String
    }
});

//Image is a model which has a schema imageSchema

const image = new mongoose.model("image", imageSchema);

module.exports = image;