import express from "express";
import bodyParser from "body-parser";
import pg from 'pg';
import { data } from "./secrets.js";

const app = express();
const port = 4000;

const db = new pg.Client({
  user: 'postgres',
  host: 'localhost',
  database: data.database,
  password: data.password,
  port: data.port
});

db.connect();

let lastId = 3;

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

//Write your code here//

//CHALLENGE 1: GET All posts
app.get('/posts', async (req, res) => {
  const result = await db.query(`SELECT * FROM posts`);
  const posts = result.rows;
  res.json(posts);
});

//CHALLENGE 2: GET a specific post by id
app.get('/posts/:id',async (req, res) => {

  const id = parseInt(req.params.id);
  const post = await db.query(`SELECT * FROM posts WHERE id = ${id}`);
  if (post) {
    res.json(post);
  }
  else {
    res.status(404);
    res.json({ message: "Post not found" });
  }

});

//CHALLENGE 3: POST a new post
app.post('/posts', (req, res) => {
  const newId = lastId + 1;
  const post = {
    id: newId,
    title: req.body.title,
    content: req.body.content,
    author: req.body.author,
    date: new Date()
  };
  lastId = newId;
  posts.push(post);
  res.status(201).json(post);
});

//CHALLENGE 4: PATCH a post when you just want to update one parameter
app.patch('/posts/:id', (req, res) => {
  const id = parseInt(req.params.id);
  let postIndex = posts.findIndex((post) => post.id === id);

  if (postIndex > -1) {
    const post = posts[postIndex];

    const { title, content, author } = req.body;

    if (!title && !content && !author) {
      res.status(400).json({ message: "Invalid request. Title, content, and author are required." });
      return;
    }

    const newPost = {
      id: post.id,
      title: title || post.title,
      content: content || post.content,
      author: author || post.author,
      date: new Date()
    };

    posts[postIndex] = newPost;
    res.json(newPost);
  } else {
    res.status(404).json({ message: "Post not found" });
    return;
  }
});

//CHALLENGE 5: DELETE a specific post by providing the post id.
app.delete('/posts/:id', (req, res) => {

  const id = parseInt(req.params.id);
  const postIndex = posts.findIndex((post) => post.id === id);

  if (postIndex > -1) {
    const post = posts[postIndex];
    posts.splice(postIndex, 1);
    res.json(post);
  }
  else {
    res.status(404);
    res.json({ message: "Post not found" });
  }
});

app.listen(port, () => {
  console.log(`API is running at http://localhost:${port}`);
});
