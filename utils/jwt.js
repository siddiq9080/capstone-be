const sendToken = (user, statusCode, res) => {
  //Creating JWT Token
  const token = user.getJwtToken();

  //setting cookies

  const options = {
    expires: new Date(
      Date.now() + process.env.COOKIE_EXPIRES_TIME * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
    secure: true, // enable it when your development in production
    sameSite: "None", // enable it when your development in production
  };

  res.status(statusCode).cookie("token", token, options).json({
    success: true,
    token,
    user,
  });
};

export default sendToken;
