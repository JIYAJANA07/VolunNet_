const Notification = require("../models/Notification");
const User = require("../models/User");
const mongoose = require("mongoose");

const { sendNotification } = require("../services/notificationService");

// Save FCM token
const saveFcmToken = async (req, res) => {
    try {
        const { fcmToken } = req.body;

        if (!fcmToken) {
            return res.status(400).json({
                success: false,
                message: "fcmToken is required"
            });
        }

        if (!req.user || !req.user.id) {
            return res.status(401).json({
                success: false,
                message: "Authentication required"
            });
        }

        const user = await User.findByIdAndUpdate(
            req.user.id,
            { fcmToken },
            { new: true }
        );

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "FCM token saved successfully"
        });

    } catch (error) {
        console.error("FCM token error:", error);

        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


const Signup = require("../models/Signup");
const Event = require("../models/Event");

// Create and send notification (supports individual user or event reminder to all volunteers)
const createNotification = async (req, res) => {
    try {
        const { user, eventId, title, message, type } = req.body;

        if (!title || !message) {
            return res.status(400).json({
                success: false,
                message: "title and message are required"
            });
        }

        // Event reminder: Send to all volunteers signed up for the event
        if (eventId) {
            if (!mongoose.Types.ObjectId.isValid(eventId)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid event ID"
                });
            }

            const event = await Event.findById(eventId);
            if (!event) {
                return res.status(404).json({
                    success: false,
                    message: "Event not found"
                });
            }

            const signups = await Signup.find({ event: eventId, status: "registered" }).populate("user");

            if (signups.length === 0) {
                return res.status(200).json({
                    success: true,
                    message: "No registered volunteers found for this event",
                    notificationsSent: 0
                });
            }

            const notifications = [];
            for (const signup of signups) {
                if (signup.user) {
                    const notif = await Notification.create({
                        user: signup.user._id,
                        title: title || `Reminder: ${event.title}`,
                        message: message,
                        type: type || "event_reminder"
                    });
                    notifications.push(notif);

                    if (signup.user.fcmToken) {
                        await sendNotification(
                            signup.user.fcmToken,
                            title || `Reminder: ${event.title}`,
                            message,
                            {
                                eventId: event._id.toString(),
                                notificationId: notif._id.toString(),
                                type: type || "event_reminder"
                            }
                        );
                    }
                }
            }

            return res.status(201).json({
                success: true,
                message: `Event reminders sent to ${notifications.length} volunteer(s)`,
                count: notifications.length,
                notifications
            });
        }

        // Single user notification
        if (!user) {
            return res.status(400).json({
                success: false,
                message: "Either user ID or eventId is required"
            });
        }

        if (!mongoose.Types.ObjectId.isValid(user)) {
            return res.status(400).json({
                success: false,
                message: "Invalid user ID"
            });
        }

        const existingUser = await User.findById(user);

        if (!existingUser) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        const notification = await Notification.create({
            user,
            title,
            message,
            type: type || "general"
        });

        let pushResult = {
            success: false,
            message: "No FCM token available"
        };

        if (existingUser.fcmToken) {
            pushResult = await sendNotification(
                existingUser.fcmToken,
                title,
                message,
                {
                    notificationId: notification._id.toString(),
                    type: type || "general"
                }
            );
        }

        res.status(201).json({
            success: true,
            message: "Notification created successfully",
            notification,
            pushNotification: pushResult
        });

    } catch (error) {
        console.error("Notification controller error:", error);

        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


// Get logged-in user's notifications
const getNotifications = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: "User not authenticated"
            });
        }

        const userId = req.user.id || req.user._id;

        const notifications = await Notification.find({
            user: userId
        }).sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            notifications
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


// Mark notification as read
const markAsRead = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: "User not authenticated"
            });
        }

        const userId = req.user.id || req.user._id;
        const notificationId = req.params.id;

        if (!mongoose.Types.ObjectId.isValid(notificationId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid notification ID"
            });
        }

        const notification = await Notification.findOneAndUpdate(
            {
                _id: notificationId,
                user: userId
            },
            {
                isRead: true
            },
            {
                new: true
            }
        );

        if (!notification) {
            return res.status(404).json({
                success: false,
                message: "Notification not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Notification marked as read",
            notification
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


module.exports = {
    saveFcmToken,
    createNotification,
    getNotifications,
    markAsRead
};