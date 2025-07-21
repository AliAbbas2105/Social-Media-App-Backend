
# Social Media App Backend

This is a **backend-only** project for a simple social media application developed using **Express.js** and **MongoDB**.

## 🚀 Features

1. 🔐 **User Authentication**
   - Email/password signup with **JWT authentication**
   - **Google Sign-In** using OAuth 2.0
   - Email verification on manual signup
   - Welcome email after successful verification

2. 📝 **Posts**
   - Users can create posts
   - Retrieve a specific post by its ID
   - Timeline feature to get relevant posts

3. 💬 **Comments**
   - Users can comment on other users’ posts

4. ❤️ **Likes**
   - Users can like other users’ posts

5. ⭐ **Favourites**
   - Users can save (add to favourites) other users’ posts

---

## 🛠 Technologies Used

- **Node.js**
- **Express.js**
- **MongoDB + Mongoose**
- **JWT (JSON Web Token)**
- **OAuth 2.0 for Google Sign-In**
- **Nodemailer** for email verification & welcome messages
- **Postman** for API testing

---

## ⚙️ Getting Started

### 1. Clone the Repository
```bash
git clone https://github.com/AliAbbas2105/Social-Media-App-Backend.git
cd Social-Media-App-Backend
```

### 2. Setup Environment Variables
A `.env.example` file is provided. Rename it to `.env` and fill in your configuration:
```bash
cp .env.example .env
```
Update values like MongoDB URI, JWT secret, email credentials, etc.

### 3. Create MongoDB Database
Before running the server, create your MongoDB database (manually or via MongoDB Atlas).
Collections such as users, posts, comments will be generated automatically when you start interacting with the API.

### 4. Start the Server
```bash
npm start
```

---

## 📬 Postman Testing Guide

### Authorization
Use **Bearer Token** type in the Authorization tab of Postman.  
Paste the **JWT token** received after login.

### Protected Post Routes
You can test the following routes after login and setting the Authorization token.

---

## 🔄 Notes

This is my first solo backend project and currently includes basic social media features.  
More features like **followers/following system** and **notifications** will be added soon.
