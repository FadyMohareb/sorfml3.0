const mongoose = require("mongoose");
const User = require("../models/user");

const sendJSONresponse = function(res, status, content) {
  res.status(status);
  res.json(content);
};

const changeNotification = function(users, experimentid, callback) {
  User.updateMany(
    { _id: users },
    { $push: { notification: { experiment_id: experimentid, seen: false } } },
    (err, usr) => {
      if (err) {
        console.log("Error updating notification: " + err);
        callback(err, null);
      } else {
        console.log("Notification updated.");
        callback(null, usr);
      }
    }
  );
};

const getNotification = function(req, res) {
  if (req.params && req.params.currentUserId) {
    User.find(
      {
        _id: req.params.currentUserId
      },
      "notification"
    )
      .populate({
        path: "notification.experiment_id",
        populate: { path: "author_id" }
      })
      .exec((err, notif) => {
        if (err) {
          console.log("Error finding notifications.");
          sendJSONresponse(res, 404, {
            message: "Error finding notifications"
          });
          return;
        } else {
          console.log("All notifications found.");
          sendJSONresponse(res, 200, notif);
        }
      });
  } else {
    console.log("Error: No current user id in the request.");
    sendJSONresponse(res, 404, {
      message: "No currentUserId in the request"
    });
  }
};

const sendNotification = function(
  author_id,
  experimentId,
  experimentName,
  experimentCreationDate,
  usersList
) {
  User.findById(author_id, "firstname lastname").exec(function(err, usr) {
    if (!usr) {
      console.log("Error: No author found for experiment creation.");
      return;
    } else if (err) {
      console.log("Error to get author during the experiment creation: " + err);
      return;
    } else {
      let notification = {
        author_name: usr.firstname + " " + usr.lastname,
        experimentId: experimentId,
        experimentName: experimentName,
        experimentCreationDate: experimentCreationDate,
        seen: false
      };

      for (user of usersList) {
        if (clientsList[user]) {
          clientSocket = clientsList[user];
          clientSocket.emit("sendNotification", notification);
        }
      }
    }
  });
};

const deleteNotificationFromAuthor = function(users, experimentid, callback) {
  User.updateMany(
    { _id: users },
    { $pull: { notification: { experiment_id: experimentid } } },
    (err, usr) => {
      if (err) {
        console.log("Error updating notification: " + err);
        callback(err, null);
      } else {
        for (user of users) {
          if (clientsList[user]) {
            clientSocket = clientsList[user];
            clientSocket.emit("deleteNotificationFromAuthor", experimentid);
          }
        }
        console.log("Notification updated.");
        callback(null, usr);
      }
    }
  );
};

const deleteNotification = function(req, res) {
  if (req.query) {
    User.update(
      { _id: req.query.currentUserId },
      { $pull: { notification: { experiment_id: req.query.experimentId } } }
    ).exec((err, usr) => {
      if (err) {
        console.log("Error finding notifications to delete one.");
        sendJSONresponse(res, 404, {
          message: "Error finding notifications to delete one"
        });
        return;
      } else {
        console.log("Notification Deleted.");
        sendJSONresponse(res, 200, usr);
      }
    });
  } else {
    console.log("Error: No parameters in the request to delete notification.");
    sendJSONresponse(res, 404, {
      message: "No parameter condition in request to delete notification"
    });
  }
};

const seenNotification = function(req, res) {
  if (req.query) {
    User.findById(req.body.currentUserId, "notification").exec((err, notif) => {
      if (err) {
        console.log("Error finding notifications to change the status.");
        sendJSONresponse(res, 404, {
          message: "Error finding notifications to change the status"
        });
        return;
      } else {
        let updatedNotification = [];
        for (item of notif.notification) {
          item.seen = true;
          updatedNotification.push(item);
        }
        notif.notification = updatedNotification;
        notif.save(function(err) {
          if (err) {
            console.log("Error changing the notification status: " + err);
            return handleError(err);
          }
          console.log("Notifications status changed.");
          sendJSONresponse(res, 200, notif);
        });
      }
    });
  } else {
    console.log("Error: No parameters in the request to change notification.");
    sendJSONresponse(res, 404, {
      message: "No parameter condition in request to change notification"
    });
  }
};

module.exports = {
  changeNotification,
  getNotification,
  sendNotification,
  deleteNotification,
  seenNotification,
  deleteNotificationFromAuthor
};
