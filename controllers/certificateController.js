const Certificate = require("../models/Certificate");
const User = require("../models/User");
const Event = require("../models/Event");
const crypto = require("crypto");

// Get logged-in user's certificates
const getMyCertificates = async (req, res) => {
    try {
        const userId = req.user.id || req.user._id;

        const certificates = await Certificate.find({ user: userId })
            .populate("event", "title location date")
            .populate("issuedBy", "name")
            .sort({ issueDate: -1 });

        res.status(200).json({
            success: true,
            count: certificates.length,
            certificates
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error fetching certificates",
            error: error.message
        });
    }
};

// Get certificates by user ID
const getUserCertificates = async (req, res) => {
    try {
        const { userId } = req.params;

        const certificates = await Certificate.find({ user: userId })
            .populate("event", "title location date")
            .populate("issuedBy", "name")
            .sort({ issueDate: -1 });

        res.status(200).json({
            success: true,
            count: certificates.length,
            certificates
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error fetching user certificates",
            error: error.message
        });
    }
};

// Issue certificate (Admin only)
const issueCertificate = async (req, res) => {
    try {
        const { userId, eventId, title, description, hoursLogged } = req.body;

        if (!userId || !title) {
            return res.status(400).json({
                success: false,
                message: "userId and title are required"
            });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        const certificateNumber = `CERT-${Date.now()}-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;

        const certificate = await Certificate.create({
            user: userId,
            event: eventId || null,
            title,
            description: description || `Certificate of Appreciation for volunteer services`,
            certificateNumber,
            hoursLogged: hoursLogged || 0,
            issuedBy: req.user.id
        });

        res.status(201).json({
            success: true,
            message: "Certificate issued successfully",
            certificate
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error issuing certificate",
            error: error.message
        });
    }
};

module.exports = {
    getMyCertificates,
    getUserCertificates,
    issueCertificate
};
