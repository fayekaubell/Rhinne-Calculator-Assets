// Wallpaper calculation utilities
// Extracted and adapted from the comprehensive calculator logic

// Constants for calculations
const CALCULATION_DEFAULTS = {
    minOverage: 4, // Universal 4" overage in inches
    minYardOrder: 5, // Minimum yard order for yard-based patterns
    yardMultiplier: 36, // Inches per yard
    maxPanelLength: 27 * 12 // Maximum panel length in inches (27 feet)
};

/**
 * Calculate wallpaper requirements for yard-based patterns
 * @param {Object} pattern - Pattern object with dimensions and properties
 * @param {number} wallWidth - Wall width in inches
 * @param {number} wallHeight - Wall height in inches
 * @returns {Object} Calculation results
 */
function calculateYardRequirements(pattern, wallWidth, wallHeight) {
    const totalWidth = wallWidth + CALCULATION_DEFAULTS.minOverage;
    const totalHeight = wallHeight + CALCULATION_DEFAULTS.minOverage;
    
    console.log('🔢 Yard calculation debug:', {
        wallWidth,
        wallHeight,
        minOverage: CALCULATION_DEFAULTS.minOverage,
        totalWidth,
        totalHeight,
        repeatHeight: pattern.repeat_height_inches,
        materialWidth: pattern.material_width_inches
    });
    
    // Safety checks to prevent calculation errors
    if (!pattern.repeat_height_inches || pattern.repeat_height_inches <= 0) {
        console.error('Invalid repeat height for yard calculation');
        return {
            stripsNeeded: 1,
            stripLengthInches: 120,
            stripLengthYards: 4,
            totalYardage: CALCULATION_DEFAULTS.minYardOrder,
            totalWidth: pattern.material_width_inches || 54,
            totalHeight: 120,
            saleType: 'yard'
        };
    }
    
    if (!pattern.material_width_inches || pattern.material_width_inches <= 0) {
        console.error('Invalid material width for yard calculation');
        return {
            stripsNeeded: 1,
            stripLengthInches: 120,
            stripLengthYards: 4,
            totalYardage: CALCULATION_DEFAULTS.minYardOrder,
            totalWidth: 54,
            totalHeight: 120,
            saleType: 'yard'
        };
    }
    
    // Calculate vertical repeats needed and strip length
    let repeatsNeeded;
    if (pattern.pattern_match === 'half drop') {
        // For half drop, we need extra length for pattern matching
        repeatsNeeded = Math.ceil(totalHeight / pattern.repeat_height_inches) + 1;
    } else {
        // For straight match
        repeatsNeeded = Math.ceil(totalHeight / pattern.repeat_height_inches);
    }
    
    const stripLengthInches = repeatsNeeded * pattern.repeat_height_inches;
    
    // Calculate number of strips needed to cover wall width
    const stripsNeeded = Math.ceil(totalWidth / pattern.material_width_inches);
    
    // Calculate total yardage: (strip length × strips needed) / 36, rounded up, minimum from pattern
    const totalYardageRaw = (stripLengthInches * stripsNeeded) / CALCULATION_DEFAULTS.yardMultiplier;
    const totalYardage = Math.max(Math.ceil(totalYardageRaw), pattern.min_yard_order || CALCULATION_DEFAULTS.minYardOrder);
    
    console.log('📊 Yard calculation result:', {
        repeatsNeeded,
        stripLengthInches,
        stripsNeeded,
        totalYardageRaw,
        totalYardage,
        totalWidth: stripsNeeded * pattern.material_width_inches,
        totalHeight: stripLengthInches
    });
    
    return {
        stripsNeeded: stripsNeeded,
        stripLengthInches: stripLengthInches,
        stripLengthYards: Math.ceil(stripLengthInches / 12), // Convert to feet, rounded up
        totalYardage: totalYardage,
        totalWidth: stripsNeeded * pattern.material_width_inches,
        totalHeight: stripLengthInches,
        saleType: 'yard'
    };
}

/**
 * Calculate wallpaper requirements for panel-based patterns
 * @param {Object} pattern - Pattern object with dimensions and properties
 * @param {number} wallWidth - Wall width in inches
 * @param {number} wallHeight - Wall height in inches
 * @returns {Object} Calculation results
 */
function calculatePanelRequirements(pattern, wallWidth, wallHeight) {
    // Safety check
    if (!pattern || !pattern.sale_type) {
        console.error('Invalid pattern data');
        return {
            panelsNeeded: 1,
            panelLength: 10,
            totalWidth: 54,
            totalHeight: 120,
            saleType: 'panel'
        };
    }
    
    // If it's a yard-based pattern, use the yard calculation
    if (pattern.sale_type === 'yard') {
        return calculateYardRequirements(pattern, wallWidth, wallHeight);
    }
    
    const totalWidth = wallWidth + CALCULATION_DEFAULTS.minOverage;
    const totalHeight = wallHeight + CALCULATION_DEFAULTS.minOverage;
    
    console.log('🔢 Panel calculation debug:', {
        wallWidth,
        wallHeight,
        minOverage: CALCULATION_DEFAULTS.minOverage,
        totalWidth,
        totalHeight,
        totalHeightInFeet: totalHeight / 12,
        availableLengths: pattern.available_lengths || [9, 12, 15]
    });
    
    const panelsNeeded = Math.ceil(totalWidth / (pattern.panel_width_inches || 54));
    
    let panelLength = 0;
    const availableLengths = pattern.available_lengths || [9, 12, 15];
    
    console.log('🔍 Looking for panel length that covers', totalHeight, 'inches (', totalHeight / 12, 'feet)');
    
    for (let length of availableLengths) {
        console.log(` Checking length ${length}' (${length * 12}" total) vs needed ${totalHeight}"`);
        if (length * 12 >= totalHeight) {
            panelLength = length;
            console.log(` ✅ Selected ${length}' panel length`);
            break;
        } else {
            console.log(` ❌ ${length}' too short (${length * 12}" < ${totalHeight}")`);
        }
    }
    
    if (panelLength === 0) {
        const minLengthFeet = Math.ceil(totalHeight / 12);
        panelLength = Math.ceil(minLengthFeet / 3) * 3;
        console.log(`🔧 No standard length found, calculated custom length: ${panelLength}'`);
    }
    
    // Check for 27' limitation
    const totalHeightNeeded = totalHeight;
    const exceedsLimit = totalHeightNeeded > CALCULATION_DEFAULTS.maxPanelLength;
    const idealPanelLength = panelLength;
    const actualPanelLength = Math.min(panelLength, 27);
    const uncoveredHeight = exceedsLimit ? totalHeightNeeded - CALCULATION_DEFAULTS.maxPanelLength : 0;
    
    console.log('📋 Final panel calculation result:', {
        panelsNeeded,
        idealPanelLength,
        actualPanelLength,
        exceedsLimit,
        uncoveredHeight,
        totalWidth: panelsNeeded * (pattern.panel_width_inches || 54),
        totalHeight: actualPanelLength * 12
    });
    
    return {
        panelsNeeded,
        panelLength: actualPanelLength,
        exceedsLimit,
        idealPanelLength,
        uncoveredHeight,
        totalWidth: panelsNeeded * (pattern.panel_width_inches || 54),
        totalHeight: actualPanelLength * 12,
        saleType: 'panel'
    };
}

/**
 * Main calculation function that routes to appropriate calculation method
 * @param {Object} pattern - Pattern object with dimensions and properties
 * @param {number} wallWidth - Wall width in inches
 * @param {number} wallHeight - Wall height in inches
 * @returns {Object} Calculation results
 */
function calculateWallpaperRequirements(pattern, wallWidth, wallHeight) {
    if (!pattern) {
        throw new Error('Pattern data is required');
    }
    
    if (!wallWidth || !wallHeight || wallWidth <= 0 || wallHeight <= 0) {
        throw new Error('Valid wall dimensions are required');
    }
    
    // Route to appropriate calculation method based on sale type
    if (pattern.sale_type === 'yard') {
        return calculateYardRequirements(pattern, wallWidth, wallHeight);
    } else {
        return calculatePanelRequirements(pattern, wallWidth, wallHeight);
    }
}

/**
 * Format dimensions for display
 * @param {number} feet - Feet component
 * @param {number} inches - Inches component
 * @returns {string} Formatted dimension string
 */
function formatDimensions(feet, inches) {
    if (inches > 0) {
        return `${feet}'${inches}"`;
    } else {
        return `${feet}'`;
    }
}

/**
 * Convert inches to feet and inches
 * @param {number} totalInches - Total inches to convert
 * @returns {Object} Object with feet and inches properties
 */
function inchesToFeetAndInches(totalInches) {
    const feet = Math.floor(totalInches / 12);
    const inches = totalInches % 12;
    return { feet, inches };
}

// Export functions for use in other modules
if (typeof window !== 'undefined') {
    // Browser environment
    window.WallpaperCalculations = {
        calculateWallpaperRequirements,
        calculateYardRequirements,
        calculatePanelRequirements,
        formatDimensions,
        inchesToFeetAndInches,
        CALCULATION_DEFAULTS
    };
}

// For Node.js environments
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        calculateWallpaperRequirements,
        calculateYardRequirements,
        calculatePanelRequirements,
        formatDimensions,
        inchesToFeetAndInches,
        CALCULATION_DEFAULTS
    };
}
