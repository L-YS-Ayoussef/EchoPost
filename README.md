# 📢 EchoPost – Real-Time Social Posting Platform

## 🌟 Overview  

**EchoPost** is a real-time social media platform that allows users to **sign up, log in, create, edit, and share posts** while also viewing posts from others. This MERN-based application leverages **GraphQL**, offering flexible and efficient data fetching. **Socket.io** is integrated to ensure real-time updates, meaning new posts, edits, and interactions appear instantly without needing to refresh the page.

---

## 🚀 Features  

- **User Authentication** – Secure signup and login using tokens.  
- **Post Management** – Users can create, edit, and delete their own posts.  
- **Feed & Social Sharing** – Users can browse posts from others.  
- **Real-Time Updates** – Automatic updates rendering without refreshing.  
- **Image Upload** – Users can upload images with their posts.  
- **GraphQL API** – More efficient and flexible data querying than REST APIs.  
- **Secure Password Handling** – Passwords are **hashed**.  
- **Input Validation** – Prevents invalid or malicious data inputs.  
- **Environment Variables** – Secure storage of sensitive data.  
- **Responsive Design** – Ensures a seamless experience across devices (mobile, tablet, desktop).  

---

## 🛠️ Technologies Used  

PostSphere is built using the **MERN stack** with additional libraries for enhanced functionality:  

- **Frontend**: React.js 
- **Backend**: Node.js & Express.js (GraphQL API)  
- **Database**: Mongoose (ORM)  
- **Authentication**: JSON Web Tokens (JWT)  
- **Password Security**: bcrypt.js for hashing passwords  
- **Socket Communication**: **Socket.io** for real-time updates  
- **Image Upload**: Multer for handling file uploads  
- **Validation**: Validator.js for secure input validation  
- **Environment Variables**: dotenv for securing sensitive credentials  

---

## 🔑 Key Skills Developed  

### 1️⃣ GraphQL API Development  
- Designed and implemented a **GraphQL API** for more flexible and efficient data queries.  
- Allows clients to request only the necessary data, reducing over-fetching and improving performance.  

### 2️⃣ Secure User Authentication  
- Used **JWT-based authentication** for managing user sessions securely.  
- **Bcrypt** for password hashing to enhance security.  

### 3️⃣ Real-Time WebSockets (Socket.io)  
- Integrated **Socket.io** to enable real-time updates to the feed and posts.  
- Ensures that users see the latest posts **without refreshing the page**.  

### 4️⃣ Image Uploading with Multer  
- **Multer** is used for handling image uploads securely in the backend.  

### 5️⃣ Input Validation (Frontend & Backend)  
- **Frontend**: Form validation in React to prevent incorrect inputs.  
- **Backend**: Used **Validator.js** to validate and sanitize user inputs before storing them in the database.  

### 6️⃣ Responsive UI/UX Design  
- Designed a fully **responsive interface** to support desktops, tablets, and mobile users.  

### 7️⃣ Environment Variables Management  
- Used **dotenv** to protect sensitive keys like JWT secrets and database credentials.  

---

## 📸 App Screenshots  

### Signup Page  
![Signup Page](https://github.com/L-YS-Ayoussef/EchoPost/blob/master/screenshots/Screenshot1.png)  

### Login Page  
![Login Page](https://github.com/L-YS-Ayoussef/EchoPost/blob/master/screenshots/Screenshot2.png)  

### Add Post Form  
![Add Post](https://github.com/L-YS-Ayoussef/EchoPost/blob/master/screenshots/Screenshot3.png)  

### Feed Page  
![Post Page](https://github.com/L-YS-Ayoussef/EchoPost/blob/master/screenshots/Screenshot4.png)  

### Post Page  
![Feed Page](https://github.com/L-YS-Ayoussef/EchoPost/blob/master/screenshots/Screenshot5.png)  

---

## 📜 License  

This app is built for **learning and practice purposes only**. It is **not a commercial product** and remains **closed-source**. **Forking or cloning** requires **explicit permission** from the author.  

**© 2025 Chameleon Tech. All rights reserved.**  
