const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    psw: {
        type: String,
        required: true
    },
    confirmpassword: {
        type: String,
        required: true
    },
    tokens: [{
        token: {
            type: String,
            required: true
        }
    }],
    company: {
        type: String
    },
    phone: {
        type: String,
        unique: true
    },
    website: {
        type: String
    },
    address: {
        address: {
            type: String
        },
        city: {
            type: String
        },
        state: {
            type: String
        }
    },
    img:
    {
        data: Buffer,
        contentType: String
    }
})

// create a middleware to generate token
// whenever we work with instance of the collection, we use methods 
// generate hash
userSchema.methods.generateToken = async function () {
    try {
        console.log("generateToken function " + this._id)
        const token = jwt.sign({ _id: this._id.toString() }, 'duggu');
        this.tokens = this.tokens.concat({ token: token });
        console.log("generateToken function token" + this.tokens);
        await this.save(); // to save token
        return token;
    } catch (error) {
        // res.send("Error" + error);
        console.log(error)
    }
}

// create a middleware function before using this schema
// here pre is ready made function of schema, which takes method name
// that is save( save is used in app.js), and a function
// and pre function will run before save method
userSchema.pre("save", async function (next) {
    // check that only password is changed then only perform hasihng
    if (this.isModified("psw")) {
        this.psw = await bcrypt.hash(this.psw, 10);
        this.confirmpassword = await bcrypt.hash(this.confirmpassword, 10); // becuase confirmpassword is unnecessary
    }
    next(); // this next method denotes that after hasing the pwd, save() method will be called
})



// create collection
const RegisterUser = new mongoose.model("RegisterUser", userSchema);

module.exports = RegisterUser;