import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { View, ActivityIndicator, StyleSheet, Text, Image } from 'react-native'; // Added Image
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

// Screens
import HomeScreen from '../screens/HomeScreen';
import ConversationScreen from '../screens/ConversationScreen';
import SavedScreen from '../screens/SavedScreen';
import HistoryScreen from '../screens/HistoryScreen';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import ProfileScreen from '../screens/ProfileScreen';

import { useAuth } from '../context/AuthContext';
import theme from '../constants/theme';

export type AuthStackParamList = {
    Login: undefined;
    Register: undefined;
};

export type MainTabsParamList = {
    Home: undefined;
    Conversation: undefined;
    Saved: undefined;
    History: undefined;
    Profile: undefined;
};

const AuthStackNav = createStackNavigator<AuthStackParamList>();
const MainTabsNav = createBottomTabNavigator<MainTabsParamList>();

const AuthFlow = () => (
    <AuthStackNav.Navigator
        screenOptions={{
            headerStyle: { backgroundColor: theme.colors.primaryOrange },
            headerTintColor: theme.colors.headerTintColor,
            headerTitleStyle: { fontWeight: 'bold' },
        }}
    >
        <AuthStackNav.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
        <AuthStackNav.Screen name="Register" component={RegisterScreen} options={{ title: 'Create Account' }} />
    </AuthStackNav.Navigator>
);

const CustomHeader = ({ title, showLogo = false }: { title: string; showLogo?: boolean }) => (
    <LinearGradient
        colors={['#FF6B35', '#F7931E']}
        style={styles.headerGradient}
    >
        <View style={styles.headerContent}>
            {showLogo && (
                <View style={styles.logoContainer}>
                    <Image 
                        source={require('../../assets/icon.png')} 
                        style={styles.headerLogo} 
                    />
                </View>
            )}
            <Text style={styles.headerTitle}>{title}</Text>
        </View>
    </LinearGradient>
);

const MainAppTabs = () => (
    <MainTabsNav.Navigator
        screenOptions={({ route }) => ({
            tabBarIcon: ({ focused, color, size }) => {
                let iconName: keyof typeof Ionicons.glyphMap = 'alert-circle';
                if (route.name === 'Home') iconName = focused ? 'home' : 'home-outline';
                else if (route.name === 'Conversation') iconName = focused ? 'chatbubbles' : 'chatbubbles-outline';
                else if (route.name === 'Saved') iconName = focused ? 'bookmark' : 'bookmark-outline';
                else if (route.name === 'History') iconName = focused ? 'time' : 'time-outline';
                else if (route.name === 'Profile') iconName = focused ? 'person-circle' : 'person-circle-outline';
                return <Ionicons name={iconName} size={size} color={color} />;
            },
            tabBarActiveTintColor: '#FF6B35',
            tabBarInactiveTintColor: '#95A5A6',
            tabBarStyle: { 
                backgroundColor: 'white', 
                borderTopWidth: 0,
                elevation: 10,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: -2 },
                shadowOpacity: 0.1,
                shadowRadius: 8,
                height: 60,
            },
            tabBarLabelStyle: {
                fontSize: 12,
                fontWeight: '500',
            },
            headerShown: true,
        })}
    >
        <MainTabsNav.Screen 
            name="Home" 
            component={HomeScreen} 
            options={{
                header: () => <CustomHeader title="Rosetta Translate" showLogo={true} />
            }}
        />
        <MainTabsNav.Screen 
            name="Conversation" 
            component={ConversationScreen} 
            options={{
                header: () => <CustomHeader title="Conversation Mode" />
            }}
        />
        <MainTabsNav.Screen 
            name="Saved" 
            component={SavedScreen}
            options={{
                header: () => <CustomHeader title="Saved Items" />
            }}
        />
        <MainTabsNav.Screen 
            name="History" 
            component={HistoryScreen}
            options={{
                header: () => <CustomHeader title="History" />
            }}
        />
        <MainTabsNav.Screen 
            name="Profile" 
            component={ProfileScreen}
            options={{
                header: () => <CustomHeader title="Profile" />
            }}
        />
    </MainTabsNav.Navigator>
);

const styles = StyleSheet.create({
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F8F9FA',
    },
    headerGradient: {
        paddingTop: 50,
        paddingBottom: 12,
        paddingHorizontal: 16,
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-start',
    },
    logoContainer: {
        marginRight: 12,
    },
    headerLogo: { // Added style for the logo image
        width: 40, 
        height: 40,
        borderRadius: 6,
        marginRight: 60,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: 'white',
        textAlign: 'center',
    },
});

const AppNavigator: React.FC = () => {
    const { token, isLoading } = useAuth();

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#FF6B35" />
                <Text style={{ marginTop: 16, color: '#7F8C8D' }}>Loading...</Text>
            </View>
        );
    }

    return (
        <NavigationContainer>
            {token == null ? <AuthFlow /> : <MainAppTabs />}
        </NavigationContainer>
    );
};

export default AppNavigator;