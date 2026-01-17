import React, { useState } from 'react';
import { useGestureControl } from '../hooks/useGestureControl';
import type { GestureData } from '../hooks/useGestureControl';
import './GestureControl.css';

interface GestureControlProps {
  enabled: boolean;
  onGestureUpdate: (gesture: GestureData) => void;
  onToggle: () => void;
}

export const GestureControl: React.FC<GestureControlProps> = ({
  enabled,
  onGestureUpdate,
  onToggle
}) => {
  const [isStatusExpanded, setIsStatusExpanded] = useState(true);
  const { isInitialized, error, currentGesture, canvasRef } = useGestureControl(
    {
      enabled,
      onGestureUpdate
    }
  );

  return (
    <div className="gesture-control">
      <div className="gesture-buttons">
        <button
          className={`gesture-toggle-button ${enabled ? 'active' : ''}`}
          onClick={onToggle}
          title={enabled ? 'Disable Gesture Control' : 'Enable Gesture Control'}
        >
          {enabled ? '👋 Gesture: ON' : '🤚 Gesture: OFF'}
        </button>

        {enabled && (
          <button
            className="gesture-status-toggle"
            onClick={() => setIsStatusExpanded(!isStatusExpanded)}
            title={isStatusExpanded ? 'Hide Status' : 'Show Status'}
          >
            {isStatusExpanded ? '🔽' : '🔼'}
          </button>
        )}
      </div>

      {enabled && (
        <>
          {isStatusExpanded && (
            <div className="gesture-status">
              {!isInitialized && !error && (
                <div className="gesture-message initializing">
                  🔄 Initializing camera...
                </div>
              )}

              {error && <div className="gesture-message error">⚠️ {error}</div>}

              {isInitialized && !error && (
                <div className="gesture-feedback">
                  <div className="gesture-indicator">
                    {currentGesture.handDetected ? (
                      <>
                        <span className="status-icon">✋</span>
                        <span className="status-text">Hand Detected</span>
                      </>
                    ) : (
                      <>
                        <span className="status-icon">👀</span>
                        <span className="status-text">Show your hand</span>
                      </>
                    )}
                  </div>

                  {currentGesture.handDetected && (
                    <>
                      <div className="gesture-indicator">
                        {currentGesture.isPinching ? (
                          <>
                            <span className="status-icon pinch">🤏</span>
                            <span className="status-text">
                              Pinch: Selection Mode
                            </span>
                          </>
                        ) : (
                          <>
                            <span className="status-icon">✋</span>
                            <span className="status-text">Open: Move Mode</span>
                          </>
                        )}
                      </div>

                      {!currentGesture.isPinching && (
                        <div className="speed-indicator">
                          <div className="speed-bar">
                            <div
                              className="speed-fill"
                              style={{
                                width: `${
                                  Math.abs(currentGesture.gestureSpeed) * 100
                                }%`,
                                left:
                                  currentGesture.gestureSpeed < 0 ? 0 : 'auto',
                                right:
                                  currentGesture.gestureSpeed > 0 ? 0 : 'auto',
                                background:
                                  currentGesture.gestureSpeed < 0
                                    ? 'linear-gradient(to left, #4a90e2, #357abd)'
                                    : 'linear-gradient(to right, #4a90e2, #357abd)'
                              }}
                            />
                          </div>
                          <div className="speed-labels">
                            <span>← Left</span>
                            <span>Speed</span>
                            <span>Right →</span>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              <canvas ref={canvasRef} className="hand-tracking-canvas" />
            </div>
          )}

          {!isStatusExpanded && (
            <canvas
              ref={canvasRef}
              className="hand-tracking-canvas"
              style={{ display: 'none' }}
            />
          )}
        </>
      )}
    </div>
  );
};

export default GestureControl;
