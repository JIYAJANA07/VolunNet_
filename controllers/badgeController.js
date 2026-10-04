const Badge = require("../models/Badge");
const Hour = require("../models/Hour");
const User = require("../models/User");

// Tier definitions
const TIERS = [
    { tier: "bronze", title: "Bronze Volunteer", hoursRequired: 5, description: "Completed at least 5 hours of volunteer service" },
    { tier: "silver", title: "Silver Volunteer", hoursRequired: 20, description: "Completed at least 20 hours of volunteer service" },
    { tier: "gold", title: "Gold Volunteer", hoursRequired: 50, description: "Completed at least 50 hours of volunteer service" },
    { tier: "platinum", title: "Platinum Volunteer", hoursRequired: 100, description: "Completed at least 100 hours of volunteer service" }
];

const mongoose = require("mongoose");

// Helper to auto-award badges based on total volunteer hours
const syncUserBadges = async (userId) => {
    const userObjectId = typeof userId === "string" ? new mongoose.Types.ObjectId(userId) : userId;

    const hours = await Hour.aggregate([
        { $match: { user: userObjectId } },
        { $group: { _id: null, totalHours: { $sum: "$hours" } } }
    ]);

    const totalHours = hours.length > 0 ? hours[0].totalHours : 0;
    const existingBadges = await Badge.find({ user: userId });
    const existingTiers = new Set(existingBadges.map(b => b.tier));

    for (const t of TIERS) {
        if (totalHours >= t.hoursRequired && !existingTiers.has(t.tier)) {
            await Badge.create({
                user: userId,
                title: t.title,
                description: t.description,
                tier: t.tier,
                hoursRequired: t.hoursRequired
            });
        }
    }

    return Badge.find({ user: userId }).sort({ hoursRequired: 1 });
};

// Get current user badges
const getMyBadges = async (req, res) => {
    try {
        const userId = req.user.id || req.user._id;
        const badges = await syncUserBadges(userId);

        res.status(200).json({
            success: true,
            count: badges.length,
            badges
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error fetching badges",
            error: error.message
        });
    }
};

// Get badges by user ID
const getUserBadges = async (req, res) => {
    try {
        const { userId } = req.params;
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        const badges = await syncUserBadges(user._id);

        res.status(200).json({
            success: true,
            user: { id: user._id, name: user.name },
            count: badges.length,
            badges
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error fetching user badges",
            error: error.message
        });
    }
};

module.exports = {
    getMyBadges,
    getUserBadges
};
