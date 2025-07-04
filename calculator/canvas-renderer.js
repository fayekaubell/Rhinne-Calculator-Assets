// Canvas Rendering Logic for Wallpaper Calculator
// Handles the visual preview of wallpaper patterns on walls
// MODIFIED: 2-section layout with dimensions on Section 2

// Main drawing function
function drawPreview() {
    if (!currentPreview) {
        console.error('No current preview data available for rendering');
        return;
    }

    const canvas = document.getElementById('previewCanvas');
    const ctx = canvas.getContext('2d');
    const { pattern, wallWidth, wallHeight, calculations } = currentPreview;
    
    console.log('🎨 Starting canvas render for:', pattern.name);
    
    // Clear canvas
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Calculate scale - use actual wall dimensions
    const leftMargin = 60;
    const rightMargin = 30;
    const maxWidth = canvas.width - leftMargin - rightMargin;
    const maxHeight = canvas.height - 80;
    
    const sectionGap = 40; // Gap between Section 2 and Section 3
    const dimensionSpace = 80; // Space for dimensions above and below sections
    
    // Determine content height for consistent spacing
    const effectiveHeight = calculations.totalHeight;
    
    // Determine actual visual height needed for Section 2
    const section2VisualHeight = Math.max(calculations.totalHeight, wallHeight);
    
    // Calculate total content height for 2-section layout
    const totalContentHeight = section2VisualHeight + wallHeight + sectionGap + dimensionSpace;
    
    // Determine content width
    const effectiveWidth = Math.max(calculations.totalWidth, wallWidth);
    
    const widthScale = maxWidth / effectiveWidth;
    const heightScale = maxHeight / totalContentHeight;
    const scale = Math.min(widthScale, heightScale);
    
    const scaledTotalWidth = calculations.totalWidth * scale;
    const scaledTotalHeight = calculations.totalHeight * scale;
    const scaledWallWidth = wallWidth * scale;
    const scaledWallHeight = wallHeight * scale;
    
    const actualContentHeight = (section2VisualHeight * scale) + scaledWallHeight + sectionGap + dimensionSpace;
    let currentY = (canvas.height - actualContentHeight) / 2 + (dimensionSpace * 0.7);
    
    const offsetX = leftMargin + (maxWidth - scaledTotalWidth) / 2;
    
    // Section 2: Complete view with wall overlay and dimensions
    const wallOffsetX = offsetX + (scaledTotalWidth - scaledWallWidth) / 2;
    const wallOffsetY = currentY + ((section2VisualHeight * scale) - scaledWallHeight) / 2;
    drawSection2_CompleteViewWithDimensions(ctx, offsetX, currentY, scaledTotalWidth, scaledTotalHeight, scaledWallWidth, scaledWallHeight, wallOffsetX, wallOffsetY, scale);
    
    currentY += section2VisualHeight * scale + sectionGap;
    
    // Section 3: Wall only
    const wallOnlyOffsetX = leftMargin + (maxWidth - scaledWallWidth) / 2;
    drawSection3_WallOnly(ctx, wallOnlyOffsetX, currentY, scaledWallWidth, scaledWallHeight, scale);
}

// NEW: Section 2 with dimensions - Complete view with wall overlay and strip dimensions
function drawSection2_CompleteViewWithDimensions(ctx, offsetX, offsetY, scaledTotalWidth, scaledTotalHeight, scaledWallWidth, scaledWallHeight, wallOffsetX, wallOffsetY, scale) {
    const { pattern, calculations } = currentPreview;
    
    // Draw pattern with opacity for overage areas
    if (imageLoaded && patternImage) {
        const repeatW = pattern.repeatWidth * scale;
        const repeatH = pattern.repeatHeight * scale;
        const patternMatch = pattern.patternMatch || 'straight';
        
        // Determine half-drop behavior
        const repeatsPerPanel = pattern.panelWidth / pattern.repeatWidth;
        const isEvenDivision = repeatsPerPanel === Math.floor(repeatsPerPanel);
        const useInternalOffset = patternMatch === 'half drop' && isEvenDivision && repeatsPerPanel > 1;
        const usePanelOffset = patternMatch === 'half drop' && (!isEvenDivision || repeatsPerPanel === 1);
        
        // First pass: Draw all panels at 50% opacity (clipped to panel areas only)
        ctx.globalAlpha = 0.5;
        for (let stripIndex = 0; stripIndex < calculations.panelsNeeded; stripIndex++) {
            const stripX = offsetX + (stripIndex * pattern.panelWidth * scale);
            const stripWidth = pattern.panelWidth * scale;
            
            ctx.save();
            ctx.beginPath();
            ctx.rect(stripX, offsetY, stripWidth, scaledTotalHeight);
            ctx.clip();
            
            // Calculate strip-level vertical offset for panel-to-panel half drop
            let stripVerticalOffset = 0;
            if (usePanelOffset && stripIndex % 2 === 1) {
                stripVerticalOffset = repeatH / 2;
            }
            
            // Calculate how many horizontal repeats fit in the strip
            const horizontalRepeats = Math.ceil(stripWidth / repeatW) + 1;
            
            for (let xIndex = 0; xIndex < horizontalRepeats; xIndex++) {
                const patternX = stripX + (xIndex * repeatW) - repeatW;
                
                // Calculate internal repeat offset for within-panel half drop
                let internalRepeatOffset = 0;
                if (useInternalOffset && xIndex % 2 === 1) {
                    internalRepeatOffset = repeatH / 2;
                }
                
                // Draw vertical column of repeats with both offsets
                for (let y = -repeatH; y < scaledTotalHeight + repeatH; y += repeatH) {
                    const drawX = patternX;
                    const drawY = offsetY + y + stripVerticalOffset + internalRepeatOffset;
                    ctx.drawImage(patternImage, drawX, drawY, repeatW, repeatH);
                }
            }
            
            ctx.restore();
        }
        
        // Second pass: Draw wall area at 100% opacity (clipped to wall area only)
        ctx.globalAlpha = 1.0;
        ctx.save();
        ctx.beginPath();
        ctx.rect(wallOffsetX, wallOffsetY, scaledWallWidth, scaledWallHeight);
        ctx.clip();
        
        for (let stripIndex = 0; stripIndex < calculations.panelsNeeded; stripIndex++) {
            const stripX = offsetX + (stripIndex * pattern.panelWidth * scale);
            const stripWidth = pattern.panelWidth * scale;
            
            // Calculate strip-level vertical offset for panel-to-panel half drop
            let stripVerticalOffset = 0;
            if (usePanelOffset && stripIndex % 2 === 1) {
                stripVerticalOffset = repeatH / 2;
            }
            
            // Calculate how many horizontal repeats fit in the strip
            const horizontalRepeats = Math.ceil(stripWidth / repeatW) + 1;
            
            for (let xIndex = 0; xIndex < horizontalRepeats; xIndex++) {
                const patternX = stripX + (xIndex * repeatW) - repeatW;
                
                // Calculate internal repeat offset for within-panel half drop
                let internalRepeatOffset = 0;
                if (useInternalOffset && xIndex % 2 === 1) {
                    internalRepeatOffset = repeatH / 2;
                }
                
                // Draw vertical column of repeats with both offsets
                for (let y = -repeatH; y < scaledTotalHeight + repeatH; y += repeatH) {
                    const drawX = patternX;
                    const drawY = offsetY + y + stripVerticalOffset + internalRepeatOffset;
                    ctx.drawImage(patternImage, drawX, drawY, repeatW, repeatH);
                }
            }
        }
        
        ctx.restore();
        ctx.globalAlpha = 1.0;
    }
    
    // Draw outlines
    drawSection2Outlines(ctx, offsetX, offsetY, scaledTotalWidth, scaledTotalHeight, scaledWallWidth, scaledWallHeight, wallOffsetX, wallOffsetY, scale);
    
    // Draw dimensions (moved from Section 1)
    drawSection2Dimensions(ctx, offsetX, offsetY, scaledTotalWidth, scaledTotalHeight, scale);
}

// NEW: Dimensions for Section 2 (adapted from original drawStripDimensions)
function drawSection2Dimensions(ctx, offsetX, offsetY, scaledTotalWidth, scaledTotalHeight, scale) {
    const { pattern, calculations } = currentPreview;
    
    ctx.fillStyle = '#333';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'center';
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 0.5;
    
    // Individual strip width dimension
    const stripWidthFeet = Math.floor(pattern.panelWidth / 12);
    const stripWidthInches = pattern.panelWidth % 12;
    const stripWidthDisplay = stripWidthInches > 0 ? `${stripWidthFeet}'-${stripWidthInches}"` : `${stripWidthFeet}'-0"`;
    
    if (calculations.panelsNeeded > 0) {
        const stripStartX = offsetX;
        const stripEndX = offsetX + (pattern.panelWidth * scale);
        const labelY = offsetY - 30;
        
        // Strip width dimension line
        ctx.beginPath();
        ctx.moveTo(stripStartX, labelY);
        ctx.lineTo(stripEndX, labelY);
        ctx.stroke();
        
        drawArrowHead(ctx, stripStartX, labelY, 'right');
        drawArrowHead(ctx, stripEndX, labelY, 'left');
        
        ctx.fillText(stripWidthDisplay, (stripStartX + stripEndX) / 2, labelY - 6);
    }
    
    // Total width dimension
    const totalWidthFeet = Math.floor(calculations.totalWidth / 12);
    const totalWidthInches = calculations.totalWidth % 12;
    const totalWidthDisplay = totalWidthInches > 0 ? `${totalWidthFeet}'-${totalWidthInches}"` : `${totalWidthFeet}'-0"`;
    
    const totalLabelY = offsetY - 55;
    
    // Total width dimension line
    ctx.beginPath();
    ctx.moveTo(offsetX, totalLabelY);
    ctx.lineTo(offsetX + scaledTotalWidth, totalLabelY);
    ctx.stroke();
    
    drawArrowHead(ctx, offsetX, totalLabelY, 'right');
    drawArrowHead(ctx, offsetX + scaledTotalWidth, totalLabelY, 'left');
    
    ctx.fillText(totalWidthDisplay, offsetX + scaledTotalWidth / 2, totalLabelY - 6);
    
    // Height dimension (on the left side)
    const heightLabelX = offsetX - 25;
    
    ctx.beginPath();
    ctx.moveTo(heightLabelX, offsetY);
    ctx.lineTo(heightLabelX, offsetY + scaledTotalHeight);
    ctx.stroke();
    
    drawArrowHead(ctx, heightLabelX, offsetY, 'down');
    drawArrowHead(ctx, heightLabelX, offsetY + scaledTotalHeight, 'up');
    
    // Display strip length properly for yard patterns
    let heightDisplay;
    if (calculations.panelLengthInches !== undefined) {
        const inches = calculations.panelLengthInches;
        heightDisplay = inches > 0 ? `${calculations.panelLength}'-${inches}"` : `${calculations.panelLength}'-0"`;
    } else {
        heightDisplay = `${calculations.panelLength}'-0"`;
    }
    
    ctx.save();
    ctx.translate(heightLabelX - 10, offsetY + scaledTotalHeight / 2);
    ctx.rotate(-Math.PI/2);
    ctx.fillText(heightDisplay, 0, 0);
    ctx.restore();
}

// UNCHANGED: Section 3 - Wall only view with proper half-drop alignment
function drawSection3_WallOnly(ctx, wallOffsetX, wallOffsetY, scaledWallWidth, scaledWallHeight, scale) {
    const { pattern, wallWidth, wallHeight, calculations } = currentPreview;
    
    if (imageLoaded && patternImage) {
        ctx.save();
        
        // Disable anti-aliasing to prevent white lines
        ctx.imageSmoothingEnabled = false;
        
        // Clip to wall area only
        ctx.beginPath();
        ctx.rect(Math.floor(wallOffsetX), Math.floor(wallOffsetY), Math.ceil(scaledWallWidth), Math.ceil(scaledWallHeight));
        ctx.clip();
        
        // MODIFIED: Calculate transformation to align with Section 2 (no longer Section 2)
        const leftMargin = 60;
        const maxWidth = 1400 - leftMargin - 30;
        const scaledTotalWidth = calculations.totalWidth * scale;
        const section2OffsetX = leftMargin + (maxWidth - scaledTotalWidth) / 2;
        
        const section2WallOffsetX = section2OffsetX + (scaledTotalWidth - (wallWidth * scale)) / 2;
        const xTransform = wallOffsetX - section2WallOffsetX;
        
        // Draw pattern using same logic as Section 2 but transformed
        const repeatW = pattern.repeatWidth * scale;
        const repeatH = pattern.repeatHeight * scale;
        const patternMatch = pattern.patternMatch || 'straight';
        
        // Determine half-drop behavior
        const repeatsPerPanel = pattern.panelWidth / pattern.repeatWidth;
        const isEvenDivision = repeatsPerPanel === Math.floor(repeatsPerPanel);
        const useInternalOffset = patternMatch === 'half drop' && isEvenDivision && repeatsPerPanel > 1;
        const usePanelOffset = patternMatch === 'half drop' && (!isEvenDivision || repeatsPerPanel === 1);
        
        for (let stripIndex = 0; stripIndex < calculations.panelsNeeded; stripIndex++) {
            const section2StripX = section2OffsetX + (stripIndex * pattern.panelWidth * scale);
            const stripX = section2StripX + xTransform;
            
            // Calculate strip-level vertical offset for panel-to-panel half drop
            let stripVerticalOffset = 0;
            if (usePanelOffset && stripIndex % 2 === 1) {
                stripVerticalOffset = repeatH / 2;
            }
            
            // Calculate how many horizontal repeats fit in the strip
            const horizontalRepeats = Math.ceil((pattern.panelWidth * scale) / repeatW) + 1;
            
            for (let xIndex = 0; xIndex < horizontalRepeats; xIndex++) {
                const patternX = stripX + (xIndex * repeatW) - repeatW;
                
                // Calculate internal repeat offset for within-panel half drop
                let internalRepeatOffset = 0;
                if (useInternalOffset && xIndex % 2 === 1) {
                    internalRepeatOffset = repeatH / 2;
                }
                
                // Draw vertical column of repeats with both offsets
                for (let y = -repeatH; y < scaledWallHeight + repeatH; y += repeatH) {
                    const drawX = Math.floor(patternX);
                    const drawY = Math.floor(wallOffsetY + y + stripVerticalOffset + internalRepeatOffset);
                    ctx.drawImage(patternImage, drawX, drawY, Math.ceil(repeatW), Math.ceil(repeatH));
                }
            }
        }
        
        ctx.restore();
        // Re-enable anti-aliasing
        ctx.imageSmoothingEnabled = true;
    }
    
    // Draw wall outline and dimensions
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 0.5;
    ctx.strokeRect(wallOffsetX, wallOffsetY, scaledWallWidth, scaledWallHeight);
    drawWallDimensions(ctx, wallOffsetX, wallOffsetY, scaledWallWidth, scaledWallHeight);
}

// UNCHANGED: Helper functions for drawing outlines and dimensions
function drawSection2Outlines(ctx, offsetX, offsetY, scaledTotalWidth, scaledTotalHeight, scaledWallWidth, scaledWallHeight, wallOffsetX, wallOffsetY, scale) {
    const { pattern, calculations } = currentPreview;
    
    // Wall outline
    ctx.strokeStyle = '#2c3e50';
    ctx.lineWidth = 0.5;
    ctx.strokeRect(wallOffsetX, wallOffsetY, scaledWallWidth, scaledWallHeight);
    
    // Strip outlines
    ctx.strokeStyle = '#666666';
    ctx.lineWidth = 0.5;
    ctx.setLineDash([]);
    
    for (let i = 0; i < calculations.panelsNeeded; i++) {
        const x = offsetX + (i * pattern.panelWidth * scale);
        const width = pattern.panelWidth * scale;
        ctx.strokeRect(x, offsetY, width, scaledTotalHeight);
    }
    
    // Dashed lines between strips
    ctx.setLineDash([8, 8]);
    for (let i = 1; i < calculations.panelsNeeded; i++) {
        const x = offsetX + (i * pattern.panelWidth * scale);
        ctx.beginPath();
        ctx.moveTo(x, offsetY);
        ctx.lineTo(x, offsetY + scaledTotalHeight);
        ctx.stroke();
    }
    ctx.setLineDash([]);
}

function drawWallDimensions(ctx, wallOffsetX, wallOffsetY, scaledWallWidth, scaledWallHeight) {
    const { wallWidthFeet, wallWidthInches, wallHeightFeet, wallHeightInches } = currentPreview;
    
    ctx.fillStyle = '#333';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'center';
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 0.5;
    
    const widthDisplay = wallWidthInches > 0 ? `${wallWidthFeet}'-${wallWidthInches}"` : `${wallWidthFeet}'-0"`;
    const heightDisplay = wallHeightInches > 0 ? `${wallHeightFeet}'-${wallHeightInches}"` : `${wallHeightFeet}'-0"`;
    
    // Width dimension
    const widthLabelY = wallOffsetY + scaledWallHeight + 20;
    
    ctx.beginPath();
    ctx.moveTo(wallOffsetX, widthLabelY);
    ctx.lineTo(wallOffsetX + scaledWallWidth, widthLabelY);
    ctx.stroke();
    
    drawArrowHead(ctx, wallOffsetX, widthLabelY, 'right');
    drawArrowHead(ctx, wallOffsetX + scaledWallWidth, widthLabelY, 'left');
    
    ctx.fillText(widthDisplay, wallOffsetX + scaledWallWidth / 2, widthLabelY + 12);
    
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
    ctx.fillText(heightDisplay, 0, 0);
    ctx.restore();
}

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

// UNCHANGED: Modal functionality for full-size view
function openCanvasModal() {
    if (!currentPreview) {
        console.error('No current preview data available for modal');
        return;
    }

    console.log('Opening canvas modal...');
    
    const modal = document.createElement('div');
    modal.className = 'canvas-modal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: rgba(0, 0, 0, 0.9);
        z-index: 9999;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 20px;
    `;
    
    const largeCanvas = document.createElement('canvas');
    const hiResScale = 2;
    largeCanvas.width = 1400 * hiResScale;
    largeCanvas.height = 1600 * hiResScale;
    
    const displayWidth = Math.min(window.innerWidth * 0.9, 1400);
    const displayHeight = (displayWidth / 1400) * 1600;
    
    largeCanvas.style.width = displayWidth + 'px';
    largeCanvas.style.height = displayHeight + 'px';
    largeCanvas.style.cursor = 'zoom-out';
    largeCanvas.style.border = '2px solid #fff';
    largeCanvas.style.borderRadius = '8px';
    
    const largeCtx = largeCanvas.getContext('2d');
    largeCtx.scale(hiResScale, hiResScale);
    largeCtx.imageSmoothingEnabled = true;
    largeCtx.imageSmoothingQuality = 'high';
    
    // Clear and render high-quality version
    largeCtx.fillStyle = '#ffffff';
    largeCtx.fillRect(0, 0, 1400, 1600);
    
    // Temporarily store current context and render to large canvas
    const originalCanvas = document.getElementById('previewCanvas');
    const tempCurrentPreview = currentPreview;
    
    // Backup and replace the canvas context for rendering
    const originalGetContext = document.getElementById.bind(document);
    document.getElementById = function(id) {
        if (id === 'previewCanvas') {
            return { getContext: () => largeCtx, width: 1400, height: 1600 };
        }
        return originalGetContext(id);
    };
    
    // Re-render at high resolution
    drawPreview();
    
    // Restore original function
    document.getElementById = originalGetContext;
    
    modal.appendChild(largeCanvas);
    
    // Close modal when clicked
    modal.onclick = (e) => {
        if (e.target === modal || e.target === largeCanvas) {
            document.body.removeChild(modal);
        }
    };
    
    document.body.appendChild(modal);
}

// Make functions globally available
window.drawPreview = drawPreview;
window.openCanvasModal = openCanvasModal;
