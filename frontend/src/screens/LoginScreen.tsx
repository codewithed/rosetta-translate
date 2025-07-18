import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { Image } from 'react-native';

type LoginScreenProps = {
    navigation: any;
};

const LoginScreen: React.FC<LoginScreenProps> = ({ navigation }) => {
    const { login } = useAuth();
    const [usernameOrEmail, setUsernameOrEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleLogin = async () => {
        if (!usernameOrEmail || !password) {
            Alert.alert('Validation Error', 'Please enter username/email and password.');
            return;
        }
        setIsLoading(true);
        try {
            await login({ usernameOrEmail, password });
        } catch (error) {
            console.log("Login screen caught error");
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

                    {/* Login Title */}
                    <Text style={styles.loginTitle}>Sign in</Text>

                    {/* Login Form */}
                    <View style={styles.formContainer}>
                        <View style={styles.inputContainer}>
                            <Ionicons name="person-outline" size={20} color="#7F8C8D" style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder="Username or Email"
                                placeholderTextColor="#95A5A6"
                                value={usernameOrEmail}
                                onChangeText={setUsernameOrEmail}
                                autoCapitalize="none"
                                keyboardType="email-address"
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
                            style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
                            onPress={handleLogin}
                            disabled={isLoading}
                        >
                            <LinearGradient
                                colors={['#2C3E50', '#34495E']}
                                style={styles.loginButtonGradient}
                            >
                                <Text style={styles.loginButtonText}>
                                    {isLoading ? "Signing in..." : "Sign in"}
                                </Text>
                            </LinearGradient>
                        </TouchableOpacity>

                        <TouchableOpacity 
                            style={styles.registerButton}
                            onPress={() => navigation.navigate('Register')}
                            disabled={isLoading}
                        >
                            <Text style={styles.registerButtonText}>Sign up</Text>
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
    logoText: {
        fontSize: 32,
        fontWeight: 'bold',
        color: 'white',
        textAlign: 'center',
    },
    logoSubtext: {
        fontSize: 18,
        color: 'rgba(255, 255, 255, 0.9)',
        textAlign: 'center',
        marginTop: 4,
    },
    loginTitle: {
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
    loginButton: {
        marginTop: 8,
        marginBottom: 16,
        borderRadius: 12,
        overflow: 'hidden',
    },
    loginButtonDisabled: {
        opacity: 0.7,
    },
    loginButtonGradient: {
        paddingVertical: 16,
        alignItems: 'center',
    },
    loginButtonText: {
        color: 'white',
        fontSize: 18,
        fontWeight: '600',
    },
    registerButton: {
        paddingVertical: 16,
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.3)',
    },
    registerButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '500',
    },
});

export default LoginScreen;