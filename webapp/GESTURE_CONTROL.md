# Gesture Control Feature

## Overview
The webapp now includes advanced gesture-based control using computer vision. Users can control the card carousel using hand movements tracked through their webcam or phone camera.

## How It Works

### Technology Stack
- **MediaPipe Hands**: Advanced hand tracking library by Google
- **Camera Utils**: Camera access and management
- **React Hooks**: Custom `useGestureControl` hook for gesture state management

### Features

#### 1. Hand Detection
- Tracks up to 21 hand landmarks in real-time
- Works with laptop webcams and phone front cameras
- Optimized for performance with minimal lag

#### 2. Palm Movement Control
- **Left/Right Navigation**: Move your open palm left or right to control card direction
- **Speed Control**: Distance from screen edge determines rotation speed
  - Center zone (30-70%): Slow, controlled movement
  - Edge zones (0-30% or 70-100%): Fast movement
- **Direction**: 
  - Palm on left side → Cards rotate left
  - Palm on right side → Cards rotate right

#### 3. Pinch Gesture Selection
- **Detection**: Measures distance between thumb tip and index finger tip
- **Threshold**: Pinch detected when distance < 0.05 normalized units
- **Action**: Stops card movement and selects the centered card

#### 4. Visual Feedback
- Real-time hand tracking visualization on canvas
- Color-coded indicators:
  - Green: Hand detected, normal mode
  - Red: Pinch detected, selection mode
- Speed bar showing movement intensity and direction
- Status messages for hand detection state

## User Interface

### Gesture Control Button
- Located in top-right corner below Settings button
- **OFF State**: Blue "🤚 Gesture: OFF" button
- **ON State**: Green "👋 Gesture: ON" button
- Click to toggle gesture control on/off

### Status Panel (when enabled)
Shows:
- Initialization status
- Hand detection state
- Current gesture (open palm or pinch)
- Speed and direction indicator
- Live camera feed with hand tracking overlay

### Instructions Modal
- Automatically appears on first use
- Comprehensive guide on how to use gestures
- Tips for optimal tracking
- Can be dismissed and won't show again

## Usage Guide

### Getting Started
1. Click the "🤚 Gesture: OFF" button to enable gesture control
2. Allow camera permissions when prompted
3. Read the instructions modal (shown on first use)
4. Position your hand in front of the camera

### Controlling Cards
1. **Start Moving**: Show your open palm to the camera
2. **Navigate**: Move your palm left or right
3. **Speed Up**: Move your palm closer to the screen edges
4. **Slow Down**: Keep your palm in the center zone
5. **Select**: Make a pinch gesture (thumb + index finger)

### Best Practices
- ✅ Ensure good lighting for accurate tracking
- ✅ Keep your hand within the camera's field of view
- ✅ Use clear, deliberate movements
- ✅ Maintain a consistent distance from the camera
- ✅ Allow camera permissions for the feature to work

### Troubleshooting
- **Hand not detected**: Check lighting and hand visibility
- **Jerky movement**: Ensure stable hand positioning
- **Pinch not working**: Make a clear pinch gesture with thumb and index finger
- **Camera not starting**: Verify browser camera permissions

## Technical Details

### Gesture Recognition Algorithm

#### Palm Position Calculation
```typescript
const palmX = (landmarks[0].x + landmarks[5].x + landmarks[9].x + 
               landmarks[13].x + landmarks[17].x) / 5;
```
Averages base landmarks of all five fingers for stable palm center.

#### Speed Calculation
```typescript
const deadZone = 0.2; // Center dead zone (0.3 to 0.7)

if (palmX > 0.5 + deadZone) {
  intensity = (palmX - (0.5 + deadZone)) / (0.5 - deadZone);
  return Math.min(1, intensity);
} else if (palmX < 0.5 - deadZone) {
  intensity = ((0.5 - deadZone) - palmX) / (0.5 - deadZone);
  return -Math.min(1, intensity);
}
```

#### Pinch Detection
```typescript
const dx = thumbTip.x - indexTip.x;
const dy = thumbTip.y - indexTip.y;
const dz = thumbTip.z - indexTip.z;
const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
const isPinching = distance < 0.05;
```

### Performance Optimizations
- Uses `requestAnimationFrame` for smooth rendering
- Canvas-based visualization (no DOM reflows)
- Ref-based gesture state (avoids unnecessary re-renders)
- Efficient hand landmark processing
- Configurable tracking confidence thresholds

### Browser Compatibility
- ✅ Chrome/Edge (desktop & mobile)
- ✅ Safari (desktop & mobile)
- ✅ Firefox (desktop & mobile)
- Requires browser support for:
  - getUserMedia API
  - WebGL (for MediaPipe)
  - ES6+ JavaScript features

## Configuration

### MediaPipe Settings
Located in `useGestureControl.ts`:
```typescript
hands.setOptions({
  maxNumHands: 1,           // Track one hand
  modelComplexity: 1,       // Balance between speed/accuracy
  minDetectionConfidence: 0.7,
  minTrackingConfidence: 0.7
});
```

### Gesture Sensitivity
Adjust in `useGestureControl.ts`:
- `deadZone`: Change center zone size (default 0.2)
- `pinchThreshold`: Adjust pinch sensitivity (default 0.05)
- Speed multiplier in `HomePage.tsx`: `Math.abs(gestureSpeedRef.current) * moveSpeed * 1.5`

## File Structure

```
webapp/src/
├── hooks/
│   └── useGestureControl.ts       # Core gesture recognition logic
├── components/
│   ├── GestureControl.tsx         # Main gesture control UI
│   ├── GestureControl.css         # Gesture control styling
│   ├── GestureInstructions.tsx    # Instructions modal
│   └── GestureInstructions.css    # Instructions styling
└── pages/
    └── HomePage.tsx               # Integration with card carousel
```

## Future Enhancements

Possible improvements:
- [ ] Two-hand gestures for advanced control
- [ ] Custom gesture training
- [ ] Hand pose recognition for more gestures
- [ ] Accessibility mode with simplified gestures
- [ ] Recording and playback of gesture sequences
- [ ] Multi-language support for instructions
- [ ] Advanced gesture customization in settings

## Privacy & Security

- Camera feed is processed locally in the browser
- No video or image data is sent to external servers
- MediaPipe models are loaded from CDN but run client-side
- Camera permissions are requested only when gesture control is enabled
- Users can disable gesture control at any time

## Dependencies

```json
{
  "@mediapipe/hands": "^0.4.x",
  "@mediapipe/camera_utils": "^0.3.x",
  "@mediapipe/drawing_utils": "^0.3.x"
}
```

## Credits

- **MediaPipe**: Google's ML solutions for live and streaming media
- **Hand Tracking Model**: MediaPipe Hands by Google Research
