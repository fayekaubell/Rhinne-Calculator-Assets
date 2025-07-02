// Wallpaper preview rendering utilities
// Handles all canvas drawing and visualization logic with 3-section layout

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
        // Check for image URL in different possible property names
        const imageUrl = pattern.repeat_url || pattern.imageUrl || pattern.image_url;
        
        if (!imageUrl) {
            console.log('No repeat URL provided for pattern:', pattern.pattern_name);
            resolve(null);
            return;
        }

        console.log('Loading pattern image:', imageUrl, 'for pattern:', pattern.pattern_name);
        const img = new Image();
        
        img.onload = function() {
            console.log('✅ Pattern image loaded successfully for:', pattern.pattern_name);
            patternImage = img;
            imageLoaded = true;
            resolve(img);
        };
        
        img.onerror = function() {
            console.log('❌ Image load failed, trying without CORS for:', pattern.pattern_name);
            
            // Try without CORS
            const fallbackImg = new Image();
            fallbackImg.onload = function() {
                console.log('✅ Pattern image loaded without CORS for:', pattern.pattern_name);
                patternImage = fallbackImg;
                imageLoaded = true;
                resolve(fallbackImg);
            };
            
            fallbackImg.onerror = function() {
                console.error('❌ Failed to load pattern image completely:', imageUrl, 'for pattern:', pattern.pattern_name);
                resolve(null);
            };
            
            fallbackImg.src = imageUrl;
        };
        
        img.src = imageUrl;
    });
}

/**
 * Main 3-section preview drawing function
 * @param {Object} previewData - Complete preview data object
 * @param {string} canvasId - ID of the canvas element
 */
function drawPreview(previewData, canvasId = 'previewCanvas') {
    console.log('Drawing 3-section preview...');
    const canvas = document.getElementById(canvasId);
    const ctx = canvas.getContext('2d');
    const { pattern, wallWidth, wallHeight, calculations } = previewData;
    
    // Clear canvas
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Calculate scale and positioning for 3-section layout
    const layoutData = calculateThreeSectionLayout(canvas, previewData);
    
    // Draw the three sections
    drawSection1_PanelLayout(ctx, layoutData, previewData);
    drawArrowsBetweenSections(ctx, layoutData, previewData);
    drawSection2_CompleteView(ctx, layoutData, previewData);
    drawSection3_WallOnly(ctx, layoutData, previewData);
    
    console.log('3-section preview drawing completed');
}

/**
 * Calculate layout positions and scaling for 3-section preview
 */
function calculateThreeSectionLayout(canvas, previewData) {
    const { pattern, wallWidth, wallHeight, calculations } = previewData;
    
    // Layout constants
    const leftMargin = 60;
    const rightMargin = 30;
    const maxWidth = canvas.width - leftMargin - rightMargin;
    const maxHeight = canvas.height - 80;
    
    const sectionGap1 = 30;
    const sectionGap2 = 25;
    const dimensionSpace = 60;
    
    // Determine content heights for scaling
    const effectiveHeight = calculations.totalHeight;
    const section2VisualHeight = Math.max(calculations.totalHeight, wallHeight);
    const totalContentHeight = (effectiveHeight + section2VisualHeight + wallHeight) + sectionGap1 + sectionGap2 + dimensionSpace;
    
    // Determine content width
    const effectiveWidth = Math.max(calculations.totalWidth, wallWidth);
    
    // Calculate scale
    const widthScale = maxWidth / effectiveWidth;
    const heightScale = maxHeight / totalContentHeight;
    const scale = Math.min(widthScale, heightScale);
    
    // Calculate scaled dimensions
    const scaledTotalWidth = calculations.totalWidth * scale;
    const scaledTotalHeight = calculations.totalHeight * scale;
    const scaledWallWidth = wallWidth * scale;
    const scaledWallHeight = wallHeight * scale;
    
    // Calculate Y positions for each section
    const actualContentHeight = (effectiveHeight * scale) + (section2VisualHeight * scale) + (scaledWallHeight) + sectionGap1 + sectionGap2 + dimensionSpace;
    let section1Y = (canvas.height - actualContentHeight) / 2 + (dimensionSpace * 0.7);
    let section2Y = section1Y + effectiveHeight * scale + sectionGap1;
    let section3Y = section2Y + section2VisualHeight * scale + sectionGap2;
    
    const offsetX = leftMargin + (maxWidth - scaledTotalWidth) / 2;
    
    return {
        scale,
        offsetX,
        section1Y,
        section2Y,
        section3Y,
        scaledTotalWidth,
        scaledTotalHeight,
        scaledWallWidth,
        scaledWallHeight,
        sectionGap1,
        sectionGap2,
        section2VisualHeight,
        leftMargin,
        maxWidth
    };
}

/**
 * Draw Section 1: Panel Layout with individual panels
 */
function drawSection1_PanelLayout(ctx, layoutData, previewData) {
    const { pattern, calculations } = previewData;
    const { offsetX, section1Y, scaledTotalWidth, scaledTotalHeight, scale } = layoutData;
    
    console.log('🎨 Drawing Section 1: Panel Layout');
    console.log('Image loaded state:', imageLoaded, 'Pattern image exists:', !!patternImage);
    console.log('Pattern details:', {
        name: pattern.pattern_name,
        imageUrl: pattern.repeat_url,
        repeatWidth: pattern.repeat_width_inches,
        repeatHeight: pattern.repeat_height_inches
    });
    
    // Draw pattern if image is loaded
    if (imageLoaded && patternImage) {
        console.log('✅ Drawing with actual pattern image');
        // Handle different pattern types
        const repeatW = calculations.saleType === 'yard' ? pattern.repeat_width_inches * scale :
            (pattern.sequenceLength === 1 ? (pattern.panel_width_inches || 54) * scale : pattern.repeat_width_inches * scale);
        const repeatH = pattern.repeat_height_inches * scale;
        const offsetPerPanel = pattern.sequenceLength === 1 ? 0 : pattern.repeat_width_inches / pattern.sequenceLength;
        const numElements = calculations.saleType === 'yard' ? calculations.stripsNeeded : calculations.panelsNeeded;
        const elementWidth = calculations.saleType === 'yard' ? pattern.material_width_inches : (pattern.panel_width_inches || 54);
        
        // Draw each panel/strip
        for (let panelIndex = 0; panelIndex < numElements; panelIndex++) {
            const panelX = offsetX + (panelIndex * elementWidth * scale);
            const panelWidth = elementWidth * scale;
            const sequencePosition = panelIndex % (pattern.sequenceLength || 1);
            
            // Calculate source offset for panel patterns
            const sourceOffsetX = sequencePosition * offsetPerPanel;
            
            ctx.save();
            ctx.beginPath();
            ctx.rect(panelX, section1Y, panelWidth, scaledTotalHeight);
            ctx.clip();
            
            // Draw pattern tiles
            for (let x = -repeatW; x < panelWidth + repeatW; x += repeatW) {
                if (pattern.hasRepeatHeight !== false) {
                    // Normal repeating pattern - tile from top
                    for (let y = -repeatH; y < scaledTotalHeight + repeatH; y += repeatH) {
                        const drawX = panelX + x - (sourceOffsetX * scale);
                        const drawY = section1Y + y;
                        try {
                            ctx.drawImage(patternImage, drawX, drawY, repeatW, repeatH);
                        } catch (error) {
                            console.warn('Error drawing pattern tile:', error);
                        }
                    }
                } else {
                    // Non-repeating pattern - anchor to bottom
                    const drawX = panelX + x - (sourceOffsetX * scale);
                    const drawY = section1Y + scaledTotalHeight - repeatH;
                    try {
                        ctx.drawImage(patternImage, drawX, drawY, repeatW, repeatH);
                    } catch (error) {
                        console.warn('Error drawing non-repeating pattern tile:', error);
                    }
                }
            }
            
            ctx.restore();
        }
    } else {
        // Draw fallback pattern
        console.log('⚠️ Drawing fallback pattern - image not loaded');
        drawFallbackPattern(ctx, offsetX, section1Y, scaledTotalWidth, scaledTotalHeight, scale, previewData);
    }
    
    // Draw panel outlines and labels
    drawPanelOutlines(ctx, offsetX, section1Y, scaledTotalWidth, scaledTotalHeight, scale, previewData, true);
}

/**
 * Draw Section 2: Complete View with wall overlay
 */
function drawSection2_CompleteView(ctx, layoutData, previewData) {
    const { pattern, wallWidth, wallHeight, calculations } = previewData;
    const { offsetX, section2Y, scaledTotalWidth, scaledTotalHeight, scaledWallWidth, scaledWallHeight, scale, section2VisualHeight } = layoutData;
    
    console.log('🎨 Drawing Section 2: Complete View');
    
    // Calculate wall position within section 2
    const wallOffsetX = offsetX + (scaledTotalWidth - scaledWallWidth) / 2;
    const wallOffsetY = section2Y + ((section2VisualHeight * scale) - scaledWallHeight) / 2;
    
    // Check for limitations
    const hasLimitation = calculations.exceedsLimit || calculations.exceedsAvailableLength;
    let actualPanelHeight = scaledTotalHeight;
    let panelStartY = section2Y;
    
    if (hasLimitation) {
        const actualPanelLengthToUse = calculations.exceedsAvailableLength ? 
            calculations.actualPanelLength : calculations.panelLength;
        const panelCoverageHeight = actualPanelLengthToUse * 12 * scale;
        panelStartY = wallOffsetY + Math.max(0, scaledWallHeight - panelCoverageHeight);
        actualPanelHeight = Math.min(panelCoverageHeight, scaledWallHeight);
    }
    
    // Draw pattern with opacity effects
    if (imageLoaded && patternImage) {
        const repeatW = calculations.saleType === 'yard' ? pattern.repeat_width_inches * scale :
            (pattern.sequenceLength === 1 ? (pattern.panel_width_inches || 54) * scale : pattern.repeat_width_inches * scale);
        const repeatH = pattern.repeat_height_inches * scale;
        const offsetPerPanel = pattern.sequenceLength === 1 ? 0 : pattern.repeat_width_inches / pattern.sequenceLength;
        const numElements = calculations.saleType === 'yard' ? calculations.stripsNeeded : calculations.panelsNeeded;
        const elementWidth = calculations.saleType === 'yard' ? pattern.material_width_inches : (pattern.panel_width_inches || 54);
        
        // First pass: Draw all panels at 50% opacity
        ctx.globalAlpha = 0.5;
        drawPatternElements(ctx, offsetX, panelStartY, actualPanelHeight, scale, previewData, hasLimitation);
        
        // Second pass: Draw wall area at 100% opacity
        ctx.globalAlpha = 1.0;
        ctx.save();
        ctx.beginPath();
        ctx.rect(wallOffsetX, hasLimitation ? panelStartY : wallOffsetY, scaledWallWidth, hasLimitation ? actualPanelHeight : scaledWallHeight);
        ctx.clip();
        
        drawPatternElements(ctx, offsetX, panelStartY, actualPanelHeight, scale, previewData, hasLimitation);
        
        ctx.restore();
        ctx.globalAlpha = 1.0;
    }
    
    // Draw uncovered area if panels exceed limits
    if (hasLimitation) {
        const uncoveredAreaHeight = scaledWallHeight - actualPanelHeight;
        if (uncoveredAreaHeight > 0) {
            ctx.fillStyle = 'rgba(255, 0, 0, 0.5)';
            ctx.fillRect(wallOffsetX, wallOffsetY, scaledWallWidth, uncoveredAreaHeight);
        }
    }
    
    // Draw outlines
    drawSection2Outlines(ctx, offsetX, panelStartY, scaledTotalWidth, actualPanelHeight, scaledWallWidth, scaledWallHeight, wallOffsetX, wallOffsetY, scale, previewData);
}

/**
 * Draw Section 3: Wall Only
 */
function drawSection3_WallOnly(ctx, layoutData, previewData) {
    const { pattern, wallWidth, wallHeight, calculations } = previewData;
    const { scaledWallWidth, scaledWallHeight, scale, leftMargin, maxWidth, section3Y } = layoutData;
    
    console.log('🎨 Drawing Section 3: Wall Only');
    
    const wallOnlyOffsetX = leftMargin + (maxWidth - scaledWallWidth) / 2;
    const wallOnlyOffsetY = section3Y;
    
    if (imageLoaded && patternImage) {
        ctx.save();
        ctx.imageSmoothingEnabled = false;
        
        // Clip to wall area only
        ctx.beginPath();
        ctx.rect(Math.floor(wallOnlyOffsetX), Math.floor(wallOnlyOffsetY), Math.ceil(scaledWallWidth), Math.ceil(scaledWallHeight));
        ctx.clip();
        
        // Calculate transformation from Section 2 to Section 3
        const section2OffsetX = layoutData.offsetX;
        const section2WallOffsetX = section2OffsetX + (layoutData.scaledTotalWidth - scaledWallWidth) / 2;
        const section2WallOffsetY = layoutData.section2Y + ((layoutData.section2VisualHeight * scale) - scaledWallHeight) / 2;
        
        const xTransform = wallOnlyOffsetX - section2WallOffsetX;
        const yTransform = wallOnlyOffsetY - section2WallOffsetY;
        
        // Draw pattern using same logic as Section 2 but transformed
        drawTransformedPattern(ctx, xTransform, yTransform, scale, previewData);
        
        ctx.restore();
        ctx.imageSmoothingEnabled = true;
    }
    
    // Draw uncovered area if needed
    const hasLimitation = calculations.exceedsLimit || calculations.exceedsAvailableLength;
    if (hasLimitation) {
        const actualPanelLengthToUse = calculations.exceedsAvailableLength ? 
            calculations.actualPanelLength : calculations.panelLength;
        const coveredHeight = actualPanelLengthToUse * 12 * scale;
        const uncoveredAreaHeight = scaledWallHeight - coveredHeight;
        
        if (uncoveredAreaHeight > 0) {
            ctx.fillStyle = 'rgba(255, 0, 0, 0.5)';
            ctx.fillRect(wallOnlyOffsetX, wallOnlyOffsetY, scaledWallWidth, uncoveredAreaHeight);
        }
    }
    
    // Draw wall outline and dimensions
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 0.5;
    ctx.strokeRect(wallOnlyOffsetX, wallOnlyOffsetY, scaledWallWidth, scaledWallHeight);
    drawWallDimensions(ctx, wallOnlyOffsetX, wallOnlyOffsetY, scaledWallWidth, scaledWallHeight, previewData);
}

/**
 * Helper function to draw pattern elements
 */
function drawPatternElements(ctx, offsetX, startY, height, scale, previewData, hasLimitation) {
    const { pattern, calculations } = previewData;
    const repeatW = calculations.saleType === 'yard' ? pattern.repeat_width_inches * scale :
        (pattern.sequenceLength === 1 ? (pattern.panel_width_inches || 54) * scale : pattern.repeat_width_inches * scale);
    const repeatH = pattern.repeat_height_inches * scale;
    const offsetPerPanel = pattern.sequenceLength === 1 ? 0 : pattern.repeat_width_inches / pattern.sequenceLength;
    const numElements = calculations.saleType === 'yard' ? calculations.stripsNeeded : calculations.panelsNeeded;
    const elementWidth = calculations.saleType === 'yard' ? pattern.material_width_inches : (pattern.panel_width_inches || 54);
    
    for (let panelIndex = 0; panelIndex < numElements; panelIndex++) {
        const panelX = offsetX + (panelIndex * elementWidth * scale);
        const panelWidth = elementWidth * scale;
        const sequencePosition = panelIndex % (pattern.sequenceLength || 1);
        const sourceOffsetX = sequencePosition * offsetPerPanel;
        
        const panelBottomY = startY + height;
        
        for (let x = -repeatW; x < panelWidth + repeatW; x += repeatW) {
            if (pattern.hasRepeatHeight !== false) {
                // Normal repeating pattern
                for (let y = -repeatH; y < height + repeatH; y += repeatH) {
                    const drawX = panelX + x - (sourceOffsetX * scale);
                    const drawY = startY + y;
                    ctx.drawImage(patternImage, drawX, drawY, repeatW, repeatH);
                }
            } else {
                // Non-repeating pattern - anchor to bottom
                const drawX = panelX + x - (sourceOffsetX * scale);
                const drawY = panelBottomY - repeatH;
                ctx.drawImage(patternImage, drawX, drawY, repeatW, repeatH);
            }
        }
    }
}

/**
 * Draw transformed pattern for Section 3
 */
function drawTransformedPattern(ctx, xTransform, yTransform, scale, previewData) {
    const { pattern, calculations } = previewData;
    const repeatW = calculations.saleType === 'yard' ? pattern.repeat_width_inches * scale :
        (pattern.sequenceLength === 1 ? (pattern.panel_width_inches || 54) * scale : pattern.repeat_width_inches * scale);
    const repeatH = pattern.repeat_height_inches * scale;
    const offsetPerPanel = pattern.sequenceLength === 1 ? 0 : pattern.repeat_width_inches / pattern.sequenceLength;
    const numElements = calculations.saleType === 'yard' ? calculations.stripsNeeded : calculations.panelsNeeded;
    const elementWidth = calculations.saleType === 'yard' ? pattern.material_width_inches : (pattern.panel_width_inches || 54);
    
    // Use Section 2's positioning but transform to Section 3 coordinates
    const section2OffsetX = 60 + (1400 - 60 - 30 - (calculations.totalWidth * scale)) / 2;
    
    for (let panelIndex = 0; panelIndex < numElements; panelIndex++) {
        const section2PanelX = section2OffsetX + (panelIndex * elementWidth * scale);
        const panelX = section2PanelX + xTransform;
        const sequencePosition = panelIndex % (pattern.sequenceLength || 1);
        const sourceOffsetX = sequencePosition * offsetPerPanel;
        
        for (let x = -repeatW; x < elementWidth * scale + repeatW; x += repeatW) {
            const drawX = Math.floor(panelX + x - (sourceOffsetX * scale));
            
            if (pattern.hasRepeatHeight !== false) {
                // Normal repeating pattern
                for (let y = -repeatH; y < 200; y += repeatH) {
                    const drawY = Math.floor(y + yTransform);
                    ctx.drawImage(patternImage, drawX, drawY, Math.ceil(repeatW), Math.ceil(repeatH));
                }
            } else {
                // Non-repeating pattern
                const drawY = Math.floor(yTransform);
                ctx.drawImage(patternImage, drawX, drawY, Math.ceil(repeatW), Math.ceil(repeatH));
            }
        }
    }
}

/**
 * Draw arrows between sections
 */
function drawArrowsBetweenSections(ctx, layoutData, previewData) {
    const { pattern, calculations } = previewData;
    const { offsetX, section1Y, scaledTotalHeight, scale, sectionGap1 } = layoutData;
    
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 0.5;
    ctx.globalAlpha = 1.0;
    
    const numElements = calculations.saleType === 'yard' ? calculations.stripsNeeded : calculations.panelsNeeded;
    const elementWidth = calculations.saleType === 'yard' ? pattern.material_width_inches : (pattern.panel_width_inches || 54);
    
    for (let i = 0; i < numElements; i++) {
        const panelCenterX = offsetX + (i * elementWidth + elementWidth / 2) * scale;
        
        const middleY = section1Y + scaledTotalHeight + (sectionGap1 / 2);
        const startY = middleY - 6;
        const endY = middleY + 6;
        
        ctx.beginPath();
        ctx.moveTo(panelCenterX, startY);
        ctx.lineTo(panelCenterX, endY);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(panelCenterX, endY);
        ctx.lineTo(panelCenterX - 6, endY - 6);
        ctx.moveTo(panelCenterX, endY);
        ctx.lineTo(panelCenterX + 6, endY - 6);
        ctx.stroke();
    }
}

/**
 * Draw panel outlines and dimensions
 */
function drawPanelOutlines(ctx, offsetX, offsetY, scaledTotalWidth, scaledTotalHeight, scale, previewData, showDimensions) {
    const { pattern, calculations } = previewData;
    
    const numElements = calculations.saleType === 'yard' ? calculations.stripsNeeded : calculations.panelsNeeded;
    const elementWidth = calculations.saleType === 'yard' ? pattern.material_width_inches : (pattern.panel_width_inches || 54);
    
    // Panel outlines
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 0.5;
    for (let i = 0; i < numElements; i++) {
        const x = offsetX + (i * elementWidth * scale);
        const width = elementWidth * scale;
        ctx.strokeRect(x, offsetY, width, scaledTotalHeight);
    }
    
    // Dashed lines between panels
    ctx.strokeStyle = '#666666';
    ctx.lineWidth = 0.5;
    ctx.setLineDash([8, 8]);
    for (let i = 1; i < numElements; i++) {
        const x = offsetX + (i * elementWidth * scale);
        ctx.beginPath();
        ctx.moveTo(x, offsetY);
        ctx.lineTo(x, offsetY + scaledTotalHeight);
        ctx.stroke();
    }
    ctx.setLineDash([]);
    
    // A/B/C/etc labels for panel patterns with sequences
    if (calculations.saleType === 'panel' && pattern.sequenceLength > 1) {
        ctx.fillStyle = '#333';
        ctx.font = '14px sans-serif';
        ctx.textAlign = 'center';
        
        for (let i = 0; i < numElements; i++) {
            const x = offsetX + (i * elementWidth + elementWidth / 2) * scale;
            const sequencePosition = i % pattern.sequenceLength;
            const label = pattern.panelSequence ? pattern.panelSequence[sequencePosition] : String.fromCharCode(65 + sequencePosition);
            
            const textWidth = ctx.measureText(label).width;
            ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
            ctx.fillRect(x - textWidth/2 - 6, offsetY - 20, textWidth + 12, 16);
            
            ctx.fillStyle = '#333';
            ctx.fillText(label, x, offsetY - 8);
        }
    }
    
    if (showDimensions) {
        drawPanelDimensions(ctx, offsetX, offsetY, scaledTotalWidth, scaledTotalHeight, scale, previewData);
    }
}

/**
 * Draw panel dimensions
 */
function drawPanelDimensions(ctx, offsetX, offsetY, scaledTotalWidth, scaledTotalHeight, scale, previewData) {
    const { pattern, calculations } = previewData;
    
    ctx.fillStyle = '#333';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'center';
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 0.5;
    
    const elementWidth = calculations.saleType === 'yard' ? pattern.material_width_inches : (pattern.panel_width_inches || 54);
    
    // Individual element width
    const elementWidthFeet = Math.floor(elementWidth / 12);
    const elementWidthInches = elementWidth % 12;
    const elementWidthDisplay = elementWidthInches > 0 ? 
        `${elementWidthFeet}'-${elementWidthInches}"` : `${elementWidthFeet}'-0"`;
    
    if (calculations.stripsNeeded > 0 || calculations.panelsNeeded > 0) {
        const elementStartX = offsetX;
        const elementEndX = offsetX + (elementWidth * scale);
        const labelY = offsetY - 30;
        
        ctx.beginPath();
        ctx.moveTo(elementStartX, labelY);
        ctx.lineTo(elementEndX, labelY);
        ctx.stroke();
        
        drawArrowHead(ctx, elementStartX, labelY, 'right');
        drawArrowHead(ctx, elementEndX, labelY, 'left');
        
        ctx.fillText(elementWidthDisplay, (elementStartX + elementEndX) / 2, labelY - 6);
    }
    
    // Total width
    const totalWidthFeet = Math.floor(calculations.totalWidth / 12);
    const totalWidthInches = calculations.totalWidth % 12;
    const totalWidthDisplay = totalWidthInches > 0 ? 
        `${totalWidthFeet}'-${totalWidthInches}"` : `${totalWidthFeet}'-0"`;
    
    const totalLabelY = offsetY - 50;
    
    ctx.beginPath();
    ctx.moveTo(offsetX, totalLabelY);
    ctx.lineTo(offsetX + scaledTotalWidth, totalLabelY);
    ctx.stroke();
    
    drawArrowHead(ctx, offsetX, totalLabelY, 'right');
    drawArrowHead(ctx, offsetX + scaledTotalWidth, totalLabelY, 'left');
    
    ctx.fillText(totalWidthDisplay, offsetX + scaledTotalWidth / 2, totalLabelY - 6);
    
    // Height
    const heightLabelX = offsetX - 25;
    
    ctx.beginPath();
    ctx.moveTo(heightLabelX, offsetY);
    ctx.lineTo(heightLabelX, offsetY + scaledTotalHeight);
    ctx.stroke();
    
    drawArrowHead(ctx, heightLabelX, offsetY, 'down');
    drawArrowHead(ctx, heightLabelX, offsetY + scaledTotalHeight, 'up');
    
    ctx.save();
    ctx.translate(heightLabelX - 10, offsetY + scaledTotalHeight / 2);
    ctx.rotate(-Math.PI/2);
    
    // Display height properly for different calculation types
    let heightDisplay;
    if (calculations.saleType === 'yard' && calculations.stripLengthYards !== undefined) {
        heightDisplay = `${calculations.stripLengthYards}'-0"`;
    } else {
        heightDisplay = `${calculations.panelLength || Math.ceil(scaledTotalHeight / (12 * scale))}'-0"`;
    }
    
    ctx.fillText(heightDisplay, 0, 0);
    ctx.restore();
}

/**
 * Draw Section 2 outlines
 */
function drawSection2Outlines(ctx, offsetX, offsetY, scaledTotalWidth, scaledTotalHeight, scaledWallWidth, scaledWallHeight, wallOffsetX, wallOffsetY, scale, previewData) {
    const { pattern, calculations } = previewData;
    
    // Wall outline
    ctx.strokeStyle = '#2c3e50';
    ctx.lineWidth = 0.5;
    ctx.strokeRect(wallOffsetX, wallOffsetY, scaledWallWidth, scaledWallHeight);
    
    // Panel outlines
    ctx.strokeStyle = '#666666';
    ctx.lineWidth = 0.5;
    ctx.setLineDash([]);
    
    const numElements = calculations.saleType === 'yard' ? calculations.stripsNeeded : calculations.panelsNeeded;
    const elementWidth = calculations.saleType === 'yard' ? pattern.material_width_inches : (pattern.panel_width_inches || 54);
    
    for (let i = 0; i < numElements; i++) {
        const x = offsetX + (i * elementWidth * scale);
        const width = elementWidth * scale;
        ctx.strokeRect(x, offsetY, width, scaledTotalHeight);
    }
    
    // Dashed lines between panels
    ctx.setLineDash([8, 8]);
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
 * Draw wall dimensions
 */
function drawWallDimensions(ctx, wallOffsetX, wallOffsetY, scaledWallWidth, scaledWallHeight, previewData) {
    const { formattedWidth, formattedHeight } = previewData;
    
    ctx.fillStyle = '#333';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'center';
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 0.5;
    
    // Width dimension
    const widthLabelY = wallOffsetY + scaledWallHeight + 20;
    
    ctx.beginPath();
    ctx.moveTo(wallOffsetX, widthLabelY);
    ctx.lineTo(wallOffsetX + scaledWallWidth, widthLabelY);
    ctx.stroke();
    
    drawArrowHead(ctx, wallOffsetX, widthLabelY, 'right');
    drawArrowHead(ctx, wallOffsetX + scaledWallWidth, widthLabelY, 'left');
    
    ctx.fillText(formattedWidth, wallOffsetX + scaledWallWidth / 2, widthLabelY + 12);
    
    // Height dimension
    const heightLabelX = wallOffsetX - 20;
    
    ctx.beginPath();
    ctx.moveTo(heightLabelX, wallOffsetY);
    ctx.lineTo(heightLabelX, wallOffsetY + scaledWallHeight);
    ctx.stroke();
    
    drawArrowHead(ctx, heightLabelX, wallOffsetY, 'down');
    drawArrowHead(ctx, heightLabelX, wallOffsetY + scaledWallHeight, 'up');
    
    ctx.save();
    ctx.translate(heightLabelX - 10, wallOffsetY + scaledWallHeight / 2);
    ctx.rotate(-Math.PI/2);
    ctx.fillText(formattedHeight, 0, 0);
    ctx.restore();
}

/**
 * Draw arrow heads for dimension lines
 */
function drawArrowHead(ctx, x, y, direction) {
    ctx.beginPath();
    switch(direction) {
        case 'right':
            ctx.moveTo(x, y);
            ctx.lineTo(x + 6, y - 6);
            ctx.moveTo(x, y);
            ctx.lineTo(x + 6, y + 6);
            break;
        case 'left':
            ctx.moveTo(x, y);
            ctx.lineTo(x - 6, y - 6);
            ctx.moveTo(x, y);
            ctx.lineTo(x - 6, y + 6);
            break;
        case 'down':
            ctx.moveTo(x, y);
            ctx.lineTo(x - 6, y + 6);
            ctx.moveTo(x, y);
            ctx.lineTo(x + 6, y + 6);
            break;
        case 'up':
            ctx.moveTo(x, y);
            ctx.lineTo(x - 6, y - 6);
            ctx.moveTo(x, y);
            ctx.lineTo(x + 6, y - 6);
            break;
    }
    ctx.stroke();
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
 * Open canvas modal for full-size view
 */
function openCanvasModal(previewData, canvasId = 'previewCanvas') {
    console.log('Opening canvas modal for full-size view...');
    
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
    
    // Use the same 3-section drawing logic but on the high-res canvas
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
    // Create a temporary canvas object for layout calculation
    const tempCanvas = { width: canvasWidth, height: canvasHeight };
    
    // Calculate layout using the same logic
    const layoutData = calculateThreeSectionLayout(tempCanvas, previewData);
    
    // Draw the three sections with high resolution
    drawSection1_PanelLayout(ctx, layoutData, previewData);
    drawArrowsBetweenSections(ctx, layoutData, previewData);
    drawSection2_CompleteView(ctx, layoutData, previewData);
    drawSection3_WallOnly(ctx, layoutData, previewData);
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
        drawSection1_PanelLayout,
        drawSection2_CompleteView,
        drawSection3_WallOnly,
        drawArrowsBetweenSections,
        calculateThreeSectionLayout
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
        drawSection1_PanelLayout,
        drawSection2_CompleteView,
        drawSection3_WallOnly,
        drawArrowsBetweenSections,
        calculateThreeSectionLayout
    };
}
