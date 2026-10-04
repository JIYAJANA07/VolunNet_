const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const admin = require("../firebase/firebase");

const register = async (req, res) => {
    try {
        const { name, email, password, role, idToken } = req.body;

        // Support Firebase Auth registration
        if (idToken) {
            if (!admin.apps || admin.apps.length === 0) {
                return res.status(500).json({
                    message: "Firebase Admin is not configured"
                });
            }

            const decoded = await admin.auth().verifyIdToken(idToken);
            const userEmail = email || decoded.email;

            let existingUser = await User.findOne({
                $or: [{ firebaseUid: decoded.uid }, { email: userEmail }]
            });

            if (existingUser) {
                return res.status(400).json({
                    message: "User already exists"
                });
            }

            const user = await User.create({
                name: name || decoded.name || userEmail.split("@")[0],
                email: userEmail,
                firebaseUid: decoded.uid,
                role: role || "volunteer"
            });

            const token = jwt.sign(
                { id: user._id, role: user.role },
                process.env.JWT_SECRET,
                { expiresIn: "1d" }
            );

            return res.status(201).json({
                message: "User registered successfully with Firebase",
                token,
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role
                }
            });
        }

        // Standard Email & Password registration
        if (!name || !email || !password) {
            return res.status(400).json({
                message: "Name, email and password are required"
            });
        }

        const existingUser = await User.findOne({ email });

        if (existingUser) {
            return res.status(400).json({
                message: "User already exists"
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await User.create({
            name,
            email,
            password: hashedPassword,
            role: role || "volunteer"
        });

        res.status(201).json({
            message: "User registered successfully",
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });

    } catch (error) {
        res.status(500).json({
            message: "Registration failed",
            error: error.message
        });
    }
};

const login = async (req, res) => {
    try {
        const { email, password, idToken } = req.body;

        // Support Firebase Auth login via idToken
        if (idToken) {
            if (!admin.apps || admin.apps.length === 0) {
                return res.status(500).json({
                    message: "Firebase Admin is not configured"
                });
            }

            const decoded = await admin.auth().verifyIdToken(idToken);
            let user = await User.findOne({
                $or: [{ firebaseUid: decoded.uid }, { email: decoded.email }]
            });

            if (!user) {
                user = await User.create({
                    name: decoded.name || (decoded.email ? decoded.email.split("@")[0] : "Firebase User"),
                    email: decoded.email,
                    firebaseUid: decoded.uid,
                    role: "volunteer"
                });
            }

            const token = jwt.sign(
                { id: user._id, role: user.role },
                process.env.JWT_SECRET,
                { expiresIn: "1d" }
            );

            return res.json({
                message: "Firebase login successful",
                token,
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role
                }
            });
        }

        // Standard Email & Password login
        if (!email || !password) {
            return res.status(400).json({
                message: "Email and password are required"
            });
        }

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(401).json({
                message: "Invalid email or password"
            });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(401).json({
                message: "Invalid email or password"
            });
        }

        const token = jwt.sign(
            {
                id: user._id,
                role: user.role
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "1d"
            }
        );

        res.json({
            message: "Login successful",
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });

    } catch (error) {
        res.status(500).json({
            message: "Login failed",
            error: error.message
        });
    }
};

module.exports = {
    register,
    login
};