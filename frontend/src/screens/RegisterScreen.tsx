import React, { useState } from 'react';
import { View, Text, StyleSheet, Button, TextInput, Alert } from 'react-native';
import { useAuth } from '../context/AuthContext';

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
        <View style={styles.container}>
            <Text style={styles.title}>Register Screen</Text>
            <TextInput
                style={styles.input}
                placeholder="Username"
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
            />
            <TextInput
                style={styles.input}
                placeholder="Email"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
            />
            <TextInput
                style={styles.input}
                placeholder="Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
            />
            <Button title={isLoading ? "Registering..." : "Register"} onPress={handleSignUp} disabled={isLoading} />
            <Button title="Go to Login" onPress={() => navigation.navigate('Login')} disabled={isLoading} />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
    },
    input: {
        width: '100%',
        borderWidth: 1,
        borderColor: '#ddd',
        padding: 10,
        marginBottom: 15,
        borderRadius: 5,
    },
});

export default RegisterScreen; 