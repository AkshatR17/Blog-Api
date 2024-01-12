import 'dotenv/config'
import express from "express";
import bodyParser from "body-parser";
import pg from 'pg';

const app = express();
const port = 4000;

const db = new pg.Client({
  user: 'postgres',
  host: 'localhost',
  database: process.env.DATABASE,
  password: process.env.PASSWORD,
  port: process.env.PORT
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
app.get('/posts/:id', async (req, res) => {

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
app.post('/posts', async (req, res) => {
  const newId = lastId + 1;
  const post = {
    id: newId,
    title: req.body.title,
    content: req.body.content,
    author: req.body.author,
    date: new Date(),
  };

  const queryText = 'INSERT INTO posts(title, content, author, date) VALUES($1, $2, $3, $4)';
  const queryValues = [post.title, post.content, post.author, post.date];

  try {
    await db.query(queryText, queryValues);
    lastId = newId;
    res.status(201).json(post);
  } catch (error) {
    console.error('Error executing SQL query:', error);
    res.status(500).send('Internal Server Error');
  }
});

//CHALLENGE 4: PATCH a post when you just want to update one parameter
app.patch('/posts/:id', async (req, res) => {
  const id = parseInt(req.params.id);

  try {
    // Fetch the existing post from the database
    const result = await db.query('SELECT * FROM posts WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      res.status(404).json({ message: "Post not found" });
      return;
    }

    const post = result.rows[0];

    const { title, content, author } = req.body;

    if (!title && !content && !author) {
      res.status(400).json({ message: "Invalid request. Title, content, and author are required." });
      return;
    }

    // Update the post in the database
    const updateQuery = `
      UPDATE posts 
      SET title = $1, content = $2, author = $3, date = $4
      WHERE id = $5
      RETURNING *
    `;

    const updateValues = [
      title || post.title,
      content || post.content,
      author || post.author,
      new Date(),
      id,
    ];

    const updatedPost = await db.query(updateQuery, updateValues);
    res.json(updatedPost.rows[0]);
  } catch (error) {
    console.error('Error executing SQL query:', error);
    res.status(500).send('Internal Server Error');
  }
});

//CHALLENGE 5: DELETE a specific post by providing the post id.
app.delete('/posts/:id', async (req, res) => {
  const id = parseInt(req.params.id);

  try {
    // Fetch the existing post from the database
    const result = await db.query('SELECT * FROM posts WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      res.status(404).json({ message: "Post not found" });
      return;
    }

    const post = result.rows[0];

    // Delete the post from the database
    const deleteQuery = 'DELETE FROM posts WHERE id = $1 RETURNING *';
    const deleteValues = [id];

    await db.query(deleteQuery, deleteValues);

    res.json(post);
  } catch (error) {
    console.error('Error executing SQL query:', error);
    res.status(500).send('Internal Server Error');
  }
});

app.listen(port, () => {
  console.log(`API is running at http://localhost:${port}`);
});
