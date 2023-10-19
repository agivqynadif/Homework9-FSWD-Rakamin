/**
 * @swagger
 * components:
 *   schemas:
 *    movies:
 *      type: object
 *      required:
 *        - title
 *        - genres
 *        - year
 *      properties:
 *        id:
 *          type: integer
 *          description: The unique number as id of the movies
 *        title:
 *          type: character varying
 *          description: The title of the movie
 *        genres:
 *          type: character varying
 *          description: The genres of the movie
 *        year:
 *          type: character varying
 *          description: The year when the movie released
 *        example:
 *          id: 1
 *          title: Reckless
 *          genres: Comedy|Drama|Romance
 *          year: 2001
 *    users:
 *      type: object
 *      required:
 *        - email
 *        - gender
 *        - password
 *        - role
 *      properties:
 *        id:
 *          type: integer
 *          description: The id of user account
 *        email:
 *          type: character varying
 *          description: The email that user use for register and login
 *        gender:
 *          type: character varying
 *          description: TThe gender of user
 *        password:
 *          type: character varying
 *          description: The password that user create while register
 *        role:
 *          type: character varying
 *          description: The role of user
 *      example:
 *        id: 1
 *        email: oainger0@craigslist.org
 *        gender: Female
 *        password: KcAk6Mrg7DRM
 *        role: Construction Worker
 *
 */

const express = require("express");
const pool = require("./query.js");
const app = express();
const router = express.Router();
const bodyParser = require("body-parser");
const jwt = require("jsonwebtoken");
const verifyToken = require("../middleware/verify.js");

app.use(bodyParser.json());

router.post("/register", async (req, res) => {
  const { id, email, gender, password, role } = req.body;

  if (!id || !email || !gender || !password || !role) {
    return res.status(400).json({ error: "Please provide all required fields." });
  }

  const registerQuery = `
    INSERT INTO users (id, email, gender, password, role)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *;
  `;

  try {
    const result = await pool.query(registerQuery, [id, email, gender, password, role]);
    const newUser = result.rows[0];
    res.status(201).json({ message: "User registered successfully", user: newUser });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "An error occurred while registering the user." });
  }
  next();
});

router.get("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Please provide both email and password." });
  }

  const loginQuery = `
      SELECT email, password FROM users
      WHERE email = $1;
    `;

  try {
    const result = await pool.query(loginQuery, [email]);

    if (result.rowCount === 0) {
      return res.status(401).json({ error: "Authentication failed. User not found." });
    }

    const user = result.rows[0];

    if (password !== user.password) {
      return res.status(401).json({ error: "Authentication failed. Incorrect password." });
    }

    const token = jwt.sign({ email: user.email, password: user.password }, process.env.SECRET_TOKEN, { expiresIn: "1h" });

    res.status(200).json({ message: "Authentication successful", token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "An error occurred during authentication." });
  }
});

router.get("/movies/paginate", verifyToken, async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = 10;

  const offset = (page - 1) * limit;

  const moviesQuery = `
  SELECT * FROM movies LIMIT $1 OFFSET $2
  `;
  try {
    const results = await pool.query(moviesQuery, [limit, offset]);
    const movies = results.rows;
    res.json({ movies, currentPage: page });
  } catch (error) {
    console.error("Error executing query:", error);
    res.status(500).json({ error: "An error occurred" });
  }
});

router.get("/movies/:id", verifyToken, async (req, res) => {
  const moviesId = req.params.id;
  try {
    const results = await pool.query("SELECT * FROM movies WHERE id = $1", [moviesId]);
    res.json(results.rows);
  } catch (error) {
    console.error("Error executing query:", error);
    res.status(500).json({ error: "An error occurred" });
  }
});

router.get("/users/paginate", verifyToken, async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = 10;

  const offset = (page - 1) * limit;

  const usersQuery = `
  SELECT email, gender, role FROM users LIMIT $1 OFFSET $2;
`;
  try {
    const results = await pool.query(usersQuery, [limit, offset]);
    const users = results.rows;
    res.json({ users, currentPage: page });
  } catch (error) {
    console.error("Error executing query:", error);
    res.status(500).json({ error: "An error occurred" });
  }
});

router.post("/movies", async (req, res) => {
  const { id, title, genres, year } = req.body;

  if (!id || !title || !genres || !year) {
    return res.status(400).json({ error: "Please provide all required fields." });
  }

  const insertMovieQuery = `
      INSERT INTO movies ( id, title, genres, year)
      VALUES ( $1, $2, $3, $4)
      RETURNING *;`;

  try {
    const result = await pool.query(insertMovieQuery, [id, title, genres, year]);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "An error occurred while adding the movie." });
  }
});

router.put("/movies/:id", verifyToken, async (req, res) => {
  const movieId = req.params.id;
  const { title, genres, year } = req.body;

  if (!title || !genres || !year) {
    return res.status(400).json({ error: "Please provide all required fields." });
  }

  const updateQuery = `
      UPDATE movies
      SET title = $1, genres = $2, year = $3
      WHERE id = $4
      RETURNING *;
    `;

  try {
    const result = await pool.query(updateQuery, [title, genres, year, movieId]);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Movie not found." });
    }

    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "An error occurred while updating the movie." });
  }
});

router.delete("/movies/:id", verifyToken, async (req, res) => {
  const movieId = req.params.id;

  const deleteQuery = `
    DELETE FROM movies WHERE id = $1
    RETURNING *;
  `;

  try {
    const result = await pool.query(deleteQuery, [movieId]);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Movie not found." });
    }

    res.status(200).json({ message: "Movie has been deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "An error occurred while deleting the movie." });
  }
});

module.exports = router;
