// Global variables
let currentPreview = null;
let patternImage = null;
let imageLoaded = false;

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

// Load pattern image with fallback strategies
function preloadPatternImage(pattern) {
    return new Promise((resolve) => {
        if (!pattern.repeat_url) {
            console.log('No repeat URL provided for pattern');
            resolve(null);
            return;
        }

        console.log('Loading pattern image:', pattern.repeat_url);
        const img = new Image();
        
        img.onload = function() {
            console.log('Pattern image loaded successfully');
            patternImage = img;
            imageLoaded = true;
            resolve(img);
        };
        
        img.onerror = function() {
            console.log('Image load failed, trying without CORS...');
            
            // Try without CORS
            const fallbackImg = new Image();
            fallbackImg.onload = function() {
                console.log('Pattern image loaded without CORS');
                patternImage = fallbackImg;
                imageLoaded = true;
                resolve(fallbackImg);
            };
            
            fallbackImg.onerror = function() {
                console.error('Failed to load pattern image:', pattern.repeat_url);
                resolve(null);
            };
            
            fallbackImg.src = pattern.repeat_url;
        };
        
        img.src = pattern.repeat_url;
    });
}

// Calculate wallpaper requirements - updated for diverse pattern sizes
function calculateYardRequirements(pattern, wallWidth, wallHeight) {
    const totalWidth = wallWidth + 4; // 4" overage
    const totalHeight = wallHeight + 4; // 4" overage
    
    // Calculate number of strips needed based on material width
    const stripsNeeded = Math.ceil(totalWidth / pattern.material_width_inches);
    
    // Calculate strip length needed based on repeat height and pattern match
    let repeatsNeeded;
    if (pattern.pattern_match === 'half drop') {
        // For half drop, we need extra length for pattern matching
        repeatsNeeded = Math.ceil(totalHeight / pattern.repeat_height_inches) + 1;
    } else {
        // For straight match
        repeatsNeeded = Math.ceil(totalHeight / pattern.repeat_height_inches);
    }
    
    const stripLengthInches = repeatsNeeded * pattern.repeat_height_inches;
    
    // Calculate total yardage: (strip length × strips needed) / 36, rounded up, minimum from pattern
    const totalYardageRaw = (stripLengthInches * stripsNeeded) / 36;
    const totalYardage = Math.max(Math.ceil(totalYardageRaw), pattern.min_yard_order);
    
    return {
        stripsNeeded: stripsNeeded,
        stripLengthInches: stripLengthInches,
        stripLengthYards: Math.ceil(stripLengthInches / 36),
        totalYardage: totalYardage,
        totalWidth: stripsNeeded * pattern.material_width_inches,
        totalHeight: stripLengthInches
    };
}

// Main function to generate preview
async function generatePreview() {
    try {
        console.log('Starting preview generation...');
        
        // Reset state
        currentPreview = null;
        patternImage = null;
        imageLoaded = false;
        
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
        
        // Calculate requirements
        const calculations = calculateYardRequirements(pattern, wallWidth, wallHeight);
        
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
        
        // Load pattern image
        await preloadPatternImage(pattern);
        
        // Update results display
        updatePreviewInfo();
        
        // Draw the preview
        drawPreview();
        
        // Hide loading overlay
        document.getElementById('loadingOverlay').style.display = 'none';
        
        // Add click handler for modal (non-mobile only)
        const canvas = document.getElementById('previewCanvas');
        const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth <= 768;
        
        if (!isMobile) {
            canvas.style.cursor = 'zoom-in';
            canvas.onclick = openCanvasModal;
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

function updatePreviewInfo() {
    const { calculations, formattedWidth, formattedHeight } = currentPreview;
    
    document.getElementById('wallDimensions').textContent = `${formattedWidth} × ${formattedHeight}`;
    document.getElementById('numStrips').textContent = calculations.stripsNeeded;
    document.getElementById('stripLength').textContent = `${calculations.stripLengthYards} yards each`;
    document.getElementById('totalYards').textContent = `${calculations.totalYardage} yards`;
}

function drawPreview() {
    console.log('Drawing preview...');
    const canvas = document.getElementById('previewCanvas');
    const ctx = canvas.getContext('2d');
    const { pattern, wallWidth, wallHeight, calculations } = currentPreview;
    
    // Clear canvas
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Calculate scale to fit everything in canvas with proper margins
    const margin = 60;
    const maxWidth = canvas.width - (margin * 2);
    const maxHeight = canvas.height - 120; // Extra space for labels
    
    const widthScale = maxWidth / calculations.totalWidth;
    const heightScale = maxHeight / calculations.totalHeight;
    const scale = Math.min(widthScale, heightScale);
    
    console.log(`Scale factor: ${scale.toFixed(3)}`);
    console.log(`Pattern repeat: ${pattern.repeat_width_inches}" × ${pattern.repeat_height_inches}"`);
    
    const scaledTotalWidth = calculations.totalWidth * scale;
    const scaledTotalHeight = calculations.totalHeight * scale;
    const scaledWallWidth = wallWidth * scale;
    const scaledWallHeight = wallHeight * scale;
    
    // Center the preview
    const offsetX = margin + (maxWidth - scaledTotalWidth) / 2;
    const offsetY = 80; // Space for top labels
    
    console.log(`Drawing area: ${scaledTotalWidth.toFixed(1)} × ${scaledTotalHeight.toFixed(1)} at offset ${offsetX.toFixed(1)}, ${offsetY}`);
    
    // Draw pattern if image loaded, otherwise draw fallback
    if (imageLoaded && patternImage) {
        console.log('Drawing pattern tiles...');
        drawPatternTiles(ctx, offsetX, offsetY, scaledTotalWidth, scaledTotalHeight, scale);
    } else {
        console.log('Drawing fallback pattern...');
        drawFallbackPattern(ctx, offsetX, offsetY, scaledTotalWidth, scaledTotalHeight, scale);
    }
    
    // Draw wall outline (centered within the total coverage)
    const wallOffsetX = offsetX + (scaledTotalWidth - scaledWallWidth) / 2;
    const wallOffsetY = offsetY + (scaledTotalHeight - scaledWallHeight) / 2;
    
    ctx.strokeStyle = '#2c3e50';
    ctx.lineWidth = 3;
    ctx.strokeRect(wallOffsetX, wallOffsetY, scaledWallWidth, scaledWallHeight);
    
    // Draw strip divisions
    ctx.strokeStyle = '#666666';
    ctx.lineWidth = 1;
    ctx.setLineDash([8, 8]);
    
    for (let i = 1; i < calculations.stripsNeeded; i++) {
        const x = offsetX + (i * pattern.material_width_inches * scale);
        ctx.beginPath();
        ctx.moveTo(x, offsetY);
        ctx.lineTo(x, offsetY + scaledTotalHeight);
        ctx.stroke();
    }
    
    ctx.setLineDash([]);
    
    // Add labels
    drawLabels(ctx, offsetX, offsetY, scaledTotalWidth, scaledTotalHeight, wallOffsetX, wallOffsetY, scaledWallWidth, scaledWallHeight, scale);
    
    console.log('Preview drawing completed');
}

function drawPatternTiles(ctx, offsetX, offsetY, displayWidth, displayHeight, scale) {
    const { pattern } = currentPreview;
    const repeatWidth = pattern.repeat_width_inches * scale;
    const repeatHeight = pattern.repeat_height_inches * scale;
    
    // Calculate number of tiles needed (add extra to ensure full coverage)
    const tilesX = Math.ceil(displayWidth / repeatWidth) + 2;
    const tilesY = Math.ceil(displayHeight / repeatHeight) + 2;
    
    console.log(`Drawing ${tilesX} × ${tilesY} pattern tiles (repeat size: ${repeatWidth.toFixed(1)} × ${repeatHeight.toFixed(1)})`);
    
    // Draw pattern tiles from bottom-left
    for (let i = 0; i < tilesX; i++) {
        for (let j = 0; j < tilesY; j++) {
            let x = offsetX + (i * repeatWidth);
            let y = offsetY + displayHeight - ((j + 1) * repeatHeight); // Start from bottom
            
            // For half drop patterns, offset every other column
            if (pattern.pattern_match === 'half drop' && i % 2 === 1) {
                y -= repeatHeight / 2;
            }
            
            // Only draw if within bounds (with some tolerance)
            if (x < offsetX + displayWidth + repeatWidth && y < offsetY + displayHeight && y + repeatHeight > offsetY) {
                try {
                    ctx.drawImage(patternImage, x, y, repeatWidth, repeatHeight);
                } catch (error) {
                    console.warn('Error drawing pattern tile, using fallback');
                    drawFallbackTile(ctx, x, y, repeatWidth, repeatHeight, i, j);
                }
            }
        }
    }
}

function drawFallbackPattern(ctx, offsetX, offsetY, displayWidth, displayHeight, scale) {
    const { pattern } = currentPreview;
    const repeatWidth = pattern.repeat_width_inches * scale;
    const repeatHeight = pattern.repeat_height_inches * scale;
    
    const tilesX = Math.ceil(displayWidth / repeatWidth) + 2;
    const tilesY = Math.ceil(displayHeight / repeatHeight) + 2;
    
    for (let i = 0; i < tilesX; i++) {
        for (let j = 0; j < tilesY; j++) {
            let x = offsetX + (i * repeatWidth);
            let y = offsetY + displayHeight - ((j + 1) * repeatHeight);
            
            if (pattern.pattern_match === 'half drop' && i % 2 === 1) {
                y -= repeatHeight / 2;
            }
            
            if (x < offsetX + displayWidth + repeatWidth && y < offsetY + displayHeight && y + repeatHeight > offsetY) {
                drawFallbackTile(ctx, x, y, repeatWidth, repeatHeight, i, j);
            }
        }
    }
}

function drawFallbackTile(ctx, x, y, width, height, i, j) {
    // Create a simple pattern as fallback with pattern name
    const colors = ['#f8f9fa', '#e9ecef', '#dee2e6', '#ced4da'];
    const colorIndex = (i + j) % colors.length;
    
    ctx.fillStyle = colors[colorIndex];
    ctx.fillRect(x, y, width, height);
    
    ctx.strokeStyle = '#adb5bd';
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, width, height);
    
    // Add pattern info text if tile is large enough
    if (width > 40 && height > 20) {
        ctx.fillStyle = '#6c757d';
        ctx.font = `${Math.min(12, width/8)}px Arial`;
        ctx.textAlign = 'center';
        ctx.fillText(currentPreview.pattern.pattern_name.split(':')[0], x + width/2, y + height/2);
    }
}

function drawLabels(ctx, offsetX, offsetY, scaledTotalWidth, scaledTotalHeight, wallOffsetX, wallOffsetY, scaledWallWidth, scaledWallHeight, scale) {
    const { pattern, calculations } = currentPreview;
    
    ctx.fillStyle = '#333';
    ctx.font = '14px Arial';
    ctx.textAlign = 'center';
    
    // Strip labels
    for (let i = 0; i < calculations.stripsNeeded; i++) {
        const stripCenterX = offsetX + (i * pattern.material_width_inches * scale) + (pattern.material_width_inches * scale / 2);
        const labelY = offsetY - 20;
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        const stripText = `Strip ${i + 1}`;
        const metrics = ctx.measureText(stripText);
        ctx.fillRect(stripCenterX - metrics.width/2 - 4, labelY - 12, metrics.width + 8, 16);
        
        ctx.fillStyle = '#333';
        ctx.fillText(stripText, stripCenterX, labelY);
    }
    
    // Wall label
    const wallCenterX = wallOffsetX + scaledWallWidth / 2;
    const wallCenterY = wallOffsetY + scaledWallHeight / 2;
    
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    const wallText = 'Your Wall';
    const wallMetrics = ctx.measureText(wallText);
    ctx.fillRect(wallCenterX - wallMetrics.width/2 - 6, wallCenterY - 8, wallMetrics.width + 12, 16);
    
    ctx.fillStyle = '#2c3e50';
    ctx.fillText(wallText, wallCenterX, wallCenterY + 4);
}

function openCanvasModal() {
    console.log('Canvas modal - full size view (to be implemented)');
    // Modal functionality can be added here if needed
}

// Utility functions
function showError(elementId) {
    document.getElementById(elementId).style.display = 'block';
}

function clearErrors() {
    const errors = document.querySelectorAll('.form-error');
    errors.forEach(error => error.style.display = 'none');
}
