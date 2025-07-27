import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    View, Text, StyleSheet, TextInput, ScrollView, TouchableOpacity, Platform, ActivityIndicator, KeyboardAvoidingView, Alert, Modal, FlatList, TextInput as RNTextInput
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { 
    useAudioPlayer, 
    useAudioPlayerStatus, 
    useAudioRecorder, 
    AudioModule,
} from 'expo-audio';
import * as FileSystem from 'expo-file-system';
import * as Clipboard from 'expo-clipboard';

import {
    translateText as apiTranslateText,
    textToSpeech as apiTextToSpeech,
    speechToText as apiSpeechToText,
} from '../services/apiService';
import { optionsForRecorder } from '../../config/recordingOptions.config';
import { SUPPORTED_LANGUAGES, Language } from '../constants/languages';

interface ConversationTurn {
    id: string;
    speaker: 'userA' | 'userB';
    originalText: string;
    translatedText: string;
    sourceLang: string;
    targetLang: string;
    audioUri?: string;
    isPlaying?: boolean;
}

const ConversationScreen: React.FC = () => {
    const [langA, setLangA] = useState('en-US');
    const [langB, setLangB] = useState('es-ES'); 
    const [isLanguageModalVisible, setIsLanguageModalVisible] = useState(false);
    const [languageModalType, setLanguageModalType] = useState<'userA' | 'userB' | null>(null);
    const [textA, setTextA] = useState('');
    const [textB, setTextB] = useState('');
    const [isRecordingA, setIsRecordingA] = useState(false);
    const [isRecordingB, setIsRecordingB] = useState(false);
    const [conversationTurns, setConversationTurns] = useState<ConversationTurn[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [currentPlayingId, setCurrentPlayingId] = useState<string | null>(null);

    // Audio player management - using null as initial state
    const [audioSource, setAudioSource] = useState<string | null>(null);
    const player = useAudioPlayer(audioSource);
    const playerStatus = useAudioPlayerStatus(player);
    
    const audioRecorder = useAudioRecorder(optionsForRecorder);
    const scrollViewRef = useRef<ScrollView>(null);

    // Refs for better state management
    const pendingPlaybackRef = useRef<string | null>(null);
    const isTransitioningRef = useRef(false);

    const handleSelectLanguage = (language: Language) => {
        if (languageModalType === 'userA') {
            setLangA(language.code);
        } else if (languageModalType === 'userB') {
            setLangB(language.code);
        }
        setIsLanguageModalVisible(false);
    };

    const handleSwapLanguages = () => {
        const currentLangA = langA;
        setLangA(langB);
        setLangB(currentLangA);
    };

    const resetPlaybackState = useCallback(() => {
        console.log('Resetting playback state');
        setCurrentPlayingId(null);
        pendingPlaybackRef.current = null;
        isTransitioningRef.current = false;
        setConversationTurns(prev => 
            prev.map(t => ({ ...t, isPlaying: false }))
        );
    }, []);

    useEffect(() => {
        requestMicrophonePermission();
    }, []);

    // Enhanced player status handling
    useEffect(() => {
        console.log('Player status changed:', {
            isLoaded: playerStatus.isLoaded,
            playing: playerStatus.playing,
            didJustFinish: playerStatus.didJustFinish,
            currentPlayingId,
            pendingPlayback: pendingPlaybackRef.current,
            isTransitioning: isTransitioningRef.current
        });

        // Handle playback completion first
        if (playerStatus.didJustFinish && !isTransitioningRef.current) {
            console.log('Playback finished');
            resetPlaybackState();
            return;
        }

        // Handle successful loading and start playback
        if (playerStatus.isLoaded && !playerStatus.playing && !playerStatus.didJustFinish && pendingPlaybackRef.current) {
            const turnId = pendingPlaybackRef.current;
            console.log('Player loaded, starting playback for turn:', turnId);
            
            // Clear pending state immediately
            pendingPlaybackRef.current = null;
            
            // Start playback using async function
            const startPlayback = async () => {
                try {
                    await player.play();
                    console.log('Playback started successfully for turn:', turnId);
                    setCurrentPlayingId(turnId);
                    setConversationTurns(prev => 
                        prev.map(t => ({ 
                            ...t, 
                            isPlaying: t.id === turnId 
                        }))
                    );
                    isTransitioningRef.current = false;
                } catch (error) {
                    // console.error('Error starting playback:', error);
                    resetPlaybackState();
                }
            };
            
            startPlayback();
        }
    }, [playerStatus, player, resetPlaybackState]);

    const ensureRecordingDirectory = async () => {
        const baseCacheDir = FileSystem.cacheDirectory;
        if (!baseCacheDir) {
            // console.error('[ConversationScreen] ensureRecordingDirectory: CRITICAL - Cache directory is null or undefined.');
            // Alert.alert('Directory Error', 'Critical error: Cache directory path is invalid.');
            throw new Error('Cache directory path is invalid');
        }
        const recordingDir = baseCacheDir + 'ExpoAudio/';
        console.log('[ConversationScreen] ensureRecordingDirectory: Target recording directory:', recordingDir);

        const dirInfo = await FileSystem.getInfoAsync(recordingDir);
        if (!dirInfo.exists) {
            console.log('[ConversationScreen] ensureRecordingDirectory: Recording directory does not exist. Creating it...');
            try {
                await FileSystem.makeDirectoryAsync(recordingDir, { intermediates: true });
                console.log('[ConversationScreen] ensureRecordingDirectory: Recording directory created successfully.');
            } catch (error) {
                // console.error('[ConversationScreen] ensureRecordingDirectory: Error creating recording directory:', error);
                Alert.alert('Directory Error', 'Could not create recording directory.');
                throw error;
            }
        } else {
            console.log('[ConversationScreen] ensureRecordingDirectory: Recording directory already exists.');
        }
    };

    const handleCopyToClipboard = async (text: string, type: string) => {
        console.log(`Attempting to copy ${type}: "${text}"`);
        if (text && text.trim() !== '') {
            try {
                await Clipboard.setStringAsync(text);
                Alert.alert('Copied!', `${type} copied to clipboard.`);
                console.log('Copy successful.');
            } catch (e) {
                // console.error('Failed to copy text to clipboard:', e);
                Alert.alert('Copy Failed', 'Could not copy text to clipboard.');
            }
        } else {
            console.log('Nothing to copy.');
            Alert.alert('Nothing to Copy', `There is no ${type.toLowerCase()} to copy.`);
        }
    };

    const requestMicrophonePermission = async () => {
        try {
            const status = await AudioModule.requestRecordingPermissionsAsync();
            if (!status.granted) {
                Alert.alert('Permission Denied', 'Microphone permission is required for voice input.');
                return false;
            }
            return true;
        } catch (error) {
            // console.error("Error requesting microphone permission:", error);
            Alert.alert('Permission Error', 'Could not request microphone permission.');
            return false;
        }
    };

    const processTurn = async (speaker: 'userA' | 'userB', audioUri?: string, inputText?: string) => {
        if (isLoading) return;
        setIsLoading(true);

        let currentOriginalText = inputText || '';
        const sourceLangWithRegion = speaker === 'userA' ? langA : langB;
        const targetLangWithRegion = speaker === 'userA' ? langB : langA;
        const sourceLangBase = sourceLangWithRegion.split('-')[0];
        const targetLangBase = targetLangWithRegion.split('-')[0];

        try {
            if (audioUri) {
                console.log('[ConversationScreen] processTurn: Received audioUri:', audioUri);
                if (typeof audioUri !== 'string' || !audioUri.trim()) {
                    setIsLoading(false);
                    Alert.alert('Error', 'Invalid audio URI received.');
                    return;
                }

                // Handle URI formatting
                let prefixedAudioUri = audioUri;
                if (!audioUri.startsWith('file://')) {
                    if (audioUri.startsWith('/')) {
                        prefixedAudioUri = `file://${audioUri}`;
                    } else {
                        prefixedAudioUri = `file:///${audioUri}`;
                    }
                }
                console.log('[ConversationScreen] processTurn: Prefixed audioUri for FileSystem:', prefixedAudioUri);

                // Wait for file to be ready
                console.log('[ConversationScreen] processTurn: Waiting for file to be ready...');
                await new Promise(resolve => setTimeout(resolve, 500)); 

                const fileInfo = await FileSystem.getInfoAsync(prefixedAudioUri);
                console.log(`[ConversationScreen] processTurn: FileInfo for ${prefixedAudioUri}:`, JSON.stringify(fileInfo));

                if (!fileInfo.exists || fileInfo.size === 0) {
                    console.warn(`[ConversationScreen] processTurn: File does not exist or is empty at ${prefixedAudioUri}.`);
                    Alert.alert('File Error', `Recording file not found or is empty. Please try recording again.`);
                    setIsLoading(false);
                    return;
                }

                const fileName = prefixedAudioUri.split('/').pop() || Platform.OS === 'ios' ? 'recording.wav' : 'recording.amr';
                const fileType = Platform.OS === 'ios' ? 'audio/wav' : 'audio/awb';

                const sttResponse = await apiSpeechToText({ uri: prefixedAudioUri, name: fileName, type: fileType }, sourceLangWithRegion);
                if (!sttResponse.success || typeof sttResponse.message !== 'string' || !sttResponse.message) {
                    throw new Error(sttResponse.message || 'Speech-to-text failed.');
                }
                currentOriginalText = sttResponse.message;
                if (speaker === 'userA') setTextA(currentOriginalText);
                else setTextB(currentOriginalText);
            }

            if (!currentOriginalText.trim()) {
                setIsLoading(false);
                return;
            }

            const translateResponse = await apiTranslateText({ text: currentOriginalText, sourceLang: sourceLangBase, targetLang: targetLangBase });
            if (!translateResponse.success || typeof translateResponse.message !== 'string') {
                throw new Error(translateResponse.message || 'Translation failed.');
            }
            const translatedText = translateResponse.message;

            const ttsResponse = await apiTextToSpeech({ text: translatedText, languageCode: targetLangWithRegion });
            if (!ttsResponse.success || !ttsResponse.data) {
                throw new Error(ttsResponse.message || 'Text-to-speech failed or returned no audio data.');
            }

            // Use a more unique filename and ensure proper path
            const timestamp = Date.now();
            const ttsAudioUri = `${FileSystem.documentDirectory}tts_${timestamp}_${Math.random().toString(36).substr(2, 9)}.mp3`;
            
            console.log('[ConversationScreen] Writing TTS audio to:', ttsAudioUri);
            
            try {
                await FileSystem.writeAsStringAsync(ttsAudioUri, ttsResponse.data, { 
                    encoding: FileSystem.EncodingType.Base64 
                });
                
                // Wait a moment for the file system to sync
                await new Promise(resolve => setTimeout(resolve, 100));
                
            } catch (fileError) {
                // console.error('[ConversationScreen] Error writing TTS file:', fileError);
                Alert.alert('Error', 'Failed to create audio file for translation.');
                setIsLoading(false);
                return;
            }

            const newTurn: ConversationTurn = {
                id: timestamp.toString(),
                speaker,
                originalText: currentOriginalText,
                translatedText,
                sourceLang: sourceLangWithRegion,
                targetLang: targetLangWithRegion,
                audioUri: ttsAudioUri,
                isPlaying: false,
            };

            setConversationTurns(prev => [...prev, newTurn]);

            if (speaker === 'userA') setTextA(''); else setTextB('');

        } catch (error: any) {
            // console.error('[ConversationScreen] processTurn: Error:', error);
            Alert.alert('Error', error.message || 'An unexpected error occurred during processing.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleRecord = async (speaker: 'userA' | 'userB') => {
        const hasPermission = await requestMicrophonePermission();
        if (!hasPermission) return;

        const isRecording = speaker === 'userA' ? isRecordingA : isRecordingB;

        if (isRecording) {
            try {
                console.log('[ConversationScreen] handleRecord: Stopping recording...');
                await audioRecorder.stop();
                const uri = audioRecorder.uri;
                console.log('[ConversationScreen] handleRecord: Recording stopped. URI:', uri);
                if (speaker === 'userA') setIsRecordingA(false); else setIsRecordingB(false);
                
                if (uri && typeof uri === 'string' && uri.trim()) {
                    processTurn(speaker, uri);
                } else {
                    // console.error('[ConversationScreen] handleRecord: Invalid URI after stopping recording:', uri);
                    Alert.alert('Recording Error', 'Failed to get a valid audio recording file.');
                }
            } catch (err: any) {
                // console.error('[ConversationScreen] handleRecord: Error stopping recording:', err);
                Alert.alert('Recording Error', 'Failed to stop recording.');
                if (speaker === 'userA') setIsRecordingA(false); else setIsRecordingB(false);
            }
        } else {
            // Stop any existing recording for this recorder instance before starting a new one
            if (audioRecorder.isRecording) {
                try {
                    console.warn('[ConversationScreen] handleRecord: Found an ongoing recording. Stopping it first.');
                    await audioRecorder.stop(); 
                } catch (stopErr: any) {
                    console.warn('[ConversationScreen] handleRecord: Error stopping previous recording before starting new one:', stopErr);
                }
            }
            try {
                console.log('[ConversationScreen] handleRecord: Ensuring recording directory...');
                await ensureRecordingDirectory();
                
                console.log('[ConversationScreen] handleRecord: Preparing to record...');
                await audioRecorder.prepareToRecordAsync();
                console.log('[ConversationScreen] handleRecord: Starting recording...');
                await audioRecorder.record();
                console.log('[ConversationScreen] handleRecord: Recording started successfully');
                if (speaker === 'userA') setIsRecordingA(true); else setIsRecordingB(true);
            } catch (err: any) {
                // console.error('[ConversationScreen] handleRecord: Error starting recording:', err);
                Alert.alert('Recording Error', `Failed to start recording: ${err.message}`);
                if (speaker === 'userA') setIsRecordingA(false); else setIsRecordingB(false);
            }
        }
    };

    const handlePlayback = async (turnId: string) => {
        const turn = conversationTurns.find(t => t.id === turnId);
        if (!turn || !turn.audioUri) {
            console.log('Turn not found or no audio URI:', turnId);
            return;
        }

        try {
            // If this audio is currently playing, pause it
            if (currentPlayingId === turnId && playerStatus.isLoaded && playerStatus.playing) {
                console.log('Pausing currently playing audio:', turnId);
                player.pause();
                resetPlaybackState();
                return;
            }

            // Verify the audio file exists and is valid
            const fileInfo = await FileSystem.getInfoAsync(turn.audioUri);
            if (!fileInfo.exists || fileInfo.size === 0) {
               // console.error('Audio file does not exist or is empty:', turn.audioUri);
                Alert.alert('Playback Error', 'Audio file not found or is empty.');
                return;
            }

            console.log('Initiating playback for turn:', turnId, 'with audio:', turn.audioUri);
            console.log('Audio file info:', JSON.stringify(fileInfo));

            // Set transitioning state to prevent interference
            isTransitioningRef.current = true;
            
            // Stop any currently playing audio first
            if (currentPlayingId && playerStatus.isLoaded && (playerStatus.playing || playerStatus.didJustFinish)) {
                console.log('Stopping currently playing audio:', currentPlayingId);
                player.pause();
                // Wait a moment for the player to fully stop
                await new Promise(resolve => setTimeout(resolve, 100));
            }

            // Reset state
            resetPlaybackState();
            
            // Set pending playback before changing audio source
            pendingPlaybackRef.current = turnId;
            isTransitioningRef.current = true;
            
            // Force reload by setting to null first, then the actual source
            // This ensures the player reloads even if it's the same audio file
            setAudioSource(null);
            // Small delay to ensure the source change is processed
            await new Promise(resolve => setTimeout(resolve, 50));
            setAudioSource(turn.audioUri);

        } catch (error) {
            //console.error('Playback error:', error);
            Alert.alert('Playback Error', 'Failed to play audio.');
            resetPlaybackState();
        }
    };

    const handleTextSubmit = (speaker: 'userA' | 'userB') => {
        const textToProcess = speaker === 'userA' ? textA : textB;
        if (textToProcess.trim()) {
            processTurn(speaker, undefined, textToProcess);
        }
    };

    useEffect(() => {
        if (conversationTurns.length > 0) {
            scrollViewRef.current?.scrollToEnd({ animated: true });
        }
    }, [conversationTurns]);

    const getPlayButtonIcon = (turn: ConversationTurn) => {
        return turn.isPlaying ? "pause-circle" : "play-circle";
    };

    return (
        <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : "height"} keyboardVerticalOffset={90}>
            <View style={styles.languageSelectorRow}>
                <TouchableOpacity onPress={() => { setLanguageModalType('userA'); setIsLanguageModalVisible(true); }} style={styles.languageButton}>
                    <Text style={styles.languageButtonText}>{langA.split('-')[0].toUpperCase()}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleSwapLanguages} style={styles.swapButton}>
                    <Ionicons name="swap-horizontal" size={28} color="#007AFF" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => { setLanguageModalType('userB'); setIsLanguageModalVisible(true); }} style={styles.languageButton}>
                    <Text style={styles.languageButtonText}>{langB.split('-')[0].toUpperCase()}</Text>
                </TouchableOpacity>
            </View>

            <ScrollView
                style={styles.conversationArea}
                ref={scrollViewRef}
                onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
            >
                {conversationTurns.map((turn) => (
                    <View key={turn.id} style={[styles.turnContainer, turn.speaker === 'userA' ? styles.userAContainer : styles.userBContainer]}>
                        <View style={styles.textBubble}>
                            <Text style={styles.originalText}>{turn.originalText}</Text>
                            <Text style={styles.translatedText}>{turn.translatedText}</Text>
                            <View style={styles.bubbleActions}>
                                <TouchableOpacity onPress={() => handleCopyToClipboard(turn.translatedText, 'Translation')}>
                                    <Ionicons name="copy-outline" size={22} color="#007AFF" />
                                </TouchableOpacity>
                                {turn.audioUri && (
                                    <View style={styles.playbackContainer}>
                                        <TouchableOpacity onPress={() => handlePlayback(turn.id)}>
                                            <Ionicons
                                                name={getPlayButtonIcon(turn)}
                                                size={24}
                                                color="#007AFF"
                                                style={{ marginLeft: 10 }}
                                            />
                                        </TouchableOpacity>
                                    </View>
                                )}
                            </View>
                        </View>
                    </View>
                ))}
                {isLoading && (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#007AFF" />
                    </View>
                )}
            </ScrollView>

            <View style={styles.inputContainer}>
                <View style={[styles.inputWrapper, styles.inputWrapperA]}>
                    <TextInput
                        style={styles.input}
                        value={textA}
                        onChangeText={setTextA}
                        placeholder={`User A (${langA})`}
                        onSubmitEditing={() => handleTextSubmit('userA')}
                    />
                    <TouchableOpacity onPress={() => handleRecord('userA')} style={styles.micButton}>
                        <Ionicons name="mic" size={24} color={isRecordingA ? "red" : "#007AFF"} />
                    </TouchableOpacity>
                </View>
                <View style={[styles.inputWrapper, styles.inputWrapperB]}>
                    <TextInput
                        style={styles.input}
                        value={textB}
                        onChangeText={setTextB}
                        placeholder={`User B (${langB})`}
                        onSubmitEditing={() => handleTextSubmit('userB')}
                    />
                    <TouchableOpacity onPress={() => handleRecord('userB')} style={styles.micButton}>
                        <Ionicons name="mic" size={24} color={isRecordingB ? "red" : "#007AFF"} />
                    </TouchableOpacity>
                </View>
            </View>
            <LanguageSelectionModal
                visible={isLanguageModalVisible}
                onClose={() => setIsLanguageModalVisible(false)}
                onSelectLanguage={handleSelectLanguage}
                languages={SUPPORTED_LANGUAGES}
            />
        </KeyboardAvoidingView>
    );
};

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
                onClose(); // Close modal after selection
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
                        initialNumToRender={15}
                        maxToRenderPerBatch={10}
                        windowSize={10}
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
        backgroundColor: '#F5F5F5',
    },
    conversationArea: {
        flex: 1,
        padding: 10,
    },
    turnContainer: {
        marginVertical: 5,
        maxWidth: '80%',
    },
    userAContainer: {
        alignSelf: 'flex-start',
    },
    userBContainer: {
        alignSelf: 'flex-end',
    },
    textBubble: {
        padding: 10,
        borderRadius: 15,
        backgroundColor: '#FFFFFF',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 1.41,
        elevation: 2,
    },
    originalText: {
        fontSize: 16,
        color: '#333',
    },
    translatedText: {
        fontSize: 16,
        color: '#007AFF',
        marginTop: 5,
        fontStyle: 'italic',
    },
    bubbleActions: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8,
    },
    playbackContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    inputContainer: {
        borderTopWidth: 1,
        borderTopColor: '#E0E0E0',
        padding: 10,
        backgroundColor: '#FFFFFF',
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F0F0F0',
        borderRadius: 20,
        paddingHorizontal: 10,
        marginBottom: 10,
    },
    inputWrapperA: {},
    inputWrapperB: {},
    input: {
        flex: 1,
        height: 40,
        fontSize: 16,
    },
    micButton: {
        padding: 5,
    },
    loadingContainer: {
        alignItems: 'center',
        padding: 20,
    },
    languageSelectorRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 20,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
    },
    languageButton: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        backgroundColor: '#F0F0F0',
        borderRadius: 20,
    },
    languageButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#007AFF',
        textTransform: 'uppercase',
    },
    swapButton: {
        padding: 10,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 20,
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
        borderColor: '#CCCCCC',
        borderRadius: 10,
        paddingHorizontal: 15,
        paddingVertical: 10,
        marginBottom: 15,
        fontSize: 16,
    },
    modalLanguageItem: {
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    modalLanguageText: {
        fontSize: 16,
        color: '#333333',
    },
    modalCloseButton: {
        marginTop: 15,
        backgroundColor: '#007AFF',
        paddingVertical: 12,
        borderRadius: 10,
        alignItems: 'center',
    },
    modalCloseButtonText: {
        color: '#FFFFFF',
        fontWeight: 'bold',
        fontSize: 16,
    },
});

export default ConversationScreen;