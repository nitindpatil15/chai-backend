import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.model.js";
import User from "../models/User.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponce } from "../utils/ApiResponse.js";
import { asynchandler } from "../utils/asynchandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

const getAllVideos = asynchandler(async (req, res) => {
  const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;
  //TODO: get all videos based on query, sort, pagination
});

const publishAVideo = asynchandler(async (req, res) => {
  // try {
    const { title, description } = req.body;

    if ([title, description].some((field) => field?.trim() === "")) {
      throw new ApiError(400, "All Fields are Required");
    }

    // TODO: get video, upload to cloudinary, create video
    let videoLocalpath;
    if (
      req.files &&
      Array.isArray(req.files.videodoc) &&
      req.files.videodoc.length > 0
    ) {
      videoLocalpath = req.files.videodoc[0].path;
    }

    if (!videoLocalpath) {
      throw new ApiError(400, "videoLocalpaths is Required");
    }
    let thumbnailLocalpath;
    if (
      req.files &&
      Array.isArray(req.files.thumbnail) &&
      req.files.thumbnail.length > 0
    ) {
      thumbnailLocalpath = req.files.thumbnail[0].path;
    }

    if (!thumbnailLocalpath) {
      throw new ApiError(400, "thumbnailLocalpath is Required");
    }

    const video = await uploadOnCloudinary(videoLocalpath);
    const thumbnail = await uploadOnCloudinary(thumbnailLocalpath);

    if (!video) {
      throw new ApiError("Failed to Upload Video");
    }
    if (!thumbnail) {
      throw new ApiError("Failed to Upload Video");
    }

    const createVideo = await Video.create({
      videodoc: video?.url,
      thumbnail: thumbnail?.url,
      title,
      description,
      duration: video?.duration,
    });

    createVideo.owner = req.user?._id;
    createVideo.save();

    console.log(createVideo);

    return res
      .status(200)
      .json(new ApiResponce(200, createVideo, "Video Uploaded Successfully"));
  // } catch (error) {
    // throw new ApiError("something goes wrong ! try again after sometime");
  // }
});

const getVideoById = asynchandler(async (req, res) => {
  const { _id } = req.params;
  //TODO: change field req position

  const videoById = await Video.findById(_id);

  if (!videoById) {
    throw new ApiError("Error while fetching video");
  }

  return res
    .status(200)
    .json(new ApiResponce(200, videoById, "Video fetched by videoId"));
});

const updateVideo = asynchandler(async (req, res) => {
  const { _id } = req.params;
  const { title, description } = req.body;

  if (!_id) {
    throw new ApiError("Id is required");
  }
  if (!title && !description) {
    throw new ApiError("Title and Description are required");
  }

  const thumbnailpath = req.files?.path;
  if (!thumbnailpath) {
    throw new ApiError("Thumbnail is required");
  }

  const thumbnail = uploadOnCloudinary(thumbnailpath);
  if (!thumbnail) {
    throw new ApiError("Thumbnail is required");
  }

  const videoUpdate = await Video.findByIdAndUpdate(
    _id,
    {
      title,
      description,
      thumbnail: thumbnail?.path,
    },
    {
      new: true,
    }
  );

  if (!videoUpdate) {
    throw new ApiError("Server Error try later!");
  }

  return res
    .status(200)
    .json(new ApiResponce(200, {}, "Video Details updated successfully!"));
});

const deleteVideo = asynchandler(async (req, res) => {
  const { _id } = req.params;

  if (!_id) {
    throw new ApiError("Id is required");
  }

  const removevideo = await Video.findByIdAndDelete(_id);

  if(!removevideo){
    throw new ApiError("Invalid Id please check it or try again!!")
  }

  return removevideo.status(200)
  .json(new ApiResponce(200,removevideo,"Video Deleted Successfully!!"))
  
});

const togglePublishStatus = asynchandler(async (req, res) => {
  const { _id } = req.params;

  if(!_id){
    throw new ApiError("Select proper video")
  }

  const statustoggle = await Video.findById(_id)

  if(!statustoggle){
    throw new ApiError("Select proper Id")
  }

  statustoggle.isPublished = !statustoggle.isPublished;
  statustoggle.save();

  return res.status(200)
  .json(new ApiResponce(200,statustoggle,"Updated"))
});

export {
  getAllVideos,
  publishAVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
};
