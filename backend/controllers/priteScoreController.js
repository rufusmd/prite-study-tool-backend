// controllers/priteScoreController.js
const PriteScore = require('../models/PriteScore');

// Get all PRITE scores for the current user
exports.getUserScores = async (req, res) => {
    try {
        const scores = await PriteScore.find({ userId: req.user.id })
            .sort({ year: -1 }) // Sort by year descending (newest first)
            .exec();

        res.json({
            success: true,
            scores
        });
    } catch (error) {
        console.error('Error fetching PRITE scores:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// Get a single PRITE score by ID
exports.getScoreById = async (req, res) => {
    try {
        const score = await PriteScore.findById(req.params.id);

        // Check if score exists
        if (!score) {
            return res.status(404).json({
                success: false,
                message: 'Score not found'
            });
        }

        // Check if user is authorized to access this score
        if (score.userId.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to access this score'
            });
        }

        res.json({
            success: true,
            score
        });
    } catch (error) {
        console.error('Error fetching PRITE score:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// Create a new PRITE score
exports.createScore = async (req, res) => {
    try {
        const {
            year,
            overallPercentile,
            psychiatryPercentile,
            neurosciencePercentile,
            somaPercentile,
            growthPercentile,
            sections,
            notes
        } = req.body;

        // Validate required fields
        if (!year || overallPercentile === undefined) {
            return res.status(400).json({
                success: false,
                message: 'Year and overall percentile are required'
            });
        }

        // Create new score
        const newScore = new PriteScore({
            userId: req.user.id,
            year,
            overallPercentile,
            psychiatryPercentile: psychiatryPercentile || null,
            neurosciencePercentile: neurosciencePercentile || null,
            somaPercentile: somaPercentile || null,
            growthPercentile: growthPercentile || null,
            sections: sections || [],
            notes: notes || ''
        });

        await newScore.save();

        res.status(201).json({
            success: true,
            score: newScore
        });
    } catch (error) {
        console.error('Error creating PRITE score:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// Update a PRITE score
exports.updateScore = async (req, res) => {
    try {
        let score = await PriteScore.findById(req.params.id);

        // Check if score exists
        if (!score) {
            return res.status(404).json({
                success: false,
                message: 'Score not found'
            });
        }

        // Check if user is authorized to update this score
        if (score.userId.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to update this score'
            });
        }

        // Update fields
        const {
            year,
            overallPercentile,
            psychiatryPercentile,
            neurosciencePercentile,
            somaPercentile,
            growthPercentile,
            sections,
            notes
        } = req.body;

        if (year) score.year = year;
        if (overallPercentile !== undefined) score.overallPercentile = overallPercentile;
        if (psychiatryPercentile !== undefined) score.psychiatryPercentile = psychiatryPercentile;
        if (neurosciencePercentile !== undefined) score.neurosciencePercentile = neurosciencePercentile;
        if (somaPercentile !== undefined) score.somaPercentile = somaPercentile;
        if (growthPercentile !== undefined) score.growthPercentile = growthPercentile;
        if (sections) score.sections = sections;
        if (notes !== undefined) score.notes = notes;

        await score.save();

        res.json({
            success: true,
            score
        });
    } catch (error) {
        console.error('Error updating PRITE score:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// Delete a PRITE score
exports.deleteScore = async (req, res) => {
    try {
        const score = await PriteScore.findById(req.params.id);

        // Check if score exists
        if (!score) {
            return res.status(404).json({
                success: false,
                message: 'Score not found'
            });
        }

        // Check if user is authorized to delete this score
        if (score.userId.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to delete this score'
            });
        }

        await score.remove();

        res.json({
            success: true,
            message: 'Score deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting PRITE score:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};