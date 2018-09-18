//Requirements 
var express = require('express');
var bodyParser = require('body-parser');
var logger = require('morgan');
var mongoose = require('mongoose');
// Parses our HTML and helps us find elements
var cheerio = require("cheerio");
// Makes HTTP request for HTML page
var request = require("request");

var app = express();

//Middleware (pass everything through the logger first) 
app.use(logger('dev'));
app.use(bodyParser.urlencoded({
    extended: false
}));
app.use(express.static('public')); // (create a public folder and land there)

//Database configuration 
//If deployed, use the deployed database. Otherwise use the local mongoHeadlines database
var MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost/mongoHeadlines";

// Set mongoose to leverage built in JavaScript ES6 Promises
// Connect to the Mongo DB
mongoose.Promise = Promise;
mongoose.connect(MONGODB_URI);


mongoose.connect('mongodb://localhost/mongoosescraper');
var db = mongoose.connection;

db.on('error', function (err) {
    console.log('Mongoose Error: ', err);
});
db.once('open', function () {
    console.log('Mongoose connection successful.');
});

//Require Schemas 
var Note = require('./models/Note.js');
var Article = require('./models/Article.js');

//Routes 
// Set up Handlebar for views
var expressHandlebars = require('express-handlebars');
app.engine('handlebars', expressHandlebars({
    defaultLayout: 'main'
}));
app.set('view engine', 'handlebars');

app.get('/scrape', function(req, res) {

    request('http://www.echojs.com/', function(error, response, html) {

        var $ = cheerio.load(html);

        $('article h2').each(function(i, element) {
            
            var result = {};

            result.title = $(this).children('a').text();
            result.link = $(this).children('a').attr('href');

            var entry = new Article (result);

            entry.save(function(err, doc) {

                if (err) {
                    console.log(err);
                } else {
                    console.log(doc);

                }
            });
        });
    });

    res.send("Scrape Complete");
});


app.get('/articles', function(req, res){

    Article.find({}, function(err, doc){
        if (err){
            console.log(err);
        }else{
            res.json(doc);
        }

    });
});


app.get('/articles/:id', function(req, res){
    Article.findOne({'_id': req.params.id})
    .populate('note')
    .exec(function(err, doc){
        if (err){
            console.log(err);
        }else{
            res.json(doc);
        }
    });
});


app.post('/articles/:id', function(req, res){
    var newNote = new Note(req.body);

    newNote.save(function(err, doc){
        if(err){
            console.log(err);
        }else{
            Article.findOneAndUpdate({'_id': req.params.id}, {'note':doc._id})
            .exec(function(err, doc){
                if (err){
                    console.log(err);
                } else {
                    res.send(doc);
                }

            });

        }
    });
});


app.listen(3000, function() {
    console.log('App running on port 3000!');
});
