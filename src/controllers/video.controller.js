import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/ApiErrors";
import { ApiResponse } from "../utils/ApiResponse";
import jwt from 'jsonwebtoken';
import { ApiResponse } from '../utils/ApiResponse.js'
import { uploadOnCloudinary,deleteFromCloudinary } from "../utils/Cloudinary.js";
import { User } from "../models/user.model.js";


// route for uploading video 

const videoUpload = asyncHandler(async (req,res)=>{
 const videoLocalPath = req.files?.[0].path
 const { title, description, thumbnail, duration, views, isPublished, owner } = req.body;

 if([title,description].some((field)=>{field?.trim()===""})){
    throw new ApiError(400,"All fields are required")
 }

 if(!videoLocalPath){
    throw new ApiError(400,"Video Local path not found")
 }

 const video = await uploadOnCloudinary(videoLocalPath)

 if(!video.url){
    throw new ApiError(400,"Video url is missing")
 }

const user = await User.create(
    {
        videoFile : videoFile.url,
        thumbnail,
        title,
        description,
        duration,
        views,
        isPublished,
        owner
    }

)

res.status(200)
.json( new ApiResponse(200,user,"Video Uploaded Successfully"))

})



export {videoUpload}