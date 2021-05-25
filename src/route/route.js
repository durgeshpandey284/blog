const express = require("express");
const router = new express.Router();
const bcrypt = require("bcryptjs");
var multer = require('multer');
var fs = require('fs');
const path = require("path");
const exec = require('child_process');

const Blog = require("../models/addBlog");
const User = require("../models/usermessage");
const RegisterUser = require("../models/userRegistration");
var image = require('../models/userprofileimg');


var storage = multer.diskStorage({
    destination: "./public/uploads",
    filename: (req, file, cb) => {
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname))
    }
});
var uploadprofileimage = multer({ storage: storage }).single('image');


//  Start of uploadprofileimage image 
router.post('/uploadprofileimg/:id', uploadprofileimage, async (req, res, next) => {
    const profileId = req.params.id;
    var imageFile = req.file.filename;
    var success = req.file.filename + " uploaded successfully";
    console.log(success);

    // find image and replace from image table
    const isProfileImageExist = await image.findOneAndReplace({ profileid: profileId }, {
        img: imageFile,
        profileid: profileId
    });

    // if image replaced  then save
    if (isProfileImageExist) {
        const profileData = await RegisterUser.findOne({ _id: profileId });
        res.render("profile", {
            profileData: profileData,
            isloogedIn: req.session.loggedin,
            userName: req.session.username,
            userData: req.session.userData,
            viewOnly: true,
            profileimg: isProfileImageExist.img
        });

    } else {  // if new profile image is creating then, create new image and save
        var imageDetail = new image({
            img: imageFile,
            profileid: profileId
        })
        imageDetail.save(async function (err, doc) {
            if (err) throw err;
            const profileData = await RegisterUser.findOne({ _id: profileId });
            const profileIMG = await image.findOne({ profileid: profileId }).sort({ created_at: -1 }); // get latest profile image
            if (profileIMG) {
                res.render("profile", {
                    profileData: profileData,
                    isloogedIn: req.session.loggedin,
                    userName: req.session.username,
                    userData: req.session.userData,
                    viewOnly: true,
                    profileimg: profileIMG.img
                });
            } else {
                res.render("profile", {
                    profileData: profileData,
                    isloogedIn: req.session.loggedin,
                    userName: req.session.username,
                    userData: req.session.userData,
                    viewOnly: true,
                    profileimg: 'user.png'
                });
            }
        })
    }

});

//  END of upload image 

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
    if (getBlogs.length) {
        res.render("blog", {
            isloogedIn: req.session.loggedin,
            userName: req.session.username,
            post: getBlogs
            // pagination: {
            //     page: 3,
            //     pageCount: 10
            //   }
        }); // pass data to templates
    } else {
        res.render("blog", {
            isloogedIn: req.session.loggedin,
            isBlogExist: "There is no blogs yet. You may be the first to write. Please sign up and login."
        });
    }

})

// get blog with pagination
//  get all blogs
router.get("/blogsperpage", async (req, res) => {
    // Declaring variable
    const resPerPage = 4; // results per page
    const page = req.params.page || 1; // Page
    console.log("blogsperpage part")
    // const getBlogs = await Blog.find({});

    try {

        // if (req.query.search) {
        // Find Demanded Products - Skipping page values, limit results       per page
        const getBlogs = await Blog.find({}).skip((resPerPage * page) - resPerPage)
            .limit(resPerPage);
        console.log(getBlogs)
        // Count how many products were found
        const numOfProducts = await Blog.count();
        console.log(numOfProducts)
        // Renders The Page
        // res.render('shop-products.ejs', {
        //     products: getBlogs,
        //     currentPage: page,
        //     pages: Math.ceil(numOfProducts / resPerPage),
        //     numOfResults: numOfProducts
        // });
        res.status(200).send({
            products: getBlogs,
            currentPage: page,
            pages: Math.ceil(numOfProducts / resPerPage),
            numOfResults: numOfProducts
        })
        // }
    } catch (err) {
        console.log("Error part")
        throw new Error(err);
    }

})



// get blog by logged in user 
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

        res.status(500).send(error);
    }
})
// get blog by blog id
router.get("/blogdetail/:id", async (req, res) => {
    try {
        // if (req.session.loggedin) {
        const _id = req.params.id;
        const getUniqueBlog = await Blog.findById(_id);
        res.render("blogdetail", {
            blog: getUniqueBlog,
            isloogedIn: req.session.loggedin,
            userName: req.session.username
        });
        // } else {
        //     res.redirect("/blog");
        // }

    } catch (error) {
        // res.status(500).send(error);
        res.redirect("/blog");
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
            userName: req.session.username,
            userData: req.session.userData
        });
    } else {
        res.render("addBlog");
    }

})


// add blog with image
var blogStorage = multer.diskStorage({
    destination: "./public/uploadsBlog",
    filename: (req, file, cb) => {
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname))
    }
});
var uploadBlogimage = multer({ storage: blogStorage }).single('image');

// add blog 
router.post("/postblog", uploadBlogimage, async (req, res) => {
    var imageFile = req.file.filename;
    var success = req.file.filename + " uploaded successfully";
    console.log(success);

    try {
        var blogData = new Blog({
            blogimage: imageFile,
            author: req.session.userData.name,
            email: req.session.userData.email,
            phone: req.session.userData.phone,
            title: req.body.title,
            blog: req.body.blog
        })
        const responsedata = await blogData.save();
        res.render("blog")
    } catch (err) {
        console.log(err);
        res.render("blog")
    }


    // blogData.save(async function (err, doc) {
    //     if (err) throw err;
    //     const profileData = await RegisterUser.findOne({ _id: profileId });
    //     const profileIMG = await image.findOne({ profileid: profileId }).sort({ created_at: -1 }); // get latest profile image
    //     if (profileIMG) {
    //         res.render("profile", {
    //             profileData: profileData,
    //             isloogedIn: req.session.loggedin,
    //             userName: req.session.username,
    //             userData: req.session.userData,
    //             viewOnly: true,
    //             profileimg: profileIMG.img
    //         });
    //     } 
    // });




    // try {

    //     req.body['author'] = req.session.userData.name;
    //     req.body['email'] = req.session.userData.email;
    //     req.body['phone'] = req.session.userData.phone;

    //     const blogData = new Blog(req.body);
    //     const responsedata = await blogData.save();
    //     res.status(201).redirect("/blog");
    // } catch (error) {
    //     res.status(500).send(error);
    // }
})

// post request for contact us
router.post("/contact", async (req, res) => {
    try {
        const userData = new User(req.body);
        const responsedata = await userData.save();

        res.status(201).render("index", {
            success: {
                success: true,
                message: 'Thanks for reaching out to us, We will get you back.',
            }
        });  // for UI
    }
    catch (error) {
        res.render("index", { error: "Some error occured, Please try again in some time" });
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


            const registerdUser = await registerUser.save();

            res.status(201).render("register", {
                registerSuccess: "User registered successfully."
            });
        }
    } catch (error) {

        res.render("register", { invalidCred: "Some error occured, Please try again in some time" });
    }
});

// get profile
router.get("/profile/:id", async (req, res) => {
    const _id = req.params.id;
    const profileData = await RegisterUser.findOne({ _id: _id });// get that user

    const profileIMG = await image.findOne({ profileid: _id }).sort({ created_at: -1 }); // get latest profile image
    if (profileIMG) {
        res.render("profile", {
            profileData: profileData,
            isloogedIn: req.session.loggedin,
            userName: req.session.username,
            userData: req.session.userData,
            viewOnly: true,
            profileimg: profileIMG.img
        });
    } else {
        res.render("profile", {
            profileData: profileData,
            isloogedIn: req.session.loggedin,
            userName: req.session.username,
            userData: req.session.userData,
            viewOnly: true,
            profileimg: 'user.png'
        });
    }
})

// get profile
router.get("/editprofile/:id", async (req, res) => {
    const _id = req.params.id;
    const profileData = await RegisterUser.findOne({ _id: _id });// get that user
    res.render("profile", {
        profileData: profileData,
        isloogedIn: req.session.loggedin,
        userName: req.session.username,
        userData: req.session.userData,
        viewOnly: false
    });
})

// update profile
router.post("/updateprofile/:id", async (req, res) => {
    const _id = req.params.id;
    const address = req.body.address;
    const city = req.body.city;
    const state = req.body.state;
    delete req.body.address;
    delete req.body.city;
    delete req.body.state;
    req.body['address'] = { address, city, state } // Object destructuring to insert object key
    // get that user and update
    const profileData = await RegisterUser.findByIdAndUpdate(_id, req.body, {
        new: true
    });
    res.render("profile", {
        profileData: profileData,
        isloogedIn: req.session.loggedin,
        userName: req.session.username,
        userData: req.session.userData,
        viewOnly: true
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
    res.status(404).render("404", { title: "Page Not Found" })
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