const asyncHandler = (requestHandler) => {
    return (req, res, next) => {
        return Promise.resolve(requestHandler(req, res, next)).catch(next);
    };
};

export { asyncHandler };

// const asyncHandler = (fn) =>{()=>{}} HIGh Order funciton we can pass function as parameter and can add function inside fun



// TRY catch method ===>

// const asyncHandler = (fn)=> async (req,res,next) => {
//     try {
//         await fn(req,res,next)
        
//     } catch (error) {
//         res.status(err.code || 500).json({
//             success:false,
//             message: err.message
//         })
//     }
// }