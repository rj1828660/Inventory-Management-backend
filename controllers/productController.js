const  asyncHandler =require("express-async-handler");
const Product = require("../models/productModel");
const { fileSizeFormatter } = require("../utils/fileUpload");
const cloudinary=require("cloudinary").v2

 //Create Product
const createProduct=asyncHandler(async(req,res)=>{
 const {name,sku,category,quantity,price,description}=req.body;
 //validation
 if(!name||!category||!quantity||!price||!description){
    res.status(400);
    throw new Error("please fill all fields");
 }
 //Manage Image upload
 let fileData={};
 if(req.file){
  //Save image to cloudinary
  let uploadedFile;
  try{
    uploadedFile=await cloudinary.uploader.upload(req.file.path,{folder:"inventory App",resource_type: "image"})
  }catch(error){
    res.status(500);
    throw new Error("Image could not be uploaded")
  }

   fileData={
     fileName:req.file.originalname,
     filePath:uploadedFile.secure_url,
     fileType:req.file.mimetype,
     fileSize:fileSizeFormatter(req.file.size,2),
   }
 }

 const product=await Product.create({
    user:req.user._id,
    name,
    sku,
    category,
    quantity,
    price,
    description,
    image:fileData

 
 })
 res.status(201).json(product);
});
//get all products
const getProducts=asyncHandler(async(req,res)=>{
   const products=await Product.find({user:req.user._id}).sort("createdAt");
   res.status(200).json(products);
  });
  //Get single Product
  const getProduct=asyncHandler(async(req,res)=>{
    const product=await Product.findById(req.params.id);
    //if Product does'nt exist
    if(!product){
      res.status(404); 
      throw new Error("Product Not Found");
    }
    //Match Products to its user
    if(product.user.toString()!==req.user.id){ 
      res.status(401);
      throw new Error("User not Authorised");
    }
     res.status(200).json({message:"product deleted Successfully"});
  });
  //Delete Product
  const deleteProduct=asyncHandler(async(req,res)=>{
    const product=await Product.findById(req.params.id);
    //if Product does'nt exist
    if(!product){
      res.status(404); 
      throw new Error("Product Not Found");
    }
    //Match Products to its user
    if(product.user.toString()!==req.user.id){
      res.status(401);
      throw new Error("User not Authorised");
    }
    await product.remove();
     res.status(200).json(product);
  });
  //Update Product
  const updateProduct=asyncHandler(async(req,res)=>{
    const {name,sku,category,quantity,price,description}=req.body;
    const {id}=req.params
    const product=await Product.findById(req.params.id);
     //if Product does'nt exist
     if(!product){
      res.status(404); 
      throw new Error("Product Not Found");
    }
    //Manage Image upload
    let fileData={};
    if(req.file){
     //Save image to cloudinary
     let uploadedFile;
     try{
       uploadedFile=await cloudinary.uploader.upload(req.file.path,{folder:"inventory App",resource_type: "image"})
     }catch(error){
       res.status(500);
       throw new Error("Image could not be uploaded")
     }
   
      fileData={
        fileName:req.file.originalname,
        filePath:uploadedFile.secure_url,
        fileType:req.file.mimetype,
        fileSize:fileSizeFormatter(req.file.size,2),
      }
    }
   //update Product
    
    const updateProduct=await Product.findByIdAndUpdate(
      {_id:id},
      {
        name,
        sku,
        category,
        quantity,
        price,
        description,
        image:Object.keys(fileData).length()===0?product.image:fileData,

      },
      {
        new:true,
        runValidators:true
      }

    )
   
    res.status(200).json(updateProduct);
   });
   
module.exports={
    createProduct,
    getProducts ,
    getProduct,
    deleteProduct,
    updateProduct
}