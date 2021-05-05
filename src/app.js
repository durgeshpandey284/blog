const express = require("express");
const path = require("path");
const hbs = require("hbs");
require("./db/conn");
const User = require("./models/usermessage");
const Blog = require("./models/addBlog");

const app = express();
const port = process.env.PORT || 3000;
const staticPath = path.join(__dirname, "../public");
const templatePath = path.join(__dirname, "../templates/views");
const partialsPath = path.join(__dirname, "../templates/partials");

app.use(express.urlencoded({ extended: false })); // to show data for send in response
app.use(express.json()); // display data in json 

app.use(express.static(staticPath));
// set BS and jquery path for easy access in hbs files
app.use("/css", express.static(path.join(__dirname, "../node_modules/bootstrap/dist/css")));
app.use("/js", express.static(path.join(__dirname, "../node_modules/bootstrap/dist/js")));
app.use("/jq", express.static(path.join(__dirname, "../node_modules/jquery/dist")));

// set hbs file for view engine
app.set("view engine", "hbs");  // set view engine
app.set("views", templatePath); // notify that now view is inside templates folder
hbs.registerPartials(partialsPath); // set partials path and register

app.get("/", (req, res) => {
    res.render("index");
})

// helper function to restrict the title upto 30 charater long
hbs.registerHelper("twentyCharaterString", function (items) {
    return items.substring(0, 30) + "...";
});


app.get("/blog", async (req, res) => {

    const getBlogs = await Blog.find({});
    res.render("blog", { post: getBlogs }); // pass data to templates
    // res.render("blog", {
    //     post: [{
    //         author: 'Binay',
    //         image: 'img/bird2.jfif',
    //         contents: "This is my first blog and I am very excited to share these with you all."
    //     }, {
    //         author: 'Tripathi',
    //         image: 'img/bird2.jfif',
    //         contents: "This is my first blog and I am very excited to share these with you all."
    //     }]
    // });
})

app.get("/blogdetail/:id", async (req, res) => {
    try {
        const _id = req.params.id;
        const getMens = await Blog.findById(_id);
        res.render("blogdetail", { blog: getMens });
        //  res.send(getMens); 
    } catch (error) {
        res.status(500).send(error);
    }

})

app.get("/postblog", (req, res) => {
    res.render("addBlog");
})

// add blog 
app.post("/postblog", async (req, res) => {
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
app.post("/contact", async (req, res) => {
    try {
        // res.send(req.body); // for post man
        const userData = new User(req.body);
        const responsedata = await userData.save();
        console.log(responsedata);
        res.status(201).render("index", {
            success: {
                success: true,
                message: 'Thanks for reaching out to us, We will get you back.',
            }
        });  // for UI
    } catch (error) {
        // console.log(error.status);
        // console.log(error.message);
        throw new Error(error.message)
        // in case , we need to show error on ui
        // res.render("index", {
        //     error: {
        //         status: error.status || 500,
        //         message: error.message || 'Internal Server Error',
        //     }
        // })
        // res.status(500).send(error);
    }
})


// middleware will run if no routes match
app.use((req, res, next) => {
    console.log("First helper")
    const error = new Error("Not found");
    error.status = 404;
    next(error);
});

// // error handler middleware it runs when except 404 any error will come
app.use((error, req, res, next) => {
    console.log("Second helper")
    res.status(error.status || 500).send({
        error: {
            status: error.status || 500,
            message: error.message || 'Internal Server Error',
        },
    });
});





app.listen(port, (req, res) => {
    console.log("Connection is listening at port " + port);
})