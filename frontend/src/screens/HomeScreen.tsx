import React, { useState, useEffect } from 'react';
import { View, Text, TextInput as RNTextInput, Button, TouchableOpacity, StyleSheet, ScrollView, Alert, KeyboardAvoidingView, Platform, Image, Modal, FlatList, ActivityIndicator } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { Ionicons } from '@expo/vector-icons';
import {
    translateText, textToSpeech, ocr, speechToText, ApiResponse,
    createTranslation as apiCreateTranslation,
    toggleFavoriteTranslation as apiToggleFavoriteTranslation,
    createSavedItem as apiCreateSavedItem,
    SavedItemCategory,
    TranslationResponse as ApiTranslationResponse,
} from '../services/apiService';
import {
    addHistoryItem, saveTranslation, unsaveTranslation,
    TranslationItem as LocalTranslationItem
} from '../utils/storage';
import { InputType } from '../constants/enums';
import * as ImagePicker from 'expo-image-picker';
import { Camera, PermissionStatus as CameraPermissionStatus, PermissionResponse as CameraPermissionResponse } from 'expo-camera'; // Renamed to avoid conflict
import { useAudioRecorder, AudioModule, useAudioPlayer, useAudioPlayerStatus, AudioStatus, RecordingPresets } from 'expo-audio';
import { optionsForRecorder } from '../../config/recordingOptions.config';
import { useAuth } from '../context/AuthContext';
import theme from '../constants/theme';
import * as FileSystem from 'expo-file-system';
import { SUPPORTED_LANGUAGES, Language } from '../constants/languages';

const HomeScreen: React.FC = () => {
    const { user } = useAuth();
    const [currentPlaybackUri, setCurrentPlaybackUri] = useState<string | null>(null);
    const player = useAudioPlayer(currentPlaybackUri);
    const playerStatus = useAudioPlayerStatus(player);
    const [inputText, setInputText] = useState('');
    const [sourceLang, setSourceLang] = useState('en-US');
    const [targetLang, setTargetLang] = useState('es-ES');
    const [resultText, setResultText] = useState('');
    const [currentApiTranslation, setCurrentApiTranslation] = useState<ApiTranslationResponse | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [currentTranslationId, setCurrentTranslationId] = useState<string | null>(null);
    const [isFavorite, setIsFavorite] = useState(false);
    const [shouldPlayNextUri, setShouldPlayNextUri] = useState<boolean>(false);

    const handleCopyTranslatedText = async () => {
        console.log(`Attempting to copy translated text: "${resultText}"`);
        if (resultText && resultText.trim() !== '') {
            try {
                await Clipboard.setStringAsync(resultText);
                Alert.alert('Copied!', 'Translated text copied to clipboard.');
                console.log('Copy successful.');
            } catch (e) {
                console.error('Failed to copy translated text:', e);
                Alert.alert('Copy Failed', 'Could not copy text.');
            }
        } else {
            console.log('Nothing to copy.');
            Alert.alert('Nothing to Copy', 'There is no translated text to copy.');
        }
    };

    const handleCopyInputText = async () => {
        console.log(`Attempting to copy input text: "${inputText}"`);
        if (inputText && inputText.trim() !== '') {
            try {
                await Clipboard.setStringAsync(inputText);
                Alert.alert('Copied!');
                console.log('Copy successful.');
            } catch (e) {
                console.error('Failed to copy input text:', e);
                Alert.alert('Could not copy text.');
            }
        } else {
            console.log('Nothing to copy.');
            Alert.alert('Nothing to Copy', 'There is no input text to copy.');
        }
    };

    const audioRecorder = useAudioRecorder(optionsForRecorder);
    const [isRecording, setIsRecording] = useState(false);
    const [audioUri, setAudioUri] = useState<string | null>(null);

    const [selectedImage, setSelectedImage] = useState<ImagePicker.ImagePickerAsset | null>(null);

    const [isLanguageModalVisible, setIsLanguageModalVisible] = useState(false);
    const [languageModalType, setLanguageModalType] = useState<'source' | 'target' | null>(null);

    const handleSelectLanguage = (language: Language) => {
        if (languageModalType === 'source') {
            setSourceLang(language.code);
        } else if (languageModalType === 'target') {
            setTargetLang(language.code);
        }
        // Clear previous translation results as they are no longer valid for the new pair
        setResultText('');
        setCurrentApiTranslation(null);
        setIsLanguageModalVisible(false);
    };

    const handleSwapLanguages = () => {
        const currentSource = sourceLang;
        const currentTarget = targetLang;
        setSourceLang(currentTarget);
        setTargetLang(currentSource);
        // Clear previous translation results as they are no longer valid for the new pair
        setResultText('');
        setCurrentApiTranslation(null);
    };

    const handleImageOcrAndTranslate = async (imageAsset: ImagePicker.ImagePickerAsset) => {
        if (!imageAsset.uri) {
            Alert.alert('Error', 'Image URI is missing.');
            return;
        }
        setIsLoading(true);
        try {
            const response = await fetch(imageAsset.uri);
            const blob = await response.blob();
            const file = {
                uri: imageAsset.uri,
                name: imageAsset.fileName || imageAsset.uri.split('/').pop() || 'photo.jpg',
                type: imageAsset.mimeType || blob.type || 'image/jpeg',
            } as any;

            const ocrResponse: ApiResponse = await ocr(file);

            if (ocrResponse && ocrResponse.success) {
                // Assuming the OCR text is in ocrResponse.message for successful calls
                const extractedText = ocrResponse.message;
                setInputText(extractedText); 
                await handleTranslate(InputType.IMAGE, extractedText);
            } else {
                Alert.alert('OCR Failed', ocrResponse.message || 'Could not extract text from image.');
            }
        } catch (error: any) {
            console.error('Error during OCR or translation:', error);
            Alert.alert('Processing Error', error.message || 'Failed to process image.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        // Request camera permissions
        (async () => {
            try {
                const cameraPermission: CameraPermissionResponse = await Camera.requestCameraPermissionsAsync();
                if (cameraPermission.status !== CameraPermissionStatus.GRANTED) {
                    Alert.alert('Permissions Required', 'Camera permission is needed to take pictures for translation.');
                }
            } catch (err) {
                console.error('Failed to request camera permissions', err);
                Alert.alert('Permission Error', 'Could not request camera permissions.');
            }
        })();

        // Request audio recording permissions
        (async () => {
            try {
                const status = await AudioModule.requestRecordingPermissionsAsync();
                if (!status.granted) {
                    Alert.alert('Permissions Required', 'Microphone permission is needed to record audio for translation.');
                }
            } catch (err) {
                console.error('Failed to request audio permissions', err);
                Alert.alert('Error', 'Failed to request audio permission.');
            }
        })();

        if (user && user.preferences) {
            if (user.preferences.preferredSourceLang) {
                setSourceLang(user.preferences.preferredSourceLang);
            }
            if (user.preferences.preferredTargetLang) {
                setTargetLang(user.preferences.preferredTargetLang);
            }
        }
    }, [user]);

    const handleApiTranslationSuccess = async (
        original: string, 
        translated: string, 
        from: string, 
        to: string, 
        inputType: InputType
    ) => {
        try {
            const backendTranslation = await apiCreateTranslation({
                sourceText: original,
                targetText: translated,
                sourceLang: from,
                targetLang: to,
                inputType: inputType,
            });
            setCurrentApiTranslation(backendTranslation);
            setResultText(translated);
            setIsFavorite(backendTranslation.isFavorite);
            setCurrentTranslationId(backendTranslation.id);

            const localItem: Omit<LocalTranslationItem, 'id' | 'timestamp' | 'isSaved' | 'inputType'> = {
                originalText: backendTranslation.sourceText,
                translatedText: backendTranslation.targetText,
                sourceLang: backendTranslation.sourceLang,
                targetLang: backendTranslation.targetLang,
            };
            await addHistoryItem({
                ...localItem, 
                id: backendTranslation.id, 
                timestamp: new Date(backendTranslation.createdAt).getTime(), 
                isSaved: backendTranslation.isFavorite, 
                inputType: inputType
            });

        } catch (error: any) {
            console.error('Failed to save translation to backend', error);
            setResultText(translated);
            setCurrentApiTranslation(null);
            const fallbackLocalItem: Omit<LocalTranslationItem, 'id' | 'timestamp' | 'isSaved' | 'inputType'> = {
                originalText: original, translatedText: translated, sourceLang: from, targetLang: to
            };
            await addHistoryItem({ 
                ...fallbackLocalItem, 
                id: Date.now().toString(),
                timestamp: Date.now(),
                isSaved: false,
                inputType: inputType 
            });
            Alert.alert('Offline', 'Translation shown, but failed to save to your online history.');
        }
    };

    const handleTranslate = async (inputType: InputType, text: string) => {
        if (!text.trim()) {
            Alert.alert('Input Error', 'Please enter text to translate.');
            return;
        }
        setIsLoading(true);
        setCurrentApiTranslation(null);
        try {
            const response = await translateText({ text, sourceLang, targetLang });
            if (response.success && typeof response.message === 'string') {
                await handleApiTranslationSuccess(text, response.message, sourceLang, targetLang, inputType);
            } else {
                setResultText('');
                Alert.alert('Translation Error', response.message || 'Failed to translate text.');
            }
        } catch (error: any) {
            setResultText('');
            console.error('Translate API error', error);
            Alert.alert('API Error', error.response?.data?.message || error.message || 'An unexpected error occurred.');
        } finally {
            setIsLoading(false);
        }
    };

const handleTextToSpeech = async (textToPlay: string, languageCodeParam?: string) => {
    // Determine the language code for the TTS API call
    // If a specific languageCodeParam is provided, use it.
    // Else, if textToPlay is the current resultText, use targetLang.
    // Otherwise, default to sourceLang.
    const effectiveLanguageCode = languageCodeParam || (textToPlay === resultText ? targetLang : sourceLang);

    console.log(`handleTextToSpeech called with text: "${textToPlay}", languageCode: "${effectiveLanguageCode}"`);
    if (!textToPlay.trim() || isLoading) return;
    if (!user) {
        Alert.alert("Authentication Error", "User not found.");
        return;
    }

    setIsLoading(true);
    try {
        const ttsRequest = { text: textToPlay, languageCode: effectiveLanguageCode };
        const apiResponse = await textToSpeech(ttsRequest); // API call now returns ApiResponse with string data

        if (apiResponse.success && apiResponse.message === "TTS_AUDIO_GENERATED" && typeof apiResponse.data === 'string') {
            const base64AudioData = apiResponse.data;
            const tempAudioFileName = `tts_audio_${Date.now()}.mp3`;
            const tempAudioUri = FileSystem.documentDirectory + tempAudioFileName;

            try {
                await FileSystem.writeAsStringAsync(tempAudioUri, base64AudioData, {
                    encoding: FileSystem.EncodingType.Base64,
                });

                console.log(`Setting URI for playback: ${tempAudioUri}`);
                setCurrentPlaybackUri(tempAudioUri);
                setShouldPlayNextUri(true);
            } catch (e) {
                console.error('Error writing audio file or setting up playback:', e);
                Alert.alert('Playback Setup Error', 'Failed to prepare audio for playback.');
            }
        } else if (!apiResponse.success) {
            // Handle TTS_UNAVAILABLE or other specific errors from API
            if (apiResponse.message === "TTS_UNAVAILABLE") {
                Alert.alert('Text-to-Speech Unavailable', apiResponse.data as string || 'TTS is not available for the selected language.');
            } else if (apiResponse.message === "GENERAL_TTS_ERROR") {
                Alert.alert('Text-to-Speech Error', apiResponse.data as string || 'An error occurred during text-to-speech conversion.');
            } else {
                // Generic error from API if message code is not recognized
                Alert.alert('Text-to-Speech Error', apiResponse.message || 'Failed to retrieve audio data.');
            }
        } else {
            // Fallback for unexpected scenarios, e.g. success true but data not a Blob
            console.error('Unexpected API response structure for TTS:', apiResponse);
            Alert.alert('Text-to-Speech Error', 'Received an unexpected response from the server.');
        }
    } catch (error: any) {
        console.error('Text-to-Speech API or main logic error:', error);
        Alert.alert('Text-to-Speech Error', error.message || 'Could not convert text to speech.');
    } finally {
        setIsLoading(false);
    }
};

    const handleSpeechToText = async (uri: string) => {
        if (!uri || typeof uri !== 'string' || !uri.trim()) {
            Alert.alert('Error', 'No valid audio URI provided for transcription.');
            console.error('[HomeScreen] handleSpeechToText: Invalid URI received:', uri);
            return;
        }
        console.log(`[HomeScreen] handleSpeechToText: Transcribing audio from: ${uri}`);
        setIsLoading(true);
        setResultText(''); 
        setCurrentApiTranslation(null);
        setIsFavorite(false);

        try {
            // Add a small delay to allow file system to catch up
            await new Promise(resolve => setTimeout(resolve, 500));

            let fileInfo = await FileSystem.getInfoAsync(uri);
            console.log('[HomeScreen] handleSpeechToText: FileInfo for ' + uri + ' (after delay):', JSON.stringify(fileInfo));

            if (!fileInfo.exists) {
                console.warn(`[HomeScreen] handleSpeechToText: File does not exist at ${uri} after delay.`);
                const parentDirUri = uri.substring(0, uri.lastIndexOf('/'));
                console.log(`[HomeScreen] handleSpeechToText: Parent directory URI: ${parentDirUri}`);
                
                try {
                    const parentDirInfo = await FileSystem.getInfoAsync(parentDirUri);
                    console.log(`[HomeScreen] handleSpeechToText: Info for parent directory ${parentDirUri}:`, JSON.stringify(parentDirInfo));

                    if (parentDirInfo.exists && parentDirInfo.isDirectory) {
                        console.log(`[HomeScreen] handleSpeechToText: Attempting to list contents of parent directory: ${parentDirUri}`);
                        const dirContents = await FileSystem.readDirectoryAsync(parentDirUri);
                        console.log(`[HomeScreen] handleSpeechToText: Contents of ${parentDirUri}:`, dirContents);
                    } else {
                        console.warn(`[HomeScreen] handleSpeechToText: Parent directory ${parentDirUri} does not exist or is not a directory.`);
                    }

                    // Re-check fileInfo after attempting to interact with parent directory
                    fileInfo = await FileSystem.getInfoAsync(uri);
                    console.log('[HomeScreen] handleSpeechToText: FileInfo after parent dir check:', JSON.stringify(fileInfo));
                    if (!fileInfo.exists) {
                        Alert.alert('File Error', `Audio file not found at ${uri}. Directory logs captured.`);
                        setIsLoading(false);
                        return;
                    }
                } catch (dirError: any) {
                    console.error(`[HomeScreen] handleSpeechToText: Error accessing/reading parent directory ${parentDirUri}:`, dirError.message, dirError.stack);
                    Alert.alert('File System Error', `Could not access parent directory ${parentDirUri}. Error: ${dirError.message}`);
                    setIsLoading(false);
                    return;
                }
            }
            const fileData = {
                uri: uri,
                name: uri.split('/').pop() || 'recording.wav',
                type: 'audio/wav', // Ensure this matches your recording options
            } as any;

            const transcriptionResult = await speechToText(fileData as unknown as File, sourceLang.split('-')[0]);
            console.log('Transcription Result from API:', JSON.stringify(transcriptionResult));

            if (transcriptionResult && transcriptionResult.success) {
                // Assuming the transcription is in the 'message' field for successful responses
                // Or if there's a specific data field, e.g., transcriptionResult.data.transcription
                const transcribedText = transcriptionResult.message; // Adjust if backend sends it differently
                setInputText(transcribedText);
                // Automatically translate the transcribed text
                await handleTranslate(InputType.TEXT, transcribedText);
            } else {
                Alert.alert('Transcription Failed', transcriptionResult.message || 'Could not transcribe audio.');
                setInputText(''); // Clear input text on failure
            }
        } catch (error: any) {
            console.error('[HomeScreen] Speech to text error:', error);
            Alert.alert('Error', error.message || 'Failed to transcribe audio.');
            setInputText(''); // Clear input text on error
        } finally {
            setIsLoading(false);
        }
    };

    const handleToggleFavoriteCurrent = async () => {
        if (!currentApiTranslation) {
            Alert.alert("Error", "No translation available to toggle favorite.");
            return;
        }
        setIsLoading(true);
        try {
            const updatedTranslation = await apiToggleFavoriteTranslation(currentApiTranslation.id);
            setCurrentApiTranslation(updatedTranslation);
            setIsFavorite(updatedTranslation.isFavorite);

            if (updatedTranslation.isFavorite) {
                try {
                    await apiCreateSavedItem({
                        translationId: updatedTranslation.id,
                        category: SavedItemCategory.PHRASE, 
                    });
                    Alert.alert('Favorite Updated', 'Translation saved and added to your organized items!');
                } catch (saveError: any) {
                    console.warn('Failed to create SavedItem automatically', saveError);
                    if (saveError.response?.data?.message?.includes('already saved')) {
                        Alert.alert('Favorite Updated', 'Translation saved! It was already in your organized items.');
                    } else {
                        Alert.alert('Favorite Updated', 'Translation saved! (Could not auto-add to organized items)');
                    }
                }
            } else {
                Alert.alert('Favorite Updated', 'Translation removed from favorites.');
            }
            await saveTranslation({
                id: updatedTranslation.id,
                originalText: updatedTranslation.sourceText, 
                translatedText: updatedTranslation.targetText,
                sourceLang: updatedTranslation.sourceLang,
                targetLang: updatedTranslation.targetLang,
                timestamp: new Date(updatedTranslation.createdAt).getTime(),
                isSaved: updatedTranslation.isFavorite, 
                inputType: updatedTranslation.inputType
            });

        } catch (error: any) {
            console.error('Toggle favorite error', error);
            Alert.alert('Error', 'Could not update favorite status.');
        }
        setIsLoading(false);
    };

    
    const startRecording = async () => {
        try {
            console.log('[HomeScreen] Preparing to recording...')
            await audioRecorder.prepareToRecordAsync();
            console.log('[HomeScreen] Starting recording...');
            audioRecorder.record();
            setIsRecording(true);
    
            console.log('[HomeScreen] Recording started successfully.');
    
        } catch (err: any) {
            console.error('[HomeScreen] Recording failed:', err);
            setIsRecording(false); // Reset state on failure
            Alert.alert('Recording Error', `Failed to start recording: ${err.message}`);
        }
    };
    
    const stopRecording = async () => {
        // Prevent stopping if not recording
        if (!audioRecorder.isRecording) { 
            console.log('[HomeScreen] stopRecording: No active recording to stop.');
            setIsRecording(false); // Ensure UI consistency
            return;
        }
    
        console.log('[HomeScreen] stopRecording: Stopping recording...');
        setIsRecording(false);
    
        try {
            await audioRecorder.stop();
            // Get URI from the hook instance
            const uri = `file:///${audioRecorder.uri}`;
            // Ensure the URI has the file:/// prefix for FileSystem operations
            console.log('[ConversationScreen] processTurn: Prefixed audioUri for FileSystem:', uri);
            setIsRecording(false);
            console.log('[HomeScreen] stopRecording: Recording stopped. URI:', uri);
            
            if (uri) {
                setAudioUri(uri);
                await handleSpeechToText(uri);
            } else {
                console.error('[HomeScreen] stopRecording: Invalid URI after stopping recording.');
                Alert.alert('Error', 'Recording URI is not available or invalid.');
            }
        } catch (error: any) {
            console.error('[HomeScreen] stopRecording: Failed to stop recording', error);
            Alert.alert('Error', `Failed to stop recording: ${error.message}`);
        }
    };

    const handleAudioRecord = async () => {
        if (isRecording) {
            await stopRecording();
        } else {
            await startRecording();
        }
    };

    const handleTakePicture = async () => {
        const permissionResult: CameraPermissionResponse = await Camera.requestCameraPermissionsAsync();
        if (permissionResult.status !== CameraPermissionStatus.GRANTED) {
            Alert.alert("Permission Denied", "Camera permission is required to take photos.");
            return;
        }

        try {
            const result = await ImagePicker.launchCameraAsync({
                mediaTypes: ['images'],
                allowsEditing: true,
                aspect: [4, 3],
                quality: 0.8,
            });

            if (!result.canceled && result.assets && result.assets.length > 0) {
                setSelectedImage(result.assets[0]);
                setInputText('');
                console.log('Image taken URI:', result.assets[0].uri);
                Alert.alert('Image Captured', 'Image ready for processing.');
            await handleImageOcrAndTranslate(result.assets[0]);
            }
        } catch (error) {
            console.error('Error taking picture:', error);
            Alert.alert('Camera Error', 'Could not take picture.');
        }
    };

    const handleSelectImage = async () => {
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images'],
                allowsEditing: true,
                aspect: [4, 3],
                quality: 0.8,
            });

            if (!result.canceled && result.assets && result.assets.length > 0) {
                setSelectedImage(result.assets[0]);
                setInputText('');
                console.log('Image selected URI:', result.assets[0].uri);
                Alert.alert('Image Selected', 'Image ready for processing.');
            await handleImageOcrAndTranslate(result.assets[0]);
            }
        } catch (error) {
            console.error('Error selecting image:', error);
            Alert.alert('Gallery Error', 'Could not select image from gallery.');
        }
    };

    const prepareForMediaInput = () => {
        setInputText('');
        setResultText('');
        setCurrentApiTranslation(null);
        setSelectedImage(null);
        setAudioUri(null);
    };

    // useEffect for logging player status
    useEffect(() => {
        if (playerStatus) {
            console.log('Player Status Update:', JSON.stringify(playerStatus, null, 2));
        }
    }, [playerStatus]);

    // useEffect for handling playback logic
    useEffect(() => {
        const playAudio = async () => {
            if (!player) return;
            try {
                await player.play();
                console.log(`Playback initiated.`);
            } catch (e) {
                console.error('Error during playback:', e);
            } finally {
                setShouldPlayNextUri(false); // Reset the trigger.
            }
        };
    
        if (player && player.isLoaded && shouldPlayNextUri) {
            playAudio();
        }
    
        // This block automatically cleans up the player after it finishes.
        if (playerStatus?.isLoaded && playerStatus?.didJustFinish) {
            console.log('Playback finished. Releasing player by setting URI to null.');
            // This is the correct way to release the native player instance.
            setCurrentPlaybackUri(null); 
        }
    }, [player, playerStatus, shouldPlayNextUri]);
    return (
        <KeyboardAvoidingView 
            style={styles.container} 
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0} 
        >
            <ScrollView 
                contentContainerStyle={styles.scrollContentContainer}
                keyboardShouldPersistTaps="handled"
            >

                <View style={styles.translationCard}>
                    
                    <View style={styles.languageSelectorRow}>
                        <TouchableOpacity onPress={() => { setLanguageModalType('source'); setIsLanguageModalVisible(true); }} style={styles.languageButton}>
                            <Text style={styles.languageButtonText}>{sourceLang.split('-')[0].toUpperCase()}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={handleSwapLanguages} style={{ padding: theme.spacing.sm }}>
                            <Ionicons name="swap-horizontal" size={28} color={theme.colors.primaryOrange} />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => { setLanguageModalType('target'); setIsLanguageModalVisible(true); }} style={styles.languageButton}>
                            <Text style={styles.languageButtonText}>{targetLang.split('-')[0].toUpperCase()}</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.inputHeaderActions}>
                    <Text style={styles.inputLangText}>{sourceLang.split('-')[0].toUpperCase()} Input</Text>
                        <View style={styles.resultIcons}>
                        
                            <TouchableOpacity onPress={() => handleTextToSpeech(inputText, sourceLang)} style={styles.iconButton} disabled={!inputText.trim()}>
                                <Ionicons name="volume-high-outline" size={24} color={!inputText.trim() ? theme.colors.mediumGray : theme.colors.primaryOrange} />
                            </TouchableOpacity>
                            <TouchableOpacity onPress={handleCopyInputText} style={styles.iconButton} disabled={!inputText.trim()}>
                                <Ionicons name="copy-outline" size={24} color={!inputText.trim() ? theme.colors.mediumGray : theme.colors.primaryOrange} />
                            </TouchableOpacity>
                        </View>
                    </View>

                    <RNTextInput
                        style={styles.textInputArea}
                        placeholder="Enter text to translate, or use mic/camera..."
                        value={inputText}
                        onChangeText={setInputText}
                        multiline
                        onFocus={() => {
                            setSelectedImage(null);
                            setAudioUri(null);
                        }}
                    />
                    {inputText ? (
                        <TouchableOpacity onPress={() => setInputText('')} style={styles.clearInputButton}>
                            <Ionicons name="close-circle" size={24} color={theme.colors.mediumGray} />
                        </TouchableOpacity>
                    ) : null}

                    {isLoading && <ActivityIndicator size="large" color={theme.colors.primaryOrange} style={styles.activityIndicator} />}

                    {resultText && !isLoading && (
                        <View style={styles.resultDisplayCard}>
                            <View style={styles.resultHeaderActions}>
                                <Text style={styles.resultLangText}>{targetLang.split('-')[0].toUpperCase()} Translation</Text>
                                <View style={styles.resultIcons}>
                                    <TouchableOpacity onPress={() => handleTextToSpeech(resultText)} style={styles.iconButton}>
                                        <Ionicons name="volume-high-outline" size={24} color={theme.colors.primaryOrange} />
                                    </TouchableOpacity>
                                    <TouchableOpacity onPress={handleCopyTranslatedText} style={styles.iconButton}>
                                        <Ionicons name="copy-outline" size={24} color={theme.colors.primaryOrange} />
                                    </TouchableOpacity>
                                    {currentApiTranslation && (
                                        <TouchableOpacity onPress={handleToggleFavoriteCurrent} style={styles.iconButton}>
                                            <Ionicons name={isFavorite ? "heart" : "heart-outline"} size={24} color={theme.colors.primaryOrange} />
                                        </TouchableOpacity>
                                    )}
                                </View>
                            </View>
                            <Text style={styles.translatedText}>{resultText}</Text>
                        </View>
                    )}
                </View>

                <View style={styles.actionButtonsContainer}>
                    <TouchableOpacity 
                        onPress={handleAudioRecord} 
                        style={styles.actionButton}
                        onLongPress={() => { if(audioUri) Alert.alert("Audio Info", `Last recording: ${audioUri}`); }}
                    >
                        <Ionicons name={isRecording ? "mic" : "mic"} size={28} color={theme.colors.primaryOrange} />
                        <Text style={styles.actionButtonText}>{isRecording ? 'Stop' : 'Record'}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity onPress={() => { prepareForMediaInput(); handleTakePicture(); }} style={styles.actionButton}>
                        <Ionicons name="camera-outline" size={28} color={theme.colors.primaryOrange} />
                        <Text style={styles.actionButtonText}>Camera</Text>
                    </TouchableOpacity>

                    <TouchableOpacity onPress={() => { prepareForMediaInput(); handleSelectImage(); }} style={styles.actionButton}>
                        <Ionicons name="image-outline" size={28} color={theme.colors.primaryOrange} />
                        <Text style={styles.actionButtonText}>Gallery</Text>
                    </TouchableOpacity>
                </View>

                <View style={[styles.actionButtonsContainer, { marginTop: theme.spacing.sm} ]}>
                    <TouchableOpacity 
                        onPress={() => handleTranslate(InputType.TEXT, inputText)} 
                        style={[styles.actionButton, {backgroundColor: theme.colors.white, flex: 1, marginHorizontal: theme.spacing.md}]} 
                        disabled={isLoading || (!inputText.trim() && !audioUri && !selectedImage)}
                    >
                        <Ionicons name="language-outline" size={28} color={theme.colors.primaryOrange} />
                        <Text style={styles.actionButtonText}>Translate</Text>
                    </TouchableOpacity>
                </View>

            </ScrollView>
            <LanguageSelectionModal 
                visible={isLanguageModalVisible}
                onClose={() => setIsLanguageModalVisible(false)}
                onSelectLanguage={handleSelectLanguage}
                languages={SUPPORTED_LANGUAGES}
            />
        </KeyboardAvoidingView>
    );
}
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
            style={styles.modalLanguageItem}
            onPress={() => {
                onSelectLanguage(item);
                onClose();
            }}
        >
            <Text style={styles.modalLanguageText}>{item.name} ({item.code.toUpperCase()})</Text>
        </TouchableOpacity>
    );

    return (
        <Modal
            animationType="slide"
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <RNTextInput
                        style={styles.modalSearchInput}
                        placeholder="Search language..."
                        value={searchTerm}
                        onChangeText={setSearchTerm}
                    />
                    <FlatList
                        data={filteredLanguages}
                        renderItem={renderItem}
                        keyExtractor={(item) => item.code}
                        initialNumToRender={15} // Performance optimization
                        maxToRenderPerBatch={10} // Performance optimization
                        windowSize={10} // Performance optimization
                    />
                    <TouchableOpacity onPress={onClose} style={styles.modalCloseButton}>
                        <Text style={styles.modalCloseButtonText}>Close</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.lightGray,
    },
    scrollContentContainer: {
        paddingBottom: theme.spacing.lg,
    },

    translationCard: {
        backgroundColor: theme.colors.cardBackground,
        borderRadius: theme.borders.radiusLarge,
        marginHorizontal: theme.spacing.md,
        marginTop: theme.spacing.lg,
        padding: theme.spacing.md,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 3,
    },
    languageSelectorRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: theme.spacing.md,
    },
    languageButton: {
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.sm,
        backgroundColor: theme.colors.lightGray,
        borderRadius: theme.borders.radiusMedium,
    },
    languageButtonText: {
        ...theme.typography.button,
        color: theme.colors.primaryOrange,
        textTransform: 'uppercase',
    },
    textInputArea: {
        ...theme.typography.h3,
        color: theme.colors.darkGray,
        minHeight: 100, 
        textAlignVertical: 'top',
        padding: theme.spacing.sm,
        marginBottom: theme.spacing.sm,
    },
    clearInputButton: {
        position: 'absolute',
        top: theme.spacing.lg + 94,
        right: theme.spacing.md,
    },
    activityIndicator: {
        marginVertical: theme.spacing.md,
    },
    resultDisplayCard: {
        backgroundColor: theme.colors.lightGray,
        borderRadius: theme.borders.radiusMedium,
        padding: theme.spacing.md,
        marginTop: theme.spacing.md,
    },
    resultHeaderActions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: theme.spacing.sm,
    },
    inputHeaderActions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: theme.spacing.xs, // Adjusted margin for tighter spacing above input
        paddingHorizontal: theme.spacing.sm, // Add some horizontal padding if needed
    },
    inputLangText: {
        ...theme.typography.caption,
        color: theme.colors.primaryOrange,
        fontWeight: 'bold',
        textTransform: 'uppercase',
    },
    resultLangText: {
        ...theme.typography.caption,
        color: theme.colors.primaryOrange,
        fontWeight: 'bold',
        textTransform: 'uppercase',
    },
    resultIcons: {
        flexDirection: 'row',
    },
    iconButton: {
        padding: theme.spacing.sm,
        marginLeft: theme.spacing.sm,
    },
    translatedText: {
        ...theme.typography.h3,
        color: theme.colors.darkGray,
    },
    actionButtonsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginHorizontal: theme.spacing.md,
        marginTop: theme.spacing.lg,
        marginBottom: theme.spacing.md, 
    },
    actionButton: {
        backgroundColor: theme.colors.white,
        paddingVertical: theme.spacing.sm,
        paddingHorizontal: theme.spacing.sm,
        borderRadius: theme.borders.radiusLarge,
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: 100,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
        elevation: 2,
        color: theme.colors.primaryOrange,
    },
    actionButtonText: {
        ...theme.typography.button,
        color: theme.colors.primaryOrange,
        marginTop: theme.spacing.xs,
    },
    // Styles for LanguageSelectionModal
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        backgroundColor: theme.colors.white,
        borderRadius: theme.borders.radiusLarge,
        padding: theme.spacing.lg,
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
        borderColor: theme.colors.mediumGray,
        borderRadius: theme.borders.radiusSmall,
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.sm,
        marginBottom: theme.spacing.md,
        fontSize: 16,
    },
    modalLanguageItem: {
        paddingVertical: theme.spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.lightGray,
    },
    modalLanguageText: {
        fontSize: 16,
        color: theme.colors.darkGray,
    },
    modalCloseButton: {
        marginTop: theme.spacing.md,
        backgroundColor: theme.colors.primaryOrange,
        paddingVertical: theme.spacing.sm,
        borderRadius: theme.borders.radiusMedium,
        alignItems: 'center',
    },
    modalCloseButtonText: {
        ...theme.typography.button,
        color: theme.colors.white,
    },
});

export default HomeScreen;