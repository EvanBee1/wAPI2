const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const session = require('express-session');
const crypto = require('crypto');
const path = require('path');

// MongoDB connection
const db = "mongodb+srv://Evan123:gVAiz75v4sWdSUNR@clusters.9vnj1il.mongodb.net/";

mongoose.connect(db).then(() => {
    console.log("Connected to database");
}).catch(() => {
    console.log("Can't connect to database");
});

// Define User Schema
const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    resetToken: { type: String, default: '' },
    resetTokenExpiration: { type: Date }
});

const User = mongoose.model('User', userSchema);

// Setup Express
const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({ secret: 'secret', resave: false, saveUninitialized: false }));

app.set('view engine', 'ejs');

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Middleware to protect routes
const requireLogin = (req, res, next) => {
    if (!req.session.userId) {
        return res.redirect('/login');
    }
    next();
};

// Routes
app.get('/', (req, res) => {
    res.render('index');
});

app.get('/login', (req, res) => {
    res.render('login');
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
    res.render('register');
});

app.post('/register', async (req, res) => {
    const { username, email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    try {
        const user = new User({ username, email, password: hashedPassword });
        await user.save();
        res.redirect('/login');
    } catch (error) {
        if (error.code === 11000) { // Duplicate key error code
            // Handle duplicate username error
            res.status(400).send('Username already exists. Please choose a different username.');
        } else {
            // Handle other errors
            res.status(500).send('Internal Server Error');
        }
    }
});


app.get('/dashboard', requireLogin, (req, res) => {
    res.send('<h1>Welcome to your dashboard</h1><a href="/logout">Logout</a>');
});

app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/login');
});

app.get('/request-reset', (req, res) => {
    res.render('request-reset');
});

app.post('/request-reset', async (req, res) => {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
        res.send('No user with that email');
        return;
    }
    user.resetToken = crypto.randomBytes(32).toString('hex');
    user.resetTokenExpiration = Date.now() + 3600000; // Token valid for 1 hour
    await user.save();
    // Here you would normally send an email with the token, but we'll skip that step.
    res.send(`Password reset link: http://localhost:3000/reset-password?token=${user.resetToken}`);
});

app.get('/reset-password', async (req, res) => {
    const token = req.query.token;
    const user = await User.findOne({ resetToken: token, resetTokenExpiration: { $gt: Date.now() } });
    if (!user) {
        res.send('Token is invalid or has expired');
        return;
    }
    res.render('reset-password', { token });
});

app.post('/reset-password', async (req, res) => {
    const { token, password } = req.body;
    const user = await User.findOne({ resetToken: token, resetTokenExpiration: { $gt: Date.now() } });
    if (!user) {
        res.send('Token is invalid or has expired');
        return;
    }
    user.password = await bcrypt.hash(password, 10);
    user.resetToken = undefined;
    user.resetTokenExpiration = undefined;
    await user.save();
    res.send('Password has been reset. You can now <a href="/login">login</a> with the new password.');
});

// Start Server
app.listen(3000, () => {
    console.log('Server is running on port 3000');
});
