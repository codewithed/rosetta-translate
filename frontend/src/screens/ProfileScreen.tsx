import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView, TextInput, ActivityIndicator, Switch, Modal, FlatList } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { UserPreferenceData } from '../services/apiService';
import { SUPPORTED_LANGUAGES, Language } from '../constants/languages'; // Import SUPPORTED_LANGUAGES and Language
import theme from '../constants/theme'; // Assuming you have a theme file for consistent styling

// Re-defining LanguageSelectionModal here or import it if it's in a separate file
// For this example, I'll put it here for completeness, but ideally, it's a shared component.
const LanguageSelectionModal: React.FC<{
    visible: boolean;
    onClose: () => void;
    onSelectLanguage: (language: Language) => void;
    languages: Language[];
}> = ({ visible, onClose, onSelectLanguage, languages }) => {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredLanguages = languages.filter(lang =>
        lang.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lang.code.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const renderItem = ({ item }: { item: Language }) => (
        <TouchableOpacity
            style={modalStyles.modalLanguageItem}
            onPress={() => {
                onSelectLanguage(item);
                onClose();
            }}
        >
            <Text style={modalStyles.modalLanguageText}>{item.name} ({item.code.toUpperCase()})</Text>
        </TouchableOpacity>
    );

    return (
        <Modal
            animationType="slide"
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
        >
            <View style={modalStyles.modalOverlay}>
                <View style={modalStyles.modalContent}>
                    <TextInput
                        style={modalStyles.modalSearchInput}
                        placeholder="Search language..."
                        value={searchTerm}
                        onChangeText={setSearchTerm}
                    />
                    <FlatList
                        data={filteredLanguages}
                        renderItem={renderItem}
                        keyExtractor={(item) => item.code}
                        initialNumToRender={15}
                        maxToRenderPerBatch={10}
                        windowSize={10}
                    />
                    <TouchableOpacity onPress={onClose} style={modalStyles.modalCloseButton}>
                        <Text style={modalStyles.modalCloseButtonText}>Close</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
};


const ProfileScreen: React.FC = () => {
    const { user, logout, updateUserProfile, isLoading: authIsLoading } = useAuth();

    const [preferredSourceLang, setPreferredSourceLang] = useState('');
    const [preferredTargetLang, setPreferredTargetLang] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    // State for language selection modal
    const [isLanguageModalVisible, setIsLanguageModalVisible] = useState(false);
    const [languageModalType, setLanguageModalType] = useState<'source' | 'target' | null>(null);

    useEffect(() => {
        if (user) {
            setPreferredSourceLang(user.preferences?.preferredSourceLang || '');
            setPreferredTargetLang(user.preferences?.preferredTargetLang || '');

            const currentSettingsString = user.settings || '{}';
            try {
                const parsedSettings = JSON.parse(currentSettingsString);

            } catch (e) {
                console.warn("Failed to parse user settings JSON", e);
            }
        }
    }, [user]);

    const handleLogout = async () => {
        Alert.alert(
            "Logout",
            "Are you sure you want to log out?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Logout",
                    onPress: async () => {
                        await logout();
                    },
                    style: "destructive"
                }
            ]
        );
    };

    const handleSelectLanguage = (language: Language) => {
        if (languageModalType === 'source') {
            setPreferredSourceLang(language.code);
        } else if (languageModalType === 'target') {
            setPreferredTargetLang(language.code);
        }
        setIsLanguageModalVisible(false);
    };

    const handleSaveChanges = async () => {
        if (!user) return;
        setIsSaving(true);

        const currentParsedSettings = user.settings ? JSON.parse(user.settings) : {};
        const finalSettingsJson = JSON.stringify(currentParsedSettings, null, 2);

        const profileData: { preferences: UserPreferenceData, settings?: string } = {
            preferences: {
                preferredSourceLang: preferredSourceLang.trim() || null,
                preferredTargetLang: preferredTargetLang.trim() || null,
            },
            settings: finalSettingsJson,
        };

        try {
            await updateUserProfile(profileData);
        } catch (error) {
            // Error handling in AuthContext
        } finally {
            setIsSaving(false);
        }
    };

    const getLanguageName = (code: string) => {
        const lang = SUPPORTED_LANGUAGES.find(l => l.code === code);
        return lang ? `${lang.name} (${lang.code.toUpperCase()})` : code;
    };

    if (authIsLoading && !user) {
        return (
            <View style={styles.centeredLoadingContainer}>
                <ActivityIndicator size="large" color="#FF6B35" />
                <Text style={styles.loadingText}>Loading profile...</Text>
            </View>
        );
    }

    return (
        <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">

            {user ? (
                <View style={styles.contentContainer}>
                    <View style={styles.sectionCard}>
                        <Text style={styles.sectionTitle}>Account Information</Text>
                        <View style={styles.infoRow}>
                            <Ionicons name="person-outline" size={20} color="#FF6B35" />
                            <Text style={styles.label}>Username:</Text>
                            <Text style={styles.infoTextValue}>{user.username}</Text>
                        </View>
                        <View style={styles.infoRow}>
                            <Ionicons name="mail-outline" size={20} color="#FF6B35" />
                            <Text style={styles.label}>Email:</Text>
                            <Text style={styles.infoTextValue}>{user.email}</Text>
                        </View>
                    </View>

                    <View style={styles.sectionCard}>
                        <Text style={styles.sectionTitle}>Preferences</Text>

                        <View style={styles.inputContainer}>
                            <Text style={styles.inputLabel}>Preferred Source Language</Text>
                            <TouchableOpacity
                                style={styles.languageSelectButton}
                                onPress={() => { setLanguageModalType('source'); setIsLanguageModalVisible(true); }}
                                disabled={isSaving || authIsLoading}
                            >
                                <Text style={styles.languageSelectButtonText}>
                                    {preferredSourceLang ? getLanguageName(preferredSourceLang) : 'Select Language'}
                                </Text>
                                <Ionicons name="chevron-forward" size={20} color="#7F8C8D" />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.inputContainer}>
                            <Text style={styles.inputLabel}>Preferred Target Language</Text>
                            <TouchableOpacity
                                style={styles.languageSelectButton}
                                onPress={() => { setLanguageModalType('target'); setIsLanguageModalVisible(true); }}
                                disabled={isSaving || authIsLoading}
                            >
                                <Text style={styles.languageSelectButtonText}>
                                    {preferredTargetLang ? getLanguageName(preferredTargetLang) : 'Select Language'}
                                </Text>
                                <Ionicons name="chevron-forward" size={20} color="#7F8C8D" />
                            </TouchableOpacity>
                        </View>


                        <TouchableOpacity
                            style={[styles.saveButton, (isSaving || authIsLoading) && styles.saveButtonDisabled]}
                            onPress={handleSaveChanges}
                            disabled={isSaving || authIsLoading}
                        >
                            <LinearGradient
                                colors={['#FF6B35', '#F7931E']}
                                style={styles.saveButtonGradient}
                            >
                                <Text style={styles.saveButtonText}>
                                    {isSaving ? "Saving..." : "Save Changes"}
                                </Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                </View>
            ) : (
                !authIsLoading && <Text style={styles.errorText}>User data not available. Please try logging in again.</Text>
            )}

            <TouchableOpacity
                style={styles.logoutButton}
                onPress={handleLogout}
                disabled={authIsLoading || isSaving}
            >
                <Ionicons name="log-out-outline" size={20} color="#FF3B30" />
                <Text style={styles.logoutButtonText}>
                    {authIsLoading ? "Loading..." : "Logout"}
                </Text>
            </TouchableOpacity>

            <LanguageSelectionModal
                visible={isLanguageModalVisible}
                onClose={() => setIsLanguageModalVisible(false)}
                onSelectLanguage={handleSelectLanguage}
                languages={SUPPORTED_LANGUAGES}
            />
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F9FA',
    },
    headerGradient: {
        paddingTop: 60,
        paddingBottom: 30,
        paddingHorizontal: 20,
    },
    profileHeader: {
        alignItems: 'center',
    },
    avatarContainer: {
        marginBottom: 15,
    },
    profileTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: 'white',
        textAlign: 'center',
    },
    contentContainer: {
        padding: 20,
        marginTop: 20,
    },
    sectionCard: {
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 20,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: '#2C3E50',
        marginBottom: 20,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    label: {
        fontSize: 16,
        color: '#7F8C8D',
        marginLeft: 12,
        flex: 1,
    },
    infoTextValue: {
        fontSize: 15,
        color: '#2C3E50',
        fontWeight: '500',
        flex: 2,
        textAlign: 'right',
    },
    inputContainer: {
        marginBottom: 20,
    },
    inputLabel: {
        fontSize: 16,
        fontWeight: '500',
        color: '#2C3E50',
        marginBottom: 8,
    },
    modernInput: { // This style is no longer directly used for the input, but kept in case
        borderWidth: 1,
        borderColor: '#E0E0E0',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 16,
        backgroundColor: '#FAFAFA',
        color: '#2C3E50',
    },
    languageSelectButton: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E0E0E0',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#FAFAFA',
        minHeight: 48,
    },
    languageSelectButtonText: {
        fontSize: 16,
        color: '#2C3E50',
        flex: 1,
    },
    settingRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    settingInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    settingLabel: {
        fontSize: 16,
        color: '#2C3E50',
        marginLeft: 12,
        fontWeight: '500',
    },
    saveButton: {
        marginTop: 20,
        borderRadius: 12,
        overflow: 'hidden',
    },
    saveButtonDisabled: {
        opacity: 0.6,
    },
    saveButtonGradient: {
        paddingVertical: 16,
        alignItems: 'center',
    },
    saveButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'white',
        marginHorizontal: 20,
        marginBottom: 40,
        paddingVertical: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#FF3B30',
    },
    logoutButtonText: {
        color: '#FF3B30',
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 8,
    },
    centeredLoadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F8F9FA',
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        color: '#7F8C8D',
    },
    errorText: {
        fontSize: 16,
        color: '#E74C3C',
        textAlign: 'center',
        margin: 20,
    },
});

// Styles for LanguageSelectionModal (can be moved to a shared styles file)
const modalStyles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        backgroundColor: 'white', // Use theme.colors.white if available
        borderRadius: 16, // Use theme.borders.radiusLarge if available
        padding: 20, // Use theme.spacing.lg if available
        width: '90%',
        maxHeight: '80%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },
    modalSearchInput: {
        borderWidth: 1,
        borderColor: '#C0C0C0', // Use theme.colors.mediumGray if available
        borderRadius: 8, // Use theme.borders.radiusSmall if available
        paddingHorizontal: 16, // Use theme.spacing.md if available
        paddingVertical: 12, // Use theme.spacing.sm if available
        marginBottom: 16, // Use theme.spacing.md if available
        fontSize: 16,
    },
    modalLanguageItem: {
        paddingVertical: 12, // Use theme.spacing.md if available
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0', // Use theme.colors.lightGray if available
    },
    modalLanguageText: {
        fontSize: 16,
        color: '#2C3E50', // Use theme.colors.darkGray if available
    },
    modalCloseButton: {
        marginTop: 16, // Use theme.spacing.md if available
        backgroundColor: '#FF6B35', // Use theme.colors.primaryOrange if available
        paddingVertical: 12, // Use theme.spacing.sm if available
        borderRadius: 8, // Use theme.borders.radiusMedium if available
        alignItems: 'center',
    },
    modalCloseButtonText: {
        color: 'white', // Use theme.colors.white if available
        fontSize: 16,
        fontWeight: '600',
    },
});


export default ProfileScreen;
