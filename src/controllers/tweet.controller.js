import mongoose, { isValidObjectId } from "mongoose"
import {Tweet} from "../models/tweet.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiErrors.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

// create tweet
const createTweet = asyncHandler(async (req, res) => {
    const {content} = req.body

    if(!content || content.trim()===""){
        throw new ApiError(400, "content Field is missing" )
    }

    if(!mongoose.isValidObjectId(req.user._id)){
        throw new ApiError(400, "Invalid user ID")
    }
    

   const tweet =  await Tweet.create(
        {content,
        owner : req.user?._id
    }
    )

    return res.status(200)
    .json(
        new ApiResponse(200,tweet,"Tweeted Successfully")
    )

})

  //  get user tweets
const getUserTweets = asyncHandler(async (req, res) => {
  
    const userId = req.user?._id
    if(!userId){
        throw new ApiError(400,'user id missing')
    }

    const { page = 1, limit = 10 } = req.query;

    
 
    const tweets = await Tweet.find({ owner: userId })
    .skip((page-1) *limit)
    .limit(Number(limit))
    .sort({ createdAt: -1 });

   if (!tweets || tweets.lenght === 0) {
     throw new ApiError(404,"No Tweet Found for this user")
   }

   return res.status(200)
   .json( new ApiResponse( 200,tweets,"Tweet Fetched Successfully"))

})

// Udpate Tweet
const updateTweet = asyncHandler(async (req, res) => {
   const {content} = req.body;
   const {tweetId} = req.params;

   if(!content || content.trim()===""){
    throw new ApiError(400,"Update field is missing")
   }

const updatedTweet = await Tweet.findByIdAndUpdate(tweetId,{

    $set:{content}

},{new:true})

if(!updateTweet){
    throw new ApiError(404,"Tweet not found")
}
return res.status(200)
.json(new ApiResponse(200,updatedTweet,"Tweet Updated successfully"))

})
// Delete Tweet
const deleteTweet = asyncHandler(async (req, res) => {

    const {tweetId} = req.params

    if(!tweetId){
        throw new ApiError(400,"Tweet is missing")
    }

  const deleteTweet =   await Tweet.findByIdAndDelete(tweetId)

  if (deleteTweet.deletedCount === 0) {
    throw new ApiError(404, "Tweet not found");
 }

    res.status(200)
    .json(new ApiResponse(200,{deleteTweet},"Tweet Deleted Successfully"))


})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}