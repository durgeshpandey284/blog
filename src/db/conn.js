const mongoose = require("mongoose");

mongoose.connect(process.env.DB_DRIVER, {
    useCreateIndex: true,
    useUnifiedTopology: true,
    useNewUrlParser: true
}).then(()=>{
    console.log("Connection successfully created.");
}).catch((err)=>{
    console.log("No DB connection");
})
