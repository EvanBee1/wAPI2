const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const session = require('express-session');
const crypto = require('crypto');
const path = require('path');
let fetch;
(async () => {
    const { default: fetchModule } = await import('node-fetch');
    fetch = fetchModule;
})();
// MongoDB connection
const db = "mongodb+srv://Evan123:gVAiz75v4sWdSUNR@clusters.9vnj1il.mongodb.net/";

mongoose.connect(db, {
    serverSelectionTimeoutMS: 10000, // Timeout after 10 seconds
}).then(() => {
    console.log("Connected to MongoDB");
}).catch((err) => {
    console.error("Error connecting to MongoDB:", err.message);
});

// Define User Schema
const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    resetToken: { type: String, default: '' },
    resetTokenExpiration: { type: Date },
    searchHistory: { type: [String], default: [] },  // Add this line
    videoHistory: { type: [String], default: [] }    // Add this line
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

//login
app.get('/login', (req, res) => {
    res.render('login');
});

app.get('/', (req, res) => {
    const { userId, username } = req.session; // Extract both userId and username from the session
    res.render('index', { userId, username });
});

app.get('/history', requireLogin, async (req, res) => {
    try {
        const user = await User.findById(req.session.userId);
        res.render('history', { 
            userId: req.session.userId, 
            username: req.session.username, 
            searchHistory: user.searchHistory, 
            videoHistory: user.videoHistory 
        });
    } catch (error) {
        console.error('Error fetching user history:', error);
        res.status(500).send('Internal Server Error');
    }
});


app.get('/favorites', (req, res) => {
    const { userId, username } = req.session; // Extract both userId and username from the session
    res.render('favorites', { userId, username });
});


app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const user = await User.findOne({ username });
        if (user && await bcrypt.compare(password, user.password)) {
            req.session.userId = user._id;
            req.session.username = user.username; // Save the username in the session

            // Fetch the logged-in user's details and render or redirect as needed
            const loggedInUser = await User.findById(user._id); // Fetch user details

            // Log user details to the console
            console.log('User logged in:', loggedInUser);

            // Here you can use `loggedInUser` to customize the response or render
            res.redirect('/');
        } else {
            res.redirect('/login');
        }
    } catch (error) {
        console.error('Error logging in:', error);
        res.status(500).send('Internal Server Error');
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
    res.redirect('/');
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

// Route to handle YouTube video search
app.get('/search', async (req, res) => {
    const { query } = req.query;
    try {
        const response = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&q=${query}&key=AIzaSyDnJmxP8a2QFQZOJ8QTwsxLtiVfcpzkSik&type=video`);
        const data = await response.json();
        res.json({ items: data.items });
    } catch (error) {
        console.error('Error fetching YouTube data:', error);
        res.status(500).json({ error: 'Error fetching YouTube data' });
    }
});

// Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
