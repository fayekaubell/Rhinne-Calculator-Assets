// Wallpaper Calculator Core Logic
// Extracted from original Shopify calculator for GitHub Pages deployment

// Global state
let currentPreview = null;
let patternImage = null;
let imageLoaded = false;
let patternsLoaded = false;

// Initialize the calculator
function initializeCalculator() {
    console.log('🚀 Initializing Wallpaper Calculator...');
    
    // Check if patterns are available
    if (typeof patterns !== 'undefined' && patterns) {
        console.log('✅ Patterns data loaded:', Object.keys(patterns).length, 'patterns');
        patternsLoaded = true;
        populatePatternDropdown();
        hideLoadingMessage();
    } else {
        console.error('❌ Patterns data not available');
        showErrorMessage('Pattern data could not be loaded. Please refresh the page.');
    }
}

// UI state management
function hideLoadingMessage() {
    document.getElementById('loadingMessage').style.display = 'none';
    document.getElementById('calculatorForm').style.display = 'block';
}

function showErrorMessage(message) {
    const errorElement = document.getElementById('errorMessage');
    errorElement.textContent = message;
    errorElement.style.display = 'block';
    document.getElementById('loadingMessage').style.display = 'none';
}

// Populate pattern dropdown
function populatePatternDropdown() {
    const select = document.getElementById('pattern');
    
    if (!select || !patterns) {
        console.error('Could not find select element or patterns data');
        return;
    }
    
    // Clear existing options except the first one
    select.innerHTML = '<option value="">Choose a pattern...</option>';
    
    // Sort patterns alphabetically by name
    const sortedPatterns = Object.keys(patterns).sort((a, b) => {
        return patterns[a].name.localeCompare(patterns[b].name);
    });
    
    // Add pattern options
    sortedPatterns.forEach(patternId => {
        const pattern = patterns[patternId];
        const option = document.createElement('option');
        option.value = patternId;
        option.textContent = pattern.sku ? `${pattern.name} / ${pattern.sku}` : pattern.name;
        select.appendChild(option);
    });
    
    console.log('✅ Pattern dropdown populated with', sortedPatterns.length, 'patterns');
}

// Get selected pattern (for compatibility with existing code)
function getSelectedPattern() {
    const select = document.getElementById('pattern');
    return select ? select.value : '';
}

// Preload pattern images with CORS handling
function preloadPatternImage(pattern) {
    return new Promise((resolve, reject) => {
        if (!pattern.imageUrl) {
            resolve(null);
            return;
        }
        
        const img = new Image();
        img.crossOrigin = 'anonymous';
        
        img.onload = function() {
            patternImage = img;
            imageLoaded = true;
            console.log('✅ Pattern image loaded:', pattern.name);
            resolve(img);
        };
        
        img.onerror = function() {
            console.warn('⚠️ Failed to load pattern image with CORS, trying without...');
            const fallbackImg = new Image();
            fallbackImg.onload = function() {
                patternImage = fallbackImg;
                imageLoaded = true;
                console.log('✅ Pattern image loaded (fallback):', pattern.name);
                resolve(fallbackImg);
            };
            fallbackImg.onerror = function() {
                console.error('❌ Failed to load pattern image:', pattern.imageUrl);
                resolve(null);
            };
            fallbackImg.src = pattern.imageUrl;
        };
        
        img.src = pattern.imageUrl;
    });
}

// Main preview generation function
async function generatePreview() {
    try {
        console.log('🎨 Resetting preview state...');
        currentPreview = null;
        patternImage = null;
        imageLoaded = false;
        
        document.getElementById('previewSection').style.display = 'none';
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Get form values
        const patternId = getSelectedPattern();
        const widthFeet = parseInt(document.getElementById('widthFeet').value) || 0;
        const widthInches = parseFloat(document.getElementById('widthInches').value) || 0;
        const heightFeet = parseInt(document.getElementById('heightFeet').value) || 0;
        const heightInches = parseFloat(document.getElementById('heightInches').value) || 0;
        
        console.log('📊 Form values:', { patternId, widthFeet, widthInches, heightFeet, heightInches });
        
        // Validation
        if (!patternId) {
            alert('Please select a wallpaper pattern');
            return;
        }
        
        if (widthFeet === 0 && widthInches === 0) {
            alert('Please enter wall width');
            return;
        }
        
        if (heightFeet === 0 && heightInches === 0) {
            alert('Please enter wall height');
            return;
        }
        
        const pattern = patterns[patternId];
        if (!pattern) {
            alert('Pattern not found: ' + patternId);
            return;
        }
        
        // Convert to inches
        const wallWidth = (widthFeet * 12) + widthInches;
        const wallHeight = (heightFeet * 12) + heightInches;
        
        console.log('📏 Wall dimensions:', { wallWidth, wallHeight });
        
        // Calculate requirements
        const calculations = calculateYardRequirements(pattern, wallWidth, wallHeight);
        
        // Format dimensions for display
        const formattedWidth = widthInches > 0 ? `${widthFeet}'${widthInches}"` : `${widthFeet}'`;
        const formattedHeight = heightInches > 0 ? `${heightFeet}'${heightInches}"` : `${heightFeet}'`;
        
        // Store preview data
        currentPreview = {
            pattern,
            wallWidth,
            wallHeight,
            calculations,
            wallWidthFeet: widthFeet,
            wallWidthInches: widthInches,
            wallHeightFeet: heightFeet,
            wallHeightInches: heightInches,
            formattedWidth: formattedWidth,
            formattedHeight: formattedHeight,
            previewNumber: generatePreviewNumber()
        };
        
        // Update UI
        document.getElementById('previewTitle').textContent = 
            `${pattern.name}: ${pattern.sku || 'N/A'}: ${formattedWidth}w x ${formattedHeight}h Wall`;
        document.getElementById('loadingOverlay').style.display = 'flex';
        document.getElementById('previewSection').style.display = 'block';
        document.getElementById('previewSection').scrollIntoView({ behavior: 'smooth' });
        
        // Load pattern image
        console.log('🖼️ Preloading image:', pattern.imageUrl);
        await preloadPatternImage(pattern);
        
        // Update preview info and draw
        updatePreviewInfo();
        drawPreview();
        
        // Add click handler for zoom (non-mobile devices)
        const canvas = document.getElementById('previewCanvas');
        const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth <= 768;
        
        if (!isMobile) {
            canvas.style.cursor = 'zoom-in';
            canvas.onclick = openCanvasModal;
        } else {
            canvas.style.cursor = 'default';
            canvas.onclick = null;
        }
        
        document.getElementById('loadingOverlay').style.display = 'none';
        console.log('✅ Preview generation complete');
        
    } catch (error) {
        console.error('❌ Error in generatePreview:', error);
        document.getElementById('loadingOverlay').style.display = 'none';
        alert('An error occurred: ' + error.message);
    }
}

// Calculate yard requirements with pattern matching support
function calculateYardRequirements(pattern, wallWidth, wallHeight) {
    const totalWidth = wallWidth + pattern.minOverage;
    const totalHeight = wallHeight + pattern.minOverage;
    
    console.log('📊 Yard calculation debug:', {
        wallWidth,
        wallHeight,
        minOverage: pattern.minOverage,
        totalWidth,
        totalHeight,
        repeatHeight: pattern.repeatHeight,
        panelWidth: pattern.panelWidth,
        patternMatch: pattern.patternMatch || 'straight'
    });
    
    // Safety checks to prevent calculation errors
    if (!pattern.repeatHeight || pattern.repeatHeight <= 0) {
        console.error('Invalid repeat height for yard calculation');
        return {
            panelsNeeded: 1,
            panelLength: 10,
            totalYardage: 5,
            totalWidth: pattern.panelWidth || 27,
            totalHeight: 120,
            saleType: 'yard',
            stripLengthInches: 120,
            patternMatch: pattern.patternMatch || 'straight'
        };
    }
    
    if (!pattern.panelWidth || pattern.panelWidth <= 0) {
        console.error('Invalid panel width for yard calculation');
        return {
            panelsNeeded: 1,
            panelLength: 10,
            totalYardage: 5,
            totalWidth: 27,
            totalHeight: 120,
            saleType: 'yard',
            stripLengthInches: 120,
            patternMatch: pattern.patternMatch || 'straight'
        };
    }
    
    // Calculate strip length: (wall height + 4") / vertical repeat = A, round up, then A * repeat height
    const repeatsNeeded = Math.ceil(totalHeight / pattern.repeatHeight);
    let stripLengthInches = repeatsNeeded * pattern.repeatHeight;
    
    // For half drop patterns, add one full repeat height to ensure adequate coverage
    const patternMatch = pattern.patternMatch || 'straight';
    if (patternMatch === 'half drop') {
        stripLengthInches += pattern.repeatHeight;
        console.log('🔄 Half drop pattern: Added extra repeat height for coverage');
    }
    
    // Calculate number of strips needed to cover wall width + 4"
    const stripsNeeded = Math.ceil(totalWidth / pattern.panelWidth);
    
    // Calculate total yardage: (strip length × strips needed) / 36, rounded up, minimum from pattern data
    const totalYardageRaw = (stripLengthInches * stripsNeeded) / 36;
    const minYardOrder = pattern.minYardOrder || 5;
    const totalYardage = Math.max(Math.ceil(totalYardageRaw), minYardOrder);
    
    console.log('📊 Yard calculation result:', {
        repeatsNeeded,
        stripLengthInches,
        stripsNeeded,
        totalYardageRaw,
        totalYardage,
        patternMatch,
        extraForHalfDrop: patternMatch === 'half drop' ? pattern.repeatHeight : 0,
        totalWidth: stripsNeeded * pattern.panelWidth,
        totalHeight: stripLengthInches
    });
    
    return {
        panelsNeeded: stripsNeeded, // Using same property name for compatibility
        panelLength: Math.floor(stripLengthInches / 12), // Convert to feet (floor)
        panelLengthInches: stripLengthInches % 12, // Remaining inches
        totalYardage: totalYardage,
        totalWidth: stripsNeeded * pattern.panelWidth,
        totalHeight: stripLengthInches,
        saleType: 'yard',
        stripLengthInches: stripLengthInches, // Keep original inches value
        patternMatch: patternMatch
    };
}

// Update preview information display
function updatePreviewInfo() {
    if (!currentPreview) return;
    
    const { calculations } = currentPreview;
    
    console.log('📋 updatePreviewInfo called with:', calculations);
    
    // For yard-based display: just show total yardage
    const totalYardage = calculations.totalYardage;
    const overageTotalYardage = Math.ceil(totalYardage * 1.2);
    
    console.log('📊 Yard display:', { totalYardage, overageTotalYardage });
    
    document.getElementById('orderQuantity').textContent = `Total yardage: ${totalYardage} yds`;
    document.getElementById('orderQuantityWithOverage').textContent = `Total yardage: ${overageTotalYardage} yds`;
}

// Generate a simple preview number for tracking
function generatePreviewNumber() {
    return 20000 + Math.floor(Date.now() / 1000) % 10000;
}

// Make functions globally available
window.generatePreview = generatePreview;
window.getSelectedPattern = getSelectedPattern;
