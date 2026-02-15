const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const bodyParser = require("body-parser");
const session = require("express-session");
const multer = require("multer");
const path = require("path");

const app = express();
const PORT = 3000;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

app.use(session({
    secret: "examportal_secret",
    resave: false,
    saveUninitialized: true
}));

// Database
const db = new sqlite3.Database("database.db");

// Create tables
db.serialize(() => {

    db.run(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT,
            email TEXT UNIQUE,
            password TEXT,
            preferred_exam TEXT,
            state TEXT
        )
    `);

    db.run(`
        CREATE TABLE IF NOT EXISTS exams (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT,
            state TEXT,
            eligibility TEXT,
            details TEXT
        )
    `);

});
app.post("/register", (req, res) => {

    const { name, email, password, exam, state } = req.body;

    db.run(
        "INSERT INTO users (name,email,password,preferred_exam,state) VALUES (?,?,?,?,?)",
        [name, email, password, exam, state],
        function(err) {

            if (err) {
                return res.send("User already exists");
            }

            res.redirect("/login.html");
        }
    );

});
app.post("/login", (req, res) => {

    const { email, password } = req.body;

    db.get(
        "SELECT * FROM users WHERE email=? AND password=?",
        [email, password],
        (err, user) => {

            if (user) {
                req.session.user = user;
                res.redirect("/dashboard.html");
            } else {
                res.send("Invalid login");
            }
        }
    );

});
app.get("/user", (req, res) => {

    if (!req.session.user) {
        return res.send("Not logged in");
    }

    res.json(req.session.user);

});
app.get("/materials", (req, res) => {

    if (!req.session.user) return res.send([]);

    const exam = req.session.user.preferred_exam;

    const fs = require("fs");

    const folder = `materials/${exam}`;

    if (!fs.existsSync(folder)) return res.send([]);

    const files = fs.readdirSync(folder);

    res.json(files);

});
app.listen(PORT, () => {
    console.log("Server running on http://localhost:3000");
});
