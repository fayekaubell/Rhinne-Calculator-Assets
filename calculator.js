// Main calculator functionality
// Handles UI interactions, form validation, and coordinates between modules

// Global state
let currentPreview = null;

// Initialize calculator when page loads
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing calculator...');
    
    // Check if pattern data is loaded
    if (typeof PATTERNS_DATA === 'undefined') {
        console.error('Pattern data not loaded');
        document.getElementById('loadingMessage').style.display = 'none';
        document.getElementById('errorMessage').style.display = 'block';
        return;
    }
    
    populatePatternDropdown();
});

// Populate the pattern dropdown and add change handler
function populatePatternDropdown() {
    console.log('Populating pattern dropdown...');
    const select = document.getElementById('pattern');
    
    try {
        // Sort patterns alphabetically
        const sortedPatterns = [...PATTERNS_DATA].sort((a, b) => 
            a.pattern_name.localeCompare(b.pattern_name)
        );
        
        sortedPatterns.forEach(pattern => {
            const option = document.createElement('option');
            option.value = pattern.sku;
            option.textContent = pattern.pattern_name;
            option.dataset.patternData = JSON.stringify(pattern);
            select.appendChild(option);
        });
        
        console.log(`Added ${sortedPatterns.length} patterns to dropdown`);
        
        // Add change handler to show pattern info
        select.addEventListener('change', function() {
            const patternInfo = document.getElementById('patternInfo');
            if (this.value) {
                const selectedOption = this.selectedOptions[0];
                const pattern = JSON.parse(selectedOption.dataset.patternData);
                patternInfo.textContent = `Repeat: ${pattern.repeat_width_inches}" × ${pattern.repeat_height_inches}" | Match: ${pattern.pattern_match} | Material width: ${pattern.material_width_inches}"`;
            } else {
                patternInfo.textContent = '';
            }
        });
        
        // Hide loading message and show form
        document.getElementById('loadingMessage').style.display = 'none';
        document.getElementById('calculatorForm').style.display = 'block';
        
    } catch (error) {
        console.error('Error populating dropdown:', error);
        document.getElementById('loadingMessage').style.display = 'none';
        document.getElementById('errorMessage').style.display = 'block';
    }
}

// Main function to generate preview
async function generatePreview() {
    try {
        console.log('Starting preview generation...');
        
        // Reset preview state
        currentPreview = null;
        window.PreviewRenderer.resetPreviewState();
        
        document.getElementById('previewSection').style.display = 'none';
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Get form values
        const patternSelect = document.getElementById('pattern');
        const widthFeet = parseInt(document.getElementById('widthFeet').value) || 0;
        const widthInches = parseFloat(document.getElementById('widthInches').value) || 0;
        const heightFeet = parseInt(document.getElementById('heightFeet').value) || 0;
        const heightInches = parseFloat(document.getElementById('heightInches').value) || 0;
        
        // Validate inputs
        clearErrors();
        let hasErrors = false;
        
        if (!patternSelect.value) {
            showError('patternError');
            hasErrors = true;
        }
        
        if (widthFeet === 0 && widthInches === 0) {
            showError('widthError');
            hasErrors = true;
        }
        
        if (heightFeet === 0 && heightInches === 0) {
            showError('heightError');
            hasErrors = true;
        }
        
        if (hasErrors) return;
        
        // Get pattern data
        const selectedOption = patternSelect.selectedOptions[0];
        const pattern = JSON.parse(selectedOption.dataset.patternData);
        
        console.log('Selected pattern:', pattern.pattern_name);
        console.log('Pattern specs:', `${pattern.repeat_width_inches}" × ${pattern.repeat_height_inches}", ${pattern.pattern_match}`);
        
        // Convert dimensions to inches
        const wallWidth = (widthFeet * 12) + widthInches;
        const wallHeight = (heightFeet * 12) + heightInches;
        
        console.log(`Wall dimensions: ${wallWidth}" × ${wallHeight}"`);
        
        // Calculate requirements using the calculations module
        const calculations = window.WallpaperCalculations.calculateWallpaperRequirements(pattern, wallWidth, wallHeight);
        
        console.log('Calculations:', calculations);
        
        // Format dimensions for display
        const formattedWidth = widthInches > 0 ? `${widthFeet}'${widthInches}"` : `${widthFeet}'`;
        const formattedHeight = heightInches > 0 ? `${heightFeet}'${heightInches}"` : `${heightFeet}'`;
        
        // Store current preview data
        currentPreview = {
            pattern,
            wallWidth,
            wallHeight,
            calculations,
            formattedWidth,
            formattedHeight
        };
        
        // Update title and show section
        document.getElementById('previewTitle').textContent = `${pattern.pattern_name} Preview`;
        document.getElementById('loadingOverlay').style.display = 'flex';
        document.getElementById('previewSection').style.display = 'block';
        document.getElementById('previewSection').scrollIntoView({ behavior: 'smooth' });
        
        // Load pattern image using the preview renderer
        await window.PreviewRenderer.preloadPatternImage(pattern);
        
        // Update results display
        updatePreviewInfo();
        
        // Draw the preview using the preview renderer
        window.PreviewRenderer.drawPreview(currentPreview);
        
        // Hide loading overlay
        document.getElementById('loadingOverlay').style.display = 'none';
        
        // Add click handler for modal (non-mobile only)
        const canvas = document.getElementById('previewCanvas');
        const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth <= 768;
        
        if (!isMobile) {
            canvas.style.cursor = 'zoom-in';
            canvas.onclick = () => window.PreviewRenderer.openCanvasModal(currentPreview);
        } else {
            canvas.style.cursor = 'default';
            canvas.onclick = null;
        }
        
        console.log('Preview generation completed successfully');
        
    } catch (error) {
        console.error('Error in generatePreview:', error);
        document.getElementById('loadingOverlay').style.display = 'none';
        alert('An error occurred while generating the preview. Please try again.');
    }
}

// Update preview information display
function updatePreviewInfo() {
    const { calculations, formattedWidth, formattedHeight } = currentPreview;
    
    document.getElementById('wallDimensions').textContent = `${formattedWidth} × ${formattedHeight}`;
    
    if (calculations.saleType === 'yard') {
        // For yard patterns: show strips and total yardage
        document.getElementById('numStrips').textContent = calculations.stripsNeeded;
        document.getElementById('stripLength').textContent = `${calculations.stripLengthYards} yards each`;
        document.getElementById('totalYards').textContent = `${calculations.totalYardage} yards`;
    } else {
        // For panel patterns: show panels and converted yardage
        const yardagePerPanel = Math.round(calculations.panelLength / 3);
        const totalYardage = calculations.panelsNeeded * yardagePerPanel;
        
        document.getElementById('numStrips').textContent = calculations.panelsNeeded + ' panels';
        document.getElementById('stripLength').textContent = `${calculations.panelLength}' each`;
        document.getElementById('totalYards').textContent = `${totalYardage} yards estimated`;
    }
}

// Utility functions
function showError(elementId) {
    document.getElementById(elementId).style.display = 'block';
}

function clearErrors() {
    const errors = document.querySelectorAll('.form-error');
    errors.forEach(error => error.style.display = 'none');
}
