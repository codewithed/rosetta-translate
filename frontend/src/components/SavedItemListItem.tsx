import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SavedItemResponse, SavedItemCategory } from '../services/apiService';

interface SavedItemListItemProps {
    item: SavedItemResponse;
    onPress?: () => void;
    onEdit?: () => void;
    onDelete?: () => void;
    onToggleFavorite?: () => void; // Assuming translations can still be favorited independently
}

const getCategoryDisplayName = (category: SavedItemCategory) => {
    switch (category) {
        case SavedItemCategory.PHRASE: return 'Phrase';
        case SavedItemCategory.WORD: return 'Word';
        case SavedItemCategory.SENTENCE: return 'Sentence';
        case SavedItemCategory.PARAGRAPH: return 'Paragraph';
        default: return 'Other';
    }
};

const SavedItemListItem: React.FC<SavedItemListItemProps> = ({ item, onPress, onEdit, onDelete, onToggleFavorite }) => {
    const { translation, name, notes, category } = item; // Removed isFavorite from here

    return (
        <TouchableOpacity onPress={onPress} style={styles.container}>
            <View style={styles.contentContainer}>
                {name && <Text style={styles.name}>{name}</Text>}
                <Text style={styles.translationText}>
                    <Text style={styles.langLabel}>{translation.sourceLang}: </Text>{translation.sourceText}
                </Text>
                <Text style={styles.translationText}>
                    <Text style={styles.langLabel}>{translation.targetLang}: </Text>{translation.targetText}
                </Text>
                {notes && <Text style={styles.notes}>Notes: {notes}</Text>}
                <View style={styles.footer}>
                    <Text style={styles.category}>Category: {getCategoryDisplayName(category)}</Text>
                    <Text style={styles.date}>{new Date(item.createdAt).toLocaleDateString()}</Text>
                </View>
            </View>
            <View style={styles.actionsContainer}>
                {onToggleFavorite && (
                    <TouchableOpacity onPress={onToggleFavorite} style={styles.iconButton}>
                        <Ionicons name={translation.isFavorite ? "heart" : "heart-outline"} size={24} color={translation.isFavorite ? "red" : "#555"} />
                    </TouchableOpacity>
                )}
                {onEdit && (
                    <TouchableOpacity onPress={onEdit} style={styles.iconButton}>
                        <Ionicons name="pencil-outline" size={24} color="blue" />
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