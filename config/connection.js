var mongoose = require("mongoose");


// mLab database
mongoose.connect("mongodb://heroku_gfp09cns:tvand5308uc4cmga0memvpuaqi@ds255797.mlab.com:55797/heroku_gfp09cns", function(err) {
	if(err) throw err;
	console.log('database connected');
});