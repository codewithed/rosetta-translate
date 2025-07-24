import AsyncStorage from '@react-native-async-storage/async-storage';
import { InputType } from '../constants/enums';
import {
    createFolder as apiCreateFolder,
    createSavedItem as apiCreateSavedItem,
    toggleFavoriteTranslation as apiToggleFavoriteTranslation,
    deleteTranslation as apiDeleteTranslation,
    deleteSavedItem as apiDeleteSavedItem,
    deleteFolder as apiDeleteFolder, // Added for folder deletion
    TranslationResponse,
    SavedItemCategory
} from '../services/apiService';

// ### DATA INTERFACES ###
export interface TranslationItem {
    id: string;
    originalText: string;
    translatedText: string;
    sourceLang: string;
    targetLang: string;
    timestamp: number;
    isFavorite: boolean;
    isSaved: boolean;
    inputType: InputType;
    folderId?: string | null;
}

export interface FolderItem {
    id: string;
    name: string;
    isSynced: boolean;
}

// ### STORAGE KEYS ###
const HISTORY_KEY = 'translation_history';
const ITEMS_KEY = 'saved_items';
const FOLDERS_KEY = 'folders';
const MAX_HISTORY_ITEMS = 100;

// ### HISTORY FUNCTIONS ###

export const getHistory = async (): Promise<TranslationItem[]> => {
    try {
        const jsonValue = await AsyncStorage.getItem(HISTORY_KEY);
        return jsonValue != null ? JSON.parse(jsonValue) : [];
    } catch (e) { return []; }
};

export const addHistoryItem = async (item: TranslationResponse): Promise<void> => {
    try {
        let history = await getHistory();
        history = history.filter(h => h.id !== item.id); // Deduplicate

        const newHistoryItem: TranslationItem = {
            id: item.id,
            originalText: item.sourceText,
            translatedText: item.targetText,
            sourceLang: item.sourceLang,
            targetLang: item.targetLang,
            timestamp: new Date(item.createdAt).getTime(),
            isFavorite: item.isFavorite,
            isSaved: item.isSaved,
            inputType: item.inputType,
        };

        const updatedHistory = [newHistoryItem, ...history].slice(0, MAX_HISTORY_ITEMS);
        await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(updatedHistory));
    } catch (e) {
        console.error('Failed to add history item', e);
    }
};

// ### FOLDER FUNCTIONS ###

export const getFolders = async (): Promise<FolderItem[]> => {
    try {
        const jsonValue = await AsyncStorage.getItem(FOLDERS_KEY);
        return jsonValue != null ? JSON.parse(jsonValue) : [];
    } catch (e) { return []; }
};

export const saveFolder = async (folder: FolderItem): Promise<FolderItem[]> => {
    const folders = await getFolders();
    const existingIndex = folders.findIndex(f => f.id === folder.id);
    if (existingIndex > -1) folders[existingIndex] = folder;
    else folders.push(folder);
    await AsyncStorage.setItem(FOLDERS_KEY, JSON.stringify(folders));
    return folders;
};

export const createNewFolder = async (name: string): Promise<FolderItem> => {
    const localId = `local_${Date.now()}`;
    const newFolder: FolderItem = { id: localId, name, isSynced: false };
    await saveFolder(newFolder);

    try {
        const syncedFolder = await apiCreateFolder({ name });
        const finalFolder: FolderItem = { ...newFolder, id: syncedFolder.id, isSynced: true };
        const allFolders = await getFolders();
        const updatedFolders = allFolders.filter(f => f.id !== localId);
        updatedFolders.push(finalFolder);
        await AsyncStorage.setItem(FOLDERS_KEY, JSON.stringify(updatedFolders));
        return finalFolder;
    } catch (error) {
        console.error("Failed to sync new folder:", error);
        return newFolder;
    }
};

/**
 * [NEW] Deletes a folder and all items within it from local storage, then syncs with the backend.
 */
export const deleteFolder = async (folderId: string): Promise<void> => {
    try {
        // 1. Remove the folder from local storage
        const folders = await getFolders();
        const updatedFolders = folders.filter(f => f.id !== folderId);
        await AsyncStorage.setItem(FOLDERS_KEY, JSON.stringify(updatedFolders));

        // 2. Remove all items belonging to that folder
        const allItems = await getSavedItems();
        const updatedItems = allItems.filter(item => item.folderId !== folderId);
        await AsyncStorage.setItem(ITEMS_KEY, JSON.stringify(updatedItems));

        // 3. Sync deletion with the backend
        apiDeleteFolder(folderId).catch(err => {
            console.error(`Sync error: deleteFolder ${folderId}`, err);
            // In a real app, you might add logic here to restore the data or queue the deletion
        });
    } catch (e) {
        console.error('Failed to delete folder from storage', e);
        throw e; // Propagate error to be caught by the UI handler
    }
};


export const initializeDefaultFolder = async (): Promise<FolderItem> => {
    const folders = await getFolders();
    let savedFolder = folders.find(f => f.name.toLowerCase() === 'saved');
    if (!savedFolder) savedFolder = await createNewFolder('Saved');
    return savedFolder;
};

// ### SAVED ITEM & FAVORITE FUNCTIONS ###

export const getSavedItems = async (): Promise<TranslationItem[]> => {
    try {
        const jsonValue = await AsyncStorage.getItem(ITEMS_KEY);
        return jsonValue != null ? JSON.parse(jsonValue) : [];
    } catch (e) { return []; }
};

export const saveItemToFolder = async (item: TranslationResponse, folderId: string): Promise<TranslationItem> => {
    const allItems = await getSavedItems();
    const existingIndex = allItems.findIndex(i => i.id === item.id);

    const newItemData: TranslationItem = {
        id: item.id,
        originalText: item.sourceText,
        translatedText: item.targetText,
        sourceLang: item.sourceLang,
        targetLang: item.targetLang,
        timestamp: Date.now(),
        folderId: folderId,
        isSaved: true,
        isFavorite: existingIndex > -1 ? allItems[existingIndex].isFavorite : item.isFavorite,
        inputType: item.inputType,
    };

    if (existingIndex > -1) allItems[existingIndex] = newItemData;
    else allItems.unshift(newItemData);

    await AsyncStorage.setItem(ITEMS_KEY, JSON.stringify(allItems));

    apiCreateSavedItem({
        translationId: item.id,
        category: SavedItemCategory.PHRASE,
        folderId: folderId,
    }).catch(err => console.error(`Sync error: saveItemToFolder ${item.id}`, err));

    return newItemData;
};

export const toggleFavorite = async (item: TranslationResponse | TranslationItem): Promise<TranslationItem> => {
    const allItems = await getSavedItems();
    const existingIndex = allItems.findIndex(i => i.id === item.id);
    const isCurrentlyFavorite = existingIndex > -1 ? allItems[existingIndex].isFavorite : ('isFavorite' in item ? item.isFavorite : false);

    const updatedItem: TranslationItem = {
        id: item.id,
        originalText: 'sourceText' in item ? item.sourceText : item.originalText,
        translatedText: 'targetText' in item ? item.targetText : item.translatedText,
        sourceLang: item.sourceLang,
        targetLang: item.targetLang,
        timestamp: Date.now(),
        folderId: existingIndex > -1 ? allItems[existingIndex].folderId : null,
        isFavorite: !isCurrentlyFavorite,
        isSaved: existingIndex > -1 ? allItems[existingIndex].isSaved : false,
        inputType: item.inputType,
    };

    if (existingIndex > -1) allItems[existingIndex] = updatedItem;
    else allItems.unshift(updatedItem);

    await AsyncStorage.setItem(ITEMS_KEY, JSON.stringify(allItems));
    
    // Sync with backend
    apiToggleFavoriteTranslation(item.id).catch(err => console.error(`Sync error: toggleFavorite ${item.id}`, err));

    if (updatedItem.isFavorite) {
        apiCreateSavedItem({
            translationId: item.id,
            category: SavedItemCategory.PHRASE,
        }).catch(err => {
            if (!err.response?.data?.message?.includes('already saved')) {
                console.error(`Sync error: createSavedItem for favorite ${item.id}`, err);
            }
        });
    }

    return updatedItem;
};

/**
 * Deletes an item from local storage first, then syncs deletion with the backend.
 * Handles deletion from History, Saved Items, or both.
 */
export const deleteItem = async (itemId: string, from: 'history' | 'saved') => {
    // Optimistic UI update
    if (from === 'history') {
        const history = await getHistory();
        const updatedHistory = history.filter(item => item.id !== itemId);
        await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(updatedHistory));
        // Sync deletion
        apiDeleteTranslation(itemId).catch(err => console.error(`Sync error: delete from history ${itemId}`, err));
    } else if (from === 'saved') {
        const savedItems = await getSavedItems();
        const itemToDelete = savedItems.find(item => item.id === itemId);
        const updatedSavedItems = savedItems.filter(item => item.id !== itemId);
        await AsyncStorage.setItem(ITEMS_KEY, JSON.stringify(updatedSavedItems));
        // This assumes the `itemId` is the same as the `translationId` for deletion.
        // A more complex backend might require a specific SavedItem ID.
        apiDeleteSavedItem(itemId).catch(err => console.error(`Sync error: delete from saved ${itemId}`, err));
    }
};