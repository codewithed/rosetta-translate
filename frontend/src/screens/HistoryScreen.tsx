import React, { useState, useCallback } from 'react';
import { View, StyleSheet, Button, Alert, ActivityIndicator, Text, Modal } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Picker } from '@react-native-picker/picker';
import TranslationList from '../components/TranslationList';
import {
    getTranslations as apiGetTranslations,
    deleteTranslation as apiDeleteTranslation,
    toggleFavoriteTranslation as apiToggleFavorite,
    TranslationResponse as ApiTranslationResponse,
    Page,
} from '../services/apiService';
import { 
    getTranslationHistory,
    clearTranslationHistory,
    deleteTranslationFromHistory,
    updateTranslationInHistory,
    batchSaveTranslations,
} from '../utils/historyStorage';
import {
    saveItemToFolder,
    getFolders,
    initializeDefaultFolder,
    createNewFolder,
    FolderItem,
    toggleFavorite, // Import the main toggleFavorite function
    TranslationItem, // Import TranslationItem for type consistency
} from '../utils/storage';
import { InputType } from '../constants/enums';
import theme from '../constants/theme';

const RNPicker: any = Picker;

// Use the main TranslationItem interface for consistency
type LocalTranslationItem = TranslationItem;

const HistoryScreen: React.FC = () => {
    const [historyItems, setHistoryItems] = useState<LocalTranslationItem[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // State for Save to Folder Modal (reused from HomeScreen)
    const [isSaveModalVisible, setIsSaveModalVisible] = useState(false);
    const [itemToSave, setItemToSave] = useState<LocalTranslationItem | null>(null);
    const [userFolders, setUserFolders] = useState<FolderItem[]>([]);
    const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
    const [isFoldersLoading, setIsFoldersLoading] = useState(false);

    const mapApiToLocal = (apiItem: ApiTranslationResponse): LocalTranslationItem => ({
        id: apiItem.id,
        originalText: apiItem.sourceText,
        translatedText: apiItem.targetText,
        sourceLang: apiItem.sourceLang,
        targetLang: apiItem.targetLang,
        timestamp: new Date(apiItem.createdAt).getTime(),
        isSaved: apiItem.isSaved ?? false,
        isFavorite: apiItem.isFavorite ?? false,
        inputType: apiItem.inputType || 'text',
    });

    const loadHistory = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response: Page<ApiTranslationResponse> = await apiGetTranslations(0, 100);
            const apiHistory = response.content.map(mapApiToLocal);
            await batchSaveTranslations(apiHistory);
            setHistoryItems(apiHistory);
        } catch (err: any) {
            // console.error('Failed to load history from API:', err);
            setError('Failed to fetch history. Displaying cached data.');
            const localHistory = await getTranslationHistory();
            setHistoryItems(localHistory);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            loadHistory();
        }, [loadHistory])
    );

    const handleDeleteItem = (id: string) => {
        setHistoryItems(prevItems => prevItems.filter(item => item.id !== id));
        apiDeleteTranslation(id).catch((err) => {
            // console.error('API delete failed:', err);
            // Alert.alert('Error', 'Failed to delete from server. Restoring history.');
            loadHistory();
        });
        deleteTranslationFromHistory(id);
    };

    const handleToggleFavorite = (itemToToggle: LocalTranslationItem) => {
        const newFavoriteState = !itemToToggle.isFavorite;
        // Optimistically update the UI
        setHistoryItems(prevItems =>
            prevItems.map(item =>
                item.id === itemToToggle.id
                    ? { ...item, isFavorite: newFavoriteState }
                    : item
            )
        );
        // Update the history cache
        updateTranslationInHistory({ ...itemToToggle, isFavorite: newFavoriteState });

        // Call the main toggleFavorite function which handles API calls and Saved Items storage
        toggleFavorite(itemToToggle).catch((err) => {
            // console.error('Toggle favorite failed:', err);
            // Alert.alert('Error', "Couldn't sync favorite status.");
            loadHistory(); // Revert on error
        });
    };

    const openSaveModal = async (item: LocalTranslationItem) => {
        setItemToSave(item);
        setIsFoldersLoading(true);
        setIsSaveModalVisible(true);
        try {
            const defaultFolder = await initializeDefaultFolder();
            const folders = await getFolders();
            setUserFolders(folders);
            setSelectedFolderId(defaultFolder.id);
        } catch (error) {
            // console.error("Failed to load folders for save modal:", error);
            Alert.alert("Error", "Could not load your folders.");
        } finally {
            setIsFoldersLoading(false);
        }
    };

    const handleCreateNewFolderInPopup = () => {
        Alert.prompt("New Folder", "Enter a name for your new folder:", async (folderName) => {
            if (folderName) {
                try {
                    setIsFoldersLoading(true);
                    const newFolder = await createNewFolder(folderName);
                    setUserFolders(prev => [...prev, newFolder]);
                    setSelectedFolderId(newFolder.id);
                    Alert.alert("Success", `Folder "${folderName}" created and selected.`);
                } catch (err: any) {
                    Alert.alert("Error", `Could not create folder: ${err.message}`);
                } finally {
                    setIsFoldersLoading(false);
                }
            }
        });
    };

    const handleSaveItem = async () => {
        if (!itemToSave || !selectedFolderId) return;
        
        setIsLoading(true);
        try {
            const apiItem: ApiTranslationResponse = {
                id: itemToSave.id,
                sourceText: itemToSave.originalText,
                targetText: itemToSave.translatedText,
                sourceLang: itemToSave.sourceLang,
                targetLang: itemToSave.targetLang,
                isFavorite: itemToSave.isFavorite,
                isSaved: true,
                inputType: itemToSave.inputType,
                createdAt: new Date(itemToSave.timestamp).toISOString(),
            };
            await saveItemToFolder(apiItem, selectedFolderId);
            
            setHistoryItems(prevItems =>
                prevItems.map(item =>
                    item.id === itemToSave.id ? { ...item, isSaved: true } : item
                )
            );
            updateTranslationInHistory({ ...itemToSave, isSaved: true });

            Alert.alert("Success", "Item saved successfully!");
            setIsSaveModalVisible(false);
            setItemToSave(null);
        } catch (err: any) {
            Alert.alert("Error", "Could not save item.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleClearHistory = () => {
        Alert.alert("Clear History", "Are you sure you want to delete all items from your history?",
            [{ text: "Cancel", style: "cancel" }, { text: "Clear All", onPress: async () => { setHistoryItems([]); await clearTranslationHistory(); }, style: "destructive" }]
        );
    };

    if (isLoading && historyItems.length === 0) {
        return <View style={styles.centered}><ActivityIndicator size="large" /></View>;
    }

    if (error && historyItems.length === 0) {
        return <View style={styles.centered}><Text style={styles.errorText}>{error}</Text><Button title="Retry" onPress={loadHistory} /></View>;
    }

    return (
        <View style={styles.container}>
            {historyItems.length > 0 && (
                <View style={styles.clearButtonContainer}>
                    <Button title="Clear History" onPress={handleClearHistory} color="#E53935" />
                </View>
            )}
            <TranslationList 
                items={historyItems} 
                onDeleteItem={handleDeleteItem} 
                onToggleSave={openSaveModal}
                onToggleFavorite={handleToggleFavorite}
                listType="history"
            />
            <Modal
                animationType="slide"
                transparent={true}
                visible={isSaveModalVisible}
                onRequestClose={() => setIsSaveModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Save to Folder</Text>
                        {isFoldersLoading ? <ActivityIndicator /> : (
                            <>
                                <View style={styles.pickerContainer}>
                                     <RNPicker
                                        selectedValue={selectedFolderId}
                                        onValueChange={(itemValue: string | null) => setSelectedFolderId(itemValue)}
                                    >
                                        {userFolders.map((folder) => (
                                            <RNPicker.Item key={folder.id} label={folder.name} value={folder.id} />
                                        ))}
                                    </RNPicker>
                                </View>
                                <View style={styles.modalButtonContainer}>
                                    <Button title="New Folder" onPress={handleCreateNewFolderInPopup} />
                                </View>
                            </>
                        )}
                        <View style={styles.modalButtonContainer}>
                            <Button title="Cancel" onPress={() => setIsSaveModalVisible(false)} color="#888" />
                            <Button title="Save" onPress={handleSaveItem} disabled={isFoldersLoading || !selectedFolderId} />
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    clearButtonContainer: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
        backgroundColor: '#fff',
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    errorText: {
        color: 'red',
        marginBottom: 10,
        textAlign: 'center',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        backgroundColor: theme.colors.white,
        borderRadius: theme.borders.radiusLarge,
        padding: theme.spacing.lg,
        width: '90%',
        maxHeight: '80%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 20,
        textAlign: 'center'
    },
    pickerContainer: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 5,
        marginBottom: 15
    },
    modalButtonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginTop: 20,
    },
});

export default HistoryScreen;