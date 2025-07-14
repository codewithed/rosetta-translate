import React, { useState, useCallback, useEffect } from 'react';
import { View, StyleSheet, Text, ActivityIndicator, Button, Alert, FlatList, TouchableOpacity, TextInput, Modal } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import {
    getFolders as apiGetFolders,
    createFolder as apiCreateFolder,
    updateFolder as apiUpdateFolder,
    deleteFolder as apiDeleteFolder,
    FolderResponse,
    getSavedItems as apiGetSavedItems,
    createSavedItem as apiCreateSavedItem,
    updateSavedItem as apiUpdateSavedItem,
    deleteSavedItem as apiDeleteSavedItem,
    SavedItemResponse,
    SavedItemCategory,
    Page,
    toggleFavoriteTranslation as apiToggleFavoriteTranslation,
    SavedItemUpdatePayload,
    // ApiResponse
} from '../services/apiService';
import SavedItemListItem from '../components/SavedItemListItem';

// Picker for selecting category and folder in modal
import { Picker } from '@react-native-picker/picker';

const RNPicker: any = Picker; // Workaround for potential Picker typing issues

const SavedScreen: React.FC = () => {
    const [folders, setFolders] = useState<FolderResponse[]>([]);
    const [currentFolder, setCurrentFolder] = useState<FolderResponse | null>(null);
    const [folderNavigationStack, setFolderNavigationStack] = useState<(FolderResponse | null)[]>([null]);
    const [activeSection, setActiveSection] = useState<'saved' | 'favorites'>('saved');
    const [savedItems, setSavedItems] = useState<SavedItemResponse[]>([]);
    const [currentCategory, setCurrentCategory] = useState<SavedItemCategory>(SavedItemCategory.PHRASE);
    
    const [isLoadingFolders, setIsLoadingFolders] = useState(false);
    const [isLoadingItems, setIsLoadingItems] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [currentPage, setCurrentPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [isFetchingMore, setIsFetchingMore] = useState(false);

    const [isFolderModalVisible, setIsFolderModalVisible] = useState(false);
    const [editingFolder, setEditingFolder] = useState<FolderResponse | null>(null);
    const [newFolderName, setNewFolderName] = useState("");

    // State for Edit SavedItem Modal
    const [isEditItemModalVisible, setIsEditItemModalVisible] = useState(false);
    const [editingItem, setEditingItem] = useState<SavedItemResponse | null>(null);
    const [editItemName, setEditItemName] = useState("");
    const [editItemNotes, setEditItemNotes] = useState("");
    const [editItemFolderId, setEditItemFolderId] = useState<string | null | undefined>(null);
    const [editItemSetFolderIdNull, setEditItemSetFolderIdNull] = useState<boolean>(false);

    // Fetch all folders for the folder picker in the modal
    const [allUserFolders, setAllUserFolders] = useState<FolderResponse[]>([]);

    const loadAllUserFoldersForPicker = useCallback(async () => {
        setIsLoadingFolders(true);
        try {
            const rootFolders = await apiGetFolders(null);
            let childFolders: FolderResponse[] = [];
            if (currentFolder && currentFolder.id) {
                try {
                    childFolders = await apiGetFolders(currentFolder.id);
                } catch (e) {
                    console.warn("Could not fetch child folders for picker:", e);
                }
            }
            const combinedFolders = [...rootFolders, ...childFolders];
            const uniqueFolders = Array.from(new Map(combinedFolders.map(f => [f.id, f])).values());
            setAllUserFolders(uniqueFolders);
        } catch (error) {
            console.error("Failed to load folders for picker:", error);
            Alert.alert("Error", "Could not load folders for selection.");
            setAllUserFolders([]);
        } finally {
            setIsLoadingFolders(false);
        }
    }, [currentFolder]);

    const loadFolders = useCallback(async (parentId?: string | null) => {
        setIsLoadingFolders(true);
        setError(null);
        try {
            console.log(`Loading folders for parentId: ${parentId}`);
            const fetchedFolders = await apiGetFolders(parentId);
            setFolders(fetchedFolders);
        } catch (err: any) {
            console.error('Failed to load folders', err);
            setError(err.response?.data?.message || err.message || 'Failed to fetch folders.');
            setFolders([]);
        }
        setIsLoadingFolders(false);
    }, []);

    const loadSavedItemsList = useCallback(async (folderIdToLoad?: string | null, categoryToLoad?: SavedItemCategory, page = 0, loadMore = false) => {
        if (!loadMore) setIsLoadingItems(true);
        else setIsFetchingMore(true);
        setError(null);
        try {
            const cat = categoryToLoad || currentCategory;
            const fId = folderIdToLoad === undefined ? (currentFolder ? currentFolder.id : null) : folderIdToLoad;
            console.log(`Loading items for folderId: ${fId}, category: ${cat}, page: ${page}`);
            const response: Page<SavedItemResponse> = await apiGetSavedItems(cat, fId, page, 20);
            setSavedItems(prev => loadMore ? [...prev, ...response.content] : response.content);
            setCurrentPage(response.number);
            setTotalPages(response.totalPages);
        } catch (err: any) {
            console.error('Failed to load saved items', err);
            setError(err.response?.data?.message || err.message || 'Failed to fetch saved items.');
            setSavedItems([]);
        }
        if (!loadMore) setIsLoadingItems(false);
        else setIsFetchingMore(false);
    }, [currentCategory, currentFolder, activeSection]);

    // Separate function to avoid circular dependency
    const loadInitialData = useCallback(async () => {
        await loadFolders(null);
        await loadSavedItemsList(null, currentCategory, 0);
        setFolderNavigationStack([null]);
    }, [loadFolders, loadSavedItemsList, currentCategory]);

    useEffect(() => {
        loadInitialData();
        loadAllUserFoldersForPicker();
    }, []); // Remove dependencies to prevent infinite loop

    useFocusEffect(
        useCallback(() => {
            console.log("SavedScreen focused");
            const folderIdToRefresh = currentFolder ? currentFolder.id : null;
            loadFolders(folderIdToRefresh);
            loadSavedItemsList(folderIdToRefresh, currentCategory, 0); 
        }, [currentFolder, currentCategory, loadFolders, loadSavedItemsList])
    );

    const handleSelectFolder = (folder: FolderResponse) => {
        setCurrentFolder(folder);
        setFolderNavigationStack(prev => [...prev, folder]);
        setFolders([]);
        setSavedItems([]);
        setCurrentPage(0);
        setTotalPages(0);
        loadFolders(folder.id);
        loadSavedItemsList(folder.id, currentCategory, 0);
    };

    const navigateToParentFolder = () => {
        if (folderNavigationStack.length <= 1) return;

        const newStack = [...folderNavigationStack];
        newStack.pop();
        const parentFolder = newStack[newStack.length - 1];
        
        setFolderNavigationStack(newStack);
        setCurrentFolder(parentFolder);
        setFolders([]);
        setSavedItems([]);
        setCurrentPage(0);
        setTotalPages(0);
        loadFolders(parentFolder ? parentFolder.id : null);
        loadSavedItemsList(parentFolder ? parentFolder.id : null, currentCategory, 0);
    };

    const handleCategoryChange = (category: SavedItemCategory) => {
        setCurrentCategory(category);
        setSavedItems([]);
        setCurrentPage(0);
        setTotalPages(0);
        loadSavedItemsList(currentFolder?.id, category, 0);
    };

    const handleSectionChange = (section: 'saved' | 'favorites') => {
        setActiveSection(section);
        setSavedItems([]);
        setCurrentPage(0);
        setTotalPages(0);
        loadSavedItemsList(currentFolder?.id, currentCategory, 0);
    };

    const handleRefresh = () => {
        const folderIdToRefresh = currentFolder ? currentFolder.id : null;
        loadFolders(folderIdToRefresh);
        loadSavedItemsList(folderIdToRefresh, currentCategory, 0);
    };

    const loadMoreSavedItems = () => {
        if (currentPage < totalPages - 1 && !isFetchingMore) {
            loadSavedItemsList(currentFolder?.id, currentCategory, currentPage + 1, true);
        }
    };

    const handleSaveFolder = async () => {
        if (!newFolderName.trim()) {
            Alert.alert("Validation", "Folder name cannot be empty.");
            return;
        }
        setIsLoadingFolders(true);
        try {
            if (editingFolder) {
                await apiUpdateFolder(editingFolder.id, { name: newFolderName.trim() });
            } else {
                await apiCreateFolder({ name: newFolderName.trim(), parentFolderId: currentFolder?.id });
            }
            setNewFolderName("");
            setEditingFolder(null);
            setIsFolderModalVisible(false);
            loadFolders(currentFolder?.id); 
        } catch (err: any) {
            Alert.alert("Error", err.response?.data?.message || err.message || "Could not save folder.");
        }
        setIsLoadingFolders(false);
    };

    const handleDeleteFolderPress = (folder: FolderResponse) => {
        Alert.alert(
            "Delete Folder",
            `Are you sure you want to delete "${folder.name}"? This action might fail if the folder is not empty of items or subfolders (backend rules apply).`, 
            [
                { text: "Cancel", style: "cancel" },
                { text: "Delete", onPress: async () => {
                    try {
                        await apiDeleteFolder(folder.id);
                        loadFolders(currentFolder?.id); 
                    } catch (err: any) { 
                        Alert.alert("Error", err.response?.data?.message || err.message || "Could not delete folder."); 
                    }
                }, style: "destructive" }
            ]
        );
    };

    const handleDeleteSavedItem = async (itemId: string) => {
        Alert.alert("Delete Item", "Are you sure you want to delete this saved item?", [
            {text: "Cancel", style: "cancel"},
            {text: "Delete", onPress: async () => {
                try {
                    await apiDeleteSavedItem(itemId);
                    loadSavedItemsList(currentFolder?.id, currentCategory, 0);
                } catch (err:any) { 
                    Alert.alert("Error", err.response?.data?.message || err.message || "Could not delete item.")
                }
            }, style: "destructive"}
        ]);
    };

    const handleToggleFavorite = async (savedItemId: string, translationId: string) => {
        try {
            const updatedTranslation = await apiToggleFavoriteTranslation(translationId);
            setSavedItems(prevItems => prevItems.map(item => 
                item.id === savedItemId 
                ? { ...item, translation: { ...item.translation, isFavorite: updatedTranslation.isFavorite } } 
                : item
            ));
            if (editingItem && editingItem.id === savedItemId) {
                setEditingItem(prev => prev ? { ...prev, translation: { ...prev.translation, isFavorite: updatedTranslation.isFavorite } } : null);
            }
        } catch (err: any) {
            console.error("Failed to toggle favorite status", err);
            Alert.alert("Error", "Could not update favorite status.");
        }
    };

    const openEditItemModal = (item: SavedItemResponse) => {
        setEditingItem(item);
        setEditItemName(item.name || item.translation.sourceText.substring(0, 50));
        setEditItemNotes(item.notes || "");
        setEditItemFolderId(item.folderId);
        setEditItemSetFolderIdNull(false);
        loadAllUserFoldersForPicker();
        setIsEditItemModalVisible(true);
    };

    const handleUpdateSavedItem = async () => {
        if (!editingItem) return;

        const payload: SavedItemUpdatePayload = {
            name: editItemName.trim(),
            notes: editItemNotes.trim(),
        };

        if (editItemSetFolderIdNull) {
            payload.folderId = null;
            payload.setFolderIdNull = true; 
        } else if (editItemFolderId !== undefined && editItemFolderId !== editingItem.folderId) {
            payload.folderId = editItemFolderId;
        }

        setIsLoadingItems(true);
        try {
            await apiUpdateSavedItem(editingItem.id, payload);
            setIsEditItemModalVisible(false);
            setEditingItem(null);
            loadSavedItemsList(currentFolder?.id, currentCategory, currentPage, false);
            if (currentFolder) loadFolders(currentFolder.id);
            else loadFolders(null);
            Alert.alert("Success", "Saved item updated.");
        } catch (err: any) {
            console.error('Failed to update saved item', err);
            Alert.alert("Error", err.response?.data?.message || "Could not update item.");
        } finally {
            setIsLoadingItems(false);
        }
    };

    const handleEditSavedItem = (item: SavedItemResponse) => {
        openEditItemModal(item);
    };

    const closeFolderModal = () => {
        setIsFolderModalVisible(false);
        setNewFolderName("");
        setEditingFolder(null);
    };

    const closeEditItemModal = () => {
        setIsEditItemModalVisible(false);
        setEditingItem(null);
    };

    const openFolderEditModal = (folder: FolderResponse) => {
        setEditingFolder(folder);
        setNewFolderName(folder.name);
        setIsFolderModalVisible(true);
    };

    const renderFolderItem = ({ item }: { item: FolderResponse }) => (
        <TouchableOpacity style={styles.folderItem} onPress={() => handleSelectFolder(item)}>
            <Ionicons name="folder-outline" size={24} color="#555" />
            <Text style={styles.folderName}>{item.name}</Text>
            <View style={styles.folderActions}>
                <TouchableOpacity onPress={() => openFolderEditModal(item)} style={styles.iconButtonSmall}>
                    <Ionicons name="pencil-outline" size={20} color="#007AFF" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDeleteFolderPress(item)} style={styles.iconButtonSmall}>
                    <Ionicons name="trash-outline" size={20} color="#FF3B30" />
                </TouchableOpacity>
            </View>
        </TouchableOpacity>
    );
    
    const renderSavedItem = ({ item }: { item: SavedItemResponse }) => (
        <SavedItemListItem 
            item={item}
            onDelete={() => handleDeleteSavedItem(item.id)}
            onEdit={() => handleEditSavedItem(item)}
            onToggleFavorite={() => handleToggleFavorite(item.id, item.translation.id)}
        />
    );

    const renderListHeader = () => (
        <View>
            {/* Section Tabs */}
            <View style={styles.sectionTabs}>
                <TouchableOpacity 
                    style={[styles.sectionTab, activeSection === 'saved' && styles.activeTab]}
                    onPress={() => handleSectionChange('saved')}
                >
                    <Text style={[styles.sectionTabText, activeSection === 'saved' && styles.activeTabText]}>Saved Items</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                    style={[styles.sectionTab, activeSection === 'favorites' && styles.activeTab]}
                    onPress={() => handleSectionChange('favorites')}
                >
                    <Text style={[styles.sectionTabText, activeSection === 'favorites' && styles.activeTabText]}>Favorites</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    const renderListEmptyComponent = () => {
        if (isLoadingItems) return <ActivityIndicator style={{ marginVertical: 20 }} />;
        if (error) return <Text style={styles.errorText}>{error}</Text>;
        return <Text style={styles.emptyListText}>
            {activeSection === 'saved' ? 'No saved items found.' : 'No favorite items found.'}
        </Text>;
    };

    if (error && !isLoadingFolders && !isLoadingItems) {
        return (
            <View style={styles.centered}>
                <Text style={styles.errorText}>{error}</Text>
                <Button title="Retry" onPress={handleRefresh} />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Modal
                animationType="slide"
                transparent={true}
                visible={isFolderModalVisible}
                onRequestClose={closeFolderModal}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContainer}>
                        <Text style={styles.modalTitle}>{editingFolder ? "Edit" : "Create New"} Folder</Text>
                        <TextInput 
                            style={styles.modalInput}
                            placeholder="Folder Name"
                            value={newFolderName}
                            onChangeText={setNewFolderName}
                            autoFocus
                        />
                        <View style={styles.modalButtonContainer}>
                            <Button title="Cancel" onPress={closeFolderModal} />
                            <Button title={editingFolder ? "Save Changes" : "Create Folder"} onPress={handleSaveFolder} />
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Edit Saved Item Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={isEditItemModalVisible}
                onRequestClose={closeEditItemModal}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContainer}>
                        <Text style={styles.modalTitle}>Edit Saved Item</Text>
                        
                        <Text style={styles.modalLabel}>Name:</Text>
                        <TextInput
                            style={styles.modalInput}
                            value={editItemName}
                            onChangeText={setEditItemName}
                            placeholder="Item Name (e.g., Travel Phrase)"
                        />

                        <Text style={styles.modalLabel}>Notes:</Text>
                        <TextInput
                            style={[styles.modalInput, styles.modalTextarea]}
                            value={editItemNotes}
                            onChangeText={setEditItemNotes}
                            placeholder="Add any notes here..."
                            multiline
                        />

                        <Text style={styles.modalLabel}>Move to Folder:</Text>
                        {isLoadingFolders ? (
                            <ActivityIndicator />
                        ) : (
                            <View style={styles.pickerContainer}>
                                <RNPicker
                                    selectedValue={editItemSetFolderIdNull ? "__ROOT__" : editItemFolderId || "__ROOT__"}
                                    onValueChange={(itemValue: string | null) => {
                                        if (itemValue === "__ROOT__") {
                                            setEditItemFolderId(null);
                                            setEditItemSetFolderIdNull(true);
                                        } else {
                                            setEditItemFolderId(itemValue);
                                            setEditItemSetFolderIdNull(false);
                                        }
                                    }}
                                    style={styles.pickerStyle}
                                >
                                    <RNPicker.Item label="-- No Folder (Root) --" value="__ROOT__" />
                                    {allUserFolders.map((folder) => (
                                        <RNPicker.Item key={folder.id} label={folder.name} value={folder.id} />
                                    ))}
                                </RNPicker>
                            </View>
                        )}
                        
                        <View style={styles.modalButtonContainer}>
                            <Button title="Cancel" onPress={closeEditItemModal} />
                            <Button title="Save Changes" onPress={handleUpdateSavedItem} />
                        </View>
                    </View>
                </View>
            </Modal>

            <FlatList
                data={savedItems}
                renderItem={renderSavedItem}
                keyExtractor={(item) => item.id}
                ListHeaderComponent={renderListHeader}
                ListEmptyComponent={renderListEmptyComponent}
                onEndReached={loadMoreSavedItems}
                onEndReachedThreshold={0.5}
                ListFooterComponent={() => 
                    isFetchingMore ? <ActivityIndicator style={{ marginVertical: 20 }} /> : null
                }
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f0f0f0',
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
    emptyListText: {
        textAlign: 'center',
        marginTop: 20,
        marginBottom: 20,
        fontSize: 16,
        color: '#888',
    },
    // Section Tabs
    sectionTabs: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    sectionTab: {
        flex: 1,
        paddingVertical: 16,
        alignItems: 'center',
        backgroundColor: '#f8f8f8',
    },
    activeTab: {
        backgroundColor: '#007AFF',
    },
    sectionTabText: {
        fontSize: 16,
        fontWeight: '500',
        color: '#666',
    },
    activeTabText: {
        color: '#fff',
    },
    // Folder Items
    folderItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    folderName: {
        flex: 1,
        marginLeft: 12,
        fontSize: 16,
    },
    folderActions: {
        flexDirection: 'row',
    },
    iconButtonSmall: {
        padding: 8,
        marginLeft: 8,
    },
    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContainer: {
        width: '85%',
        backgroundColor: 'white',
        borderRadius: 10,
        padding: 20,
        alignItems: 'stretch',
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 15,
        textAlign: 'center',
    },
    modalInput: {
        borderWidth: 1,
        borderColor: '#ddd',
        padding: 10,
        borderRadius: 5,
        fontSize: 16,
        marginBottom: 10,
    },
    modalTextarea: {
        minHeight: 80,
        textAlignVertical: 'top',
    },
    modalLabel: {
        fontSize: 16,
        color: '#333',
        marginBottom: 5,
        marginTop: 10,
    },
    pickerContainer: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 5,
        marginBottom: 15,
        height: 50,
        justifyContent: 'center',
    },
    pickerStyle: {
        height: 50,
        width: '100%',
    },
    modalButtonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
    },
});

export default SavedScreen;