import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView, TextInput, ActivityIndicator, Switch } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { UserPreferenceData } from '../services/apiService';

const ProfileScreen: React.FC = () => {
    const { user, logout, updateUserProfile, isLoading: authIsLoading } = useAuth();

    const [preferredSourceLang, setPreferredSourceLang] = useState('');
    const [preferredTargetLang, setPreferredTargetLang] = useState('');
    const [isSaving, setIsSaving] = useState(false);

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
                            <TextInput
                                style={styles.modernInput}
                                value={preferredSourceLang}
                                onChangeText={setPreferredSourceLang}
                                placeholder="e.g., en-US or auto"
                                editable={!isSaving && !authIsLoading}
                                autoCapitalize="none"
                            />
                        </View>

                        <View style={styles.inputContainer}>
                            <Text style={styles.inputLabel}>Preferred Target Language</Text>
                            <TextInput
                                style={styles.modernInput}
                                value={preferredTargetLang}
                                onChangeText={setPreferredTargetLang}
                                placeholder="e.g., es-ES or fr-FR"
                                editable={!isSaving && !authIsLoading}
                                autoCapitalize="none"
                            />
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
    modernInput: {
        borderWidth: 1,
        borderColor: '#E0E0E0',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 16,
        backgroundColor: '#FAFAFA',
        color: '#2C3E50',
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

export default ProfileScreen;