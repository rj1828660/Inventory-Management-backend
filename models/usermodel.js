const mongoose=require("mongoose");
const bcrypt=require("bcryptjs");
const userSchema=mongoose.Schema({
   name:{
    type:String,
    required:[true,"Please add a Name"]
   },
   email:{
    type:String,
    required:[true,"Please add a Email"],
    unique:true,
    trim:true,
    match:[
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
        "please enter valid email"
    ]
   },
   password:{
    type: String,
    required:[true,"Please add a Password"],
    minLength:[8,"Password must be up to 8 Characters"],
    // maxLength:[30,"Password must not be more than 30 Characters"]
   },
   photo: {
    type: String,
    required: [true,"Please add a photo"],
    default:"https://www.pexels.com/photo/green-grass-field-with-trees-12696013/"
   },
   phone: {
    type: String,
    default:"+91"
   },
   bio :{
    type: String,
    maxLength:[250,"Bio must not be more than 250 Characters"],
    default: "bio"
   }
 
},{
    timestamps:true
});
//Encrypt password before saving to DB
userSchema.pre("save",async function(next){
    if(!this.isModified("password")){
    
        return next();
    }
   //Hash password{
   const salt=await bcrypt.genSalt(10);
   const hashedPassword=await bcrypt.hash(this.password,salt);
   this.password=hashedPassword;
   next();

})
const User=mongoose.model("user",userSchema);
module.exports=User ;