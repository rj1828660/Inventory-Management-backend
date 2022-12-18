const  asyncHandler =require("express-async-handler");
const User = require("../models/usermodel");
const sendEmail = require("../utils/sendEmail");
const contactUs=asyncHandler(async(req,res)=>{
   const {subject,message}=req.body ;
   const user= await User.findById(req.user._id);

   if(!user){
    res.status(400);
    throw new Error("User Not Found Please SignUp");
   }
   //Validation
   if(!subject||!message){
    res.status(400);
    throw new Error ("please add subject and message");

   } 
   
  
   const send_to=process.env.EMAIL_USER;
   const send_from=process.env.EMAIL_USER;
   const reply_to=user.email;
   console.log(subject);
   console.log(message);
   console.log(send_to);
   console.log(send_from);
   console.log(reply_to);
   try{
       await sendEmail(subject,message,send_to,send_from,reply_to)
       res.status(200).json({success: true,message:"Email Sent"})
   }catch(error){
       res.status(500);
       throw new Error("Email not Sent, please try again");
   }
 
});

module.exports={
    contactUs,
}