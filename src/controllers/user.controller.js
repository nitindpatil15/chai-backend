import { asynchandler } from "../utils/asynchandler.js";
import { ApiError } from "../utils/ApiError.js";
import user from "../models/User.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponce } from "../utils/ApiResponse.js";
import bcrypt from "bcrypt";

const generateAccessAndRefreshToken = async (userId) => {
  try {
    const UserToken = await user.findById(userId);
    const accessToken = UserToken.generateAccessToken();
    const refreshToken = UserToken.generateRefreshToken();
    console.log("generated accessToken: ", accessToken);
    console.log("generated refreshToken: ", refreshToken);

    UserToken.refreshToken = refreshToken;
    await UserToken.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(500, "Something went wrong  while generating tokens");
  }
};

const registerUser = asynchandler(async (req, res) => {
  const { fullName, email, username, password } = req.body;
  console.log("Email: ", email);

  // for checking empty field
  if (
    [fullName, email, username, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All Fields are Required");
  }

  // checking user isExists or not
  const existedUser = await user.findOne({
    $or: [{ email }, { username }],
  });
  if (existedUser) {
    throw new ApiError(409, "Username or Email already exists.");
  }

  // Checking for Avatar and coverImage
  // const avatarLocalpath = req.files?.avatar?.[0]?.path;
  // const coverImageLocalpath = req.files?.coverImage?.[0]?.path;

  let avatarLocalpath;
  if (
    req.files &&
    Array.isArray(req.files.avatar) &&
    req.files.avatar.length > 0
  ) {
    avatarLocalpath = req.files.avatar[0].path;
  }

  // if (!avatarLocalpath) {
  //   throw new ApiError(400, "Avatar is Required");
  // }

  let coverImageLocalpath;
  if (
    req.files &&
    Array.isArray(req.files.avatar) &&
    req.files.avatar.length > 0
  ) {
    coverImageLocalpath = req.files.coverImage[0].path;
  }

  // uploading Files on Cloudinary
  const avatar = await uploadOnCloudinary(avatarLocalpath);
  const coverImage = await uploadOnCloudinary(coverImageLocalpath);

  // if (!avatar) {
  //   throw new ApiError(500, "Failed to Upload Image On Server");
  // }

  // User object
  const User = await user.create({
    fullName,
    avatar: avatar?.url || "",
    coverImage: coverImage?.url || "",
    password,
    username,
    email,
  });

  // Removing password and refreshToken from object
  const createdUser = await user
    .find(user._id)
    .select("-password -refreshtoken");

  // Checking User Creation
  if (!createdUser) {
    throw new ApiError(500, "Somthing went wrong while creating the Account");
  }

  // sending Response to User
  return res
    .status(201)
    .json(new ApiResponce(200, createdUser, "User Register Successfully"));
});

const loginUser = asynchandler(async (req, res) => {
  // req.body -> data
  // username or email
  // find the user
  // password check
  // access and refresh token
  // send cookies
  const { email, username, password } = req.body;
  // console.log(req.body);
  // if (!(username || email)) {
  if (!username && !email) {
    throw new ApiError(400, "Username and Email is required");
  }

  const UserDetail = await user.findOne({
    $or: [{ username }, { email }],
  });
  // console.log(UserDetail);
  if (!UserDetail) {
    throw new ApiError(403, "Invalid Credentials");
  }

  // Password validating
  // const isPasswordValid = await UserDetail.isPasswordCorrect(password,UserDetail.password)

  // if (!isPasswordValid) {
  //   throw new ApiError(403, "Invalid Password");
  // }
  const passwordCompare = await bcrypt.compare(password, UserDetail.password);
  if (!passwordCompare) {
    success = false;
    return res
      .status(400)
      .json({ success, error: "Please try to login with correct credentials" });
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
    UserDetail._id
  );
  const loggedUser = await user
    .findById(UserDetail._id)
    .select("-password -refreshToken");

  const option = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, option)
    .cookie("refreshToken", refreshToken, option)
    .json(
      new ApiResponce(
        200,
        {
          UserDetail: loggedUser,
          accessToken: accessToken,
          refreshToken: refreshToken,
        },
        "User Logged Successfully"
      )
    );
});

const logoutUser = asynchandler(async (req, res) => {
  try {
    await user.findByIdAndUpdate(
      req.user._id,
      {
        $set: {
          refreshToken: undefined,
        },
      },
      {
        new: true,
      }
    );

    const options = {
      httpOnly: true,
      secure: true,
    };

    return res
      .status(200)
      .clearCookie("accessToken", options)
      .clearCookie("refreshToken", options)
      .json(200, {}, console.log("User Logged Out Successfully"));
  } catch (error) {
    throw new ApiError(500, "Internal Server Error");
  }
});

const refreshAccessToken = async (req, res) => {
  try {
    const incomingAccessToken =
      req.cookies.refreshToken || req.body.refreshToken;

    if (!incomingAccessToken) {
      throw new ApiError(401, "Invalid Token");
    }

    const decodedToken = jwt.verify(
      incomingAccessToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    const User = await user.findById(decodedToken._id);

    if (!User) {
      throw new ApiError(404, "Invalid Refresh Token");
    }

    if (incomingAccessToken !== User?.refreshtoken) {
      throw new ApiError(401, "Refresh Token is Expired or used");
    }

    const option = {
      httpOnly: true,
      secure: true,
    };

    const { accessToken, newRefreshToken } =
      await generateAccessAndRefreshToken(User._id);

    return res
      .status(200)
      .cookie("AccessToken", accessToken, option)
      .cookie("RefreshToken", newRefreshToken, option)
      .json(
        new ApiResponce(
          200,
          { accessToken, newRefreshToken },
          "Access Token refreshed"
          .console.log("Access token has been refreshed")
        )
      );
  } catch (error) {
    throw new ApiError(401, "Session Timeout Please Login Again");
  }
};

export { registerUser, loginUser, logoutUser, refreshAccessToken };
