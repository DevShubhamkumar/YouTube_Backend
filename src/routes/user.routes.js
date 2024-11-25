import { Router } from "express";
import { loginUser, logoutUser, refreshAccessToken, registerUser,ChangePassword,getcurrentUser, AccountDetialUpdate,UpdateUserAvatar,updateCoverImage,getUserChannelProfile,getWatchHistory} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
// import { verifyJWT } from "../middlewares/auth.middleware.js";
import {verifyJWT} from '../middlewares/auth.middleware.js'
 
const router = Router();

router.route("/register").post(
    upload.fields([ // upload.single uplaod single image but upload.field gives a array for serpate image storing array give on to store all nad it is middleware
        {
            name : "avatar",
            maxCount:1
        },
        {
            name : "coverImage",
            maxCount:1
        }
    ]) ,
     registerUser) 

router.route("/login").post(loginUser)


// secured routes
 // verifyjwt is logut next pass value to logout do your work
router.route("/logout").post(verifyJWT, logoutUser)
router.route("/refresh-token").post(refreshAccessToken)
router.route("/change-password").post(verifyJWT,ChangePassword)
router.route("/current-user").get(verifyJWT,getcurrentUser)
router.route("/update-account").patch(verifyJWT,AccountDetialUpdate)
router.route("/avatar").patch(verifyJWT,upload.single("avatar"),UpdateUserAvatar)
router.route("/coverImage").patch(verifyJWT,upload.single("coverImage"),updateCoverImage)
router.route("/c/:username").get(verifyJWT,getUserChannelProfile)
router.route("/history").get(verifyJWT,getWatchHistory)
export default router 
