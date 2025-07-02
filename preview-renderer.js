// Wallpaper preview rendering utilities
// Handles all canvas drawing and visualization logic

// Global state for the renderer
let patternImage = null;
let imageLoaded = false;

/**
 * Preload pattern image with fallback strategies
 * @param {Object} pattern - Pattern object with image URL
 * @returns {Promise} Resolves with image or null
 */
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

/**
 * Main preview drawing function
 * @param {Object} previewData - Complete preview data object
 * @param {string} canvasId - ID of the canvas element
 */
function drawPreview(previewData, canvasId = 'previewCanvas') {
    console.log('Drawing preview...');
    const canvas = document.getElementById(canvasId);
    const ctx = canvas.getContext('2d');
    const { pattern, wallWidth, wallHeight, calculations } = previewData;
    
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
        drawPatternTiles(ctx, offsetX, offsetY, scaledTotalWidth, scaledTotalHeight, scale, previewData);
    } else {
        console.log('Drawing fallback pattern...');
        drawFallbackPattern(ctx, offsetX, offsetY, scaledTotalWidth, scaledTotalHeight, scale, previewData);
    }
    
    // Draw wall outline (centered within the total coverage)
    const wallOffsetX = offsetX + (scaledTotalWidth - scaledWallWidth) / 2;
    const wallOffsetY = offsetY + (scaledTotalHeight - scaledWallHeight) / 2;
    
    ctx.strokeStyle = '#2c3e50';
    ctx.lineWidth = 3;
    ctx.strokeRect(wallOffsetX, wallOffsetY, scaledWallWidth, scaledWallHeight);
    
    // Draw strip/panel divisions
    drawDivisions(ctx, offsetX, offsetY, scaledTotalWidth, scaledTotalHeight, scale, previewData);
    
    // Add labels
    drawLabels(ctx, offsetX, offsetY, scaledTotalWidth, scaledTotalHeight, wallOffsetX, wallOffsetY, scaledWallWidth, scaledWallHeight, scale, previewData);
    
    console.log('Preview drawing completed');
}

/**
 * Draw pattern tiles on the canvas
 */
function drawPatternTiles(ctx, offsetX, offsetY, displayWidth, displayHeight, scale, previewData) {
    const { pattern, calculations } = previewData;
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
                    drawFallbackTile(ctx, x, y, repeatWidth, repeatHeight, i, j, previewData);
                }
            }
        }
    }
}

/**
 * Draw fallback pattern when image fails to load
 */
function drawFallbackPattern(ctx, offsetX, offsetY, displayWidth, displayHeight, scale, previewData) {
    const { pattern } = previewData;
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
                drawFallbackTile(ctx, x, y, repeatWidth, repeatHeight, i, j, previewData);
            }
        }
    }
}

/**
 * Draw a single fallback tile
 */
function drawFallbackTile(ctx, x, y, width, height, i, j, previewData) {
    const { pattern } = previewData;
    
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
        ctx.fillText(pattern.pattern_name.split(':')[0], x + width/2, y + height/2);
    }
}

/**
 * Draw division lines between strips/panels
 */
function drawDivisions(ctx, offsetX, offsetY, scaledTotalWidth, scaledTotalHeight, scale, previewData) {
    const { pattern, calculations } = previewData;
    
    // Draw strip/panel divisions
    ctx.strokeStyle = '#666666';
    ctx.lineWidth = 1;
    ctx.setLineDash([8, 8]);
    
    const numElements = calculations.saleType === 'yard' ? calculations.stripsNeeded : calculations.panelsNeeded;
    const elementWidth = calculations.saleType === 'yard' ? pattern.material_width_inches : (pattern.panel_width_inches || 54);
    
    for (let i = 1; i < numElements; i++) {
        const x = offsetX + (i * elementWidth * scale);
        ctx.beginPath();
        ctx.moveTo(x, offsetY);
        ctx.lineTo(x, offsetY + scaledTotalHeight);
        ctx.stroke();
    }
    
    ctx.setLineDash([]);
}

/**
 * Draw labels for strips/panels and wall
 */
function drawLabels(ctx, offsetX, offsetY, scaledTotalWidth, scaledTotalHeight, wallOffsetX, wallOffsetY, scaledWallWidth, scaledWallHeight, scale, previewData) {
    const { pattern, calculations } = previewData;
    
    ctx.fillStyle = '#333';
    ctx.font = '14px Arial';
    ctx.textAlign = 'center';
    
    // Strip/Panel labels
    const numElements = calculations.saleType === 'yard' ? calculations.stripsNeeded : calculations.panelsNeeded;
    const elementWidth = calculations.saleType === 'yard' ? pattern.material_width_inches : (pattern.panel_width_inches || 54);
    
    for (let i = 0; i < numElements; i++) {
        const elementCenterX = offsetX + (i * elementWidth * scale) + (elementWidth * scale / 2);
        const labelY = offsetY - 20;
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        const elementText = calculations.saleType === 'yard' ? `Strip ${i + 1}` : `Panel ${i + 1}`;
        const metrics = ctx.measureText(elementText);
        ctx.fillRect(elementCenterX - metrics.width/2 - 4, labelY - 12, metrics.width + 8, 16);
        
        ctx.fillStyle = '#333';
        ctx.fillText(elementText, elementCenterX, labelY);
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

/**
 * Open canvas modal for full-size view
 */
function openCanvasModal(previewData, canvasId = 'previewCanvas') {
    console.log('Canvas modal - creating full size view...');
    
    const originalCanvas = document.getElementById(canvasId);
    
    if (!previewData) {
        console.error('No preview data available for modal');
        return;
    }
    
    // Create modal
    const modal = document.createElement('div');
    modal.className = 'canvas-modal';
    
    // Create high-resolution canvas
    const largeCanvas = document.createElement('canvas');
    const hiResScale = 2;
    largeCanvas.width = originalCanvas.width * hiResScale;
    largeCanvas.height = originalCanvas.height * hiResScale;
    
    const displayWidth = Math.min(window.innerWidth * 0.9, largeCanvas.width / hiResScale);
    const displayHeight = (displayWidth * largeCanvas.height) / largeCanvas.width;
    
    largeCanvas.style.width = displayWidth + 'px';
    largeCanvas.style.height = displayHeight + 'px';
    largeCanvas.style.cursor = 'zoom-out';
    largeCanvas.style.border = '2px solid #fff';
    largeCanvas.style.borderRadius = '8px';
    
    // Draw on high-res canvas
    const largeCtx = largeCanvas.getContext('2d');
    largeCtx.scale(hiResScale, hiResScale);
    largeCtx.imageSmoothingEnabled = true;
    largeCtx.imageSmoothingQuality = 'high';
    
    // Clear and draw
    largeCtx.fillStyle = '#ffffff';
    largeCtx.fillRect(0, 0, originalCanvas.width, originalCanvas.height);
    
    // Use the same drawing logic but on the high-res canvas
    renderHighResPreview(largeCtx, originalCanvas.width, originalCanvas.height, previewData);
    
    modal.appendChild(largeCanvas);
    
    // Close modal handlers
    modal.onclick = (e) => {
        if (e.target === modal || e.target === largeCanvas) {
            document.body.removeChild(modal);
        }
    };
    
    document.body.appendChild(modal);
}

/**
 * Render high-resolution preview for modal
 */
function renderHighResPreview(ctx, canvasWidth, canvasHeight, previewData) {
    const { pattern, wallWidth, wallHeight, calculations } = previewData;
    
    // Use same layout logic as main preview but with high resolution
    const margin = 60;
    const maxWidth = canvasWidth - (margin * 2);
    const maxHeight = canvasHeight - 120;
    
    const widthScale = maxWidth / calculations.totalWidth;
    const heightScale = maxHeight / calculations.totalHeight;
    const scale = Math.min(widthScale, heightScale);
    
    const scaledTotalWidth = calculations.totalWidth * scale;
    const scaledTotalHeight = calculations.totalHeight * scale;
    const scaledWallWidth = wallWidth * scale;
    const scaledWallHeight = wallHeight * scale;
    
    const offsetX = margin + (maxWidth - scaledTotalWidth) / 2;
    const offsetY = 80;
    
    // Draw pattern
    if (imageLoaded && patternImage) {
        drawPatternTiles(ctx, offsetX, offsetY, scaledTotalWidth, scaledTotalHeight, scale, previewData);
    } else {
        drawFallbackPattern(ctx, offsetX, offsetY, scaledTotalWidth, scaledTotalHeight, scale, previewData);
    }
    
    // Draw wall outline
    const wallOffsetX = offsetX + (scaledTotalWidth - scaledWallWidth) / 2;
    const wallOffsetY = offsetY + (scaledTotalHeight - scaledWallHeight) / 2;
    
    ctx.strokeStyle = '#2c3e50';
    ctx.lineWidth = 3;
    ctx.strokeRect(wallOffsetX, wallOffsetY, scaledWallWidth, scaledWallHeight);
    
    // Draw divisions and labels
    drawDivisions(ctx, offsetX, offsetY, scaledTotalWidth, scaledTotalHeight, scale, previewData);
    drawLabels(ctx, offsetX, offsetY, scaledTotalWidth, scaledTotalHeight, wallOffsetX, wallOffsetY, scaledWallWidth, scaledWallHeight, scale, previewData);
}

/**
 * Reset preview renderer state
 */
function resetPreviewState() {
    patternImage = null;
    imageLoaded = false;
}

/**
 * Get current image loading state
 */
function getImageLoadingState() {
    return {
        patternImage,
        imageLoaded
    };
}

// Export functions for use in other modules
if (typeof window !== 'undefined') {
    // Browser environment
    window.PreviewRenderer = {
        preloadPatternImage,
        drawPreview,
        openCanvasModal,
        resetPreviewState,
        getImageLoadingState,
        drawPatternTiles,
        drawFallbackPattern,
        drawLabels
    };
}

// For Node.js environments
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        preloadPatternImage,
        drawPreview,
        openCanvasModal,
        resetPreviewState,
        getImageLoadingState,
        drawPatternTiles,
        drawFallbackPattern,
        drawLabels
    };
}
