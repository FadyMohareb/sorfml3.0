const passport = require('passport');
const mongoose = require('mongoose');
const User = require('../models/user');
const ObjectId = mongoose.Types.ObjectId;

const sendJSONresponse = function(res, status, content) {
  res.status(status);
  res.json(content);
};

const register = function(req, res) {
  if (
    !req.body.firstname    ||
    !req.body.lastname     ||
    !req.body.email        ||
    !req.body.organisation ||
    !req.body.password
  ) {
    console.log('Register fields are required.');
    sendJSONresponse(res, 400, {
      message: 'All fields required'
    });
    return;
  }
  User.find({ email: req.body.email }, function(err, docs) {
    if (err) {
      console.log('Error checking email already existing: ' + err);
      sendJSONresponse(res, 404, err);
    } else if (docs.length) {
      console.log('Name already exists');
      sendJSONresponse(res, 528, { message: 'Name already exists' });
    } else {
      let user = new User();
      // Let's set and register the user information!
      user._id                    = new ObjectId();
      user.firstname              = req.body.firstname;
      user.lastname               = req.body.lastname;
      user.email                  = req.body.email;
      user.organisation           = req.body.organisation;
      user.isregulatorydepartment = req.body.isregulatorydepartment;
      user.notification           = [];
      user.setPassword(req.body.password);

      user.save(function(err) {
        let token;
        if (err) {
          console.log('Error user creation: ' + err);
          sendJSONresponse(res, 404, err);
        } else {
          token = user.generateJwt();
          console.log('\n[authentication.ls/register()]: \x1b[32mUser created\x1b[39m:');
          console.log(user);
          console.log('\n');
          sendJSONresponse(res, 200, {
            token: token
          });
        }
      });
    }
  });
};

const login = function(req, res) {
  if (!req.body.email || !req.body.password) {
    console.log('Login fields are required.');
    sendJSONresponse(res, 400, {
      message: 'All fields required'
    });
    return;
  }

  passport.authenticate('local', function(err, user, info) {
    let token;

    // If Passport throws/catches an error
    if (err) {
      console.log('Error authentication with passport: ' + err);
      sendJSONresponse(res, 404, err);
      return;
    }

    // If a user is found
    if (user) {
      console.log('Login success, user found.');
      token = user.generateJwt();
      sendJSONresponse(res, 200, {
        token: token
      });
    } else {
      // If user is not found
      console.log('Login fail, user not found:' + info);
      sendJSONresponse(res, 401, info);
    }
  })(req, res);
};

module.exports = {
  login,
  register
};
