// src/constants/categories.js

export const PRITE_CATEGORIES = [
    "Neuroscience",
    "Development",
    "Psychopathology",
    "Psychotherapy",
    "Somatic Treatments",
    "Epidemiology",
    "Genetics",
    "Ethics",
    "Practice Management",
    "Substance Use Disorders",
    "Schizophrenia Spectrum",
    "Bipolar Disorders",
    "Depressive Disorders",
    "Anxiety Disorders",
    "Obsessive-Compulsive Disorders",
    "Trauma-Related Disorders",
    "Eating Disorders",
    "Sleep-Wake Disorders",
    "Sexual Dysfunctions",
    "Gender Dysphoria",
    "Personality Disorders",
    "Neurocognitive Disorders",
    "Child Psychiatry",
    "Geriatric Psychiatry",
    "Consultation-Liaison",
    "Emergency Psychiatry",
    "Forensic Psychiatry",
    "Community Psychiatry",
    "Cultural Psychiatry",
    "Research Methods",
    "Psychopharmacology",
    "Neurodevelopmental Disorders",
    "Disruptive Disorders",
    "Other"
];

// Function to get categories for dropdown menus
export const getCategoryOptions = () => {
    return PRITE_CATEGORIES.map(category => ({
        value: category,
        label: category
    }));
};