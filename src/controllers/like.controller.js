import mongoose, {isValidObjectId} from "mongoose"
import {Like} from "../models/like.model.js"
import {Video} from "../models/Video.model.js"
import {ApiError} from "../utils/ApiError.js"
import { ApiResponce } from "../utils/ApiResponse.js"
import {asynchandler} from "../utils/asynchandler.js"

const toggleVideoLike = asynchandler(async (req, res) => {
  try {
      const {_id} = req.query 
      if(!_id){
          throw new ApiError(401,"Invalid id")
      }
  
      const {userId} = req.user?._id 
      const condition = {likedBy:userId,video:_id}
  
      const like = await Like.findOne(condition)
  
      const isvalidvideo = await Video.findById(_id)
      if(!isvalidvideo){
          throw new ApiError(401,"video not found")
      }
  
      if(!like){
          const newLike = await Like.create({video:_id,likedBy:userId})
          await Video.findByIdAndUpdate(_id,{$inc:{likes:+1}})
  
          return res.status(200)
          .json(new ApiResponce(200,newLike,"Liked a video!"))
      }
      else{
          const removelike = await Like.findOne(condition)
          await Video.findByIdAndUpdate(_id,{$inc:{likes:-1}})
          return res.status(200)
          .json(new ApiResponce(200,removelike,"unliked a video"))
      }
  } catch (error) {
    throw new ApiError(500,"Newtwork problem")
  }

})

const toggleCommentLike = asynchandler(async (req, res) => {
    const {commentId} = req.params
    const {userId} = req.user?._id 
    const condition = {likedBy:userId,tweet:_id}

    const like = await Like.findOne(condition)
    if(!like){
        const newlike = await Like.create({likedBy:userId,tweet:_id})
        await Tweet.findByIdAndUpdate(_id,{$inc:{likes:1}})
        
        return res.status(200)
        .json(new ApiResponce(200,newlike,"Liked a comment!"))
    }
    else{
        const removelike = await Like.findOne(condition)
        await Tweet.findByIdAndUpdate(_id,{$inc:{likes:-1}})

        return res.status(200)
        .json(new ApiResponce(200,removelike,"Unliked a Tweet"))
    }

})

const toggleTweetLike = asynchandler(async (req, res) => {
    const {_id} = req.params

}
)

const getLikedVideos = asynchandler(async (req, res) => {
    
    try {
        const {userId} = req.user?._id
    
        const likedVideos = await Like.find({likedBy:userId})
    
        if(!likedVideos){
            throw new ApiError(401,"No liked videos")
        }
    
        return res.status(200).json(new ApiResponce(200,likedVideos,"Liked Videos are fetched"))
    
    } catch (error) {
        throw new ApiError(500,"something went wrong while fetching liked Videos")
    }})

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}