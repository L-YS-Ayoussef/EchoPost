const { validationResult } = require('express-validator');
const path = require("path");
const fs = require("fs");

const Post = require("../models/post");
const User = require("../models/user");

const io = require("../socket");

exports.getPosts = (req, res, next) => {
  // For Pagination 
  const currentPage = req.query.page || 1;
  const perPage = 2;
  let totalItems;

  Post
    .countDocuments()
    .then(count => {
      totalItems = count;
      return Post.find().populate('creator')
        .sort({createdAt: -1})
        .skip((currentPage - 1) * perPage)
        .limit(perPage);
    })
    .then(posts => {
      res
        .status(200)
        .json({ 
          message: 'Fetched posts successfully.',
          posts, 
          totalItems
        }); // sending the respons in json format that when checking the headers of the response, you will find the key [content-type] automatically set to "application/json" and this data will be used by the UI(frontend)
    })
    .catch(err => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

exports.createPost = (req, res, next) => {
  // Checking for the erros from the validation or if there is no image uploaded 
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error("Validation failed, entered data is incorrect.");
    error.statusCode = 422;
    return next(error);
    // Notes -> 
    // throwing an error is useful in case throwing it inside the try statement that it will be caught by the catch statement 
    // If you do not use a try-catch block in the synchronous parts of the code when throwing an error, such errors will propagate unhandled and may result in the server crashing or not responding correctly.
  }
  if (!req.file) {
    const error = new Error('No image provided.');
    error.statusCode = 422;
    return next(error);
  }

  // when testing this post request using [postman], then we can set the body as a json data with keys [title, content] and this body can be sent within the request cause the it is a post request. if for example [GET], it is not available 
  const title = req.body.title;
  const content = req.body.content;
  const imageUrl = req.file.path.replace("\\", "/");

  let creator; 

  const post = new Post({
    title,
    content,
    imageUrl,
    creator: req.userId
  });

  post
    .save()
    .then(res => {
      return User.findById(req.userId);
    })
    .then(user => { 
      creator = user;
      user.posts.push(post); // although in the "User" model -> the type of key [posts] is an array of "ObjectId", here we are pushing the full post not the id of it -> mongoose by default handles it to store only the _id of the post 
      user.save();
      return user;
    })
    .then(user => {
      
      // Informing all the clients by the post created 
      // the function "emit" -> is for sending the message to all the clients
      io.getIO().emit("posts", { action: "create", post: {...post._doc, creator:{_id: req.userId, name:user.name }} }) // the first parameter is the event name, the second parameter is an object containing the data -> the action key is to inform the client what happened 
      // Note -> The ._doc property is often used to access the raw document data from a Mongoose document. When you retrieve a document from a MongoDB collection using Mongoose, the document is wrapped in a Mongoose object that provides additional methods and properties. The ._doc property contains the plain JavaScript object representation of the document, excluding the Mongoose-specific properties.
      
      res.status(201).json({
        message: 'Post created successfully!',
        post: post, 
        creator: { id: creator._id, name: creator.name }
      });
    })
    .catch(err => { // throwing an error inside the [.then] statement -> this error will be caught by the [.ctach] and it is not necessary to be direct after the [.then] statement  
      console.log(err);
    });
};

exports.getPost = (req, res, next) => {
  const postId = req.params.postId;
  Post.findById(postId)
    .then(post => {
      if (!post) {
        const error = new Error('Could not find post.');
        error.statusCode = 404;
        return next(error);
      }
      res.status(200).json({ message: 'Post fetched.', post: post });
    })
    .catch(err => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

exports.updatePost = (req, res, next) => {
  const postId = req.params.postId;

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error('Validation failed, entered data is incorrect.');
    error.statusCode = 422;
    return next(error);
  }

  const title = req.body.title;
  const content = req.body.content;

  let imageUrl = req.body.image; // as it is the controller of the update, then the user may not upload a new image 
  if (req.file) {
    imageUrl = req.file.path.replace("\\", "/");
  }
  if (!imageUrl) {
    const error = new Error('No file picked.');
    error.statusCode = 422;
    return next(error);
  }

  Post.findById(postId).populate("creator")
    .then(post => {
      if (!post) {
        const error = new Error('Could not find post.');
        error.statusCode = 404;
        return next(error);
      }

      if (post.creator._id.toString() !== req.userId){
        const error = new Error('Not Authorized to fo this!');
        error.statusCode = 403;
        return next(error);
      }

      if (imageUrl !== post.imageUrl) {
        clearImage(post.imageUrl);
      }

      post.title = title;
      post.imageUrl = imageUrl;
      post.content = content;
      post.save();

      return post;
    })
    .then(post => {
      io.getIO().emit("posts", { action: "update", post: post });

      res.status(200).json({ message: 'Post updated!', post: post });
    })
    .catch(err => {
      // console.log(err);
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};
const clearImage = filePath => {
  filePath = path.join(__dirname, '..', filePath); // the second parameter ".." to back one step to be in the domain of the folder (controllers, models, images, ...) as we can see above when requiring the "post" model, then we can join it with the file path which is "images/imgName.ext"
  fs.unlink(filePath, err => console.log(err));
};

exports.deletePost = (req, res, next) => {
  const postId = req.params.postId;
  Post.findById(postId)
    .then(post => {
      if (!post) {
        const error = new Error('Could not find post.');
        error.statusCode = 404;
        return next(error);
      }

      if (post.creator.toString() !== req.userId) {
        const error = new Error('Not Authorized to do this!');
        error.statusCode = 403;
        return next(error);
      }

      clearImage(post.imageUrl);
      return Post.deleteOne({ _id: postId })
      // return Post.findByIdAndRemove(postId); // the function "findByIdAndRemove" is deprecated in mongoose of version above 5.0.0
    })
    .then(res => {
      return User.findById(req.userId);
    })
    .then(user => {
      user.posts.pull(postId);
      return user.save();
    })
    .then(result => {
      io.getIO().emit("posts", { action: "delete", post: postId });
      res.status(200).json({ message: 'Deleted post.' });
    })
    .catch(err => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};


// Notes on "async-await" which can be used intead of [.then and .catch] -> 
  // Top-level await is a feature in JavaScript that allows you to use the await keyword outside of async functions, directly at the top level of a module. This feature simplifies asynchronous code by eliminating the need to wrap top-level asynchronous operations inside an async function.

// Example --> 
  // using top-level await
  // const response = await fetch('https://api.example.com/data');
  // const data = await response.json();
  // console.log(data);

// Key Points of Top - Level await --> 
  // 1) Simplified Syntax: You can use await directly at the top level, making the code cleaner and removing the need for an immediately invoked async function.
  // 2) Module Context: Top - level await works only in modules(ESM - ECMAScript Modules).You need to use the type = "module" attribute in your HTML script tag or have the file with a.mjs extension(or use "type": "module" in package.json for Node.js).
  // 3) Sequential Loading: When using top-level await, module execution is paused until the awaited promise is resolved.This means other modules that import this module will wait for the top - level await to complete before they execute.This can lead to more predictable and manageable code execution.

// Module Context --> 
  // ECMAScript Modules(ESM): These are a standardized way to structure and organize JavaScript code, allowing you to use import and export statements.
    // 1) In the Browser --> Use the type = "module" attribute in the < script > tag to indicate that the script should be treated as a module.
      // <!DOCTYPE html>
      // <html>
      //   <head>
      //     <title>Top-Level Await Example</title>
      //   </head>
      //   <body>
      //     <script type="module">
      //       const response = await fetch('https://api.example.com/data');
      //       const data = await response.json();
      //       console.log(data);
      //     </script>
      //   </body>
      // </html>

// 2) In Node.js --> Use the.mjs file extension to indicate that the file is a module. Alternatively, you can set "type": "module" in the package.json file to treat all.js files in the project as modules.
  // - myModule.mjs
    // const response = await fetch('https://api.example.com/data');
    // const data = await response.json();
    // console.log(data);

  // - Using "type": "module" in package.json:
    // {
    //   "type": "module"
    // }

// 3) CommonJS(CJS) --> Used traditionally in Node.js with require and module.exports. Does not support top - level await.

// 4) Classic Script --> Default in browsers when type is not specified or set to text/javascript. Does not support module features like import/export or top-level await.

// Other Notes --> 
// Using type = "text/javascript" in an HTML script tag will treat the script as a classic script, which does not support modern module features like import and export. In this context, you cannot use require or import statements directly.Here's a brief explanation and possible solutions -> 
  // 1) Classic Script Limitations --> 
    // - No Module Support: Classic scripts(text / javascript or no type specified) do not support ES modules or CommonJS modules.
    // - No require or import: You cannot use require(CommonJS) or import(ESM) in classic scripts.
    // - Limited by Environment: You typically run classic scripts in a browser environment where modules are not supported without specifying type = "module".
  // 2) Solution -> Using <script> tags with type = "module" --> In modern browsers, you can mix classic scripts for DOM manipulation and module scripts for backend logic by using separate <script> tags.
    // Example --> 
      // <!DOCTYPE html>
      // <html>
      //   <head>
      //     <title>Mixed Script Example</title>
      //   </head>
      //   <body>
      //     <div id="content"></div>

      //     <!-- Classic script for DOM manipulation -->
      //     <script type="text/javascript">
      //       document.getElementById('content').textContent = 'Hello, world!';
      //     </script>

      //     <!-- Module script for backend logic -->
      //     <script type="module">
      //       import {fetchData} from './fetchData.js';

      //   fetchData().then(data => {
      //         console.log(data);
      //   });
      //     </script>
      //   </body>
      // </html>




