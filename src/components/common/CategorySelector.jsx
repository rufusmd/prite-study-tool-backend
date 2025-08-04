// src/components/common/CategorySelector.jsx
import { useState, useEffect } from 'react';

// PRITE categories from the original application
const PRITE_CATEGORIES = [
    "Development & Maturation",
    "Behavioral & Social Sciences",
    "Epidemiology",
    "Diagnostic Procedures",
    "Psychopathology & Associated Conditions",
    "Treatment across the Lifespan",
    "Consultation/Collaborative Integrated Care",
    "Issues in Practice",
    "Research & Scholarship Literacy",
    "Administration and Systems"
];

const CategorySelector = ({ selectedCategory, onChange, showEmptyOption = true, className = '' }) => {
    return (
        <select
            value={selectedCategory || ''}
            onChange={(e) => onChange(e.target.value)}
            className={`input ${className}`}
        >
            {showEmptyOption && (
                <option value="">-- Select a category --</option>
            )}

            {PRITE_CATEGORIES.map((category) => (
                <option key={category} value={category}>
                    {category}
                </option>
            ))}
        </select>
    );
};

export default CategorySelector;