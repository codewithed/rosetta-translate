import React, { useState, useCallback } from 'react';
import { View, StyleSheet, Button, Alert, ActivityIndicator, Text } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import TranslationList from '../components/TranslationList';
import {
    getTranslations as apiGetTranslations,
    deleteTranslation as apiDeleteTranslation,
    toggleFavoriteTranslation as apiToggleTranslationFavorite,
    TranslationResponse as ApiTranslationResponse,
    Page,
    ApiResponse
} from '../services/apiService';
import { saveTranslationToHistory, getTranslationHistory, clearTranslationHistory } from '../utils/historyStorage';
import { InputType } from '../constants/enums';

interface LocalTranslationItem {
    id: string;
    originalText: string;
    translatedText: string;
    sourceLang: string;
    targetLang: string;
    timestamp: number;
    isSaved: boolean;
    inputType?: InputType;
    isDeleting?: boolean;
    isUpdating?: boolean;
}

const HistoryScreen: React.FC = () => {
    const [historyItems, setHistoryItems] = useState<LocalTranslationItem[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const mapApiToLocal = (apiItem: ApiTranslationResponse): LocalTranslationItem => ({
        id: apiItem.id,
        originalText: apiItem.sourceText,
        translatedText: apiItem.targetText,
        sourceLang: apiItem.sourceLang,
        targetLang: apiItem.targetLang,
        timestamp: new Date(apiItem.createdAt).getTime(),
        isSaved: apiItem.isFavorite ?? false,
        inputType: InputType.TEXT, // Defaulting to TEXT, adjust if API provides this
        isDeleting: false,
        isUpdating: false,
    });

    const ensureLocalItemStructure = (item: any): LocalTranslationItem => ({
        id: item.id,
        originalText: item.originalText,
        translatedText: item.translatedText,
        sourceLang: item.sourceLang,
        targetLang: item.targetLang,
        timestamp: item.timestamp,
        isSaved: item.isSaved ?? false,
        inputType: typeof item.inputType === 'string' ? 
            (Object.values(InputType).includes(item.inputType as InputType) ? 
                item.inputType as InputType : InputType.TEXT) : 
            (item.inputType || InputType.TEXT),
        isDeleting: item.isDeleting || false,
        isUpdating: item.isUpdating || false,
    });

    const loadHistory = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            // First, try to load from local storage
            const localHistory = await getTranslationHistory();
            const normalizedLocalHistory = localHistory.map(ensureLocalItemStructure);
            setHistoryItems(normalizedLocalHistory);

            // Then, attempt to fetch from API and update local storage
            const response: Page<ApiTranslationResponse> = await apiGetTranslations(0, 50); // Fetch a reasonable amount
            const apiHistory = response.content.map(mapApiToLocal);

            // Merge and deduplicate: prioritize API data, then local data
            const mergedHistoryMap = new Map<string, LocalTranslationItem>();
            apiHistory.forEach(item => mergedHistoryMap.set(item.id, item));
            normalizedLocalHistory.forEach((item: LocalTranslationItem) => {
                if (!mergedHistoryMap.has(item.id)) {
                    mergedHistoryMap.set(item.id, item);
                }
            });
            const finalHistory = Array.from(mergedHistoryMap.values()).sort((a, b) => b.timestamp - a.timestamp);
            setHistoryItems(finalHistory);

            // Optionally, persist the merged history back to local storage
            // This ensures local storage is up-to-date with the latest from API
            await clearTranslationHistory(); // Clear before saving to avoid duplicates
            for (const item of finalHistory) {
                await saveTranslationToHistory(item);
            }

        } catch (err: any) {
            console.error('Failed to load history:', err);
            setError(err.message || 'Failed to fetch history. Displaying local cache.');
            // If API fails, ensure we still display local history if available
            const localHistory = await getTranslationHistory();
            const normalizedLocalHistory = localHistory.map(ensureLocalItemStructure);
            setHistoryItems(normalizedLocalHistory);
        }
        setIsLoading(false);
    }, []);

    useFocusEffect(
        useCallback(() => {
            loadHistory();
        }, [loadHistory])
    );

    const handleDeleteItem = async (id: string) => {
        // Update UI immediately to show deleting state
        setHistoryItems(prevItems => 
            prevItems.map(item => 
                item.id === id ? { ...item, isDeleting: true } : item
            )
        );

        try {
            await apiDeleteTranslation(id);
            // Remove from local storage as well
            const updatedHistory = historyItems.filter(item => item.id !== id);
            setHistoryItems(updatedHistory);
            await clearTranslationHistory();
            for (const item of updatedHistory) {
                await saveTranslationToHistory(item);
            }
        } catch (err: any) {
            // Reset deleting state on error
            setHistoryItems(prevItems => 
                prevItems.map(item => 
                    item.id === id ? { ...item, isDeleting: false } : item
                )
            );
            Alert.alert('Error', 'Failed to delete translation.');
        }
    };

    const handleToggleSave = async (item: LocalTranslationItem) => {
        // Update UI immediately to show updating state
        setHistoryItems(prevItems => 
            prevItems.map(hItem => 
                hItem.id === item.id ? { ...hItem, isUpdating: true } : hItem
            )
        );

        try {
            const updatedApiItem = await apiToggleTranslationFavorite(item.id);
            const updatedLocalItem = mapApiToLocal(updatedApiItem);

            const updatedHistory = historyItems.map(hItem => 
                hItem.id === updatedLocalItem.id ? updatedLocalItem : hItem
            );
            setHistoryItems(updatedHistory);

            // Update local storage
            await clearTranslationHistory();
            for (const hItem of updatedHistory) {
                await saveTranslationToHistory(hItem);
            }

        } catch (err: any) {
            // Reset updating state on error
            setHistoryItems(prevItems => 
                prevItems.map(hItem => 
                    hItem.id === item.id ? { ...hItem, isUpdating: false } : hItem
                )
            );
            Alert.alert('Error', 'Failed to update favorite status.');
        }
    };
    
    const handleClearHistory = async () => {
        Alert.alert(
            "Clear History",
            "This will clear your LOCAL history cache. A backend 'clear all' is not yet supported. Continue?",
            [
                { text: "Cancel", style: "cancel" },
                { text: "Clear Local Cache", onPress: async () => {
                    setIsLoading(true);
                    await clearTranslationHistory();
                    setHistoryItems([]); // Clear displayed items
                    setIsLoading(false);
                    Alert.alert("Local Cache Cleared", "Your local history cache has been cleared.");
                }, style: "destructive" }
            ]
        );
    };

    if (isLoading && historyItems.length === 0) {
        return <View style={styles.centered}><ActivityIndicator size="large" /></View>;
    }

    if (error && historyItems.length === 0) {
        return <View style={styles.centered}><Text style={styles.errorText}>{error}</Text><Button title="Retry" onPress={() => loadHistory()} /></View>;
    }

    return (
        <View style={styles.container}>
            {historyItems.length > 0 && (
                <View style={styles.clearButtonContainer}>
                    <Button title="Clear Local History Cache" onPress={handleClearHistory} color="orange" />
                </View>
            )}
            <TranslationList 
                items={historyItems.map(item => ({
                    ...item,
                    isSaved: item.isSaved ?? false // Ensure isSaved is always boolean
                }))} 
                onDeleteItem={(id) => handleDeleteItem(id)} 
                onToggleSave={(item) => {
                    // Find the original item to pass to handleToggleSave
                    const originalItem = historyItems.find(hItem => hItem.id === item.id);
                    if (originalItem) {
                        handleToggleSave(originalItem);
                    }
                }}
                listType="history"
                // onLoadMore and hasMore props are removed as local storage doesn't have pagination
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    clearButtonContainer: {
        padding: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    errorText: {
        color: 'red',
        marginBottom: 10,
    }
});

export default HistoryScreen;