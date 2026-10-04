const jwt = require("jsonwebtoken");
const admin = require("../firebase/firebase");
const User = require("../models/User");

const authMiddleware = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                message: "Access denied. Token required."
            });
        }

        const token = authHeader.split(" ")[1];

        // 1. Try custom JWT verification first
        try {
            const decoded = jwt.verify(
                token,
                process.env.JWT_SECRET
            );

            req.user = decoded;
            return next();
        } catch (jwtError) {
            // 2. If JWT fails, attempt Firebase ID Token verification if Firebase Admin is initialized
            if (admin.apps && admin.apps.length > 0) {
                try {
                    const decodedFirebase = await admin.auth().verifyIdToken(token);
                    let user = await User.findOne({
                        $or: [
                            { firebaseUid: decodedFirebase.uid },
                            { email: decodedFirebase.email }
                        ]
                    });

                    if (!user) {
                        user = await User.create({
                            name: decodedFirebase.name || (decodedFirebase.email ? decodedFirebase.email.split("@")[0] : "Firebase User"),
                            email: decodedFirebase.email || `${decodedFirebase.uid}@firebase.volunnet`,
                            firebaseUid: decodedFirebase.uid,
                            role: "volunteer"
                        });
                    }

                    req.user = {
                        id: user._id,
                        _id: user._id,
                        role: user.role,
                        email: user.email,
                        firebaseUid: decodedFirebase.uid
                    };

                    return next();
                } catch (fbError) {
                    // Both custom JWT and Firebase token verification failed
                }
            }

            return res.status(401).json({
                message: "Invalid or expired token"
            });
        }

    } catch (error) {
        return res.status(401).json({
            message: "Authentication failed",
            error: error.message
        });
    }
};

module.exports = authMiddleware;