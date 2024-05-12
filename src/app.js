import express from "express";
import cookieParser from "cookie-parser";
import cors from  "cors";

const app = express()

app.use(cors({
    origin : process.env.CORS_ORIGIN,
    Credential:true
}))
// Config settings In CORS() middleware 
// for setting limits on data 
app.use(express.json({limit:"16kb"}))

// parse incoming requests in url of browser
app.use(express.urlencoded({extended:true , limit:"16kb"}))

// for any kind of static files , public is folder
app.use(express.static("public"))

// Accessing cookies from user browser which can only  be accessed by server side code using the following method
app.use(cookieParser())



// Routes import 
import userRouter from './routes/user.route.js'
import healthcheckRouter from "./routes/healthcheck.routes.js"
import tweetRouter from "./routes/tweet.routes.js"
import subscriptionRouter from "./routes/subscription.routes.js"
import videoRouter from "./routes/video.routes.js"
import commentRouter from "./routes/comment.routes.js"
import likeRouter from "./routes/like.routes.js"
import playlistRouter from "./routes/playlist.routes.js"
import dashboardRouter from "./routes/dashboard.routes.js"

// Router Declaration 
app.use("/api/v1/healthcheck", healthcheckRouter)
app.use("/api/v1/users", userRouter)
app.use("/api/v1/tweets", tweetRouter)
app.use("/api/v1/subscriptions", subscriptionRouter)
app.use("/api/v1/videos", videoRouter)
app.use("/api/v1/comments", commentRouter)
app.use("/api/v1/likes", likeRouter)
app.use("/api/v1/playlist", playlistRouter)
app.use("/api/v1/dashboard", dashboardRouter)

export {app}