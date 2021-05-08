const express = require("express");
const path = require("path");
const hbs = require("hbs");
require("./db/conn");
const router = require("./route/route");


const app = express();
const port = process.env.PORT || 3000;
const staticPath = path.join(__dirname, "../public");
const templatePath = path.join(__dirname, "../templates/views");
const partialsPath = path.join(__dirname, "../templates/partials");

app.use(express.urlencoded({ extended: false })); // to show data for send in response
app.use(express.json()); // display data in json 
app.use(router);

app.use(express.static(staticPath));
// set BS and jquery path for easy access in hbs files
app.use("/css", express.static(path.join(__dirname, "../node_modules/bootstrap/dist/css")));
app.use("/js", express.static(path.join(__dirname, "../node_modules/bootstrap/dist/js")));
app.use("/jq", express.static(path.join(__dirname, "../node_modules/jquery/dist")));

// set hbs file for view engine
app.set("view engine", "hbs");  // set view engine
app.set("views", templatePath); // notify that now view is inside templates folder
hbs.registerPartials(partialsPath); // set partials path and register

// helper function to restrict the title upto 30 charater long
hbs.registerHelper("twentyCharaterString", function (items) {
    return items.substring(0, 30) + "...";
});


app.listen(port, (req, res) => {
    console.log("Connection is listening at port " + port);
})