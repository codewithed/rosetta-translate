import AsyncStorage from '@react-native-async-storage/async-storage';
import { InputType } from '../constants/enums';

export interface TranslationItem {
    id: string;
    originalText: string;
    translatedText: string;
    sourceLang: string;
    targetLang: string;
    timestamp: number;
    isSaved?: boolean; // Optional: to distinguish if an item in history is also a saved item
    inputType?: InputType;
}

const HISTORY_KEY = 'translation_history';
const SAVED_KEY = 'saved_translations';
const MAX_HISTORY_ITEMS = 50;

// --- History Functions ---

export const getHistory = async (): Promise<TranslationItem[]> => {
    try {
        const jsonValue = await AsyncStorage.getItem(HISTORY_KEY);
        return jsonValue != null ? JSON.parse(jsonValue) : [];
    } catch (e) {
        console.error('Failed to load history', e);
        return [];
    }
};

export const addHistoryItem = async (item: Omit<TranslationItem, 'id' | 'timestamp'> & Partial<Pick<TranslationItem, 'id' | 'timestamp'>> & { inputType: InputType }): Promise<TranslationItem[]> => {
    let history: TranslationItem[] = []; // Keep a reference to the fetched history
    try {
        history = await getHistory();
        const newItem: TranslationItem = {
            originalText: item.originalText,
            translatedText: item.translatedText,
            sourceLang: item.sourceLang,
            targetLang: item.targetLang,
            isSaved: item.isSaved || false, // Ensure isSaved has a default
            id: item.id || Date.now().toString(), // Use provided ID or generate
            timestamp: item.timestamp || Date.now(), // Use provided timestamp or generate
            inputType: item.inputType,
        };
        
        // Prevent duplicates by ID if an ID was provided
        let updatedHistory = history;
        if (item.id) {
            updatedHistory = history.filter(h => h.id !== item.id);
        }

        updatedHistory = [newItem, ...updatedHistory].slice(0, MAX_HISTORY_ITEMS);
        await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(updatedHistory));
        return updatedHistory;
    } catch (e) {
        console.error('Failed to add history item', e);
        return history; // Return the history array as it was before the failed setItem
    }
};

export const removeHistoryItem = async (id: string): Promise<TranslationItem[]> => {
    let history: TranslationItem[] = [];
    try {
        history = await getHistory();
        const updatedHistory = history.filter(item => item.id !== id);
        // If updatedHistory is the same as history (item not found),
        // we might not need to call setItem, but for simplicity, we'll always call it.
        // If the item to remove wasn't found, this will effectively re-save the same list.
        await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(updatedHistory));
        return updatedHistory;
    } catch (e) {
        console.error('Failed to remove history item', e);
        return history; // Return the history array as it was before the failed setItem
    }
};

export const clearHistory = async (): Promise<void> => {
    try {
        await AsyncStorage.removeItem(HISTORY_KEY);
    } catch (e) {
        console.error('Failed to clear history', e);
    }
};

// --- Saved Translations Functions ---

export const getSavedTranslations = async (): Promise<TranslationItem[]> => {
    try {
        const jsonValue = await AsyncStorage.getItem(SAVED_KEY);
        return jsonValue != null ? JSON.parse(jsonValue) : [];
    } catch (e) {
        console.error('Failed to load saved translations', e);
        return [];
    }
};

export const saveTranslation = async (item: TranslationItem): Promise<TranslationItem[]> => {
    let saved: TranslationItem[] = [];
    try {
        saved = await getSavedTranslations();
        // Prevent duplicates by ID, or update if exists but ensure isSaved is true
        const existingIndex = saved.findIndex(s => s.id === item.id);
        let updatedSaved;
        if (existingIndex > -1) {
            updatedSaved = [...saved];
            updatedSaved[existingIndex] = { ...item, isSaved: true, timestamp: Date.now() }; // Update timestamp on re-save
        } else {
            updatedSaved = [{ ...item, isSaved: true }, ...saved];
        }
        updatedSaved.sort((a, b) => b.timestamp - a.timestamp); // Keep sorted by most recent
        await AsyncStorage.setItem(SAVED_KEY, JSON.stringify(updatedSaved));
        return updatedSaved;
    } catch (e) {
        console.error('Failed to save translation', e);
        return saved; // Return the saved array as it was before the failed setItem
    }
};

export const unsaveTranslation = async (id: string): Promise<TranslationItem[]> => {
    let saved: TranslationItem[] = [];
    try {
        saved = await getSavedTranslations();
        const updatedSaved = saved.filter(item => item.id !== id);
        // If updatedSaved is the same as saved (item not found),
        // we might not need to call setItem.
        await AsyncStorage.setItem(SAVED_KEY, JSON.stringify(updatedSaved));
        return updatedSaved;
    } catch (e) {
        console.error('Failed to unsave translation', e);
        return saved; // Return the saved array as it was before the failed setItem
    }
};