const express = require("express");
const router = new express.Router();
const bcrypt = require("bcryptjs");

const Blog = require("../models/addBlog");
const User = require("../models/usermessage");
const RegisterUser = require("../models/userRegistration");


// initial home page
router.get("/", (req, res) => {
    // check user is logged in or not
    if (req.session.loggedin) {
        res.render("index", {
            isloogedIn: req.session.loggedin,
            userName: req.session.username,
            userData: req.session.userData
        });
    } else {
        res.render("index");
    }
})

//  get all blogs
router.get("/blog", async (req, res) => {
    const getBlogs = await Blog.find({});
    res.render("blog", {
        isloogedIn: req.session.loggedin,
        userName: req.session.username,
        post: getBlogs
    }); // pass data to templates
})

// get blog by blog id
router.get("/blogdetail/:id", async (req, res) => {
    try {
        if (req.session.loggedin) {
            const _id = req.params.id;
            const getUniqueBlog = await Blog.findById(_id);
            res.render("blogdetail", {
                blog: getUniqueBlog,
                isloogedIn: req.session.loggedin,
                userName: req.session.username
            });
        } else {
            res.redirect("/blog");
        }

    } catch (error) {
        res.status(500).send(error);

    }
})

// get blog by user email
router.get("/userblog/:id", async (req, res) => {
    try {
        if (req.session.loggedin) {
            const _id = req.params.id;
            const loggedInUserBlogs = await getBlogByEmail(_id);
            res.render("userblog", {
                isloogedIn: req.session.loggedin,
                userName: req.session.username,
                post: loggedInUserBlogs,
                // userData: req.session.userData
            }); // pass data to templates
        } else {
            res.redirect("/login");
        }

    } catch (error) {
        console.log("ERRROROROR****************")
        res.status(500).send(error);
    }
})

// get blog by user email
async function getBlogByEmail(id) {
    const getLoggedInUserData = await RegisterUser.findOne({ _id: id });// get that user
    const authorizeUserData = await Blog.find({ email: getLoggedInUserData.email });

    if (!authorizeUserData.length) {
        return authorizeUserData
    }
    return authorizeUserData;
}

router.get("/postblog", (req, res) => {
    if (req.session.loggedin) {
        res.render("addBlog", {
            isloogedIn: req.session.loggedin,
            userName: req.session.username
        });
    } else {
        res.render("addBlog");
    }

})

// add blog 
router.post("/postblog", async (req, res) => {
    try {
        const blogData = new Blog(req.body);
        const responsedata = await blogData.save();
        res.status(201).redirect("/blog");
    } catch (error) {
        res.status(500).send(error);
    }
})

// post request for contact us
router.post("/contact", async (req, res) => {
    try {
        const userData = new User(req.body);
        const responsedata = await userData.save();
        console.log(responsedata);
        res.status(201).render("index", {
            success: {
                success: true,
                message: 'Thanks for reaching out to us, We will get you back.',
            }
        });  // for UI
    }
    catch (error) {
        console.log(error);
        res.json(error.errors.message);
        // in case , we need to show error on ui
        res.render("index", {
            error: {
                status: error.status || 500,
                message: error.message || 'Internal Server Error',
            }
        })
        // res.status(500).send(error);
    }
})

// get login page
router.get("/login", async (req, res) => {
    res.render("login"); // load login page 
})

//  login user
router.post("/login", async (req, res) => {
    try {
        const email = req.body.email;
        const psw = req.body.psw;

        const userData = await RegisterUser.findOne({ email: email });// get that user
        const isMatch = await bcrypt.compare(psw, userData.psw);



        // adding middleware to genrate token
        const token = await userData.generateToken();
        // console.log(`${isMatch}Login Token is ${token}`);

        // set username and a flag to maintain session that user is logged in
        req.session.loggedin = true;
        req.session.activeToken = token;
        req.session.username = userData.name;
        req.session.userData = userData;

        // store cookie
        // res.cookie("jwtToken", token, {
        //     expires: new Date(Date.now() + 600000),
        //     httpOnly: true
        // });

        if (isMatch) {
            res.status(201).redirect("/");
        } else {
            res.render("login", { invalidCred: "Invalid credentials. Please try again!" });
        }
    } catch (error) {
        res.render("login", { invalidCred: "Invalid credentials. Please try again!" });
    }
})


router.get("/register", async (req, res) => {
    res.render("register"); // load login page 
})

// create new user 
router.post("/register", async (req, res) => {
    try {
        const validationErrors = await validateUserRegistrationForm(req.body);
        // if case is for , if there is any validation error  in registration form
        if (!(Object.keys(validationErrors).length === 0 && validationErrors.constructor === Object)) {
            res.render("register", {
                invalidPassword: validationErrors
            })
        } else { // else case is for if there is no validation error in registration form
            const registerUser = new RegisterUser(req.body);

            // call middleware function for token genration
            const token = await registerUser.generateToken();
            console.log(`Token is ${token}`);

            const registerdUser = await registerUser.save();
            console.log(registerdUser)
            res.status(201).render("register", {
                registerSuccess: "User registered successfully."
            });
        }
    } catch (error) {
        console.log(error);
        res.render("register", { invalidCred: "Some error occured, Please try again in some time" });
    }
});

// get profile
router.get("/profile/:id", async (req, res) => {
    const _id = req.params.id;
    const profileData = await RegisterUser.findOne({_id: _id});// get that user
    console.log("***********PROFILE*************");
    console.log(profileData);
    res.render("profile",{
        profileData: profileData
    });
})


// logout user from the app
router.get("/logout", async (req, res) => {

    if (req.session.loggedin) {
        const userData = await RegisterUser.findOne({ email: req.session.userData.email });// get that user

        // start : if user want logout from particular device
        //match that particular token to remove from and update
        // userData.tokens = userData.tokens.filter((currentToken) => {
        //     return currentToken.token != req.session.activeToken;
        // })
        // End : if user want logout from particular device

        // start : if user want logout from all device
        userData.tokens = [];
        // End : if user want logout from all device
        req.session.destroy();
        const result = await userData.save();
        res.status(201).redirect("/login");
    } else {
        res.status(201).redirect("/login");
    }
})


router.get("*", (req, res) => {
    res.status(404).send("404", { title: "Page Not Found" })
})

function validateUserRegistrationForm(request) {
    let validationErrors = {}
    if (!request.name) {
        validationErrors["username"] = "User name was invalid";
    }
    if (!request.email) {
        validationErrors["email"] = "Email was invalid";
    }
    if (!request.phone) {
        validationErrors["phone"] = "Phone nuber was invalid";
    }
    if (!request.psw) {
        validationErrors["psw"] = "Password was invalid";
    }
    if (!request.confirmpassword) {
        validationErrors["confirmpassword"] = "Confirm password was invalid";
    }
    if (request.psw !== request.confirmpassword) {
        validationErrors["passwordmissmatch"] = "Password and confirm password does not match";
    }
    return validationErrors;
}


module.exports = router;