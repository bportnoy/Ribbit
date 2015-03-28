// After user login, send user to main page
var User = require('./db-user.js');
var Question = require('./db-question.js');
var util = require('./utility.js');
var Firebase = require('firebase');
var _ = require('underscore');

var sessions = {};


exports.loginUser = function(req, res){
  // console.log(req.body);
  var username = req.body.username;
  var password = req.body.password;

  User.findOne( {username: username})
    .exec(function(err, user){
      if (!user){
        console.log('user not found');
        res.send('0');
      } else {
        var savedPassword = user.password;
        User.comparePassword(password, savedPassword, function(err, match){
          if(match){
            // console.log('user found and matched');
            util.createSession(req, res, user);
            res.send('2');
          } else {
            // console.log('user found but not matched');
            res.send('0');
          }
        });
      }
    });
};

// First time user signup
exports.signupUser = function(req, res){
  var username = req.body.username;
  var password = req.body.password;

  User.findOne( {username: username})
    .exec(function(err, user){
      if (!user){
        var newUser = new User({
          username: username,
          password: password
        });
        newUser.save(function(err, newUser){
          if (err){
            res.send('0');
          }
          util.createSession(req, res, newUser);
        });
      } else {
        console.log("Account already exists");
        res.send('0');
      }
    });
} ;

// When user logout
exports.logoutUser = function(req, res){
  req.session.destroy(function(){
    res.redirect('/');
  });
};

// A function that 1.) checks if the room exists 2.) returns the room's
// information in the case that it exists. Otherwise sends '0'.
exports.checkPresenter = function(req, res, rooms) {
  var roomName = req.body.roomname;
  var userName = req.session.passport.user.username;
  console.log('inside the checkPresenter function, about to log req.session: ', req.session);

  for (var room in rooms) {
    if (room === roomName) {
      res.send({roomname: room, presenter: rooms[room].presenter, username: userName});
    }
  }
  res.send('0');
};

// If the room is available for creation, return 1
// If the room is already in the list, return 0
exports.checkRoom = function(req, res, rooms){
  if (req.session.passport.user === undefined) {
    res.send(401);
    return;
  }
  
  var roomName = req.body.roomname;
  var lecturerName = req.session.passport.user.username;

  for (var room in rooms){
    if (room === roomName){
      res.send('0');
      return rooms;
    }
  }
  rooms[roomName] = {
    presenter: lecturerName,
    audience : []
  };
  res.send({rooms: rooms});

  //start logging the room
  sessions[roomName] = {};
  sessions[roomName].interval = logResults(roomName);

  return rooms[roomName];
};


var logResults = function(roomName){
  sessions[roomName].results = [];
  var roomRef = new Firebase('https://popping-inferno-6077.firebaseio.com/').child(roomName);
  return setInterval(function(){logSecond(roomRef, sessions[roomName].results);}, 1000);
};

var thumbMap = {
  0: "Rockin'",
  1: "Thumbs Up",
  2: "Thumbs Sideways",
  3: "Thumbs Down",
  4: "I'm Bored"
};

var logSecond = function(roomRef, results){
  var result = {
    time: Date.now(),
    "Rockin'": 0,
    "Thumbs Up": 0,
    "Thumbs Sideways": 0,
    "Thumbs Down": 0,
    "I'm Bored": 0
  };

  roomRef.once("value", function(data){
    _.each(data.val(), function(user){
      if (user.name){
        var thumb = user.thumb;
        var mapped = thumbMap[thumb];
        result[mapped]++;
      }
    });
    results.push(result);
    console.log(results);
  });
};

exports.endSession = function(req, res){
  var session = sessions[req.body.roomName];
  clearInterval(session.interval);
  console.log('session.results');
  console.log(session.results);
  res.send(200, {results: session.results});
};

// If the room is available for access, return the room object
// If the room is already in the list, return 0
exports.accessRoom = function(req, res, rooms, inputRoom){
  // Get user 
  var studentName = req.body.name;

  // if room exists
  for (var key in rooms){
    if (key === inputRoom){
      // Add student to the room
      rooms[inputRoom][audience].push(studentName);
      res.send(rooms[inputRoom]); //send back inputRoom 
      return rooms;
    }
  }
  
  res.send('0');
  return rooms;
};

exports.saveQuestion = function(req, res) {
  var question = req.body.question;
  var username = req.body.username;
  var roomname = req.body.roomname;

  new Question({
    question: question,
    username: username,
    roomname: roomname
  }).save(function(err, question) {
    if (err) {
      res.send(400, 'There was a problem. Please resubmit your question.');
    } else {
      res.send(201, question);
    }
  });
};

exports.getQuestions = function(req, res) {
  console.log('req.query.roomname:', req.query.roomname);
  var roomname = req.query.roomname;

  Question.find()
    .where('roomname').equals(roomname)
    .exec(function(err, questions) {
      res.status(200);
      res.json(questions);
    });
};
