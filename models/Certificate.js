const mongoose = require("mongoose");

const certificateSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        event: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Event",
            default: null
        },
        title: {
            type: String,
            required: true
        },
        description: {
            type: String,
            default: ""
        },
        certificateNumber: {
            type: String,
            required: true,
            unique: true
        },
        hoursLogged: {
            type: Number,
            default: 0
        },
        issuedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },
        issueDate: {
            type: Date,
            default: Date.now
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("Certificate", certificateSchema);
