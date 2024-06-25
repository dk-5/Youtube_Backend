import {asyncHandler} from "../utils/asyncHandler.js"
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.model.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {uploadoncloudinary} from "../utils/cloudinary.js"

const generateAccessandRefreshToken= async (userId)=>

    {
        try 
        {
            const user=await User.findById(userId)
            const accessToken=user.generateAccessToken()
            const refreshToken=user.generateRefreshToken()
            user.refreshToken=refreshToken
            await user.save({validateBeforeSave:false})
    
            return {accessToken,refreshToken}
        }
        catch(error)
        {
            throw new ApiError(500,"Something went wrong")
        }
        

    }
const registerUser=asyncHandler(async (req,res)=>{
// get user details from frontend
    // validation - not empty
    // check if user already exists: username, email
    // check for images, check for avatar
    // upload them to cloudinary, avatar
    // create user object - create entry in db
    // remove password and refresh token field from response
    // check for user creation
    // return res
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


const loginUser=asyncHandler(async(req,res)=>{
     // req body -> data
    // username or email
    //find the user
    //password check
    //access and referesh token
    //send cookie
   
     const {email,username,password}=req.body

     if(!username && !email)
        {
            throw new ApiError(404,"User does not exist")
        }

     const user=await User.findOne({
        $or:[{username},{email}]
     })   
     if(!user)
        {
            throw new ApiError(404,"User does not exist")
        }
     const isPasswordvalid=await user.isPasswordCorrect(password)

     if(!isPasswordvalid)
        {
            throw new ApiError(401,"Invalid User credentials")
        }

    const {accessToken,refreshToken}=await generateAccessandRefreshToken(user._id)
    const loggedInUser=await User.findById(user._id).select("-password -refreshToken")
    const options={
        httpOnly:true,
        secure:true
    }
    
    return res
    .status(200)
    .cookie("accessToken",accessToken,options)
    .cookie("refreshToken",refreshToken,options)
    .json((new ApiResponse(200,"User logged in successfully",{
        user:loggedInUser,accessToken,refreshToken
    })))

        
})
const logoutUser=asyncHandler(async(req,res)=>{
    User.findByIdAndUpdate(req.user._id,{
        $unset: {
            refreshToken: 1 // this removes the field from document
        }},{
          new:true
      })

      const options={
        httpOnly:true,
        secure:true
    }
  
    return res
    .status(200)
    .clearCookie("accessToken",options)
    .clearCookie("refreshToken",options)
    .json(new ApiResponse(202,"User loggedout successfully",{}))

  })
  
const refreshAccessToken=asyncHandler(async(req,res)=>
{
    const incomingRefreshToken=req.cookies.refreshToken || req.body.refreshToken

    try {
        if(!incomingRefreshToken)
            {
                throw new ApiError(401,"unauthorised request")
            }
        
        const decodedToken=jwt.verify(incomingRefreshToken,process.env.REFRESH_TOKEN_SECRET)
        const user=await User.findById(decodedToken?._id)
        if(!user)
            {
                throw new ApiError(401,"Invalid refresh token")
            }
            if(incomingRefreshToken!==user?.refreshToken)
                {
                    throw new ApiError(401,"Refresh token expired")
                }
            const options={
                httpOnly:true,
                secure:true
            }    
           const {accessToken,newRefreshToken}=await generateAccessandRefreshToken(user._id)
    
           return res
           .status(200)
           .cookie("accessToken",accessToken,options)
           .cookie("refreshToken",newRefreshToken,options)
           .json(
            new ApiResponse( 200, 
                {accessToken, refreshToken: newRefreshToken},
                "Access token refreshed")
           )
    } catch (error) {
        throw new ApiError(401,error?.message || "invalid refresh token")
    }
})


export {registerUser,loginUser,logoutUser,refreshAccessToken}