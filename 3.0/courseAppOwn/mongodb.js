/* 

Database software refers to software applications designed to store, manage, and retrieve data efficiently.
These software solutions provide mechanisms for creating, querying, updating, and deleting data, ensuring data integrity,
security, and reliability.
 Databases are crucial for various applications, ranging from simple to complex systems,
*/


/*
   MongoDB stands out as a database software due to its schema flexibility, scalability, and high performance,
    making it well-suited for modern applications with dynamic data requirements and high-performance needs.
*/


const express = require('express')
const app = express()
const jwt = require("jsonwebtoken")


//Mongoose is an Object Data Modeling (ODM) library for MongoDB and Node.js.
// Mongoose simplifies the process of working with MongoDB databases in Node.js applications by providing a rich set of features for defining schemas, modeling data, performing CRUD operations, and handling data validation and middleware logic.


const mongoose = require("mongoose")

app.use(express.json())

const secret = "eoijvciweuvneiurw"


// In MongoDB, a schema is a structure that defines the shape or format of documents within a collection.
// MongoDB is schema-less in the sense that documents in a collection can have varying structures. However, despite being schema-less, MongoDB allows developers to enforce a schema-like structure using a concept called "schema validation

// define schema for admin

const adminSchema = new mongoose.Schema({
    username: {type:"String"},
    password: {type:"String"}
  });


// let us define the schema for user db

const userSchema = new mongoose.Schema({
    userename:{type: String},
    password:{type:String},
    purchasedCourse:[{
         type:mongoose.Schema.Types.ObjectId,
         ref:"Course"
        }]

        // here, purchasedCourses: This is a field in the userSchema that stores an array
        // type: mongoose.Schema.Types.ObjectId: Specifies that each element in the purchasedCourses array will be of type ObjectId, which is a unique identifier automatically generated by MongoDB for each document.
        // ref: 'Course': Indicates that these ObjectId references are related to documents in the 'Course' collection.

})



// now let us define scemas for the course

const courseSchema = new mongoose.Schema({
    title:{type:String},
    description:{type:String},
    price:{type:Number},
    imageLink:{type:String},
    published:{type:Boolean}
})


// In Mongoose, a model is a constructor function that corresponds to a specific collection in your MongoDB database.
// so we need to pass the collection's name and the defined  schema to create the data model

// define models

const User = mongoose.model("User", userSchema)
const Admin = mongoose.model("Admin",adminSchema)
const Course = mongoose.model("Course", courseSchema)

const authenticateJwt = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (authHeader) {
      const token = authHeader.split(' ')[1];
      jwt.verify(token, secret, (err, user) => {
        if (err) {
          return res.sendStatus(403);
        }
        req.user = user;
        next();
      });
    } else {
      res.sendStatus(401);
    }
  };

  // now do the connection with mongo db

  mongoose.connect('mongodb+srv://sivasish48:suvamdbdb@cluster1.a4rumgr.mongodb.net/') 


  // now let us define routes for Admin 
  // for signup

  app.post("/admin/signup", async (req,res)=>{
    // These lines extract the username and password from the request body.
    const username = req.body.username
    const password = req.body.password

    // This line uses the Admin model to search for an existing admin user with the same username.
    const admin = await Admin.findOne({username})

    if(admin){
      res.status(403).json({message:`Admin already exists.`})
    }else{

      // This line creates an object containing the retrieved username and password to be used for the new admin user.
      const userObj = {
        username:username,
        password:password
      }

      // This line creates a new instance of the Admin model using the userObj as data.
      const newAdmin  = new Admin(userObj)

      // This line saves the new admin user to the database. await is used because newAdmin.save likely returns a Promise.
      await newAdmin.save()
     

      // It creates a token containing the username and sets the role to "admin".
      const token = jwt.sign({username,role:"admin"},secret,{expiresIn:"1h"})
      res.json({message:`Admin created successfully ${token}`})
    }
  })


  // now let us define routes for the logging of the admin

  app.post("/admin/login", async (req,res)=>{
    const {username,password} = req.header

    // let us store if the admin exists
    const admin = await Admin.findOne({username,password})

    if(admin){
      const token = jwt.sign({username,role:"admin"},secret,{expiresIn:'1hr'})
      res.json({message:`LoggedIn successfully, ${token}`})

    }else{
      res.json({message:`Invalod username or password`})
    }
  })


  // now let us define routes to create courses

  app.post("/admin/courses", authenticateJwt, async (req,res)=>{
    
    const course =  new Course({
      title:req.body.title,
      description:req.body.description
    })
    await course.save()
    res.json({message:`Course created successfully , course ID is : ${course.id} ` })
  })


  // now let us create routes to edit an existing course

  app.put("/admin/course/:courseId",authenticateJwt, async(req,res)=>{
    const course = await Course.findByIdAndUpdate(req.params.courseId,req.body)
    /* Course.findByIdAndUpdate(req.params.courseId, req.body) is likely a function (from a Mongoose) that retrieves a course document from the database based on the provided courseId.
       The req.body object contains the new course data sent in the request body (usually in JSON format).
       findByIdAndUpdate attempts to find the course and update its properties with the values from req.body. It returns the updated course document if successful, or null if not found.
       The await keyword pauses the execution of the route handler until findByIdAndUpdate finishes its operation.
*/
    if(course){
      res.json({message:`course edited successfullyy`})
    }else{
      res.statusCode(403).json({message:`Course not found`})
    }
  })


  // let us create a route to get all the courses

  app.get("/admin/courses",authenticateJwt, async (req,res)=>{
    const course = await Course.find({})
    // The empty {} object as an argument specifies no filtering criteria, meaning all courses are returned.
     // The await keyword pauses the execution of the route handler until Course.find finishes its operation.
    res.json({course})
  })


  // ok let us make routes for the userm signin

  app.post("/user/signup", async(req,res)=>{

    const username = {
      username:username,
      password:password
    }

    const user = await User.findOne({username})
    if (user){
      res.json({message:`User already exists`})
    }else{
      const newUser = new User({username,password})
      await newUser.save()
      const token = jwt.sign({username,role:user},secret,{expiresIn:"1h"})
      res.json({message:`New user created successfuly, ${token}`})
    }
  })

  // now create routes on user login

  app.post("/user/login", async(req,res)=>{

    const {username,password} = req.header
    const user = await User.findOne({username,password})
    
    if(user){
      const token = jwt.sign({username,role:user},secret,{expiresIn:"1h"})
      res.json({message:`New user created successfuly, ${token}`})
    }else{
      res.json({message:"Invalid username or password"})
    }
  })


// now let us define routes to purchase the course
