const express = require("express");
const cors = require("cors");
const bcrypt = require("bcrypt");
const { MongoClient, ObjectId } = require("mongodb");
require("dotenv").config();
const jwt = require("jsonwebtoken");

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection URL
const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function run() {
  try {
    // Connect to MongoDB
    await client.connect();
    console.log("Connected to MongoDB");

    const db = client.db("l2-assignment6");
    const collection = db.collection("users");
    const supplyCollection = db.collection("supply");

    // User Registration
    app.post("/api/v1/register", async (req, res) => {
      const { name, email, password } = req.body;

      // Check if email already exists
      const existingUser = await collection.findOne({ email });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: "User already exists",
        });
      }

      // Hash the password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Insert user into the database
      await collection.insertOne({ name, email, password: hashedPassword });

      res.status(201).json({
        success: true,
        message: "User registered successfully",
      });
    });

    // User Login
    app.post("/api/v1/login", async (req, res) => {
      const { email, password } = req.body;

      // Find user by email
      const user = await collection.findOne({ email });
      if (!user) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      // Compare hashed password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      // Generate JWT token
      const token = jwt.sign({ email: user.email }, process.env.JWT_SECRET, {
        expiresIn: process.env.EXPIRES_IN,
      });

      res.json({
        success: true,
        message: "Login successful",
        token,
      });
    });

    // ==============================================================

    // create supply
    app.post("/api/v1/create-supply", async (req, res) => {
      try {
        const supplyData = req.body;
        const result = await supplyCollection.insertOne(supplyData);
        res.status(201).json({
          success: true,
          message: "Supply created successfully",
          data: result,
        });
      } catch (error) {
        res.status(400).json({
          success: false,
          message: error.message || "supply create failed",
        });
      }
    });

    // get all supply
    app.get("/api/v1/supplies", async (req, res) => {
      try {
        const result = await supplyCollection.find().toArray();
        res.status(200).json({
          success: true,
          message: "successfully retrieved supplies data",
          data: result,
        });
      } catch (error) {
        res.status(400).json({
          success: false,
          message: error.message || "supplies retrieved failed",
        });
      }
    });

    // get single supply data
    app.get("/api/v1/supply/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) };
        const result = await supplyCollection.findOne(query);
        res.status(200).json({
          success: true,
          message: "successfully retrieved supply data",
          data: result,
        });
      } catch (error) {
        console.log(error);
        res.status(400).json({
          success: false,
          message: error.message || "supply retrieved failed",
        });
      }
    });

    // update supply data
    app.patch("/api/v1/supply/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const updatedData = req.body;

        const result = await supplyCollection.updateOne(
          { _id: new ObjectId(id) },
          {
            $set: { ...updatedData },
          }
        );

        res.status(200).json({
          success: false,
          message: "supply updated successfully",
          data: result,
        });
      } catch (error) {
        res.status(400).json({
          success: false,
          message: error.message || "supply update failed",
        });
      }
    });

    // delete supply
    app.delete("/api/v1/supply/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const result = await supplyCollection.deleteOne({
          _id: new ObjectId(id),
        });
        res.status(200).json({
          success: true,
          message: "successfully delete supply data",
          data: result,
        });
      } catch (error) {
        res.status(400).json({
          success: false,
          message: error.message | "supply delete failed",
        });
      }
    });
    // ==============================================================

    // Start the server
    app.listen(port, () => {
      console.log(`Server is running on http://localhost:${port}`);
    });
  } finally {
  }
}

run().catch(console.dir);

// Test route
app.get("/", (req, res) => {
  const serverStatus = {
    message: "Server is running smoothly",
    timestamp: new Date(),
  };
  res.json(serverStatus);
});
