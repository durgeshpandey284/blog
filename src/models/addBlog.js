const mongoose = require("mongoose");
const validator = require("validator");

const blogSchema = mongoose.Schema({
    author: {
        type: String,
        required: true,
        minLength: 3
    },
    blogimage: String,
    email: {
        type: String,
        required: true,
        validate(value) {
            if (!validator.isEmail(value)) {
                throw new Error("Invalid Email id");
            }
        }
    },
    phone: {
        type: Number,
        required: true,
        min: 10
    },
    title: {
        type: String,
        required: true,
        minLength: 1
    },
    blog: {
        type: String,
        required: true,
        minLength: 20
    },
    
})

//create a collection

const Blog = mongoose.model("Blog", blogSchema);

module.exports = Blog;