import express from "express";
import catchAsyncError from "../middleware/catchAsyncError.js";
import User from "../Models/userModel.js";
import sendToken from "../utils/jwt.js";
import CustomErrorHandler from "../utils/customError.js";
import {
  authorizeRoles,
  isAuthenticatedUser,
} from "../middleware/authenticate.js";
import jwtToken from "../utils/jwt_token.js";
import { mailobj, transporter } from "../utils/mailSend.js";

const userRouter = express.Router();

//POST - Register a new user

userRouter.post(
  "/register",
  catchAsyncError(async (req, res, next) => {
    const { name, email, phone, password } = req.body;

    const user = await User.create({
      name,
      email,
      phone,
      password,
    });

    sendToken(user, 201, res);
  })
);

//POST - LOGIN a existing user

userRouter.post(
  "/login",
  catchAsyncError(async (req, res, next) => {
    const { email, password } = req.body;

    if (!email || !password) {
      return next(new CustomErrorHandler("Please enter email & password", 401));
    }

    // finding the user database

    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      return next(new CustomErrorHandler("Invalid email or password", 401));
    }

    if (!(await user.isValidPassword(password))) {
      return next(new CustomErrorHandler("Invalid email or Password", 401));
    }

    sendToken(user, 201, res);
  })
);

// POST - Change User Password

userRouter.post(
  "/change-password",
  isAuthenticatedUser,
  catchAsyncError(async (req, res, next) => {
    const user = await User.findById(req.user.id).select("+password");

    //check old password

    if (!(await user.isValidPassword(req.body.oldPassword))) {
      return next(new CustomErrorHandler("Old password is Incorrect", 401));
    }
    user.password = req.body.password;

    await user.save();

    res.status(200).json({ success: true });
  })
);

// POST - logoutUser

userRouter.get(
  "/logout",
  catchAsyncError(async (req, res, next) => {
    res
      .cookie("token", null, {
        expires: new Date(Date.now()),
        httpOnly: true,
      })
      .status(200)
      .json({ success: true, message: "LoggedOut" });
  })
);

// GET - Get user profile

userRouter.get(
  "/myProfile",
  isAuthenticatedUser,
  catchAsyncError(async (req, res, next) => {
    const user = await User.findById(req.user.id);

    res.status(200).json({ success: true, user });
  })
);

// PUT -Update User Profile

// userRouter.put(
//   "/updateProfile",
//   isAuthenticatedUser,
//   catchAsyncError(async (req, res, next) => {
//     let newUserData = {
//       name: req.body.name,
//       email: req.body.email,
//     };
//     let avatar;
//     let BASE_URL = "http://localhost:5100";
//     if (req.file) {
//       avatar = `${BASE_URL}/uploads/user/${req.file.originalname}`;
//       newUserData = { ...newUserData, avatar };
//     }

//     const user = await User.findByIdAndUpdate(req.user.id, newUserData, {
//       new: true,
//       runValidators: true,
//     });

//     res.status(200).json({ success: true, user });
//   })
// );

userRouter.put(
  "/updateProfile",
  isAuthenticatedUser,
  authorizeRoles("admin"),
  catchAsyncError(async (req, res, next) => {
    const { name, email } = req.body;

    // Update user profile logic
    const user = await User.findByIdAndUpdate(
      req.user.id, // Assuming you are using JWT authentication
      { name, email },
      { new: true }
    );

    sendToken(user, 200, res); // Send back updated user info and token
  })
);

//post call to verify the email to change the password

userRouter.post("/verify-email", async (req, res) => {
  const { email } = req.body;
  const emailfind = await User.findOne({ email: email });
  if (emailfind) {
    const tempdata = uuidV4();
    await User.updateOne(
      { email: emailfind.email },
      { $set: { passcode_change: tempdata } }
    );
    const currentuser = await User.findOne({ email: emailfind.email });
    const token = jwtToken({ passcode: currentuser.passcode_change[0] }, "1d");
    await transporter.sendMail({
      ...mailobj,
      to: currentuser.email,
      subject: "Password Recovery",
      text: `Click on the link below to reset your password: ${process.env.FE_URL}/reset-password?token=${token}`,
    });
    res.json({ msg: "Password recovery mail sent succesfully" });
  } else {
    res.status(404).json({ msg: "User not found" });
  }
});

//Post call to reset the password and save the new password

userRouter.post("/reset-password", async (req, res) => {
  const { token } = req.query;
  const password = req.body;
  jwt.verify(token, process.env.JWT_KEY, async (err, data) => {
    const user = await User.findOne({ passcode_change: data.passcode });
    if (user) {
      if (err) {
        res.status(400).json({ msg: "Sorry Link is expired" });
      } else {
        bcrypt.hash(password.password, 10, async (err, hashdata) => {
          if (err) {
            res.status(500).json({ msg: "Internal server error" });
          } else {
            await User.updateOne(
              { passcode_change: data.passcode },
              { $set: { password: hashdata } }
            );
            await User.updateOne(
              { passcode_change: data.passcode },
              { $set: { passcode_change: [] } }
            );
            res.json({ msg: "Password changed succesfully" });
          }
        });
      }
    } else {
      res.status(400).json({ msg: "Sorry link already used" });
    }
  });
});

//ADMIN ROUTES

//ADMIN - GET - GET all users

userRouter.get(
  "/admin/getAllUsers",
  isAuthenticatedUser,
  authorizeRoles("admin"),
  catchAsyncError(async (req, res, next) => {
    const users = await User.find();

    const count = users.length;
    res.status(200).json({ success: true, count, users });
  })
);

// ADMIN - GET a Specific user

userRouter.get(
  "/admin/user/:id",
  isAuthenticatedUser,
  authorizeRoles("admin"),
  catchAsyncError(async (req, res, next) => {
    const user = await User.findById(req.params.id);

    if (!user) {
      return next(
        new CustomErrorHandler(
          `User not found with this id ${req.params.id}`,
          400
        )
      );
    }

    res.status(200).json({ success: true, user });
  })
);

// ADMIN - Update a user

userRouter.put(
  "/admin/userUpdate/:id",
  isAuthenticatedUser,
  authorizeRoles("admin"),
  catchAsyncError(async (req, res, next) => {
    const newUserData = {
      name: req.body.name,
      email: req.body.email,
      role: req.body.role,
    };

    const existingUser = await User.findById(req.params.id);

    if (!existingUser) {
      return next(
        new CustomErrorHandler(
          `User not found with this id ${req.params.id}`,
          400
        )
      );
    }

    const user = await User.findByIdAndUpdate(req.params.id, newUserData, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({ success: true, user });
  })
);

// ADMIN - DELETE a existing user

userRouter.delete(
  "/admin/userDelete/:id",
  isAuthenticatedUser,
  authorizeRoles("admin"),
  catchAsyncError(async (req, res, next) => {
    const user = await User.findById(req.params.id);

    if (!user) {
      return next(new CustomErrorHandler("User not found", 404));
    }

    await user.deleteOne();
    res
      .status(200)
      .json({ success: true, message: "User deleted successfully" });
  })
);

export default userRouter;
