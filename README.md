# Rhinne-Calculator-Assets
Pattern images for wallpaper calculator

# Wallpaper Preview Calculator

A standalone wallpaper quantity calculator with visual preview functionality. This calculator helps users estimate wallpaper requirements and visualize pattern layouts on their walls.

## 🌟 Features

- **Pattern Selection**: Choose from 27 available wallpaper patterns
- **Visual Preview**: Interactive canvas showing pattern layout on wall
- **Quantity Calculation**: Accurate yardage estimation for yard-based patterns
- **Pattern Matching**: Supports both straight match and half drop patterns
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **Embeddable**: Perfect for iframe integration into any website
- **Zero Dependencies**: Self-contained HTML/CSS/JS with no external libraries

## 🚀 Live Demo

View the calculator at: `https://fayekaubell.github.io/Rhinne-Calculator-Assets/`

## 📱 Embedding

To embed this calculator in your website, use an iframe:

```html
<iframe 
    src="https://fayekaubell.github.io/Rhinne-Calculator-Assets/" 
    width="100%" 
    height="800" 
    frameborder="0"
    style="border: none; border-radius: 8px;">
</iframe>
```

### Responsive Embedding

For responsive websites, use this CSS:

```css
.wallpaper-calculator {
    position: relative;
    width: 100%;
    height: 0;
    padding-bottom: 75%; /* 4:3 aspect ratio */
}

.wallpaper-calculator iframe {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    border: none;
}
```

```html
<div class="wallpaper-calculator">
    <iframe src="https://fayekaubell.github.io/Rhinne-Calculator-Assets/"></iframe>
</div>
```

## 🛠️ How It Works

1. **Pattern Selection**: Users choose from available wallpaper patterns
2. **Dimension Input**: Enter wall width and height in feet and inches
3. **Calculation**: Algorithm determines:
   - Number of strips needed
   - Strip length requirements
   - Total yardage accounting for pattern matching
   - Minimum order quantities
4. **Visual Preview**: Canvas renders pattern layout showing:
   - Pattern tiling across the wall area
   - Strip divisions and numbering
   - Wall outline within coverage area
   - Clickable zoom for detailed view

## 📐 Calculation Logic

### For Yard-Based Patterns:

- **Width Coverage**: `Math.ceil((wall_width + 4") / material_width)`
- **Height Coverage**: Based on pattern repeat and matching type
- **Pattern Matching**:
  - **Straight Match**: Standard repeat calculation
  - **Half Drop**: Additional length for offset matching
- **Final Yardage**: `Math.max(calculated_yards, minimum_order)`

### Overage Included:
- 4" added to both width and height dimensions
- Additional recommendations for 10-20% installer overage

## 🗂️ File Structure

```
├── index.html          # Main calculator interface
├── patterns-data.js    # Pattern database (converted from CSV)
├── patterns/           # Pattern image assets
│   ├── W-MEG-DUS-2-repeat.jpg
│   ├── W-MEG-DUS-repeat.jpg
│   └── ...
└── README.md          # This file
```

## 🎨 Pattern Data Format

Each pattern includes:
```javascript
{
    "pattern_name": "Megaflora: Dusk",
    "sku": "W-MEG-DUS-2",
    "sale_type": "yard",
    "repeat_width_inches": 27,
    "repeat_height_inches": 33.5,
    "material_width_inches": 27,
    "pattern_match": "half drop",
    "min_yard_order": 5,
    "repeat_url": "https://raw.githubusercontent.com/..."
}
```

## 🔧 Customization

### Adding New Patterns
1. Add pattern images to `/patterns/` folder
2. Update `patterns-data.js` with new pattern data
3. Commit and push changes to GitHub

### Styling Customization
The calculator uses minimal styling and inherits from parent websites:
- Colors inherit from parent site
- Fonts inherit from parent site
- Background is transparent
- Components use subtle opacity for blending

### Brand Customization
- Modify `page-title` section for custom branding
- Update disclaimer text as needed
- Customize color scheme in CSS variables

## 🌐 Browser Support

- **Modern Browsers**: Chrome, Firefox, Safari, Edge (latest versions)
- **Mobile**: iOS Safari, Android Chrome
- **Canvas Support**: Required for visual preview functionality
- **JavaScript**: ES6+ features used

## 📝 License

This calculator is proprietary software. All rights reserved.

## 🤝 Support

For technical support or customization requests, please contact the development team.

---

**Version**: 1.0  
**Last Updated**: January 2025  
**Compatibility**: All modern browsers, mobile responsive
