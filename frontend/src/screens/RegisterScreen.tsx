import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { Image } from 'react-native';

// TODO: Update navigation type when it's set up
type RegisterScreenProps = {
    navigation: any; // Replace 'any' with actual navigation prop type
};

const RegisterScreen: React.FC<RegisterScreenProps> = ({ navigation }) => {
    const { signUp } = useAuth();
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleSignUp = async () => {
        if (!username || !email || !password) {
            Alert.alert('Validation Error', 'Please fill in all fields.');
            return;
        }
        setIsLoading(true);
        try {
            await signUp({ username, email, password });
            // Alert for success/failure is handled in AuthContext
            // Optionally navigate to login or show success message here
            navigation.navigate('Login'); // Navigate to login after successful sign up message
        } catch (error) {
            // Error is already alerted in AuthContext
            console.log("Register screen caught error");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView 
            style={styles.container} 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <LinearGradient
                colors={['#FF6B35', '#F7931E']}
                style={styles.backgroundGradient}
            >
                <View style={styles.contentContainer}>
                    {/* Logo */}
                    <View style={styles.logoContainer}>
                        <Image 
                            source={require('../../assets/icon.png')} 
                            style={styles.logoImage} 
                        />
                    </View>

                    {/* Sign Up Title */}
                    <Text style={styles.signUpTitle}>Sign up</Text>

                    {/* Sign Up Form */}
                    <View style={styles.formContainer}>
                        <View style={styles.inputContainer}>
                            <Ionicons name="person-outline" size={20} color="#7F8C8D" style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder="Username"
                                placeholderTextColor="#95A5A6"
                                value={username}
                                onChangeText={setUsername}
                                autoCapitalize="none"
                            />
                        </View>

                        <View style={styles.inputContainer}>
                            <Ionicons name="mail-outline" size={20} color="#7F8C8D" style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder="Email"
                                placeholderTextColor="#95A5A6"
                                value={email}
                                onChangeText={setEmail}
                                keyboardType="email-address"
                                autoCapitalize="none"
                            />
                        </View>

                        <View style={styles.inputContainer}>
                            <Ionicons name="lock-closed-outline" size={20} color="#7F8C8D" style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder="Password"
                                placeholderTextColor="#95A5A6"
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry={!showPassword}
                            />
                            <TouchableOpacity 
                                onPress={() => setShowPassword(!showPassword)}
                                style={styles.eyeIcon}
                            >
                                <Ionicons 
                                    name={showPassword ? "eye-outline" : "eye-off-outline"} 
                                    size={20} 
                                    color="#7F8C8D" 
                                />
                            </TouchableOpacity>
                        </View>

                        <TouchableOpacity 
                            style={[styles.signUpButton, isLoading && styles.signUpButtonDisabled]}
                            onPress={handleSignUp}
                            disabled={isLoading}
                        >
                            <LinearGradient
                                colors={['#2C3E50', '#34495E']}
                                style={styles.signUpButtonGradient}
                            >
                                <Text style={styles.signUpButtonText}>
                                    {isLoading ? "Signing up..." : "Sign up"}
                                </Text>
                            </LinearGradient>
                        </TouchableOpacity>

                        <TouchableOpacity 
                            style={styles.loginButton}
                            onPress={() => navigation.navigate('Login')}
                            disabled={isLoading}
                        >
                            <Text style={styles.loginButtonText}>Sign in</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </LinearGradient>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    backgroundGradient: {
        flex: 1,
    },
    contentContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 32,
    },
    logoContainer: {
        alignItems: 'center',
        marginBottom: 40,
    },
    logoImage: {
        width: 120,
        height: 120,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    signUpTitle: {
        fontSize: 28,
        fontWeight: '600',
        color: 'white',
        marginBottom: 32,
        textAlign: 'center',
    },
    formContainer: {
        width: '100%',
        maxWidth: 320,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'white',
        borderRadius: 12,
        marginBottom: 16,
        paddingHorizontal: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    inputIcon: {
        marginRight: 12,
    },
    input: {
        flex: 1,
        paddingVertical: 16,
        fontSize: 16,
        color: '#2C3E50',
    },
    eyeIcon: {
        padding: 4,
    },
    signUpButton: {
        marginTop: 8,
        marginBottom: 16,
        borderRadius: 12,
        overflow: 'hidden',
    },
    signUpButtonDisabled: {
        opacity: 0.7,
    },
    signUpButtonGradient: {
        paddingVertical: 16,
        alignItems: 'center',
    },
    signUpButtonText: {
        color: 'white',
        fontSize: 18,
        fontWeight: '600',
    },
    loginButton: {
        paddingVertical: 16,
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.3)',
    },
    loginButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '500',
    },
});

export default RegisterScreen;