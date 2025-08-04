// models/PriteScore.js
const mongoose = require('mongoose');

const SectionSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    percentile: {
        type: Number,
        required: true,
        min: 0,
        max: 99
    }
});

const PriteScoreSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    year: {
        type: String,
        required: true
    },
    overallPercentile: {
        type: Number,
        required: true,
        min: 0,
        max: 99
    },
    psychiatryPercentile: {
        type: Number,
        min: 0,
        max: 99
    },
    neurosciencePercentile: {
        type: Number,
        min: 0,
        max: 99
    },
    somaPercentile: {
        type: Number,
        min: 0,
        max: 99
    },
    growthPercentile: {
        type: Number,
        min: 0,
        max: 99
    },
    sections: [SectionSchema],
    notes: {
        type: String
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Update timestamp on save
PriteScoreSchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    next();
});

module.exports = mongoose.model('PriteScore', PriteScoreSchema);