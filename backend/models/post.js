const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const postSchema = new Schema(
  {
    title: {
      type: String,
      required: true
    },
    imageUrl: {
      type: String,
      required: true
    },
    content: {
      type: String,
      required: true
    },
    creator: {
      type: Schema.Types.ObjectId,
      ref: "User", 
      required: true
    }
  },
  { timestamps: true } // The { timestamps: true } option in the schema automatically adds createdAt and updatedAt fields to the schema, which store the creation and last update timestamps of each document.
);

module.exports = mongoose.model('Post', postSchema);
