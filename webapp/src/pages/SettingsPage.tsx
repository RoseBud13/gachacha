import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import type { CardContent } from '../context/AppContext';
import './SettingsPage.css';

const SettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const { settings, updateSettings } = useAppContext();
  const [localCardAmount, setLocalCardAmount] = useState(settings.cardAmount);
  const [localMoveSpeed, setLocalMoveSpeed] = useState(settings.moveSpeed);
  const [localCardContents, setLocalCardContents] = useState<CardContent[]>(
    settings.cardContents
  );
  const [localDeleteDrawnCard, setLocalDeleteDrawnCard] = useState(
    settings.deleteDrawnCard
  );

  const handleCardAmountChange = (amount: number) => {
    const validAmount = Math.max(3, Math.min(20, amount));
    setLocalCardAmount(validAmount);

    // Adjust card contents array
    if (validAmount > localCardContents.length) {
      const additional = Array.from(
        { length: validAmount - localCardContents.length },
        (_, i) => ({
          id: localCardContents.length + i,
          text: `Lucky Card ${localCardContents.length + i + 1}`
        })
      );
      setLocalCardContents([...localCardContents, ...additional]);
    } else {
      setLocalCardContents(localCardContents.slice(0, validAmount));
    }
  };

  const handleCardContentChange = (index: number, text: string) => {
    const updated = [...localCardContents];
    updated[index] = { ...updated[index], text };
    setLocalCardContents(updated);
  };

  const handleSave = () => {
    updateSettings({
      cardAmount: localCardAmount,
      cardContents: localCardContents,
      moveSpeed: localMoveSpeed,
      deleteDrawnCard: localDeleteDrawnCard
    });
    navigate('/');
  };

  const handleCancel = () => {
    navigate('/');
  };

  const handleReset = () => {
    const defaultContents = Array.from({ length: localCardAmount }, (_, i) => ({
      id: i,
      text: `Lucky Card ${i + 1}`
    }));
    setLocalCardAmount(10);
    setLocalMoveSpeed(1);
    setLocalDeleteDrawnCard(false);
    setLocalCardContents(defaultContents);
  };

  return (
    <div className="settings-page">
      <div className="settings-container">
        <div className="settings-header">
          <h1>⚙️ Settings</h1>
          <button className="close-button" onClick={handleCancel}>
            ✕
          </button>
        </div>

        <div className="settings-content">
          {/* Card Amount */}
          <div className="setting-section">
            <h2>Number of Cards</h2>
            <div className="setting-control">
              <input
                type="range"
                min="3"
                max="20"
                value={localCardAmount}
                onChange={e => handleCardAmountChange(Number(e.target.value))}
                className="slider"
              />
              <div className="value-display">{localCardAmount} cards</div>
            </div>
          </div>

          {/* Movement Speed */}
          <div className="setting-section">
            <h2>Movement Speed</h2>
            <div className="setting-control">
              <input
                type="range"
                min="0.5"
                max="3"
                step="0.1"
                value={localMoveSpeed}
                onChange={e => setLocalMoveSpeed(Number(e.target.value))}
                className="slider"
              />
              <div className="value-display">{localMoveSpeed.toFixed(1)}x</div>
            </div>
          </div>

          {/* Delete Drawn Card */}
          <div className="setting-section">
            <h2>Delete Drawn Card</h2>
            <div className="setting-control">
              <label className="toggle-label">
                <input
                  type="checkbox"
                  checked={localDeleteDrawnCard}
                  onChange={e => setLocalDeleteDrawnCard(e.target.checked)}
                />
                <span className="toggle-text">
                  {localDeleteDrawnCard
                    ? 'Drawn cards will be removed from the pool'
                    : 'Drawn cards remain in the pool'}
                </span>
              </label>
            </div>
          </div>

          {/* Card Contents */}
          <div className="setting-section">
            <h2>Card Contents</h2>
            <div className="card-contents-list">
              {localCardContents
                .slice(0, localCardAmount)
                .map((card, index) => (
                  <div key={card.id} className="card-content-item">
                    <label>Card {index + 1}</label>
                    <input
                      type="text"
                      value={card.text}
                      onChange={e =>
                        handleCardContentChange(index, e.target.value)
                      }
                      placeholder={`Content for card ${index + 1}`}
                      maxLength={50}
                    />
                  </div>
                ))}
            </div>
          </div>
        </div>

        <div className="settings-actions">
          <button className="reset-btn" onClick={handleReset}>
            Reset to Default
          </button>
          <div className="action-buttons">
            <button className="cancel-btn" onClick={handleCancel}>
              Cancel
            </button>
            <button className="save-btn" onClick={handleSave}>
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
