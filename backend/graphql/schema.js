const { buildSchema } = require('graphql');

module.exports = buildSchema(`
    type Post {
        _id: ID!
        title: String!
        content: String!
        imageUrl: String!
        creator: User!
        createdAt: String!
        updatedAt: String!
    }
    type User {
        _id: ID!
        name: String!
        email: String!
        password: String
        status: String!
        posts: [Post!]!
    }
    type AuthData {
        token: String!
        userId: String!
    }
    type PostData {
        posts: [Post!]!
        totalPosts: Int!
    }

    input UserInputData {
        email: String!
        name: String!
        password: String!
    }
    input PostInputData {
        title: String!
        content: String!
        imageUrl: String!
    }

    
    type RootQuery {
        login(email: String!, password: String!): AuthData!
        posts(page: Int): PostData!
        post(id: ID!): Post!
        user: User!
    }
    type RootMutation {
        createUser(userInput: UserInputData): User!
        createPost(postInput: PostInputData): Post!
        updatePost(id: ID!, postInput: PostInputData): Post!
        deletePost(id: ID!): Boolean
        updateStatus(status: String!): User!
    }

    schema {
        query: RootQuery
        mutation: RootMutation
    }
`);

// Notes -> 
// 1) pass the template literal containing the schem to the function "buildSchema" and in the schema -> there is a value to "query" key for getting the data and a value to "mutation" for the insertion, edit and delete operations and a value to "subscription" for the real-time data like sockets
// 2) we can define a format for any object usign the "type" keyword for example ->  
    // type RootQuery {
    //     hello: String // here "hello" function defined in the resolver and returns a String
    // }
// 3) '!' means this field is required    
// 4) in the frontend -> the body of the post request sent from the frontend can be in this format -> 
    // {
    //     "query": "{ hello {text views} }" // inside the nested curly brackets -> defining the data to be returned it can be only the text or views
    // }
// 5) the "input" keyword for defining object structure that will be used as an argument(will be passed to a function)
// 6) for the "mutation" -> the query/prompt to create a user -> 
    // mutation{
    //     createUser(userInput: { email: "test@test", name: "Youssef", password: "123456789" }) {
    //     _id email // data to be returned
    //     }
    // }
// 7) dealing with the ide got from hitting the url "http://localhost:5000/graphql" to write the queries/prompts and execute them and also visualize the structure of the schema 
// 8) the command [npm install --save validator --legacy-peer-deps] -> This option allows NPM to install packages without strict peer dependency checks, which is useful when working with legacy packages that may not have been updated to support newer versions of their peer dependencies.
// 9) "ID" -> This is a built-in scalar type in GraphQL used to represent unique identifiers. It is often used to fetch or reference objects by their unique ID.





