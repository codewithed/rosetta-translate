import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SavedItemResponse } from '../services/apiService';
import { TranslationItem } from '../utils/storage';

interface SavedItemListItemProps {
    item: TranslationItem;
    onPress?: () => void;
    onDelete?: () => void;
    onToggleFavorite?: () => void; // Assuming translations can still be favorited independently
}


const SavedItemListItem: React.FC<SavedItemListItemProps> = ({ item, onPress, onDelete, onToggleFavorite }) => {

    return (
        <TouchableOpacity onPress={onPress} style={styles.container}>
            <View style={styles.contentContainer}>
                <Text style={styles.translationText}>
                    <Text style={styles.langLabel}>{item.sourceLang}: </Text>{item.originalText}
                </Text>
                <Text style={styles.translationText}>
                    <Text style={styles.langLabel}>{item.targetLang}: </Text>{item.translatedText}
                </Text>
                <View style={styles.footer}>
                    <Text style={styles.date}>{new Date(item.timestamp).toLocaleDateString()}</Text>
                </View>
            </View>
            <View style={styles.actionsContainer}>
                {onToggleFavorite && (
                    <TouchableOpacity onPress={onToggleFavorite} style={styles.iconButton}>
                        <Ionicons name={item.isFavorite ? "heart" : "heart-outline"} size={24} color={item.isFavorite ? "red" : "#555"} />
                    </TouchableOpacity>
                )}
                {onDelete && (
                    <TouchableOpacity onPress={onDelete} style={styles.iconButton}>
                        <Ionicons name="trash-outline" size={24} color="red" />
                    </TouchableOpacity>
                )}
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#fff',
        padding: 15,
        marginVertical: 8,
        marginHorizontal: 16,
        borderRadius: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.22,
        shadowRadius: 2.22,
        elevation: 3,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    contentContainer: {
        flex: 1,
    },
    name: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 5,
    },
    translationText: {
        fontSize: 16,
        marginBottom: 3,
    },
    langLabel: {
        fontWeight: 'bold',
        color: '#444',
    },
    notes: {
        fontSize: 14,
        color: '#666',
        fontStyle: 'italic',
        marginTop: 5,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 10,
    },
    category: {
        fontSize: 12,
        color: '#777',
    },
    date: {
        fontSize: 12,
        color: '#777',
    },
    actionsContainer: {
        flexDirection: 'column', // Changed to column for vertical alignment of icons
        justifyContent: 'space-around', // Distribute space around icons
        alignItems: 'center',
        marginLeft: 10, // Add some margin from the content
    },
    iconButton: {
        padding: 5, // Add padding for easier touch
        marginVertical: 5, // Add vertical margin between icons
    },
});

export default SavedItemListItem; 