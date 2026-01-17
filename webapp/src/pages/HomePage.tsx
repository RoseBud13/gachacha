import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { GestureControl } from '../components/GestureControl';
import { GestureInstructions } from '../components/GestureInstructions';
import type { GestureData } from '../hooks/useGestureControl';
import './HomePage.css';

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { settings, updateSettings } = useAppContext();
  const [rotation, setRotation] = useState(0);
  const [isMoving, setIsMoving] = useState(true);
  const [selectedCard, setSelectedCard] = useState<number | null>(null);
  const [flippedCard, setFlippedCard] = useState<number | null>(null);
  const [direction, setDirection] = useState(1); // 1 for right, -1 for left
  const [gestureEnabled, setGestureEnabled] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [gestureSpeed, setGestureSpeed] = useState(0);
  const animationRef = useRef<number | undefined>(undefined);
  const containerRef = useRef<HTMLDivElement>(null);
  const lastPinchStateRef = useRef(false);

  const { cardAmount, cardContents, moveSpeed, deleteDrawnCard } = settings;

  // Handle gesture updates
  const handleGestureUpdate = (gesture: GestureData) => {
    if (!gestureEnabled || selectedCard !== null) return;

    // Update gesture speed for animation
    setGestureSpeed(gesture.gestureSpeed);

    // Update direction based on gesture speed
    if (Math.abs(gesture.gestureSpeed) > 0.1) {
      setDirection(gesture.gestureSpeed > 0 ? 1 : -1);
    }

    // Handle pinch gesture for selection
    if (gesture.isPinching && !lastPinchStateRef.current) {
      // Pinch started - select the card
      handleConfirm();
    }
    lastPinchStateRef.current = gesture.isPinching;
  };

  // Toggle gesture control
  const handleGestureToggle = () => {
    const newEnabled = !gestureEnabled;
    setGestureEnabled(newEnabled);

    // Show instructions when enabling for the first time
    if (newEnabled) {
      const hasSeenInstructions =
        localStorage.getItem('hasSeenGestureInstructions') === 'true';
      if (!hasSeenInstructions) {
        setShowInstructions(true);
      }
    }
  };

  // Auto-rotate cards
  useEffect(() => {
    if (!isMoving) return;

    let lastTime = performance.now();

    const animate = (currentTime: number) => {
      const deltaTime = (currentTime - lastTime) / 16.67; // Normalize to 60fps
      lastTime = currentTime;

      // Use gesture speed when gesture control is enabled, otherwise use normal speed
      const speed =
        gestureEnabled && Math.abs(gestureSpeed) > 0.05
          ? Math.abs(gestureSpeed) * 2 * moveSpeed // Gesture-controlled speed
          : 0.5 * moveSpeed; // Normal automatic speed

      setRotation(prev => prev + speed * direction * deltaTime);
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isMoving, direction, moveSpeed, gestureEnabled, gestureSpeed]);

  // Handle mouse movement
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isMoving || !containerRef.current || gestureEnabled) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const threshold = 100; // pixels from edge

    if (x < threshold) {
      setDirection(-1);
    } else if (x > rect.width - threshold) {
      setDirection(1);
    }
  };

  // Handle touch movement
  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!isMoving || !containerRef.current || gestureEnabled) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = e.touches[0].clientX - rect.left;
    const threshold = 100;

    if (x < threshold) {
      setDirection(-1);
    } else if (x > rect.width - threshold) {
      setDirection(1);
    }
  };

  const handleConfirm = () => {
    // Find the card closest to center (0 degrees position)
    const anglePerCard = 360 / cardAmount;
    const normalizedRotation = ((rotation % 360) + 360) % 360;
    const centeredCardIndex =
      Math.round(normalizedRotation / anglePerCard) % cardAmount;

    setSelectedCard(centeredCardIndex);
    setIsMoving(false);
  };

  const handleCardClick = (index: number) => {
    // Only allow clicks when a card is selected and movement has stopped
    if (isMoving || selectedCard === null) return;

    if (selectedCard === index) {
      setFlippedCard(flippedCard === index ? null : index);
    }
  };

  const handleReset = () => {
    // Reset state first to ensure clean transition
    setSelectedCard(null);
    setFlippedCard(null);
    lastPinchStateRef.current = false;
    setGestureSpeed(0);

    // Delete the drawn card if the setting is enabled
    if (deleteDrawnCard && selectedCard !== null && cardContents.length > 3) {
      // Remove the drawn card from the pool
      const updatedContents = cardContents.filter((_, i) => i !== selectedCard);
      const newAmount = Math.max(3, cardAmount - 1);

      updateSettings({
        cardContents: updatedContents,
        cardAmount: newAmount
      });
    }

    // Start movement after state is reset
    setIsMoving(true);
  };

  // Calculate radius once and memoize it
  const radius = React.useMemo(() => {
    const screenWidth = window.innerWidth;
    const baseRadius = screenWidth * 0.25;
    const cardAmountFactor = Math.max(1, cardAmount / 10);
    const minRadius = 200 * cardAmountFactor;
    const maxRadius = 400 * cardAmountFactor;
    return Math.min(
      maxRadius,
      Math.max(minRadius, baseRadius * cardAmountFactor)
    );
  }, [cardAmount]);

  // Calculate card dimensions once and memoize them
  const cardDimensions = React.useMemo(
    () => ({
      width: Math.max(120, 160 - cardAmount * 2),
      height: Math.max(180, 240 - cardAmount * 3)
    }),
    [cardAmount]
  );

  // Calculate card positions
  const getCardStyle = (index: number): React.CSSProperties => {
    const anglePerCard = 360 / cardAmount;
    const angle = (index * anglePerCard - rotation) * (Math.PI / 180);
    const x = Math.sin(angle) * radius;
    const z = Math.cos(angle) * radius;
    const scale = (z + radius) / (radius * 2);
    const rotateY = index * anglePerCard - rotation;

    return {
      transform: `translate3d(${x.toFixed(2)}px, 0px, ${z.toFixed(2)}px) rotateY(${rotateY.toFixed(2)}deg) scale(${scale.toFixed(3)})`,
      WebkitTransform: `translate3d(${x.toFixed(2)}px, 0px, ${z.toFixed(2)}px) rotateY(${rotateY.toFixed(2)}deg) scale(${scale.toFixed(3)})`,
      zIndex: Math.round(z + radius),
      opacity: scale > 0.3 ? 1 : 0.3
    } as React.CSSProperties;
  };

  return (
    <div className="home-page">
      <div className="home-page-header">
        <GestureControl
          enabled={gestureEnabled}
          onGestureUpdate={handleGestureUpdate}
          onToggle={handleGestureToggle}
        />
        <button
          className="settings-button"
          onClick={() => navigate('/settings')}
        >
          Settings
        </button>
      </div>

      <GestureInstructions
        show={showInstructions}
        onClose={() => setShowInstructions(false)}
      />

      <div className="home-page-content">
        <div
          className="card-container"
          ref={containerRef}
          onMouseMove={handleMouseMove}
          onTouchMove={handleTouchMove}
        >
          <div
            className="cards-wrapper"
            style={{
              width: `${cardDimensions.width}px`,
              height: `${cardDimensions.height}px`
            }}
          >
            {cardContents.slice(0, cardAmount).map((card, index) => (
              <div
                key={card.id}
                className={`card ${selectedCard === index ? 'selected' : ''} ${
                  flippedCard === index ? 'flipped' : ''
                }`}
                style={{
                  ...getCardStyle(index),
                  width: `${cardDimensions.width}px`,
                  height: `${cardDimensions.height}px`
                }}
                onClick={() => handleCardClick(index)}
              >
                <div className="card-inner">
                  <div className="card-back">
                    <div className="card-back-design">
                      <div className="card-back-pattern"></div>
                      <div className="card-back-logo">?</div>
                    </div>
                  </div>
                  <div className="card-front">
                    <div className="card-content">
                      <h2>🎉</h2>
                      <p>{card.text}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="controls">
          {selectedCard === null ? (
            <button className="confirm-button" onClick={handleConfirm}>
              Confirm Selection
            </button>
          ) : (
            <div className="action-buttons">
              <button className="reset-button" onClick={handleReset}>
                Draw Again
              </button>
              {flippedCard === null && (
                <p className="hint">Click the selected card to reveal!</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HomePage;
