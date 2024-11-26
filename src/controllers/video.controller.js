import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiErrors.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { uploadOnCloudinary,deleteFromCloudinary } from "../utils/Cloudinary.js";
import { User } from "../models/user.model.js";
import {Video} from "../models/video.model.js";
import mongoose,{isValidObjectId} from "mongoose";



const getAllVideos = asyncHandler(async (req, res) => {
   const { page = 1, limit = 10, query, sortBy= "createdAt", sortType="desc", userId } = req.query
   //TODO: get all videos based on query, sort, pagination
   // query is ? liek this 
   const queryOptions = {
      isPublished : true
   }
   // if user id exist add it to querry 
   if(userId){
      queryOptions.owner = userId
   }
// If query exists, add text search across title and description
   if(query){
      queryOptions.$or=[
         { title: { $regex: query, $options: 'i' } },
         { description: { $regex: query, $options: 'i' } }  

      ]
   }

   // sort options
   const sortOptions= {}
   sortOptions[sortBy] = sortType === 'desc' ? -1 :1 

   const skipCount = (page-1) * limit // page = 0 (1-1) *10 so page start form 1

   const videos = await Video.find(queryOptions)
   .sort(sortOptions)
   .skip(skipCount)
   .limit(Number(limit))
   .populate("owner",'avatar username',)

   const totalvideos = await Video.countDocuments(queryOptions);
   const totalPage = Math.ceil(totalvideos/limit);

   return res.status(200)
   .json( new ApiResponse(200,{
      videos,
      totalPage,
      totalvideos,
      page:Number(page),
      limit :Number(limit)
   },'Video retrieved Successfully'))



})

// Video uploading 

const publishAVideo = asyncHandler(async (req,res)=>{

   const { title, description } = req.body;

   if (!title?.trim() || !description?.trim()) {
      throw new ApiError(400, "All fields are required");
  }
  
  const videoLocalPath = req.files?.videoFile?.[0].path;
  const thumbnailLocalPath = req.files?.thumbnail?.[0].path;

   if(!(videoLocalPath || thumbnailLocalPath)){
      throw new ApiError(400,"Video file or thumbnail is missing ")
   }
  
  
   const video = await uploadOnCloudinary(videoLocalPath)
  
   if(!video.url){
      throw new ApiError(400,"Video url is Missing")
   }

   const thumbnail = await uploadOnCloudinary(thumbnailLocalPath)

   if(!thumbnail.url){
      throw new ApiError(400,"Thumbnail Url is Missing")
   }
  
  const newvideo = await Video.create(
      {
          videoFile : video.url,
          thumbnail : thumbnail.url,
          title,
          description,
          duration:video.duration,
          owner : req.user?._id
         
      }
  
  )
  
  res.status(200)
  .json( new ApiResponse(200,newvideo,"Video Uploaded Successfully"))
  
  })

// get Video by id 

const getVideoById = asyncHandler(async (req, res) => {
   const { videoId } = req.params
  
  const video = await Video.findById(videoId)

  if(!video){
   throw new ApiError(400,"Video not Found ")

  }
   res.status(200)
   .json(new ApiResponse(200,video,"Video Fetched Successfully"))

})

// Update a Video 
const updateVideo = asyncHandler(async (req, res) => {
   const { videoId } = req.params
   
   // Extract fields from request body
   const { title, description } = req.body
   
   // Find the existing video
   const video = await Video.findById(videoId)
   if(!video){
       throw new ApiError(404, "Video not found");
   }

   // Prepare update object
   const updateFields = {};
   
   // Add title to update if provided
   if (title) {
       updateFields.title = title;
   }
   
   // Add description to update if provided
   if (description) {
       updateFields.description = description;
   }

   // Handle thumbnail update if file is present
   let thumbnailLocalPath = req.files?.thumbnail?.[0]?.path;
   if (thumbnailLocalPath) {
       const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);
       if(!thumbnail.url){
           throw new ApiError(400, "Error Updating Thumbnail Image");
       }
       
       // Store old thumbnail for deletion
       const oldThumbnail = video.thumbnail 
           ? video.thumbnail.split('/').pop().split('.')[0] 
           : null;
       
       // Add thumbnail to update fields
       updateFields.thumbnail = thumbnail.url;

       // Delete old thumbnail from cloudinary
       if (oldThumbnail) {
           await deleteFromCloudinary(oldThumbnail);
       }
   }

   // If no updates are provided
   if (Object.keys(updateFields).length === 0) {
       throw new ApiError(400, "No update fields provided");
   }

   // Perform the update
   const updatedVideo = await Video.findByIdAndUpdate(
       videoId, 
       { $set: updateFields },
       { new: true }
   )

   return res.status(200)
       .json(new ApiResponse(200, updatedVideo, "Video updated Successfully"))
})
// Delete a Video 
const deleteVideo = asyncHandler(async (req, res) => {
   const { videoId } = req.params
 

  const  video = await Video.findById(videoId)
   if (!video) {
      throw new ApiError(404, "Video not found");
   }

   const videoPublicId = video?.videoFile.split('/').pop().split('.')[0]
   const thumbnailPublicId= video?.thumbnail.split('/').pop().split('.')[0]

   await deleteFromCloudinary(videoPublicId)
   await deleteFromCloudinary(thumbnailPublicId)

   await Video.findByIdAndDelete(videoId)




    return res.status(200)
    .json( new ApiResponse(200,{},"Video deleted Successfully"))
})

// Enable or Disable video
const togglePublishStatus = asyncHandler(async (req, res) => {
   const { videoId } = req.params
  

   const video = await Video.findById(videoId)
   if(!video){
      throw new ApiError(404,"Video not found")
   }
   video.isPublished = !video.isPublished;


   await video.save();
   return res.status(200).json(
      new ApiResponse(
         200,
         video,
         `Video has been ${video.isPublished ? "enabled" : "disabled"} successfully`
      )
   );
});
   

export {
   getAllVideos,
   publishAVideo,
   getVideoById,
   updateVideo,
   deleteVideo,
   togglePublishStatus
}