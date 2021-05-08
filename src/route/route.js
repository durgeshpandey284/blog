const express = require("express");
const router = new express.Router();
const Blog = require("../models/addBlog");
const User = require("../models/usermessage");



router.get("/", (req, res) => {
    res.render("index");
})

router.get("/blog", async (req, res) => {
    const getBlogs = await Blog.find({});
    res.render("blog", { post: getBlogs }); // pass data to templates
})

router.get("/blogdetail/:id", async (req, res) => {
    try {
        const _id = req.params.id;
        const getMens = await Blog.findById(_id);
        res.render("blogdetail", { blog: getMens });
        //  res.send(getMens); 
    } catch (error) {
        res.status(500).send(error);

    }
})

router.get("/postblog", (req, res) => {
    res.render("addBlog");
})

// add blog 
router.post("/postblog", async (req, res) => {
    try {
        // console.log("***************************");
        // console.log(req.body);
        // res.send(req.body);
        const blogData = new Blog(req.body);
        const responsedata = await blogData.save();
        res.status(201).redirect("/blog");
        // res.status(201).send(responsedata);
    } catch (error) {
        res.status(500).send(error);
    }
})

// post request for contact us
router.post("/contact", async (req, res) => {
    try {
        // res.send(req.body); // for post man
        console.log(req.body);
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
        console.log("****************");
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

router.get("*", (req, res) => {
    res.send("404", { title: "Page Not Found" })
})

module.exports = router;