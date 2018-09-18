let mongoose = require('mongoose');

// Save a Reference to the Schema Constructor
let Schema = mongoose.Schema;

// Create a New Schema Constructor for News Article
let ArticleSchema = new Schema({
    headline: {
        type: String,
        required: true
        },

    summary: {
        type: String,
        required: true
        },

    url: {
        type: String,
        required: true
        },

    imageURL: {
        type: String,
        required: true
        },

    slug: {
        type: String
        },

    // `comments` is an object that stores a NoteID
    // The ref property links the ObjectId to the Note model
    // This allows to populate the Article with an associated Comment
    note: [{
        type: Schema.Types.ObjectId,
        ref: "Note"
        }]

}); // End of New Schema


// This creates the model from the above schema, using mongoose's model method
let Article = mongoose.model("Article", ArticleSchema);

module.exports = Article;