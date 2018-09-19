var mongoose = require("mongoose");

var MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost/mongoHeadlines";

// Set mongoose to leverage built in JavaScript ES6 Promises
// Connect to the Mongo DB
mongoose.Promise = Promise;
mongoose.connect(MONGODB_URI);

// mLab database
mongoose.connect("mongodb://heroku_c577r8ff:iq2foj6tq3d74abph51sr7k4ea@ds163402.mlab.com:63402/heroku_c577r8ff", function(err) {
	if(err) throw err;
	console.log('database connected');
});