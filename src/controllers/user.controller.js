import {asyncHandler} from '../utils/asyncHandler.js'
import {ApiError} from '../utils/ApiErrors.js'
import {User} from '../models/user.model.js'
import {deleteFromCloudinary, uploadOnCloudinary} from '../utils/Cloudinary.js'
import { ApiResponse } from '../utils/ApiResponse.js'
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose'

const generateAccessTokenAndRefreshToken = async (userId)=>{
   try {
   const user =   await User.findById(userId)
    const accessToken =   user.generateAccessToken()
      const refreshToken =user.generateRefreshToken()

      user.refreshToken = refreshToken
      await user.save({validateBeforeSave:false}) // if we direct save it moongose model kick in like you need to add pass email etc so we skip validation by adding validateBeforeSave

      return {accessToken, refreshToken}

   } catch (error) {
      throw new ApiError(500,"something went wrong while generating refresh and access token ")
      
   }
}



const registerUser = asyncHandler( async (req,res)=>{
   // get user detail form frontend
   // validation = not empty
   // check if user already exist " username , email"
   // check fro iamge , check for avatar
   // upload to cloudinary, avatar
   // create usser object = create entry in db 
   // remove password and refresh token field from response 
   // check for user creation
   // return response


   const {fullName, email , username,password}=req.body
   // console.log("Email",email);
   // console.log("REqBodyy==> ",req.body);
   

   // if (fullname==="") {
   //    throw new ApiError(400,"full name is required")
   // } or
   if ([fullName,email,username,password].some((field)=> field?.trim()==="")
   ) { throw new ApiError(400,"All fields are required")
      
   }

  const existedUser = await User.findOne({
      $or:[{ username },{ email }] // $or give us array to check as many field as we can exiest or not if found one print user exist
   })
   if(existedUser){
      throw new ApiError(409,"User already Exist")
   }
   // to get the image local path req.files are option like req.body we get req.files in multer [0] first property may give us path
   const avatarLocalPath = req.files?.avatar[0]?.path;
   // const coverImageLocalPath = req.files?.coverImage[0]?.path;



let coverImageLocalPath;
// Safely access coverImage if it's provided
if (req.files && req.files.coverImage && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
   coverImageLocalPath = req.files.coverImage[0].path;
}


   if (!avatarLocalPath) {
      throw new ApiError(400,"Avatar is required")
   }

  const avatar =  await uploadOnCloudinary(avatarLocalPath)
  const coverImage = await uploadOnCloudinary(coverImageLocalPath)

  if(!avatar){
   throw new ApiError(400,"Avatar is required")

  }

  const user = await User.create({
   fullName,
   avatar:avatar.url,
   coverImage: coverImage?.url || "",
   email,
   password,
   username: username.toLowerCase()


  })
  // checkin user exsit  slecet is which vlaue we dont need -password etc
  const createdUser = await User.findById(user._id).select(
   "-password -refreshToken"
  )    
  if(!createdUser){
   throw new ApiError(500,"Something went wrong while registering a user Contact team")
  }          
    
  return res.status(201).json(
   new ApiResponse(200, createdUser, "User Registered Successfully ")
  )

})


// LOGIN 
const loginUser = asyncHandler( async (req,res)=>{

   // reqbody --> data
   // username or email to login 
   // find the user 
   // pass check 
   // generate access or refresh token 
   // send cookie 

   // reqbody --> data

   const {email ,username, password} = req.body
   if(!(username || email)){
      throw  new  ApiError(400, "username or email is required")
   }


   // username or email to login 

   const user = await User.findOne({
      $or : [{username},{email}]
   })
   // find the user 

   if(!user){
      throw new ApiError(404 , ("User does not exist "))
   }
   // pass check 

   const isPasswordValid = await user.isPasswordCorrect(password)
   if(!isPasswordValid){
      throw new ApiError(401 , ("invlaid user credentials"))
   }

   // generate access or refresh token 

 const {accessToken,refreshToken} = await generateAccessTokenAndRefreshToken(user._id)

 const loggedInUser = await User.findById(user._id).select(-password -refreshToken)

 // send to cookies 
    const options = {
      httpOnly : true, // means front end cannot modify it 
      secure : true
    }
    return res
    .status(200)
    .cookie("accessToken", accessToken,options)
    .cookie("refreshToken",refreshToken,options)
    .json(
      new ApiResponse(
         200,
         {
            user : loggedInUser,accessToken,refreshToken
         },
         "user logged in Successfully"
      )
    )


})

//logout user 
const logoutUser = asyncHandler( async (req,res)=>{
 // refres acces and refrsh token
 
  await User.findByIdAndUpdate(
   req.user._id, 
   {
      $unset:{
         refreshToken:1 // this remove field form documents
      }
   },
   {
      new : true
   }

   )
   const options = {
      httpOnly : true, 
      secure : true
    }
    return res
    .status(200)
    .clearCookie("accessToken",options)
    .clearCookie("refreshToken",options)
    .json(new ApiResponse(200,{},"user logged out Successfully"))
})

// refresh token

const refreshAccessToken = asyncHandler( async (req,res)=>{
   
   const IncomingTokenRequest = req.cookies?.refreshToken || req.body?.refreshToken
   // console.log(IncomingTokenRequest);
   
   if(!IncomingTokenRequest){
      throw new ApiError(401,"unauhterized Request");  
   }
try {
   
     const decodedToken =  jwt.verify(
         IncomingTokenRequest,
         process.env.REFRESH_TOKEN_SECRET
      )
   
      const user = await User.findById(decodedToken?._id)
      
      if (!user) {
         throw new ApiError(401,"invalid refresh token ")
         
      }
      if (IncomingTokenRequest !== user?.refreshToken) {
         throw new ApiError(401," refresh token is expired or used")
         
      }
       const options = {
         httpOnly : true,
         secure : true
   
       }
     const {newRefreshToken,accessToken} = await generateAccessTokenAndRefreshToken(user._id)
   
     return res
     .status(200)
     .cookie("accessToken",accessToken,options)
     .cookie("refreshToken",newRefreshToken,options)
     .json(
      new ApiResponse(
         200,
         {accessToken,refreshToken:newRefreshToken},
         "AccessToken is Successfully refreshed"
      )
     )
   
} catch (error) {
   throw new ApiError(401,error?.message ||"Error in refresing token")
}
  

})
// password Change
const ChangePassword = asyncHandler( async (req,res)=>{
const {oldPassword , newPassword} = req.body
const user = await User.findByIdAndUpdate(req.user?._id) // middleware 

const isPasswordCorrect = await user.isPasswordCorrect(oldPassword) // userSchema

if (!isPasswordCorrect) {
   throw new ApiError(400,"Invalid old password ")
   
}
if(oldPassword===newPassword){
   throw new ApiError(400,"password cannot be same as old")
}
user.password = newPassword
await user.save({validateBeforeSave:false})

return res
.status(200)
.json( new ApiResponse(200,{},"password changed succesfuly"))

})

// get Current user
const getcurrentUser = asyncHandler( async (req,res)=>{

   return res
   .status(200)
   .json( new ApiResponse(   200,
      req.user,
      "Current user Fetched Successfully")
   
   )


})

// Update user
const AccountDetialUpdate = asyncHandler( async (req,res)=>{
const {fullName,email,username} = req.body
if (!fullName && !email && !username) {
   throw new ApiError(400, "At least one field is required for update");
}

const user = await User.findByIdAndUpdate(
   req.user?._id,
   {
       $set: {
           fullName,
           email,
           username
       }
   },
   {
       new: true
   }
).select("-password");

return res.status(200)
.json(new ApiResponse(200,user,"Account Updated Successfully"))
 
})

// Update avatar image

const UpdateUserAvatar = asyncHandler( async (req, res)=>{
   const avatarLocalPath = req.file?.path // middleware
   if(!avatarLocalPath){
      throw new ApiError(400, "Avatar File Missing")
   }
    const avatar = await uploadOnCloudinary(avatarLocalPath)
    if (!avatar.url) {
      throw new ApiError(400, "Error Unable to Update the file on Cloudinary URL Missing")
      
    } 

       // Find the user and get the old avatar public ID before updating
       const user = await User.findById(req.user?._id);
       const oldAvatarPublicId = user.avatar ? 
           user.avatar.split('/').pop().split('.')[0] : 
           null;
    
    const updatedUser = await User.findByIdAndUpdate(req.user?._id,
      {
         $set:{
            avatar : avatar.url
            
         }
      },{new : true}
    ).select("-password")

    if(oldAvatarPublicId){
        await deleteFromCloudinary(oldAvatarPublicId)
    }
   
    return res.status(200)
    .json(new ApiResponse(200,updatedUser,"Avatar Uploaded Successfully"))
   
   })
// Update Cover avatar image

const updateCoverImage = asyncHandler( async (req,res)=>{
const localCoverImage = req.file?.path

if(!localCoverImage){
   throw new ApiError(400, "Cover Avatar File Missing")
}

const coverImage = await uploadOnCloudinary(localCoverImage)

if (!coverImage.url) {
   throw new ApiError(400, "Error Unable to Update the file on Cloudinary URL Missing in Cover image")
   
 }

 const user = User.findById(req.url?._id);
 const oldAvatarPublicId = user.coverImage ? 
 user.coverImage.split('/').pop().split('.')[0] : 
 null;
 
const updateUser = await User.findByIdAndUpdate(req.user?._id,
   {
      $set:{
         coverImage : coverImage.url
      }
   },{new:true}
).select("-password")

if (oldAvatarPublicId) {
   await deleteFromCloudinary(oldAvatarPublicId)
}

return res.status(200)

.json(new ApiResponse(200,updateUser,"cover Image Updated Successfully"))

})

// USer Channel profile

const getUserChannelProfile = asyncHandler( async (req,res)=>{

   const {username} = req.params // params is username = shubham

   if(!username?.trim()){
      throw new ApiError(4000, "username not found")
   }
 
   const channel = await User.aggregate([
      {
         $match:{
            username: username?.toLowerCase()
         }
      },
      
      {
         $lookup:{
            from : "subscriptions" , // model namne 
            localField: "_id", // we see ti form id 
            foreignField: "channel", // channels selected
            as : "subscribers"
            

         }
      },
      {
         $lookup:{
            from : "subscriptions",
            localField:"_id",
            foreignField:"subscriber",
            as : "subscribedTo"
         }
      },
      { // add both locup in same field to user model 
         $addFields:{
            subscriberCount : {
                $size : "$subscribers" // add dollar sign because it field 
            },
            channelSubscribedToCount : {
               $size : "$subscribedTo" // now this to fields added in user schema in array from[ 0] is object 
            } ,
            isSubscribed :{
               $cond:{
                  if:{$in:[req.user?._id,"$subscribers.subscribers"]}, // in can go further in array as well as objects
                  then:true,
                  else : false
               }
            },
         }
      }, 
      {
         $project:{
            fullName : 1,
            email : 1,
            coverImage : 1,
            avatar:1,
            subscriberCount:1,
            channelSubscribedToCount:1,
            isSubscribed:1,
            username:1
         }
      }
   ])
   if (!channel?.length) {
      throw new ApiError(401, "Channel doest not exist ")
   }

   return res.status(200)
   .json(
      new ApiResponse(200,channel[0], "User channel fetched Successfully ")
   )
})
// Watch History Aggregation Pipeline
const getWatchHistory = asyncHandler(async (req, res) => {
    const user = await User.aggregate([
        // Stage 1: $match - Filters documents
        {
            $match: {
                _id: new mongoose.Types.ObjectId(req.user?._id)
                // Converting string ID to MongoDB ObjectId
                // Required because aggregation pipeline sees IDs as strings
            }
        },
        // Stage 2: $lookup - Performs a left outer join with videos collection
        {
            $lookup: {
                from: "videos",               // Target collection to join
                localField: "watchHistory",   // Field from users collection
                foreignField: "_id",          // Field from videos collection
                as: "WatchHistory",           // Output array field
                pipeline: [
                    // Nested $lookup to get video owner details
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            pipeline: [
                                // $project stage to select specific fields
                                {
                                    $project: {
                                        fullName: 1,   // 1 means include
                                        username: 1,
                                        avatar: 1
                                    }
                                }
                            ]
                        }
                    },
                    // Add owner field with first element of owner array
                    {
                        $addFields: {
                            owner: {
                                $first: "$owner"
                            }
                        }
                    }
                ]
            }
        }
    ])

   return res.status(200)
   .json(
      new ApiResponse(200, user[0].watchHistory , "watch history fetched succesfully")
   )

 
})
export {registerUser,loginUser,logoutUser,refreshAccessToken, ChangePassword,getcurrentUser,AccountDetialUpdate ,UpdateUserAvatar, updateCoverImage,getUserChannelProfile,getWatchHistory}