import React, { useState, useCallback } from 'react';
import { View, StyleSheet, Text, ActivityIndicator, Alert, FlatList, TouchableOpacity } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import {
    getFolders,
    getSavedItems,
    FolderItem,
    deleteItem,
    toggleFavorite,
    TranslationItem,
    deleteFolder,
} from '../utils/storage';
import TranslationList from '../components/TranslationList';

type ViewMode = 'folders' | 'items' | 'favorites';

const SavedScreen: React.FC = () => {
    const [viewMode, setViewMode] = useState<ViewMode>('folders');
    const [folders, setFolders] = useState<FolderItem[]>([]);
    const [items, setItems] = useState<TranslationItem[]>([]);
    const [selectedFolder, setSelectedFolder] = useState<FolderItem | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadData = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            if (viewMode === 'folders') {
                const localFolders = await getFolders();
                setFolders(localFolders);
            } else if (viewMode === 'items' && selectedFolder) {
                const allItems = await getSavedItems();
                const folderItems = allItems.filter(item => item.folderId === selectedFolder.id);
                setItems(folderItems);
            } else if (viewMode === 'favorites') {
                const allItems = await getSavedItems();
                const favoriteItems = allItems.filter(item => item.isFavorite);
                setItems(favoriteItems);
            }
        } catch (err) {
            // console.error("Failed to load data from storage:", err);
            setError("Could not load data.");
        } finally {
            setIsLoading(false);
        }
    }, [viewMode, selectedFolder]);

    useFocusEffect(
        useCallback(() => {
            loadData();
        }, [loadData])
    );

    const handleDeleteItem = (itemId: string) => {
        setItems(prevItems => prevItems.filter(item => item.id !== itemId));
        deleteItem(itemId, 'saved').catch(err => {
            // console.error("Failed to delete item:", err);
            // Alert.alert("Error", "Could not delete item. Restoring list.");
            loadData();
        });
    };

    const handleToggleFavorite = (itemToToggle: TranslationItem) => {
        if (viewMode === 'favorites' && itemToToggle.isFavorite) {
            setItems(prevItems => prevItems.filter(item => item.id !== itemToToggle.id));
        } else {
            setItems(prevItems =>
                prevItems.map(item =>
                    item.id === itemToToggle.id ? { ...item, isFavorite: !item.isFavorite } : item
                )
            );
        }
        toggleFavorite(itemToToggle).catch(err => {
            // console.error("Failed to toggle favorite:", err);
            // Alert.alert("Error", "Could not update favorite status. Restoring list.");
            loadData();
        });
    };

    const handleDeleteFolder = (folder: FolderItem) => {
        Alert.alert(
            "Delete Folder",
            `Are you sure you want to delete "${folder.name}" and all its saved items?`,
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete", style: "destructive",
                    onPress: () => {
                        setFolders(prevFolders => prevFolders.filter(f => f.id !== folder.id));
                        deleteFolder(folder.id).catch(err => {
                            // console.error("Failed to delete folder:", err);
                            Alert.alert("Error", "Could not delete folder.");
                            loadData();
                        });
                    },
                },
            ]
        );
    };

    const handleSelectFolder = (folder: FolderItem) => {
        setSelectedFolder(folder);
        setViewMode('items');
    };

    const handleBackToFolders = () => {
        setSelectedFolder(null);
        setViewMode('folders');
    };

    const handleTabChange = (newMode: ViewMode) => {
        if (viewMode !== newMode) {
            setSelectedFolder(null);
            setViewMode(newMode);
        }
    };

    // FIX: Ensured this function returns a JSX element. The parentheses `()` cause an implicit return.
    const renderFolderItem = ({ item }: { item: FolderItem }) => (
        <View style={styles.folderItemContainer}>
            <TouchableOpacity style={styles.folderItem} onPress={() => handleSelectFolder(item)}>
                <Ionicons name="folder-outline" size={24} color="#F56B0A" />
                <Text style={styles.folderName}>{item.name}</Text>
                <Ionicons name="chevron-forward-outline" size={22} color="#ccc" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleDeleteFolder(item)} style={styles.deleteIcon}>
                <Ionicons name="trash-outline" size={22} color="#E53935" />
            </TouchableOpacity>
        </View>
    );

    const renderContent = () => {
        if (isLoading) {
            return <ActivityIndicator size="large" style={styles.loadingContainer} />;
        }
        if (error) {
            return <Text style={styles.errorText}>{error}</Text>;
        }
        if (viewMode === 'folders') {
            return (
                <FlatList
                    data={folders}
                    renderItem={renderFolderItem}
                    keyExtractor={(item) => item.id}
                    ListEmptyComponent={<Text style={styles.emptyListText}>No folders found.</Text>}
                />
            );
        }
        return (
            <TranslationList
                items={items}
                onDeleteItem={handleDeleteItem}
                onToggleFavorite={handleToggleFavorite}
                listType="saved"
            />
        );
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                {viewMode === 'items' && (
                    <TouchableOpacity onPress={handleBackToFolders} style={styles.backButton}>
                        <Ionicons name="arrow-back-outline" size={28} color="#007AFF" />
                    </TouchableOpacity>
                )}
                <View style={styles.sectionTabs}>
                    <TouchableOpacity
                        style={[styles.sectionTab, viewMode !== 'favorites' && styles.activeTab]}
                        onPress={() => handleTabChange('folders')}
                    >
                        <Text style={[styles.sectionTabText, viewMode !== 'favorites' && styles.activeTabText]}>My Folders</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.sectionTab, viewMode === 'favorites' && styles.activeTab]}
                        onPress={() => handleTabChange('favorites')}
                    >
                        <Text style={[styles.sectionTabText, viewMode === 'favorites' && styles.activeTabText]}>Favorites</Text>
                    </TouchableOpacity>
                </View>
            </View>
            {renderContent()}
        </View>
    );
};

// FIX: Added all missing style definitions to resolve the 'Property does not exist' error.
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f5f5' },
    header: {
        backgroundColor: '#f8f8f8',
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
        flexDirection: 'row',
        alignItems: 'center',
        position: 'relative',
    },
    backButton: {
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        justifyContent: 'center',
        paddingHorizontal: 16,
        zIndex: 1,
    },
    sectionTabs: {
        flex: 1,
        flexDirection: 'row',
    },
    sectionTab: {
        flex: 1,
        paddingVertical: 16,
        alignItems: 'center',
    },
    activeTab: {
        borderBottomWidth: 2,
        borderBottomColor: '#007AFF',
    },
    sectionTabText: {
        fontSize: 16,
        fontWeight: '500',
        color: '#666',
    },
    activeTabText: {
        color: '#007AFF',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    errorText: { color: 'red', textAlign: 'center', marginTop: 20 },
    emptyListText: { textAlign: 'center', marginTop: 50, fontSize: 16, color: '#888' },
    folderItemContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
        marginHorizontal: 16,
        marginTop: 12,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 1,
    },
    folderItem: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 18,
        paddingLeft: 18,
    },
    folderName: {
        flex: 1,
        marginLeft: 16,
        fontSize: 16,
    },
    deleteIcon: {
        padding: 16,
    },
});

export default SavedScreen;