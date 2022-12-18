const dotenv = require("dotenv").config();
const express= require("express");
const mongoose= require("mongoose");
const cookieParser=require("cookie-parser");
const bodyParser=require("body-parser");
const cors=require("cors");
const path=require("path");
const userRoute=require("./routes/userRoute"); 
const productRoute=require("./routes/productRoute");
const contactRoute=require("./routes/contactRoute");
const app=express();
const errorHandler=require("./middleWare/errorMiddleWare");
const PORT= process.env.PORT || 5000;
//Middlewares
app.use(cookieParser());
app.use(express.json())//handle json data
app.use(express.urlencoded({extend: false}))//handle data through url
app.use(bodyParser.json());//helps to parse data from front-end to backend
app.use("/uploads",express.static(path.join(__dirname,"uploads")));
app.use(cors({
  origin: ["http://localhost:3000", "https://inventory-app.vercel.app"],
  credentials: true,
  // optionSuccessStatus:200
}))
//Route Middleware
app.use("/api/users",userRoute);
app.use("/api/products",productRoute);
app.use("/api/contactUs",contactRoute);
//Routes
app.get("/",(req,res)=>{
  res.send("Home Page");
})
//error middleWare
 app.use(errorHandler);
//Connect mongoDb
mongoose
  .connect(process.env.MONGO_URI)
  .then(()=>{
    app.listen(PORT,()=>{
        console.log('Server Running on port '+PORT);
    })
  }) 
  .catch((err)=>console.log(err))  