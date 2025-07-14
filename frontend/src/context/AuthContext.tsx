import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as apiService from '../services/apiService';
import { Alert } from 'react-native';

// Define the shape of the auth context state
interface AuthContextType {
    isAuthenticated: boolean;
    user: apiService.UserProfile | null; // Use UserProfile type
    token: string | null;
    isLoading: boolean;
    login: (credentials: apiService.LoginRequest) => Promise<void>;
    signUp: (userData: apiService.SignUpRequest) => Promise<void>;
    logout: () => Promise<void>;
    updateUserProfile: (profileData: apiService.UserProfileUpdateRequest) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [user, setUser] = useState<apiService.UserProfile | null>(null); // Use UserProfile type
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);

    useEffect(() => {
        // Load token from storage on app start
        const bootstrapAsync = async () => {
            let userToken: string | null = null;
            try {
                userToken = await AsyncStorage.getItem('userToken');
            } catch (e) {
                // Restoring token failed
                console.error('Failed to load token from storage', e);
            }
            if (userToken) {
                setToken(userToken);
                apiService.setAuthToken(userToken);
                try {
                    const profile = await apiService.getUserProfile();
                    setUser(profile);
                } catch (e: any) {
                    console.log('Failed to fetch user profile on bootstrap', e);
                    // Check if the error is due to an expired token
                    if (e.response?.data?.message?.includes('expired')) {
                        console.log('Session expired, logging out.');
                        await handleLogout(); // Silently log out
                    } else {
                        // For other errors, you might still want to log out but maybe also alert
                        await handleLogout(); // Clear invalid token and user state
                    }
                }
            }
            setIsLoading(false);
        };

        bootstrapAsync();
    }, []);

    const handleLogin = async (credentials: apiService.LoginRequest) => {
        try {
            const response = await apiService.login(credentials);
            // Tentatively set token for current session
            setToken(response.accessToken);
            apiService.setAuthToken(response.accessToken);

            try {
                await AsyncStorage.setItem('userToken', response.accessToken);
            } catch (storageError) {
                console.error('Failed to save token to AsyncStorage', storageError);
                // Revert token state if AsyncStorage failed
                setToken(null);
                apiService.setAuthToken(null);
                Alert.alert('Login Partially Failed', 'Could not save session for next time.');
                throw storageError; // Re-throw to indicate login persistence failed
            }

            // Fetch profile after successful login and token persistence
            try {
                const profile = await apiService.getUserProfile();
                setUser(profile);
            } catch (e: any) {
                console.error('Failed to fetch user profile after login', e);
                setUser(null); 
                if (e.response?.data?.message?.includes('expired')) {
                    Alert.alert('Session Expired', 'Your session has expired. Please log in again.');
                    await handleLogout();
                } else {
                    Alert.alert('Login Succeeded', 'Session saved, but could not fetch user profile.');
                }
            }
        } catch (error: any) {
            console.error('Login failed', error);
            // Ensure token is cleared if any part of login failed after it was set
            setToken(null);
            apiService.setAuthToken(null);
            // No need to clear AsyncStorage here if setItem itself failed and threw
            Alert.alert('Login Failed', error.response?.data?.message || 'An unexpected error occurred.');
            throw error; // Re-throw to allow UI to handle it
        }
    };

    const handleSignUp = async (userData: apiService.SignUpRequest) => {
        try {
            const response = await apiService.signUp(userData);
            if (response.success) {
                Alert.alert('Registration Successful', 'You can now log in.');
                // Optionally, log the user in directly or navigate to login
            } else {
                Alert.alert('Registration Failed', response.message || 'An unexpected error occurred.');
            }
        } catch (error: any) {
            console.error('Sign up failed', error);
            Alert.alert('Sign Up Failed', error.response?.data?.message || 'An unexpected error occurred.');
            throw error;
        }
    };

    const handleLogout = async () => {
        try {
            await apiService.logout(); // Call API logout first
        } catch (apiError) {
            console.error('API logout failed', apiError);
            // Continue with local logout even if API call fails
        }
        setToken(null);
        setUser(null);
        apiService.setAuthToken(null);
        try {
            await AsyncStorage.removeItem('userToken');
        } catch (e) {
            console.error('Failed to remove token from AsyncStorage during logout', e);
            // The user is logged out from the app's perspective, 
            // but the token might remain in storage. This is a minor issue.
        }
    };

    const handleUpdateUserProfile = async (profileData: apiService.UserProfileUpdateRequest) => {
        if (!token) {
            Alert.alert("Error", "You must be logged in to update your profile.");
            throw new Error("Not authenticated");
        }
        setIsLoading(true);
        try {
            const updatedProfile = await apiService.updateUserProfile(profileData);
            setUser(updatedProfile); // Update user state in context
            Alert.alert("Success", "Profile updated successfully.");
        } catch (error: any) {
            console.error('Failed to update user profile', error);
            Alert.alert('Update Failed', error.response?.data?.message || 'An unexpected error occurred.');
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AuthContext.Provider value={{
            isAuthenticated: !!token,
            user,
            token,
            isLoading,
            login: handleLogin,
            signUp: handleSignUp,
            logout: handleLogout,
            updateUserProfile: handleUpdateUserProfile,
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};