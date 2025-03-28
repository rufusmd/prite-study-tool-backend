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
        E: { type: String },
        F: { type: String },
        G: { type: String },
        H: { type: String },
        I: { type: String },
        J: { type: String },
        K: { type: String },
        L: { type: String },
        M: { type: String },
        N: { type: String },
        O: { type: String }
    },
    // For standard questions with a single correct answer
    correctAnswer: {
        type: String,
        enum: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', ''],
        default: ''
    },
    // For questions with multiple correct answers
    correctAnswers: {
        type: [String],
        default: []
    },
    explanation: {
        type: String
    },
    generatedExplanation: {
        type: String,
        default: ''
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
    // New field for question type
    questionType: {
        type: String,
        enum: ['standard', 'fourOptions', 'multipleCorrect'],
        default: 'standard'
    },
    // For instructions specific to this question type
    instructions: {
        type: String,
        default: ''
    },
    // Number of correct answers expected (for multipleCorrect type)
    numCorrectAnswers: {
        type: Number,
        default: 1
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
    },
    number: {
        type: String
    },
    year: {
        type: String
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