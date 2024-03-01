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
    const gratitudeCollection = db.collection("gratitudes");
    const testimonialCollection = db.collection("testimonials");
    const volunteerCollection = db.collection("volunteer");

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
      console.log(user);
      if (!user) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      // Compare hashed password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      // Generate JWT token
      const token = jwt.sign(
        { email: user.email, name: user.name, photo: user?.photo || "" },
        process.env.JWT_SECRET,
        {
          expiresIn: process.env.EXPIRES_IN,
        }
      );

      res.json({
        success: true,
        message: "Login successful",
        token,
      });
    });

    // ==============================================================

    // ----------------- supply releted -----------------
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
    //-------------------- supply operation end ------------------------

    //---------------------- provider or doner releted -------------------
    // get all providers based on theire total amount
    app.get("/api/v1/providers", async (req, res) => {
      try {
        const result = await supplyCollection
          .aggregate([
            {
              $group: {
                _id: "$providerEmail",
                providerName: { $first: "$providerName" },
                providerEmail: { $first: "$providerEmail" },
                providerImage: { $first: "$providerPhoto" },
                totalAmount: { $sum: "$amount" },
              },
            },
            {
              $sort: {
                totalAmount: -1,
              },
            },
            {
              $project: {
                providerName: 1,
                providerEmail: 1,
                providerImage: 1,
                totalAmount: 1,
              },
            },
          ])
          .toArray();
        res.status(200).json({
          success: true,
          message: "successfully retrieved providers data",
          data: result,
        });
      } catch (error) {
        res.status(400).json({
          success: false,
          message: error.message || "providers retrieved failed",
        });
      }
    });
    //-------------------- supply operation end ------------------------

    // ----------------- Community Gratitude Wall releted -----------------
    // create Community Gratitude Wall
    app.post("/api/v1/create-gratitude", async (req, res) => {
      try {
        const gratitudeData = req.body;
        const result = await gratitudeCollection.insertOne(gratitudeData);
        res.status(201).json({
          success: true,
          message: "gratitude created successfully",
          data: result,
        });
      } catch (error) {
        res.status(400).json({
          success: false,
          message: error.message || "gratitude create failed",
        });
      }
    });

    // get all gratitude
    app.get("/api/v1/gratitudes", async (req, res) => {
      try {
        const result = await gratitudeCollection.find().toArray();
        res.status(200).json({
          success: true,
          message: "successfully retrieved gratituds data",
          data: result,
        });
      } catch (error) {
        res.status(400).json({
          success: false,
          message: error.message || "supplies gratitudes failed",
        });
      }
    });
    // get all gratitude by supply id
    app.get("/api/v1/gratitudes/supply/:id", async (req, res) => {
      try {
        const id = req.params.id;
        console.log(id);
        const query = { supplyId: id };
        const result = await gratitudeCollection.find(query).toArray();
        res.status(200).json({
          success: true,
          message: "successfully retrieved gratituds data using supply id",
          data: result,
        });
      } catch (error) {
        res.status(400).json({
          success: false,
          message:
            error.message || "supplies gratitudes failed using supply id",
        });
      }
    });

    // get single gratitude data for showing details page
    app.get("/api/v1/gratitude/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) };
        const result = await gratitudeCollection.findOne(query);
        res.status(200).json({
          success: true,
          message: "successfully retrieved gratitude data",
          data: result,
        });
      } catch (error) {
        console.log(error);
        res.status(400).json({
          success: false,
          message: error.message || "gratitude retrieved failed",
        });
      }
    });

    // update gratitude data
    app.patch("/api/v1/gratitude/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const updatedData = req.body;

        const result = await gratitudeCollection.updateOne(
          { _id: new ObjectId(id) },
          {
            $set: { ...updatedData },
          }
        );

        res.status(200).json({
          success: false,
          message: "gratitude updated successfully",
          data: result,
        });
      } catch (error) {
        res.status(400).json({
          success: false,
          message: error.message || "gratitude update failed",
        });
      }
    });

    // delete gratitude
    app.delete("/api/v1/gratitude/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const result = await gratitudeCollection.deleteOne({
          _id: new ObjectId(id),
        });
        res.status(200).json({
          success: true,
          message: "successfully delete gratitude data",
          data: result,
        });
      } catch (error) {
        res.status(400).json({
          success: false,
          message: error.message | "gratitude delete failed",
        });
      }
    });
    //----------------------------- gratitude releted operation end------------------------

    // ----------------- provider testimonial releted -----------------
    //  create-testimonial
    app.post("/api/v1/create-testimonial", async (req, res) => {
      try {
        const TestimonialData = req.body;
        const result = await testimonialCollection.insertOne(TestimonialData);
        res.status(201).json({
          success: true,
          message: "Testimonial successfully created!",
          data: result,
        });
      } catch (error) {
        res.status(400).json({
          success: false,
          message: error.message || "Testimonial create failed",
        });
      }
    });

    // get all testimonial about donation posts
    app.get("/api/v1/testimonial", async (req, res) => {
      try {
        const result = await testimonialCollection.find().toArray();
        res.status(200).json({
          success: true,
          message: "successfully retrieved testimonial data",
          data: result,
        });
      } catch (error) {
        res.status(400).json({
          success: false,
          message: error.message || "supplies Testimonial failed",
        });
      }
    });

    // get single testimonial data
    app.get("/api/v1/testimonial/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) };
        const result = await testimonialCollection.findOne(query);
        res.status(200).json({
          success: true,
          message: "successfully retrieved testimonial data",
          data: result,
        });
      } catch (error) {
        console.log(error);
        res.status(400).json({
          success: false,
          message: error.message || "testimonial retrieved failed",
        });
      }
    });

    // update testimonial data
    app.patch("/api/v1/testimonial/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const updatedData = req.body;

        const result = await testimonialCollection.updateOne(
          { _id: new ObjectId(id) },
          {
            $set: { ...updatedData },
          }
        );

        res.status(200).json({
          success: false,
          message: "testimonial updated successfully",
          data: result,
        });
      } catch (error) {
        res.status(400).json({
          success: false,
          message: error.message || "testimonial update failed",
        });
      }
    });

    // delete testimonial
    app.delete("/api/v1/testimonial/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const result = await testimonialCollection.deleteOne({
          _id: new ObjectId(id),
        });
        res.status(200).json({
          success: true,
          message: "successfully delete testimonial data",
          data: result,
        });
      } catch (error) {
        res.status(400).json({
          success: false,
          message: error.message | "testimonial delete failed",
        });
      }
    });
    //----------------------------- testimonial releted operation end------------------------

    // ----------------- volunteer releted -----------------
    //  create-volunteer
    app.post("/api/v1/create-volunteer", async (req, res) => {
      try {
        const volunteerData = req.body;
        const result = await volunteerCollection.insertOne(volunteerData);
        res.status(201).json({
          success: true,
          message: "successfully register as a volunteer!",
          data: result,
        });
      } catch (error) {
        res.status(400).json({
          success: false,
          message: error.message || "volunteer create failed",
        });
      }
    });

    // get all volunteer about donation posts
    app.get("/api/v1/volunteer", async (req, res) => {
      try {
        const result = await volunteerCollection.find().toArray();
        res.status(200).json({
          success: true,
          message: "successfully retrieved volunteer data",
          data: result,
        });
      } catch (error) {
        res.status(400).json({
          success: false,
          message: error.message || "supplies volunteer failed",
        });
      }
    });

    // get single volunteer data
    app.get("/api/v1/volunteer/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) };
        const result = await volunteerCollection.findOne(query);
        res.status(200).json({
          success: true,
          message: "successfully retrieved volunteer data",
          data: result,
        });
      } catch (error) {
        console.log(error);
        res.status(400).json({
          success: false,
          message: error.message || "volunteer retrieved failed",
        });
      }
    });

    // update volunteer data
    app.patch("/api/v1/volunteer/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const updatedData = req.body;

        const result = await volunteerCollection.updateOne(
          { _id: new ObjectId(id) },
          {
            $set: { ...updatedData },
          }
        );

        res.status(200).json({
          success: false,
          message: "volunteer updated successfully",
          data: result,
        });
      } catch (error) {
        res.status(400).json({
          success: false,
          message: error.message || "volunteer update failed",
        });
      }
    });

    // delete volunteer
    app.delete("/api/v1/volunteer/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const result = await volunteerCollection.deleteOne({
          _id: new ObjectId(id),
        });
        res.status(200).json({
          success: true,
          message: "successfully delete volunteer data",
          data: result,
        });
      } catch (error) {
        res.status(400).json({
          success: false,
          message: error.message | "volunteer delete failed",
        });
      }
    });
    //----------------------------- volunteer releted operation end------------------------

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
