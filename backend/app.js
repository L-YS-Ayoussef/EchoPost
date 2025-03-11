require("dotenv").config();
const path = require('path');
const fs = require('fs');
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');
const multer = require('multer');
const socket = require("./socket");

// GraphQl Part
const { graphqlHTTP } = require("express-graphql"); // requiring the function "graphqlHttp" from the package 
const graphqlSchema = require("./graphql/schema");
const graphqlResolver = require("./graphql/resolvers");
const auth = require("./middleware/auth");
const { clearImage } = require('./util/file');

const app = express();

// Handling image upload 
const fileStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'images');
    },
    filename: (req, file, cb) => {
        cb(null, uuidv4() + '-' + file.originalname);
    }
});
const fileFilter = (req, file, cb) => {
    if (
        file.mimetype === 'image/png' ||
        file.mimetype === 'image/jpg' ||
        file.mimetype === 'image/jpeg'
    ) {
        cb(null, true);
    } else {
        cb(null, false);
    }
};

// Using Prepared Middlewares for different missions 
app.use(bodyParser.json()); 
app.use(
    multer({ storage: fileStorage, fileFilter: fileFilter }).single('image')
);
app.use('/images', express.static(path.join(__dirname, 'images')));


// CORS Handling
app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*"); 
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS"); 
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization"); 
    
    // Handlign the "OPTIONS" request
    if (req.method === "OPTIONS") {
        return res.sendStatus(200); // responding without going through the other middleware as GraphQl doesn't support the OPTIONS method
    }
    next();
});

// Handling Authentication -> adding the property/field [isAuth] to the [req] object to validate the authentication 
app.use(auth);

// Middleware for image upload
app.put('/post-image', (req, res, next) => { // this middleware is for handling the file caught by "multer" -> storing it and returning the path 
    if (!req.isAuth) {
        throw new Error('Not authenticated!');
    }
    if (!req.file) {
        return res.status(200).json({ message: 'No file provided!' });
    }
    if (req.body.oldPath) {
        clearImage(req.body.oldPath);
    }
    return res
        .status(201)
        .json({ message: 'File stored.', filePath: req.file.path.replace("\\", "/") });
});

// GraphQl Route/Endpoint Handling 
app.use("/graphql", graphqlHTTP({
    schema: graphqlSchema, 
    rootValue: graphqlResolver, 
    graphiql: true, // it will give a special tool for visualizing the GraphQl data when hitting the url "http://localhost:5000/graphql"(sending the get request so above we used -> [app.use not app.post for not limitting it to the post request])
    customFormatErrorFn(err) {
        if (!err.originalError) { // [originalError] -> will be set by express-graphql when it detects an error thrown in the code either by developer(ME) or some third-party package
            return err; // returning just the [err] without formatting -> formatting only the thrown error
        }
        const data = err.originalError.data;
        const message = err.message || 'An error occurred.';
        const code = err.originalError.code || 500;
        return { message: message, status: code, data: data };
    }
}));

// Error Handling
app.use((error, req, res, next) => {
    if (req.file) { 
        fs.unlink(req.file.path, err => { 
            console.log(err);
        });
    } 
    
    // console.log(error);
    const status = error.statusCode || 500;
    const message = error.message;
    const data = error.data && error.data;
    res.status(status).json({ message: message, data: data  });
});


// DB Connection 
mongoose
    .connect(process.env.DATABASE_URL)
    .then(() => {
        const server = app.listen(5000, () => {
            console.log("The server starts on the port 5000.");
        });
        // [server] -> is returned by the [listen] function 
        const io = socket.init(server); // passing our created server to the function got from requiring the package "socket.io"
        // [io] -> is an object handling/setting up all the web sockets stuff behind the scenes
        // using [io] to define event listeners
        // here, the event listener is whenever a new client connects to us
        io.on("connection", socket => { // [socket] -> is the connection between the server and the client and this function taking the [socket] as an argument will be executed for every new client connecting to the server 
            console.log("Client Connected!");
        })
    })
    .catch(err => {
        console.log(err);
    });
