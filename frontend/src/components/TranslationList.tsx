import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { TranslationItem } from '../utils/storage';
import { Ionicons } from '@expo/vector-icons';

interface TranslationListProps {
    items: TranslationItem[];
    onItemPress?: (item: TranslationItem) => void;
    onDeleteItem?: (id: string) => void;
    onToggleSave?: (item: TranslationItem) => void;
    listType: 'history' | 'saved';
    onLoadMore?: () => void;
    isLoadingMore?: boolean;
    hasMore?: boolean;
}

const TranslationList: React.FC<TranslationListProps> = ({ 
    items, 
    onItemPress, 
    onDeleteItem, 
    onToggleSave, 
    listType, 
    onLoadMore,
    isLoadingMore,
    hasMore 
}) => {
    
    const renderItem = ({ item }: { item: TranslationItem }) => (
        <TouchableOpacity 
            style={styles.itemContainer}
            onPress={() => onItemPress && onItemPress(item)}
            activeOpacity={onItemPress ? 0.7 : 1}
        >
            <LinearGradient
                colors={['#FFFFFF', '#F8F9FA']}
                style={styles.cardGradient}
            >
                <View style={styles.textContainer}>
                    <View style={styles.languageHeader}>
                        <View style={styles.languageTag}>
                            <Text style={styles.languageCode}>{item.sourceLang.toUpperCase()}</Text>
                        </View>
                        <Ionicons name="arrow-forward" size={16} color="#FF6B35" />
                        <View style={styles.languageTag}>
                            <Text style={styles.languageCode}>{item.targetLang.toUpperCase()}</Text>
                        </View>
                    </View>
                    
                    <Text style={styles.originalText}>{item.originalText}</Text>
                    <Text style={styles.translatedText}>{item.translatedText}</Text>
                    <Text style={styles.timestamp}>{new Date(item.timestamp).toLocaleString()}</Text>
                </View>
                
                <View style={styles.actionsContainer}>
                    {/* Save/Bookmark Icon */}
                    {onToggleSave && (
                        <TouchableOpacity 
                            onPress={() => onToggleSave(item)} 
                            style={[styles.iconButton, styles.saveButton]}
                        >
                            <Ionicons 
                                name={item.isSaved ? "bookmark" : "bookmark-outline"} 
                                size={22} 
                                color={item.isSaved ? "#FF6B35" : "#BDC3C7"} 
                            />
                        </TouchableOpacity>
                    )}
                    
                    {/* Favorite/Heart Icon */}
                    {onToggleSave && (listType === 'history') && (
                        <TouchableOpacity 
                            onPress={() => onToggleSave(item)} 
                            style={[styles.iconButton, styles.favoriteButton]}
                        >
                            <Ionicons 
                                name={item.isSaved ? "heart" : "heart-outline"} 
                                size={22} 
                                color={item.isSaved ? "#E74C3C" : "#BDC3C7"} 
                            />
                        </TouchableOpacity>
                    )}
                    
                    {/* Delete Icon */}
                    {onDeleteItem && (
                        <TouchableOpacity 
                            onPress={() => {
                                const title = listType === 'history' ? 'Delete History Item' : 'Remove Saved Item';
                                const message = listType === 'history' 
                                    ? 'Are you sure you want to delete this item from history?' 
                                    : 'Are you sure you want to remove this item from your saved list?';
                                const buttonText = listType === 'history' ? 'Delete' : 'Remove';
                                
                                Alert.alert(
                                    title,
                                    message,
                                    [
                                        { text: 'Cancel', style: 'cancel' },
                                        { text: buttonText, onPress: () => onDeleteItem(item.id), style: 'destructive' },
                                    ]
                                );
                            }} 
                            style={[styles.iconButton, styles.deleteButton]}
                        >
                            <Ionicons name="trash-outline" size={20} color="#E74C3C" />
                        </TouchableOpacity>
                    )}
                </View>
            </LinearGradient>
        </TouchableOpacity>
    );

    const renderFooter = () => {
        if (!isLoadingMore && !hasMore && items.length > 0 && listType === 'history') {
             return <Text style={styles.footerText}>End of history.</Text>;
        }
        if (!isLoadingMore) return null;
        return (
            <View style={styles.footerLoadingContainer}>
                <ActivityIndicator size="small" color="#FF6B35" />
            </View>
        );
    };

    if (items.length === 0 && !isLoadingMore) {
        return (
            <View style={styles.emptyContainer}>
                <Ionicons 
                    name={listType === 'history' ? 'time-outline' : 'bookmark-outline'} 
                    size={64} 
                    color="#BDC3C7" 
                />
                <Text style={styles.emptyTitle}>
                    {listType === 'history' ? 'No History Yet' : 'No Saved Items'}
                </Text>
                <Text style={styles.emptyText}>
                    {listType === 'history' 
                        ? 'Your translation history will appear here' 
                        : 'Save translations to access them quickly'}
                </Text>
            </View>
        );
    }

    return (
        <FlatList
            data={items}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContentContainer}
            onEndReached={onLoadMore}
            onEndReachedThreshold={0.5}
            ListFooterComponent={renderFooter}
            showsVerticalScrollIndicator={false}
        />
    );
};

const styles = StyleSheet.create({
    itemContainer: {
        marginBottom: 12,
        borderRadius: 16,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    cardGradient: {
        padding: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    textContainer: {
        flex: 1,
        marginRight: 12,
    },
    languageHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    languageTag: {
        backgroundColor: '#FF6B35',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        marginHorizontal: 4,
    },
    languageCode: {
        color: 'white',
        fontSize: 12,
        fontWeight: '600',
    },
    originalText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#2C3E50',
        marginBottom: 8,
        lineHeight: 22,
    },
    translatedText: {
        fontSize: 15,
        color: '#34495E',
        marginBottom: 8,
        lineHeight: 20,
    },
    timestamp: {
        fontSize: 12,
        color: '#95A5A6',
        fontStyle: 'italic',
    },
    actionsContainer: {
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-start',
    },
    iconButton: {
        padding: 8,
        borderRadius: 20,
        marginVertical: 2,
        backgroundColor: '#F8F9FA',
        borderWidth: 1,
        borderColor: '#E9ECEF',
    },
    saveButton: {
        backgroundColor: '#FFF3E0',
        borderColor: '#FFB366',
    },
    favoriteButton: {
        backgroundColor: '#FFEBEE',
        borderColor: '#FFCDD2',
    },
    deleteButton: {
        backgroundColor: '#FFEBEE',
        borderColor: '#FFCDD2',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: '#7F8C8D',
        marginTop: 16,
        marginBottom: 8,
    },
    emptyText: {
        fontSize: 16,
        color: '#95A5A6',
        textAlign: 'center',
        lineHeight: 22,
    },
    listContentContainer: {
        padding: 16,
    },
    footerLoadingContainer: {
        paddingVertical: 20,
        alignItems: 'center',
    },
    footerText: {
        textAlign: 'center',
        paddingVertical: 20,
        color: '#95A5A6',
        fontSize: 14,
        fontStyle: 'italic',
    },
});

export default TranslationList;