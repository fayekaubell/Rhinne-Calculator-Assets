# Wallpaper Calculator

A modular wallpaper calculator that can be easily embedded on websites and customized with different pattern catalogs. This calculator provides visual previews of wallpaper patterns on walls and calculates yardage requirements.

## Features

- **Visual Pattern Preview**: Shows how wallpaper patterns will look on walls with realistic scaling
- **Accurate Calculations**: Calculates yardage requirements for yard-based wallpaper patterns
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **Embeddable**: Can be easily integrated into existing websites
- **Customizable**: Easy to swap pattern catalogs for different clients
- **Canvas Zoom**: Click to view full-size pattern previews (desktop only)

## File Structure

```
wallpaper-calculator/
├── index.html              # Main calculator page
├── css/
│   └── calculator.css      # Styling (inherits from parent site)
├── js/
│   ├── patterns-data.js    # Pattern catalog data (client-specific)
│   ├── calculator-core.js  # Main calculation logic
│   └── canvas-renderer.js  # Visual preview rendering
└── README.md              # This file
```

## Quick Start

1. **Clone or download** this repository
2. **Host the files** on your web server or GitHub Pages
3. **Open index.html** in a web browser
4. **Test the calculator** with the included Rhinne pattern catalog

## Customization for Different Clients

### Swapping Pattern Catalogs

The main customization point is the `js/patterns-data.js` file. Each client can have their own pattern catalog by replacing this file.

#### Pattern Data Format

Each pattern in the catalog should follow this structure:

```javascript
"pattern-id": {
    "name": "Pattern Name",
    "sku": "PATTERN-SKU",
    "repeatWidth": 27,           // inches
    "repeatHeight": 33.5,        // inches
    "hasRepeatHeight": true,
    "imageUrl": "path/to/pattern-image.jpg",
    "thumbnailUrl": "path/to/thumbnail.jpg",
    "saleType": "yard",
    "panelWidth": 27,            // material width in inches
    "rollWidth": 27,             // for yard patterns
    "minYardOrder": 5,           // minimum order quantity
    // ... other properties
}
```

#### Converting CSV to Pattern Data

If you have pattern data in CSV format (like the included template), you can convert it using the patterns included in this repository:

1. Update the CSV with your pattern information
2. Use the conversion logic from the original calculator code
3. Generate a new `patterns-data.js` file

### Styling Customization

The calculator is designed to inherit styles from the parent website when embedded. Key customization points:

- **Colors**: Modify button colors and accent colors in `calculator.css`
- **Fonts**: The calculator inherits `font-family` from the parent site
- **Spacing**: Adjust margins and padding as needed
- **Branding**: Add logos or brand elements to the HTML

## Embedding on Websites

### Option 1: Iframe Embed

```html
<iframe 
    src="https://your-domain.com/wallpaper-calculator/" 
    width="100%" 
    height="1200px" 
    frameborder="0">
</iframe>
```

### Option 2: Direct Integration

Copy the calculator HTML, CSS, and JS directly into your existing page template.

### Option 3: JavaScript Widget

Include the calculator as a JavaScript widget that can be inserted into any div:

```html
<div id="wallpaper-calculator"></div>
<script src="https://your-domain.com/calculator/widget.js"></script>
```

## Browser Support

- **Modern Browsers**: Chrome, Firefox, Safari, Edge (latest versions)
- **Mobile**: iOS Safari, Android Chrome
- **Features Used**: Canvas API, ES6 JavaScript, CSS Grid/Flexbox

## Dependencies

- **None**: Pure vanilla JavaScript, no external libraries required
- **Optional**: Can be enhanced with libraries like jsPDF for PDF generation

## Development

### Local Development

1. Serve files using a local web server (required for loading images)
2. Python: `python -m http.server 8000`
3. Node.js: `npx serve .`
4. PHP: `php -S localhost:8000`

### Testing

- Test with different wall dimensions
- Verify calculations are accurate
- Check responsive design on various screen sizes
- Test pattern image loading

## Deployment

### GitHub Pages

1. Push files to a GitHub repository
2. Enable GitHub Pages in repository settings
3. Calculator will be available at `https://username.github.io/repository-name/`

### Other Hosting

- Upload files to any web hosting service
- Ensure HTTPS is enabled for cross-origin image loading
- Configure CORS headers if needed for pattern images

## Pattern Image Requirements

- **Format**: JPG, PNG, or WebP
- **Size**: Recommended 400-800px width for performance
- **Aspect Ratio**: Should match the pattern's repeat dimensions
- **CORS**: Images must be served with appropriate CORS headers if hosted on different domains

## Calculation Logic

The calculator uses the following logic for yard-based patterns:

1. **Strip Calculation**: Determines how many vertical strips are needed to cover wall width
2. **Length Calculation**: Calculates strip length based on pattern repeat and wall height
3. **Yardage Calculation**: Converts total material needed to yards
4. **Minimum Orders**: Applies minimum order quantities from pattern data

## Troubleshooting

### Common Issues

1. **Images not loading**: Check CORS headers and image URLs
2. **Calculations seem wrong**: Verify pattern data (repeat dimensions, material width)
3. **Mobile display issues**: Test responsive CSS and canvas scaling
4. **Performance**: Optimize pattern images for web use

### Browser Console

Check browser developer tools console for error messages and debugging information.

## Future Enhancements

Potential features that could be added:

- **PDF Generation**: Export calculations and previews as PDF
- **Quote System**: Integration with CRM or quote management
- **Multi-wall Calculator**: Calculate for multiple walls at once
- **Pattern Matching**: Advanced pattern matching options
- **Material Calculator**: Include adhesive and tool calculations
- **3D Preview**: More realistic wall visualization

## Support

For technical support or customization assistance:

1. Check this README for common solutions
2. Review the browser console for error messages
3. Test with the included sample patterns first
4. Verify pattern data format matches the requirements

## License

This calculator is provided as-is for client projects. Modify and use as needed for your specific requirements.
