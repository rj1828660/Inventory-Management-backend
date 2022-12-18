
const asyncHandler= require("express-async-handler");
const jwt =require("jsonwebtoken");
const User = require("../models/usermodel");
const bcrypt=require("bcryptjs");
const Token = require("../models/tokenModel");
const crypto= require("crypto");
const sendEmail = require("../utils/sendEmail");
//genarating token
const generateToken=(id)=>{
    return jwt.sign({id},process.env.JWT_SECRET,{expiresIn:"1d"});
}

//register user
const registerUser= asyncHandler(async(req,res)=>{
    const {name,email,password}=req.body;
    //validation
    // console.log(name);
    // console.log(req.body.name);
    // console.log(req.body);
    if(!name ||!email|| !password){
        res.status(400)
        throw new Error("Please fill in all required fields")
    }
    if(password.length<8){
        res.status(400)
        throw new Error("Password must be upto 8 characters");
    }
    //check if user email already exits
   const userExist= await User.findOne({email});
   if(userExist){
    res.status(400);
    throw new Error("This Email already Exist")
   }
   
   //Create new User
   const user=await User.create({
    name,
    email,
    password 
   })
   //generate Token
    const token=generateToken(user.id);   
  //send HTTP-only cookie
  res.cookie("token",token,{
    path:"/",
    httpOnly:true,
    expires:new Date(Date.now()+1000*86400),//1 day
    sameSite:"none",
    secure:true
  });
   if(user){
    const {_id,name,email,photo,phone,bio}=user;
    res.status(201).json({
        _id,name,email,photo,phone,bio,token
    });
}else{
    res.status(400);
    throw new Error("Invalid user data");
}
}); 
//Login User
const loginUser=asyncHandler(async(req,res)=>{
   const {email,password}=req.body;
   //Validate 
   if(!email||!password){
    res.status(400);
    throw new Error ("please add Email and Password");

   }
   //Check User exist
   const user =await User.findOne({email});
   if(!user){
    res.status(400);
    throw new Error ("User not found please signUp");
   }
    //generate Token
   const token=generateToken(user.id);   
  //send HTTP-only cookie
  res.cookie("token",token,{
    path:"/",
    httpOnly:true,
    expires:new Date(Date.now()+1000*86400),//1 day
    // sameSite:"none",
    //secure:true
  });
 
   //User exists check PassWord correct
    const passwordIsCorrect=await bcrypt.compare(password,user.password);
   if(user && passwordIsCorrect){
    const {id,name,email,photo,phone,bio}=user;
    res.status(200).json({
        id,name,email,photo,phone,bio,token
    });
   }else{
    res.status(400);
    throw new Error("Invalid email or Password");
   }
});
//logout user
const logout=asyncHandler(async(req,res)=>{
    res.cookie("token","",{
        path:"/",
        httpOnly:true,
        expires:new Date(0),//ends now at curr sec
        sameSite:"none",
        secure:true
      });
      return res.status(200).json({message:"Successfully logout"});
});
//Get User Profile
const getUser=asyncHandler(async(req,res)=>{
   const user= await User.findById(req.user.id);
   if(user){
    const {_id,name,email,photo,phone,bio}=user;
    res.status(200).json({
        _id,name,email,photo,phone,bio
    });
}else{
    res.status(400);
    throw new Error("User not found");
}
});
//Gets login status
const loginStatus=asyncHandler(async(req,res)=>{
    const token=req.cookies.token;
    if(!token){
        return res.json(false);
    }
    //verify Token
    const verified=jwt.verify(token,process.env.JWT_SECRET);
    if(verified){
        return res.json(true);
    }
});
//updateUser
const updateUser=asyncHandler(async(req,res)=>{
   const user=await User.findById(req.user.id);
   if(user){
    const {name,email,photo,phone,bio}=user;
    user.email=email;
    user.name=req.body.name||name;
    user.phone=req.body.phone||phone;
    user.bio=req.body.bio||bio;
    user.photo=req.body.photo||photo;

    const updatedUser=await user.save();
    res.status(200).json({
        id:updatedUser.id,name:updatedUser.name,email:updatedUser.email,photo:updatedUser.photo,phone:updatedUser.phone,bio:updatedUser.bio
    });
   }else{
    res.status(401);
    throw new Error("user not found");
   }
});
//changePassword
const changePassword=asyncHandler(async(req,res)=>{
    const user=await User.findById(req.user.id);
  
    const {oldPassword,password}=req.body;
    if(!user){
        res.status(400);
        throw new Error("user not found");
    }
    //validate
    if(!oldPassword||!password){
        res.status(400);
        throw new Error("please add old and new password");
    }
    //check if old password matches password in db
    const passwordIsCorrect=await bcrypt.compare(oldPassword,user.password);
    //save
    if(user&&passwordIsCorrect){
        user.password=password;
        await user.save();
        res.status(200).send("Password change Successfully");
    }else{
        res.status(400);
        throw new Error("old password is incorrect");
    }
})
//forgot password
const forgotPassword=asyncHandler(async(req,res)=>{
    const{email}=req.body
    const user=await User.findOne({email})

    if(!user){
        res.status(404);
        throw new Error("User does not exist");
    }
    //Delete token if it exists in DB
    let token=await Token.findOne({userId:user._id})
    if(token){
        await token.deleteOne();
    }
    //Create reset Token
    let resetToken=crypto.randomBytes(32).toString("hex")+user._id;
   // console.log("resetToken:"+resetToken);
    //Hash token before saving to db
    const hashedToken=crypto.createHash("sha256").update(resetToken).digest("hex");
    //console.log(hashedToken);
    //save token to db
    await new Token({
        userId: user._id,
        token: hashedToken,
        createdAt : Date.now(),
        expiresAt:Date.now()+30*(60*1000)//30 min

    }).save()
    //construct Reset url
    const resetUrl=`${process.env.FRONTEND_URL}/resetPassword/${resetToken}`;
    //Reset Email
    //console.log(resetUrl);
    const message= `<h2>Hello ${user.name}</h2>
    <p>Please use url below to reset your password</p>
    <p>reset link is valid for only 30 minutes</p>
    
    <a href=${resetUrl} clicktracking=off>${resetUrl}</a>

    <p>Regards...</p>
    <p>Inventory Management Team</p>
    `
    ;
    
    const subject="Password Reset Request";
    const send_to=user.email;
    const send_from=process.env.EMAIL_USER;
    console.log(send_from);
    try{
        await sendEmail(subject,message,send_to,send_from)
        res.status(200).json({success: true,message:"Reset Email Sent"})
    }catch(error){
        res.status(500)
        throw new Error("Email not Sent, please try again")
    }
  
    


});
const resetPassword=asyncHandler(async(req,res)=>{
   const {password}=req.body;
   const {resetToken}=req.params;
    //Hash token and compare to token in database
    const hashedToken=crypto.createHash("sha256").update(resetToken).digest("hex");

    //find token in db
    const userToken=await Token.findOne({
        token:hashedToken,
        expiresAt:{$gt:Date.now()}
    })
    if(!userToken){
         res.status(404);
         throw new Error("Invalid or Expires Token");
    }
    const user=await User.findOne({_id:userToken.userId})
    user.password=password;
    await user.save();
    res.status(200).json({message:"Password Reset Successful, Please login"})
});

module.exports={
    registerUser,
    loginUser,
    logout,
    getUser,
    loginStatus,
    updateUser,
    changePassword,
    forgotPassword,
    resetPassword
};