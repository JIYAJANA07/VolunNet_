const mongoose = require("mongoose");

const badgeSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        title: {
            type: String,
            required: true
        },
        description: {
            type: String,
            default: ""
        },
        tier: {
            type: String,
            enum: ["bronze", "silver", "gold", "platinum"],
            default: "bronze"
        },
        hoursRequired: {
            type: Number,
            default: 0
        },
        awardedAt: {
            type: Date,
            default: Date.now
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("Badge", badgeSchema);
