import { Router } from "express";
import { loginUser, logoutUser, registerUser } from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

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

 // verifyjwt is logut next pass value to logutsuer do your work
 
router.route("/logout").post(verifyJWT, logoutUser)

export default router 