import jwt from "jsonwebtoken";
import { ApiError } from "../utils/ApiErrors.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";

 // how we getting cokkie acces ? from cookie parser in app.js
export const verifyJWT = asyncHandler( async (req, _,next)=>{ // _ instead of res
try {
    const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer","") // replace with empty stirng bearer token
    
    if(!token){
        throw new ApiError(401,"Unauthorization")
    }
    // verifying token matched or not 
    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
    
    // db querry taking user if decoed token m,atch wiht .id which is passed in jwt secret
    
    const user = await User.findById(decodedToken?._id).select("-password -refreshToken")
    if (!user) {
        throw new ApiError(401, "Invalid Access Token")
        
    }
    
    req.user = user;
    next() // when its work done next work
} catch (error) {
    throw new ApiError(401, error?.message || "invalid access token");
    
}

}) 