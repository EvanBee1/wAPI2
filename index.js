const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const session = require('express-session');

// MongoDB connection
const db = "mongodb+srv://Evan123:gVAiz75v4sWdSUNR@clusters.9vnj1il.mongodb.net/";

mongoose.connect(db).then(()=> {
    console.log("Connected to database");
})
.catch(()=> {
    console.log("Can't connect to database");
});

// Define User Schema
const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true }
});

const User = mongoose.model('User', userSchema);

// Setup Express
const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({ secret: 'secret', resave: false, saveUninitialized: false }));

// Middleware to protect routes
const requireLogin = (req, res, next) => {
    if (!req.session.userId) {
        return res.redirect('/login');
    }
    next();
};

// Routes
app.get('/', (req, res) => {
    res.send('<h1>Welcome to the Home Page</h1><a href="/login">Login</a> or <a href="/register">Register</a>');
});

app.get('/login', (req, res) => {
    res.send('<form method="POST"><input type="text" name="username" placeholder="Username"/><input type="password" name="password" placeholder="Password"/><button type="submit">Login</button></form>');
});

app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (user && await bcrypt.compare(password, user.password)) {
        req.session.userId = user._id;
        res.redirect('/dashboard');
    } else {
        res.redirect('/login');
    }
});

app.get('/register', (req, res) => {
    res.send('<form method="POST"><input type="text" name="username" placeholder="Username"/><input type="password" name="password" placeholder="Password"/><button type="submit">Register</button></form>');
});

app.post('/register', async (req, res) => {
    const { username, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ username, password: hashedPassword });
    await user.save();
    res.redirect('/login');
});

app.get('/dashboard', requireLogin, (req, res) => {
    res.send('<h1>Welcome to your dashboard</h1><a href="/logout">Logout</a>');
});

app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/login');
});

// Start Server
app.listen(3000, () => {
    console.log('Server is running on port 3000');
});
