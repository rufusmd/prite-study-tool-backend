// models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const SettingsSchema = new mongoose.Schema({
    shareUsageData: {
        type: Boolean,
        default: false
    },
    publicProfile: {
        type: Boolean,
        default: false
    },
    notificationsEnabled: {
        type: Boolean,
        default: true
    },
    questionsPerSession: {
        type: Number,
        default: 20
    },
    showExplanations: {
        type: Boolean,
        default: true
    }
});

const UserSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    password: {
        type: String,
        required: true
    },
    displayName: {
        type: String,
        trim: true
    },
    pgyLevel: {
        type: String,
        enum: ['1', '2', '3', '4', '5', '6+', 'Fellow', 'Attending', 'Other', '']
    },
    specialty: {
        type: String,
        default: 'Psychiatry'
    },
    institution: {
        type: String
    },
    isAdmin: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    lastLogin: {
        type: Date,
        default: Date.now
    },
    onboardingStep: {
        type: Number,
        default: 0
    },
    onboardingComplete: {
        type: Boolean,
        default: false
    },
    settings: {
        type: SettingsSchema,
        default: () => ({})
    }
});

// Hash password before saving
UserSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();

    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Method to compare password
UserSchema.methods.comparePassword = async function (candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);