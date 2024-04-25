const asyncHandler = (requestHandler) => {(req, res, next) =>{
    return Promise.resolve(requestHandler(req, res, next)).catch(next);
}
}

export {asyncHandler}

// const asyncHandler=(fn)=>(req,res,next)=>{
//     try {
//     await fn(req,res,next)
//     }
//     catch(error) {
//         res.status(error.code || 500).json({
//             success:false,
//             message:error.message}
//     )}
   
// }

