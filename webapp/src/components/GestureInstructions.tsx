import React, { useState, useEffect } from 'react';
import './GestureInstructions.css';

interface GestureInstructionsProps {
  show: boolean;
  onClose: () => void;
}

export const GestureInstructions: React.FC<GestureInstructionsProps> = ({
  show,
  onClose
}) => {
  const [hasSeenInstructions, setHasSeenInstructions] = useState(() => {
    return localStorage.getItem('hasSeenGestureInstructions') === 'true';
  });

  useEffect(() => {
    if (show && !hasSeenInstructions) {
      // Auto-show instructions when gesture control is enabled for the first time
    }
  }, [show, hasSeenInstructions]);

  const handleClose = () => {
    setHasSeenInstructions(true);
    localStorage.setItem('hasSeenGestureInstructions', 'true');
    onClose();
  };

  if (!show || hasSeenInstructions) return null;

  return (
    <div className="gesture-instructions-overlay" onClick={handleClose}>
      <div className="gesture-instructions" onClick={e => e.stopPropagation()}>
        <h3>🎮 Gesture Control Guide</h3>
        <ul>
          <li>
            <strong>✋ Open Palm:</strong> Show your open hand to the camera to
            start controlling the cards
          </li>
          <li>
            <strong>← → Move Hand:</strong> Move your palm left or right to
            control card direction and speed
          </li>
          <li>
            <strong>⚡ Speed Control:</strong> The closer your palm is to the
            screen edge, the faster the cards move
          </li>
          <li>
            <strong>🤏 Pinch Gesture:</strong> Pinch your thumb and index finger
            together to stop movement and select the centered card
          </li>
          <li>
            <strong>🎯 Center Zone:</strong> Keep your hand in the center area
            for slower, controlled movement
          </li>
        </ul>
        <div className="gesture-tips">
          <p>
            <strong>💡 Tips:</strong>
          </p>
          <p>• Ensure good lighting for best tracking</p>
          <p>• Keep your hand visible and within camera view</p>
          <p>• Allow camera permissions when prompted</p>
        </div>
        <button onClick={handleClose}>Got it! Let's Start</button>
      </div>
    </div>
  );
};

export default GestureInstructions;
