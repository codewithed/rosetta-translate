import AsyncStorage from '@react-native-async-storage/async-storage';
import { InputType } from '../constants/enums';

const HISTORY_KEY = 'translationHistory';

interface TranslationItem {
  id: string;
  originalText: string;
  translatedText: string;
  sourceLang: string;
  targetLang: string;
  timestamp: number;
  isSaved: boolean;
  isFavorite: boolean;
  inputType: InputType;
}

export const saveTranslationToHistory = async (translation: TranslationItem) => {
  try {
    const existingHistoryString = await AsyncStorage.getItem(HISTORY_KEY);
    const existingHistory: TranslationItem[] = existingHistoryString ? JSON.parse(existingHistoryString) : [];
    
    // Check if translation already exists (prevent duplicates)
    const existingIndex = existingHistory.findIndex(item => item.id === translation.id);
    
    if (existingIndex !== -1) {
      // Update existing translation
      existingHistory[existingIndex] = translation;
    } else {
      // Add new translation to the beginning
      existingHistory.unshift(translation);
    }
    
    await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(existingHistory));
  } catch (error) {
    console.error('Error saving translation to history:', error);
  }
};

export const getTranslationHistory = async (): Promise<TranslationItem[]> => {
  try {
    const historyString = await AsyncStorage.getItem(HISTORY_KEY);
    if (!historyString) {
      return [];
    }
    
    const history: TranslationItem[] = JSON.parse(historyString);
    // Ensure it's sorted by timestamp (newest first)
    return history.sort((a, b) => b.timestamp - a.timestamp);
  } catch (error) {
    console.error('Error getting translation history:', error);
    return [];
  }
};

export const clearTranslationHistory = async () => {
  try {
    await AsyncStorage.removeItem(HISTORY_KEY);
  } catch (error) {
    console.error('Error clearing translation history:', error);
  }
};

export const updateTranslationInHistory = async (updatedTranslation: TranslationItem) => {
  try {
    const existingHistoryString = await AsyncStorage.getItem(HISTORY_KEY);
    const existingHistory: TranslationItem[] = existingHistoryString ? JSON.parse(existingHistoryString) : [];
    
    const updatedHistory = existingHistory.map(item => 
      item.id === updatedTranslation.id ? updatedTranslation : item
    );
    
    await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(updatedHistory));
  } catch (error) {
    console.error('Error updating translation in history:', error);
  }
};

export const deleteTranslationFromHistory = async (translationId: string) => {
  try {
    const existingHistoryString = await AsyncStorage.getItem(HISTORY_KEY);
    const existingHistory: TranslationItem[] = existingHistoryString ? JSON.parse(existingHistoryString) : [];
    
    const filteredHistory = existingHistory.filter(item => item.id !== translationId);
    
    await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(filteredHistory));
  } catch (error) {
    console.error('Error deleting translation from history:', error);
  }
};

export const getTranslationById = async (translationId: string): Promise<TranslationItem | null> => {
  try {
    const existingHistoryString = await AsyncStorage.getItem(HISTORY_KEY);
    const existingHistory: TranslationItem[] = existingHistoryString ? JSON.parse(existingHistoryString) : [];
    
    return existingHistory.find(item => item.id === translationId) || null;
  } catch (error) {
    console.error('Error getting translation by ID:', error);
    return null;
  }
};

export const getHistoryCount = async (): Promise<number> => {
  try {
    const existingHistoryString = await AsyncStorage.getItem(HISTORY_KEY);
    const existingHistory: TranslationItem[] = existingHistoryString ? JSON.parse(existingHistoryString) : [];
    return existingHistory.length;
  } catch (error) {
    console.error('Error getting history count:', error);
    return 0;
  }
};

// Batch operations for better performance
export const batchSaveTranslations = async (translations: TranslationItem[]) => {
  try {
    const existingHistoryString = await AsyncStorage.getItem(HISTORY_KEY);
    const existingHistory: TranslationItem[] = existingHistoryString ? JSON.parse(existingHistoryString) : [];
    
    // Create a map for efficient lookups
    const existingMap = new Map(existingHistory.map(item => [item.id, item]));
    
    // Merge translations, updating existing ones and adding new ones
    translations.forEach(translation => {
      existingMap.set(translation.id, translation);
    });
    
    const mergedHistory = Array.from(existingMap.values())
      .sort((a, b) => b.timestamp - a.timestamp);
    
    await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(mergedHistory));
  } catch (error) {
    console.error('Error batch saving translations:', error);
  }
};

export const batchDeleteTranslations = async (translationIds: string[]) => {
  try {
    const existingHistoryString = await AsyncStorage.getItem(HISTORY_KEY);
    const existingHistory: TranslationItem[] = existingHistoryString ? JSON.parse(existingHistoryString) : [];
    
    const idsToDelete = new Set(translationIds);
    const filteredHistory = existingHistory.filter(item => !idsToDelete.has(item.id));
    
    await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(filteredHistory));
  } catch (error) {
    console.error('Error batch deleting translations:', error);
  }
};

// Utility function to clean up old entries if storage gets too large
export const pruneOldHistory = async (maxItems: number = 1000) => {
  try {
    const existingHistoryString = await AsyncStorage.getItem(HISTORY_KEY);
    const existingHistory: TranslationItem[] = existingHistoryString ? JSON.parse(existingHistoryString) : [];
    
    if (existingHistory.length > maxItems) {
      // Sort by timestamp and keep only the most recent items
      const sortedHistory = existingHistory.sort((a, b) => b.timestamp - a.timestamp);
      const prunedHistory = sortedHistory.slice(0, maxItems);
      
      await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(prunedHistory));
      console.log(`Pruned history: kept ${maxItems} most recent items`);
    }
  } catch (error) {
    console.error('Error pruning history:', error);
  }
};