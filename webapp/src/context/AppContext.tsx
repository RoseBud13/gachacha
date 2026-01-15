import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode
} from 'react';

export interface CardContent {
  id: number;
  text: string;
}

interface AppSettings {
  cardAmount: number;
  cardContents: CardContent[];
  moveSpeed: number;
}

interface AppContextType {
  settings: AppSettings;
  updateSettings: (newSettings: Partial<AppSettings>) => void;
}

const defaultCardContents: CardContent[] = Array.from(
  { length: 10 },
  (_, i) => ({
    id: i,
    text: `Lucky Card ${i + 1}`
  })
);

const defaultSettings: AppSettings = {
  cardAmount: 10,
  cardContents: defaultCardContents,
  moveSpeed: 1
};

const AppContext = createContext<AppContextType | undefined>(undefined);

// eslint-disable-next-line react-refresh/only-export-components
export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within AppProvider');
  }
  return context;
};

export const AppProvider: React.FC<{ children: ReactNode }> = ({
  children
}) => {
  const [settings, setSettings] = useState<AppSettings>(() => {
    const stored = localStorage.getItem('gachacha-settings');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        // Ensure cardContents has the right amount of items
        if (parsed.cardContents.length < parsed.cardAmount) {
          const additional = Array.from(
            { length: parsed.cardAmount - parsed.cardContents.length },
            (_, i) => ({
              id: parsed.cardContents.length + i,
              text: `Lucky Card ${parsed.cardContents.length + i + 1}`
            })
          );
          parsed.cardContents = [...parsed.cardContents, ...additional];
        }
        return parsed;
      } catch {
        return defaultSettings;
      }
    }
    return defaultSettings;
  });

  useEffect(() => {
    localStorage.setItem('gachacha-settings', JSON.stringify(settings));
  }, [settings]);

  const updateSettings = (newSettings: Partial<AppSettings>) => {
    setSettings(prev => {
      const updated = { ...prev, ...newSettings };

      // If cardAmount changed, adjust cardContents array
      if (
        newSettings.cardAmount !== undefined &&
        newSettings.cardAmount !== prev.cardAmount
      ) {
        if (newSettings.cardAmount > prev.cardContents.length) {
          // Add more cards
          const additional = Array.from(
            { length: newSettings.cardAmount - prev.cardContents.length },
            (_, i) => ({
              id: prev.cardContents.length + i,
              text: `Lucky Card ${prev.cardContents.length + i + 1}`
            })
          );
          updated.cardContents = [...prev.cardContents, ...additional];
        } else {
          // Remove excess cards
          updated.cardContents = prev.cardContents.slice(
            0,
            newSettings.cardAmount
          );
        }
      }

      return updated;
    });
  };

  return (
    <AppContext.Provider value={{ settings, updateSettings }}>
      {children}
    </AppContext.Provider>
  );
};
