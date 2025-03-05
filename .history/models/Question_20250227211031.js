// models/Question.js
const mongoose = require('mongoose');

const StudyDataSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    interval: {
        type: Number,
        default: 0
    },
    easeFactor: {
        type: Number,
        default: 2.5
    },
    repetitions: {
        type: Number,
        default: 0
    },
    reviewedDate: Date,
    nextReviewDate: {
        type: Date,
        default: Date.now
    }
});

const QuestionSchema = new mongoose.Schema({
    creator: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    text: {
        type: String,
        required: true
    },
    options: {
        A: { type: String, required: true },
        B: { type: String, required: true },
        C: { type: String },
        D: { type: String },
        E: { type: String }
    },
    correctAnswer: {
        type: String,
        required: true,
        enum: ['A', 'B', 'C', 'D', 'E']
    },
    explanation: {
        type: String
    },
    part: {
        type: String,
        enum: ['1', '2'],
        default: '1'
    },
    category: {
        type: String
    },
    isPublic: {
        type: Boolean,
        default: false
    },
    tags: [String],
    studyData: [StudyDataSchema],
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Index for better search performance
QuestionSchema.index({ text: 'text', category: 1, part: 1, isPublic: 1 });

// Update timestamp on save
QuestionSchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    next();
});

module.exports = mongoose.model('Question', QuestionSchema);