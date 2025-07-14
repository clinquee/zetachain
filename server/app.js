const express = require("express");
const cors = require("cors");
const chatRoutes = require("./routes/chat");
const dotenv = require("dotenv");
const app = express();
dotenv.config();

// Middleware
app.use(
    cors({
        origin: ["http://localhost:3000", "http://127.0.0.1:3000"],
        credentials: true,
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization"],
    })
);

// Handle preflight requests
app.options("*", cors());

app.use(express.json());

// Test route to verify server is working
app.get("/api/health", (req, res) => {
    res.json({ status: "OK", message: "Server is running" });
});

// Routes
app.use("/api/chat", chatRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: "Something went wrong!" });
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/api/health`);
});

module.exports = app;
