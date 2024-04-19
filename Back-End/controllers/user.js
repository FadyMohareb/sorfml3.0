const mongoose = require("mongoose");
const User = require("../models/user");

const sendJSONresponse = function(res, status, content) {
  res.status(status);
  res.json(content);
};

const profileRead = function(req, res) {
  if (!req.payload._id) {
    console.log("Unauthorized profile.");
    sendJSONresponse(res, 401, {
      message: "UnauthorizedError: private profile"
    });
  } else {
    User.findById(
      req.payload._id,
      "firstname lastname email organisation role"
    ).exec(function(err, user) {
      if (!user) {
        console.log("User id not found.");
        sendJSONresponse(res, 404, {
          message: "userid not found"
        });
        return;
      } else if (err) {
        console.log("Error to read profile from payload: " + err);
        sendJSONresponse(res, 404, err);
        return;
      }
      console.log("Profile read success.");
      sendJSONresponse(res, 200, user);
    });
  }
};

const findAllUsers = function(req, res) {
  User.find().exec((err, user) => {
    if (err) {
      console.log("Error findind all users: " + err);
      sendJSONresponse(res, 404, err);
      return;
    } else {
      console.log("All users found.");
      sendJSONresponse(res, 200, user);
    }
  });
};

const updateProfile = function(req, res) {
  if (
    !req.body.firstname ||
    !req.body.lastname ||
    !req.body.email ||
    !req.body.organisation ||
    !req.body.previousEmail
  ) {
    console.log("All fields are required.");
    sendJSONresponse(res, 400, {
      message: "All fields required"
    });
    return;
  }

  // If the email is the same, don't need the check if email already exists
  if (req.body.previousEmail == req.body.email) {
    updateUser(req.body, res);
  } else {
    // If not check it
    User.find({ email: req.body.email }, function(err, docs) {
      if (err) {
        console.log("Error checking email already existing: " + err);
        sendJSONresponse(res, 404, err);
      } else if (docs.length) {
        console.log("Email already exists");
        sendJSONresponse(res, 528, { message: "Email already exists" });
      } else {
        updateUser(req.body, res);
      }
    });
  }
};

const updatePassword = function(req, res) {
  if (!req.body.password || !req.body.currentUserId) {
    console.log("All fields are required.");
    sendJSONresponse(res, 400, {
      message: "All fields required"
    });
    return;
  }

  let user = new User();
  user.setPassword(req.body.password);

  User.findByIdAndUpdate(
    req.body.currentUserId,
    {
      $set: {
        salt: user.salt,
        hash: user.hash
      }
    },
    { new: true },
    function(err, usr) {
      if (err) {
        console.log("Error password update: " + err);
        sendJSONresponse(res, 404, err);
      } else {
        console.log("Password Updated.");
        sendJSONresponse(res, 200, usr);
      }
    }
  );
};

const deleteAccount = function(req, res) {
  if (!req.params && !req.params.currentUserId) {
    console.log("No parameter to delete the account.");
    sendJSONresponse(res, 404, {
      message: "No parameters to delete the account."
    });
    return;
  } else {
    User.findByIdAndRemove(req.params.currentUserId).exec((err, usr) => {
      if (err) {
        console.log("Error to delete the account: " + err);
        sendJSONresponse(res, 404, err);
        return;
      }
      console.log("Account deleted success.");
      sendJSONresponse(res, 200, usr);
    });
  }
};

module.exports = {
  profileRead,
  findAllUsers,
  updateProfile,
  updatePassword,
  deleteAccount
};

const updateUser = function(user, res) {
  User.findByIdAndUpdate(
    user._id,
    {
      $set: {
        firstname: user.firstname,
        lastname: user.lastname,
        organisation: user.organisation,
        email: user.email
      }
    },
    { new: true },
    function(err, usr) {
      if (err) {
        console.log("Error user details update: " + err);
        sendJSONresponse(res, 404, err);
      } else {
        console.log("User details Updated.");
        sendJSONresponse(res, 200, usr);
      }
    }
  );
};
