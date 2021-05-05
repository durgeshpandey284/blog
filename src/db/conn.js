const mongoose = require("mongoose");

mongoose.connect("mongodb://localhost:27017/blogdb", {
    useCreateIndex: true,
    useUnifiedTopology: true,
    useNewUrlParser: true
}).then(()=>{
    console.log("Connection successfully created.");
}).catch((err)=>{
    console.log("No DB connection");
})
