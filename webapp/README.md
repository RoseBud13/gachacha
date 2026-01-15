# Gachacha - Lucky Card Draw 🎴✨

A modern Progressive Web App (PWA) for drawing lucky cards with stunning 3D animations and interactive carousel effects.

## Features

### 🎡 Interactive 3D Card Carousel

* Cards arranged in a circular layout with 3D depth perspective
* Smooth continuous rotation animation
* Mouse/touch interaction to control rotation direction
* Hover near edges to change card movement direction

### 🎴 Card Flip Animation

* Beautiful 3D card flip transitions
* Card back displays a mystery design
* Card front reveals the lucky content
* Click selected card to flip and reveal

### ⚙️ Customizable Settings

* **Card Amount**: Configure between 3-20 cards
* **Card Content**: Customize the text on each card
* **Movement Speed**: Adjust rotation speed (0.5x - 3x)
* Settings persist in localStorage

### 📱 Progressive Web App

* Installable on mobile and desktop
* Offline support with service worker
* Responsive design for all screen sizes
* Touch-friendly interface

## Getting Started

### Prerequisites

* Node.js (v18 or higher)
* npm or yarn

### Installation

1. Navigate to the webapp directory:

```bash
cd webapp
```

2. Install dependencies:

```bash
npm install
```

3. Start the development server:

```bash
npm run dev
```

4. Open your browser and visit:

```
http://localhost:5177
```

### Building for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

### Preview Production Build

```bash
npm run preview
```

## Usage

### Drawing Cards

1. **Watch the Cards**: Cards automatically rotate in a circular pattern
2. **Control Direction**: Move your mouse/finger to the left or right edge to change rotation direction
3. **Confirm Selection**: Click the "Confirm Selection" button at the bottom
4. **Reveal Content**: Click the selected card to flip it and reveal your lucky draw!
5. **Draw Again**: Click "Draw Again" to reset and draw another card

### Configuring Settings

1. Click the **Settings** button (⚙️) in the top-right corner
2. Adjust the following:
   - **Number of Cards**: Use the slider to set card amount (3-20)
   - **Movement Speed**: Control how fast cards rotate (0.5x - 3x)
   - **Card Contents**: Edit the text displayed on each card
3. Click **Save Changes** to apply your settings
4. Click **Reset to Default** to restore default values

## Tech Stack

* **React 19** - UI framework
* **TypeScript** - Type-safe development
* **Vite** - Build tool and dev server
* **React Router** - Client-side routing
* **Vite PWA Plugin** - Progressive Web App capabilities
* **CSS3** - 3D transforms and animations

## Project Structure

```
webapp/
├── public/
│   ├── manifest.json      # PWA manifest
│   ├── icon-192.png       # App icon (192x192)
│   └── icon-512.png       # App icon (512x512)
├── src/
│   ├── context/
│   │   └── AppContext.tsx # Global state management
│   ├── pages/
│   │   ├── HomePage.tsx   # Main card carousel page
│   │   ├── HomePage.css
│   │   ├── SettingsPage.tsx # Settings configuration
│   │   └── SettingsPage.css
│   ├── App.tsx            # Router setup
│   ├── App.css
│   ├── main.tsx           # Entry point
│   └── index.css          # Global styles
├── index.html
├── vite.config.ts         # Vite & PWA configuration
└── package.json
```

## Features in Detail

### 3D Card Carousel

The card carousel uses CSS 3D transforms to create a circular arrangement with depth. Cards are positioned using trigonometry (sin/cos) to calculate their x and z coordinates in 3D space. The scale and opacity adjust based on the z-position to create a realistic depth effect.

### Touch & Mouse Interaction

The app detects mouse/touch position relative to the container edges. When near the left edge, cards rotate counter-clockwise; when near the right edge, they rotate clockwise. This creates an intuitive interface for browsing cards.

### Card Flip Mechanism

Each card has two faces (front and back) using `backface-visibility: hidden` and `rotateY` transforms. When flipped, the card smoothly transitions 180 degrees to reveal the content.

### State Persistence

All settings (card amount, contents, speed) are saved to localStorage and automatically restored when you revisit the app.

## Browser Support

* Chrome/Edge 90+
* Firefox 88+
* Safari 14+
* Mobile browsers with CSS 3D transform support

## Contributing

Feel free to submit issues and enhancement requests!

## License

MIT License

---

Built with ❤️ using React and Vite
