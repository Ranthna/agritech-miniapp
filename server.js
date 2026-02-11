const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Database setup
const dbPath = path.join(__dirname, '../database/db.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) console.error('Database connection error:', err);
    else console.log('Connected to SQLite database');
});

// Create tables
db.serialize(() => {
    // Users table
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        telegramId TEXT UNIQUE,
        name TEXT NOT NULL,
        phone TEXT NOT NULL,
        location TEXT,
        registeredAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Bookings table
    db.run(`CREATE TABLE IF NOT EXISTS bookings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId INTEGER,
        name TEXT,
        age INTEGER,
        address TEXT,
        farmSize REAL,
        equipment TEXT,
        serviceDate DATE,
        status TEXT DEFAULT 'pending',
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (userId) REFERENCES users(id)
    )`);

    // Processing guides table
    db.run(`CREATE TABLE IF NOT EXISTS processingGuides (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId INTEGER,
        question TEXT,
        response TEXT,
        type TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (userId) REFERENCES users(id)
    )`);
});

// Routes
// Register/Get User
app.post('/api/register', (req, res) => {
    const { telegramId, name, phone, location } = req.body;

    const sql = `INSERT OR REPLACE INTO users (telegramId, name, phone, location) 
                 VALUES (?, ?, ?, ?)`;

    db.run(sql, [telegramId, name, phone, location], function (err) {
        if (err) {
            return res.status(500).json({ success: false, error: err.message });
        }
        res.json({
            success: true,
            userId: this.lastID,
            message: 'Registration successful'
        });
    });
});

// Get user profile
app.get('/api/user/:telegramId', (req, res) => {
    const { telegramId } = req.params;
    const sql = 'SELECT * FROM users WHERE telegramId = ?';

    db.get(sql, [telegramId], (err, row) => {
        if (err) {
            return res.status(500).json({ success: false, error: err.message });
        }
        res.json({ success: true, data: row });
    });
});

// Book service
app.post('/api/bookings', (req, res) => {
    const { userId, name, age, address, farmSize, equipment, serviceDate } = req.body;

    const sql = `INSERT INTO bookings (userId, name, age, address, farmSize, equipment, serviceDate) 
                 VALUES (?, ?, ?, ?, ?, ?, ?)`;

    db.run(sql, [userId, name, age, address, farmSize, equipment, serviceDate], function (err) {
        if (err) {
            return res.status(500).json({ success: false, error: err.message });
        }
        res.json({
            success: true,
            bookingId: this.lastID,
            message: 'Booking created successfully'
        });
    });
});

// Get user bookings
app.get('/api/bookings/:userId', (req, res) => {
    const { userId } = req.params;
    const sql = 'SELECT * FROM bookings WHERE userId = ? ORDER BY createdAt DESC';

    db.all(sql, [userId], (err, rows) => {
        if (err) {
            return res.status(500).json({ success: false, error: err.message });
        }
        res.json({ success: true, data: rows });
    });
});

// Save processing question & response
app.post('/api/processing', (req, res) => {
    const { userId, question, response, type } = req.body;

    const sql = `INSERT INTO processingGuides (userId, question, response, type) 
                 VALUES (?, ?, ?, ?)`;

    db.run(sql, [userId, question, response, type], function (err) {
        if (err) {
            return res.status(500).json({ success: false, error: err.message });
        }
        res.json({
            success: true,
            guideId: this.lastID,
            message: 'Processing guide saved'
        });
    });
});

// Get user processing history
app.get('/api/processing/:userId', (req, res) => {
    const { userId } = req.params;
    const sql = 'SELECT * FROM processingGuides WHERE userId = ? ORDER BY createdAt DESC';

    db.all(sql, [userId], (err, rows) => {
        if (err) {
            return res.status(500).json({ success: false, error: err.message });
        }
        res.json({ success: true, data: rows });
    });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

// Close database on exit
process.on('SIGINT', () => {
    db.close((err) => {
        if (err) console.error('Error closing database:', err);
        console.log('Database connection closed');
        process.exit(0);
    });
});

module.exports = { app, db };