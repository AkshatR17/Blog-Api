import dotenv from 'dotenv';
import express from "express";
import bodyParser from "body-parser";
import axios from "axios";
import bcrypt from 'bcrypt';
import pg from 'pg';
dotenv.config();
const saltRounds = 10;

const app = express();
const port = 3000;
const API_URL = "http://localhost:4000";

const db = new pg.Client({
  user: 'postgres',
  host: 'localhost',
  database: process.env.DATABASE,
  password: process.env.PASSWORD,
  port: process.env.PORT
});

db.connect()
  .then(() => {
    console.log('Connected to the database');
  })
  .catch((err) => {
    console.error('Error connecting to the database', err);
  });

app.use(express.static("public"));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Route to render the main page
app.get('/', (req, res) => {
  res.render('loginAndRegister.ejs');
});

// login and registration route

app.post('/register', async (req, res) => {
  try {
    const checkUserQuery = 'SELECT * FROM users WHERE email = $1 AND username = $2';
    const checkUserValues = [req.body.email, req.body.username];
    const existingUser = await db.query(checkUserQuery, checkUserValues);

    if (existingUser.rows.length > 0) {
      return res.status(409).send('User already exists');
    }

    const hash = await bcrypt.hash(req.body.password, saltRounds);
    const insertUserQuery = 'INSERT INTO users(username, email, hash) VALUES($1, $2, $3)';
    const insertUserValues = [req.body.username, req.body.email, hash];
    await db.query(insertUserQuery, insertUserValues);

    res.redirect('/home');
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});

app.post('/login', async (req, res) => {
  const userName = req.body.username;
  const password = req.body.password;

  try {
    const result = await db.query('SELECT * FROM users WHERE username = $1', [userName]);
    const user = result.rows[0];

    if (!user) {
      return res.status(404).send('Username not found');
    }

    bcrypt.compare(password, user.hash).then(function (result) {
      if (result == true) {
        res.redirect('/home');
      } else {
        res.status(401).send('Incorrect password');
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});

app.get("/home", async (req, res) => {
  try {
    const response = await axios.get(`${API_URL}/posts`);
    // console.log(response);
    res.render("index.ejs", { posts: response.data });
  } catch (error) {
    res.status(500).json({ message: "Error fetching posts" });
  }
});

// Route to render the edit page
app.get("/new", (req, res) => {
  res.render("modify.ejs", { heading: "New Post", submit: "Create Post" });
});

app.get("/edit/:id", async (req, res) => {
  try {
    const response = await axios.get(`${API_URL}/posts/${req.params.id}`);
    res.render("modify.ejs", {
      heading: "Edit Post",
      submit: "Update Post",
      post: response.data.rows[0],
    });
  } catch (error) {
    res.status(500).json({ message: "Error fetching post" });
  }
});

// Create a new post
app.post("/api/posts", async (req, res) => {
  try {
    const response = await axios.post(`${API_URL}/posts`, req.body);
    // console.log(response.data);
    res.redirect("/");
  } catch (error) {
    res.status(500).json({ message: "Error creating post" });
  }
});

// Partially update a post
app.post("/api/posts/:id", async (req, res) => {
  // console.log("called");
  try {
    const response = await axios.patch(
      `${API_URL}/posts/${req.params.id}`,
      req.body
    );
    console.log(response.data);
    res.redirect("/");
  } catch (error) {
    res.status(500).json({ message: "Error updating post" });
  }
});

// Delete a post
app.get("/api/posts/delete/:id", async (req, res) => {
  try {
    await axios.delete(`${API_URL}/posts/${req.params.id}`);
    res.redirect("/");
  } catch (error) {
    res.status(500).json({ message: "Error deleting post" });
  }
});

app.listen(port, () => {
  console.log(`Backend server is running on http://localhost:${port}`);
});
