import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import './HomePage.css';

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { settings, updateSettings } = useAppContext();
  const [rotation, setRotation] = useState(0);
  const [isMoving, setIsMoving] = useState(true);
  const [selectedCard, setSelectedCard] = useState<number | null>(null);
  const [flippedCard, setFlippedCard] = useState<number | null>(null);
  const [direction, setDirection] = useState(1); // 1 for right, -1 for left
  const animationRef = useRef<number | undefined>(undefined);
  const containerRef = useRef<HTMLDivElement>(null);

  const { cardAmount, cardContents, moveSpeed, deleteDrawnCard } = settings;

  // Auto-rotate cards
  useEffect(() => {
    if (!isMoving) return;

    const animate = () => {
      setRotation(prev => prev + 0.5 * moveSpeed * direction);
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isMoving, direction, moveSpeed]);

  // Handle mouse movement
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isMoving || !containerRef.current) return;

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
    if (!isMoving || !containerRef.current) return;

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

  // Calculate card positions
  const getCardStyle = (index: number): React.CSSProperties => {
    const anglePerCard = 360 / cardAmount;
    const angle = (index * anglePerCard - rotation) * (Math.PI / 180);
    // Dynamic radius based on screen width and card amount
    const screenWidth = window.innerWidth;
    const baseRadius = screenWidth * 0.25;
    const cardAmountFactor = Math.max(1, cardAmount / 10); // Scale up for more cards
    const minRadius = 200 * cardAmountFactor;
    const maxRadius = 400 * cardAmountFactor;
    const radius = Math.min(
      maxRadius,
      Math.max(minRadius, baseRadius * cardAmountFactor)
    );
    const x = Math.sin(angle) * radius;
    const z = Math.cos(angle) * radius;
    const scale = (z + radius) / (radius * 2);
    const rotateY = index * anglePerCard - rotation;

    return {
      transform: `translate3d(${x}px, 0, ${z}px) rotateY(${rotateY}deg) scale(${scale})`,
      zIndex: Math.round(z + radius),
      opacity: scale > 0.3 ? 1 : 0.3
    };
  };

  return (
    <div className="home-page">
      <button className="settings-button" onClick={() => navigate('/settings')}>
        ⚙️ Settings
      </button>

      <div
        className="card-container"
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onTouchMove={handleTouchMove}
      >
        <div
          className="cards-wrapper"
          style={{
            width: `${Math.max(120, 160 - cardAmount * 2)}px`,
            height: `${Math.max(180, 240 - cardAmount * 3)}px`
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
                width: `${Math.max(120, 160 - cardAmount * 2)}px`,
                height: `${Math.max(180, 240 - cardAmount * 3)}px`
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
  );
};

export default HomePage;
