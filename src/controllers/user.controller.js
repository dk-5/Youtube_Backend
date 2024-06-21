import {asyncHandler} from "../utils/asyncHandler.js"
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.model.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {uploadoncloudinary} from "../utils/cloudinary.js"

const registerUser=asyncHandler(async (req,res)=>{

    const {fullname,email,username,password}=req.body
    // console.log("email:",email)
    if([fullname,email,username,password].some((field)=>field?.trim()===''))
        {
         throw new ApiError(400,"Empty field")
        }
    const exiteduser= await User.findOne({
        $or:[{username},{email}]
    })

    if(exiteduser)
        {
            throw new ApiError(404,"User Already exits")
        }
        const avatarLocalPath=req.files?.avatar[0]?.path;
        // const coverImageLocalPath=req.files?.coverImage[0]?.path;
        let coverImageLocalPath;
        if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length>0)
            {
                coverImageLocalPath=req.files.coverImage[0].path
            }

        if(!avatarLocalPath)
            {
                throw new ApiError(401,"Avatar Image is required ")
            }
        const avatar = await uploadoncloudinary(avatarLocalPath)
       const coverImage = await uploadoncloudinary(coverImageLocalPath)
        if(!avatar)
            {
                throw new ApiError(401,"Avatar Image is required ")
            }    
       
       const user= await User.create({
            fullname,
            avatar:avatar.url,
            coverImage:coverImage?.url || "",
            email,
            password,
            username:username.toLowerCase()
        })
        const createdUser=await User.findById(user._id).select("-password -refreshToken")
        if(!createdUser)
            {
                throw new ApiError(500,"Something went wrong while registering")
            } 

        return res.status(201).json(
            new ApiResponse(200,"User Registered successfully",createdUser)
        )    
})

export {registerUser}