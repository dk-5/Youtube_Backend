import dotenv from "dotenv";
import connectDB from "./db/index.js";
import { app } from "./app.js";

dotenv.config({
    path:"./env"
});
connectDB()
.then(()=>{
    app.listen(process.env.PORT,()=>{
        console.log(`Server is running on port ${process.env.PORT}`);
})})
.catch((error)=>{
    console.error(error);
    process.exit(1);
});
















// const app=express();
// (async ()=> {
//     try {
//        await mongoose.connect(`${process.env.MONGO_URI}/${DB_NAME}`)
//         app.on("error",(error)=>{
//             console.error(error);
//             throw error
//         })
//         app.listen(`${process.env.PORT}`,()=>{
//             console.log(`Server is running on port ${process.env.PORT}`)
//     }
// }
//     catch (error) {
//         console.error(error)
//         throw error
//     }
// })()