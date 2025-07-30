import AsyncStorage from "@react-native-async-storage/async-storage";
import { InputType } from "../constants/enums";
import {
  createTranslation as apiCreateTranslation,
  CreateTranslationPayload,
  TranslationResponse,
} from "../services/apiService";

const HISTORY_KEY = "translationHistory";

/**
 * Represents a single translation item in local storage.
 */
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
  isSynced?: boolean; // True if the item is saved on the server
}

/**
 * Creates a history item optimistically.
 * It's added to local storage immediately and then synced with the backend.
 * @param payload The data for the new translation.
 * @returns The translation item, marked as unsynced if the backend call fails.
 */
export const createHistoryItemOptimistic = async (
  payload: CreateTranslationPayload
): Promise<TranslationItem> => {
  // 1. Create a temporary local item with a unique ID.
  const localId = `local_${Date.now()}`;
  const tempHistoryItem: TranslationItem = {
    id: localId,
    originalText: payload.sourceText,
    translatedText: payload.targetText,
    sourceLang: payload.sourceLang,
    targetLang: payload.targetLang,
    timestamp: Date.now(),
    isFavorite: false,
    isSaved: false,
    inputType: payload.inputType,
    isSynced: false,
  };

  // 2. Immediately save the temporary item to local history.
  try {
    const history = await getTranslationHistory();
    const updatedHistory = [tempHistoryItem, ...history];
    await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(updatedHistory));
  } catch (e) {
    // console.error("Failed to add temporary history item", e);
    throw e; // Abort if we can't save locally.
  }

  // 3. In the background, sync with the backend.
  try {
    const syncedItemResponse = await apiCreateTranslation(payload);
    const finalHistoryItem: TranslationItem = {
      id: syncedItemResponse.id,
      originalText: syncedItemResponse.sourceText,
      translatedText: syncedItemResponse.targetText,
      sourceLang: syncedItemResponse.sourceLang,
      targetLang: syncedItemResponse.targetLang,
      timestamp: new Date(syncedItemResponse.createdAt).getTime(),
      isFavorite: syncedItemResponse.isFavorite,
      isSaved: syncedItemResponse.isSaved,
      inputType: syncedItemResponse.inputType,
      isSynced: true,
    };

    // 4. Replace the temporary item in storage with the final, synced item.
    const history = await getTranslationHistory();
    const historyWithoutLocal = history.filter((item) => item.id !== localId);
    const finalHistory = [finalHistoryItem, ...historyWithoutLocal];
    await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(finalHistory));

    return finalHistoryItem;
  } catch (error) {
    // console.error("Failed to sync new history item:", error);
    // If sync fails, the unsynced local item remains in storage.
    return tempHistoryItem;
  }
};

export const saveTranslationToHistory = async (
  translation: TranslationItem
) => {
  try {
    const existingHistory = await getTranslationHistory();
    const existingIndex = existingHistory.findIndex(
      (item) => item.id === translation.id
    );

    if (existingIndex !== -1) {
      existingHistory[existingIndex] = translation;
    } else {
      existingHistory.unshift(translation);
    }

    await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(existingHistory));
  } catch (error) {
    // console.error("Error saving translation to history:", error);
  }
};

export const getTranslationHistory = async (): Promise<TranslationItem[]> => {
  try {
    const historyString = await AsyncStorage.getItem(HISTORY_KEY);
    if (!historyString) {
      return [];
    }
    const history: TranslationItem[] = JSON.parse(historyString);
    return history.sort((a, b) => b.timestamp - a.timestamp);
  } catch (error) {
    // console.error("Error getting translation history:", error);
    return [];
  }
};

export const clearTranslationHistory = async () => {
  try {
    await AsyncStorage.removeItem(HISTORY_KEY);
  } catch (error) {
    // console.error("Error clearing translation history:", error);
  }
};

export const updateTranslationInHistory = async (
  updatedTranslation: TranslationItem
) => {
  try {
    const existingHistory = await getTranslationHistory();
    const updatedHistory = existingHistory.map((item) =>
      item.id === updatedTranslation.id ? updatedTranslation : item
    );
    await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(updatedHistory));
  } catch (error) {
    console.error("Error updating translation in history:", error);
  }
};

export const deleteTranslationFromHistory = async (translationId: string) => {
  try {
    const existingHistory = await getTranslationHistory();
    const filteredHistory = existingHistory.filter(
      (item) => item.id !== translationId
    );
    await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(filteredHistory));
  } catch (error) {
    // console.error("Error deleting translation from history:", error);
  }
};

export const getTranslationById = async (
  translationId: string
): Promise<TranslationItem | null> => {
  try {
    const existingHistory = await getTranslationHistory();
    return existingHistory.find((item) => item.id === translationId) || null;
  } catch (error) {
    // console.error("Error getting translation by ID:", error);
    return null;
  }
};

export const getHistoryCount = async (): Promise<number> => {
  try {
    const existingHistory = await getTranslationHistory();
    return existingHistory.length;
  } catch (error) {
    // console.error("Error getting history count:", error);
    return 0;
  }
};

export const batchSaveTranslations = async (
  translations: TranslationItem[]
) => {
  try {
    const existingHistory = await getTranslationHistory();
    const existingMap = new Map(existingHistory.map((item) => [item.id, item]));
    translations.forEach((translation) => {
      existingMap.set(translation.id, translation);
    });
    const mergedHistory = Array.from(existingMap.values()).sort(
      (a, b) => b.timestamp - a.timestamp
    );
    await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(mergedHistory));
  } catch (error) {
    // console.error("Error batch saving translations:", error);
  }
};

export const batchDeleteTranslations = async (translationIds: string[]) => {
  try {
    const existingHistory = await getTranslationHistory();
    const idsToDelete = new Set(translationIds);
    const filteredHistory = existingHistory.filter(
      (item) => !idsToDelete.has(item.id)
    );
    await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(filteredHistory));
  } catch (error) {
    // console.error("Error batch deleting translations:", error);
  }
};

export const pruneOldHistory = async (maxItems: number = 1000) => {
  try {
    const existingHistory = await getTranslationHistory();
    if (existingHistory.length > maxItems) {
      const prunedHistory = existingHistory.slice(0, maxItems);
      await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(prunedHistory));
      console.log(`Pruned history: kept ${maxItems} most recent items`);
    }
  } catch (error) {
    // console.error("Error pruning history:", error);
  }
};
