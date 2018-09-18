//add imports
let axios = require('axios'); // HTTP Request
let cheerio = require('cheerio'); // Web Scrapper
let mongoose = require('mongoose'); // MongoDB ORM
let db = require("../models"); // Require all models

// Mongoose Configuration 

// Set mongoose to leverage Built in JavaScript ES6 Promises
mongoose.Promise = Promise;
mongoose.connect("mongodb://heroku_n498q09l:nqhsgor6hvbhfudh35mk0npfo0@ds147267.mlab.com:47267/heroku_n498q09l", {
    // Connect to the Mongo DB
    useMongoClient: true
});

let mongooseConnection = mongoose.connection;

mongooseConnection.on('error', console.error.bind(console, 'connection error:'));
mongooseConnection.once('open', function() {
    console.log(`Sucessfully Connected to MongoDB!`);
});

// Export Module Containing Routes. Called from Server.js
module.exports = (app) => {
    
    // Get Requests
    
    // Default Route
    app.get("/", (req, res) => res.render("index"));

    // Scrape Articles Route
    app.get("/api/search", (req, res) => {

        axios.get("https://www.npr.org/sections/news/").then(response => {
            // console.log("Load Response");

            // Then, we load that into cheerio and save it to $ for a shorthand selector
            let $ = cheerio.load(response.data);

            // Initialize Empty Object to Store Cheerio Objects
            let handlebarsObject = {
                data: []
            }; 

        // Use Cheerio to Search for all Article HTML Tags
        $("article").each((i, element) => { 
            //NPR Only Returns Low Res Images to the Web Scrapper. A little String Manipulation is Done to Get High Res Images
            let lowResImageLink = $(element).children('.item-image').children('.imagewrap').children('a').children('img').attr('src');

            if (lowResImageLink) {
                let imageLength = lowResImageLink.length;
                let highResImage = lowResImageLink.substr(0, imageLength - 11) + "800-c100.jpg";

                // Store Scrapped Data into handlebarsObject
                handlebarsObject.data.push({
                    headline: $(element).children('.item-info').children('.title').children('a').text(),
                    summary: $(element).children('.item-info').children('.teaser').children('a').text(),
                    url: $(element).children('.item-info').children('.title').children('a').attr('href'),
                    imageURL: highResImage,
                    slug: $(element).children('.item-info').children('.slug-wrap').children('.slug').children('a').text(),
                    comments: null
            }); 
            } 
        }); 

        // Return Scrapped Data to Handlebars for Rendering
        res.render("index", handlebarsObject);
        });
    });

    // Saved Article Route
    app.get("/api/savedArticles", (req, res) => {
        // Grab every document in the Articles collection
        db.Articles.find({}).then(function(dbArticle) {
            
            // If we were able to successfully find Articles, send them back to the client
            res.json(dbArticle);

        }).catch(function(err) {
            // If an error occurred, send it to the client
            res.json(err);
        });
    });

    // Post Requests 

    // Add Article Route
    app.post("/api/add", (req, res) => {
        // console.log("add path hit");

        let articleObject = req.body;

        // Save the Article to the Database

        // Look for an Existing Article with the Same URL
        db.Articles.findOne({url: articleObject.url}). 
        then(function(response) {

            // Only Create Article if it has not been Created
            if (response === null) {
                db.Articles.create(articleObject).then((response) => console.log(" ")).catch(err => res.json(err));
            }
            
            // If we were able to successfully  save an Article, send a message to the client
            res.send("Article Saved");

        }).catch(function(err) {
            // If an error occurred, send it to the client
            res.json(err);
        });

    });

    // Delete Article Route
    app.post("/api/deleteArticle", (req, res) => {
        // console.log(req.body)

        sessionArticle = req.body;

        // Look for the Article and Remove from DB
        db.Articles.findByIdAndRemove(sessionArticle["_id"]).
        then(response => {
            if (response) {
                res.send("Sucessfully Deleted");
                }
            });
    }); 

    // Delete Comment Route
    app.post("/api/deleteComment", (req, res) => {
        // console.log("delete comment route hit")

        let comment = req.body;

        // Look for the Comment and Remove from DB
        db.Notes.findByIdAndRemove(comment["_id"]).
        then(response => {
            if (response) {
                res.send("Sucessfully Deleted");
                }
        });
    }); 

    // Create Notes Route
    app.post("/api/createNotes", (req, res) => {

        sessionArticle = req.body;
        
        db.Notes.create(sessionArticle.body).then(function(dbNote) {
            // console.log(dbNote);

            // If a Note was created successfully, find one Article with an `_id` equal to `req.params.id`. Update the Article to be associated with the new Note
            // { new: true } tells the query that we want it to return the updated User -- it returns the original by default

            return db.Articles.findOneAndUpdate({

                _id: sessionArticle.articleID.articleID
            }, {
                    $push: {
                        note: dbNote._id
                        }
                });

        }).then(function(dbArticle) {
            // If we were able to successfully update an Article, send it back to the client
            res.json(dbArticle);
            }).catch(function(err) {
                    // If an error occurred, send it to the client
                    res.json(err);
                });
    }); 

    // Route for grabbing a specific Article by id, populate it with it's note
    app.post("/api/populateNote", function(req, res) {
        // Using the id passed in the id parameter, prepare a query that finds the matching one in the db...
        // console.log("ID is "+ req.body.articleID);

        // Associate Notes with the Article ID
        db.Articles.findOne({_id: req.body.articleID}).populate("Note").
        then((response) => {
            // console.log("response is " + response);

            if (response.note.length == 1) {
                db.Notes.findOne({'_id': response.note}).then((comment) => {
                    comment = [comment];
                    console.log("Sending Back One Comment");
                    // Send Comment back to the Client
                    res.json(comment); 
                });

            } else {
                console.log("2")
                db.Notes.find({
                    '_id': {
                        "$in": response.note
                        }
                }).then((comments) => {
                    // console.log("Sending Back Multiple Comments");

                    // Send Comments back to the Client
                    res.json(comments);
                });
            }

            // If we were able to successfully find an Article with the given id, send it back to the client
        }).catch(function(err) {

            // If an error occurred, send it to the client
            res.json(err);
            });
        }); 
} 