const asyncHandler= require("express-async-handler");
const jwt =require("jsonwebtoken");
const User = require("../models/usermodel");

const protect=asyncHandler(async(req,res,next)=>{
    try{
         const token =req.cookies.token;
         console.log(req.cookies);
         if(!token){
            res.status(401);
            throw new Error("Not Authorized ,Please login");
         }
    
         //verify Token
         const verified=jwt.verify(token,process.env.JWT_SECRET);
         //get user id
        const user=await User.findById(verified.id).select("password");
         if(!user){
            res.status(401);
            throw new Error("User not found");

         }
         req.user=user;
         next();


    }catch(error){
        res.status(401);
        throw new Error("Not Authorized ,Please login");
    }
});
module.exports=protect;