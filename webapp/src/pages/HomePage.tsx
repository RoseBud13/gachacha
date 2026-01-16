import React, { useState, useEffect, useRef, useMemo, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import './HomePage.css';

interface CardProps {
  card: { id: number; text: string };
  index: number;
  anglePerCard: number;
  radius: number;
  width: number;
  height: number;
  isSelected: boolean;
  isFlipped: boolean;
  isMoving: boolean;
  onClick: () => void;
  rotationRef: React.MutableRefObject<number>;
}

const Card = memo<CardProps>(
  ({
    card,
    index,
    anglePerCard,
    radius,
    width,
    height,
    isSelected,
    isFlipped,
    isMoving,
    onClick,
    rotationRef
  }) => {
    const cardRef = useRef<HTMLDivElement>(null);

    // Update card position directly via DOM - no React re-renders!
    useEffect(() => {
      let animationId: number;

      const updatePosition = () => {
        if (cardRef.current) {
          const rotation = rotationRef.current;
          const angle = (index * anglePerCard - rotation) * (Math.PI / 180);
          const x = Math.sin(angle) * radius;
          const z = Math.cos(angle) * radius;
          const scale = (z + radius) / (radius * 2);
          const rotateY = index * anglePerCard - rotation;

          cardRef.current.style.transform = `translate3d(${x}px, 0, ${z}px) rotateY(${rotateY}deg) scale(${scale})`;
          cardRef.current.style.zIndex = String(Math.round(z + radius));
          cardRef.current.style.opacity = scale > 0.3 ? '1' : '0.3';
        }

        animationId = requestAnimationFrame(updatePosition);
      };

      updatePosition();

      return () => {
        if (animationId) {
          cancelAnimationFrame(animationId);
        }
      };
    }, [index, anglePerCard, radius, rotationRef]);

    return (
      <div
        ref={cardRef}
        className={`card ${isSelected ? 'selected' : ''} ${
          isFlipped ? 'flipped' : ''
        }`}
        style={{
          width: `${width}px`,
          height: `${height}px`
        }}
        onClick={onClick}
      >
        <div className="card-inner">
          <div className="card-back">
            <div className="card-back-design">
              {!isMoving && <div className="card-back-pattern"></div>}
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
    );
  }
);

Card.displayName = 'Card';

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { settings, updateSettings } = useAppContext();
  const [isMoving, setIsMoving] = useState(true);
  const [selectedCard, setSelectedCard] = useState<number | null>(null);
  const [flippedCard, setFlippedCard] = useState<number | null>(null);
  const rotationRef = useRef(0);
  const directionRef = useRef(1); // 1 for right, -1 for left
  const animationRef = useRef<number | undefined>(undefined);
  const containerRef = useRef<HTMLDivElement>(null);
  const cardsWrapperRef = useRef<HTMLDivElement>(null);

  const { cardAmount, cardContents, moveSpeed, deleteDrawnCard } = settings;

  // Cache radius calculation
  const radius = useMemo(() => {
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

  const anglePerCard = useMemo(() => 360 / cardAmount, [cardAmount]);

  // Animate using just the ref - no state updates, no re-renders!
  useEffect(() => {
    if (!isMoving) return;

    const animate = () => {
      rotationRef.current += 0.5 * moveSpeed * directionRef.current;
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isMoving, moveSpeed]);

  // Handle mouse movement
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isMoving || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const threshold = 100; // pixels from edge

    if (x < threshold) {
      directionRef.current = -1;
    } else if (x > rect.width - threshold) {
      directionRef.current = 1;
    }
  };

  // Handle touch movement
  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!isMoving || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = e.touches[0].clientX - rect.left;
    const threshold = 100;

    if (x < threshold) {
      directionRef.current = -1;
    } else if (x > rect.width - threshold) {
      directionRef.current = 1;
    }
  };

  const handleConfirm = () => {
    // Find the card closest to center (0 degrees position)
    const normalizedRotation = ((rotationRef.current % 360) + 360) % 360;
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

  const cardWidth = Math.max(120, 160 - cardAmount * 2);
  const cardHeight = Math.max(180, 240 - cardAmount * 3);

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
          ref={cardsWrapperRef}
          className="cards-wrapper"
          style={{
            width: `${cardWidth}px`,
            height: `${cardHeight}px`
          }}
        >
          {cardContents.slice(0, cardAmount).map((card, index) => (
            <Card
              key={card.id}
              card={card}
              index={index}
              anglePerCard={anglePerCard}
              radius={radius}
              width={cardWidth}
              height={cardHeight}
              isSelected={selectedCard === index}
              isFlipped={flippedCard === index}
              isMoving={isMoving}
              onClick={() => handleCardClick(index)}
              rotationRef={rotationRef}
            />
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
