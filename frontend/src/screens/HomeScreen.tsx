import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput as RNTextInput,
  Button,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Image,
  Modal,
  FlatList,
  ActivityIndicator,
} from "react-native";
import * as Clipboard from "expo-clipboard";
import { Ionicons } from "@expo/vector-icons";
import {
  translateText,
  textToSpeech,
  ocr,
  speechToText,
  ApiResponse,
  createTranslation as apiCreateTranslation,
  TranslationResponse as ApiTranslationResponse,
} from "../services/apiService";
import {
  addHistoryItem,
  toggleFavorite,
  saveItemToFolder,
  getFolders,
  initializeDefaultFolder,
  createFolderOptimistic,
  FolderItem,
} from "../utils/storage";
import { InputType } from "../constants/enums";
import * as ImagePicker from "expo-image-picker";
import {
  Camera,
  PermissionStatus as CameraPermissionStatus,
  PermissionResponse as CameraPermissionResponse,
} from "expo-camera";
import {
  useAudioRecorder,
  AudioModule,
  useAudioPlayer,
  useAudioPlayerStatus,
} from "expo-audio";
import { optionsForRecorder } from "../../config/recordingOptions.config";
import { useAuth } from "../context/AuthContext";
import theme from "../constants/theme";
import * as FileSystem from "expo-file-system";
import { SUPPORTED_LANGUAGES, Language } from "../constants/languages";
import { Picker } from "@react-native-picker/picker";

const HomeScreen: React.FC = () => {
  const { user } = useAuth();
  const [currentPlaybackUri, setCurrentPlaybackUri] = useState<string | null>(
    null
  );
  const player = useAudioPlayer(currentPlaybackUri);
  const playerStatus = useAudioPlayerStatus(player);
  const [inputText, setInputText] = useState("");
  const [sourceLang, setSourceLang] = useState("en-US");
  const [targetLang, setTargetLang] = useState("es-ES");
  const [resultText, setResultText] = useState("");
  const [currentApiTranslation, setCurrentApiTranslation] =
    useState<ApiTranslationResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [shouldPlayNextUri, setShouldPlayNextUri] = useState<boolean>(false);

  // State for Save to Folder Modal
  const [isSaveModalVisible, setIsSaveModalVisible] = useState(false);
  const [itemToSave, setItemToSave] = useState<ApiTranslationResponse | null>(
    null
  );
  const [userFolders, setUserFolders] = useState<FolderItem[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<string>("");
  const [isFoldersLoading, setIsFoldersLoading] = useState(false);

  // Other state variables from original component
  const audioRecorder = useAudioRecorder(optionsForRecorder);
  const [isRecording, setIsRecording] = useState(false);
  const [audioUri, setAudioUri] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] =
    useState<ImagePicker.ImagePickerAsset | null>(null);
  const [isLanguageModalVisible, setIsLanguageModalVisible] = useState(false);
  const [languageModalType, setLanguageModalType] = useState<
    "source" | "target" | null
  >(null);

  useEffect(() => {
    // Initialize default folder on component mount to ensure it's available
    initializeDefaultFolder();

    // Request permissions
    Camera.requestCameraPermissionsAsync();
    AudioModule.requestRecordingPermissionsAsync();

    if (user?.preferences) {
      if (user.preferences.preferredSourceLang)
        setSourceLang(user.preferences.preferredSourceLang);
      if (user.preferences.preferredTargetLang)
        setTargetLang(user.preferences.preferredTargetLang);
    }
  }, [user]);

  useEffect(() => {
    if (shouldPlayNextUri && currentPlaybackUri && player) {
      console.log(`Playing audio from: ${currentPlaybackUri}`);
      player.play();
      setShouldPlayNextUri(false); // Reset the flag
    }
  }, [currentPlaybackUri, shouldPlayNextUri, player]);

  const handleApiTranslationSuccess = async (
    original: string,
    translated: string,
    from: string,
    to: string,
    inputType: InputType
  ) => {
    // 1. Immediately display the translation to the user.
    setResultText(translated);

    // 2. Create a temporary translation object to update the UI state instantly.
    // This makes features like 'Favorite' and 'Save' available right away.
    const optimisticTranslation: ApiTranslationResponse = {
      id: `temp-${Date.now()}`, // A temporary ID for local state management
      sourceText: original,
      targetText: translated,
      sourceLang: from,
      targetLang: to,
      inputType: inputType,
      isFavorite: false, // Assume it's not a favorite initially
      isSaved: false, // Assume it's not saved initially
      createdAt: new Date().toISOString(),
    };

    setCurrentApiTranslation(optimisticTranslation);
    setIsFavorite(optimisticTranslation.isFavorite);

    // 3. Immediately add the item to the local history for a snappy UI response.
    await addHistoryItem(optimisticTranslation);

    // 4. Perform the backend save operation in the background (fire-and-forget).
    // We do not 'await' this call, so the UI is not blocked.
    apiCreateTranslation({
      sourceText: original,
      targetText: translated,
      sourceLang: from,
      targetLang: to,
      inputType: inputType,
    })
      .then((backendTranslation) => {
        // 5. Once the backend responds, update the UI with the real data from the server.
        // This replaces the temporary data with the permanent, server-confirmed data.
        setCurrentApiTranslation(backendTranslation);
        setIsFavorite(backendTranslation.isFavorite);
        // Optionally, you can update the item in the history with the real ID.
        // This would require a function like `updateHistoryItem(tempId, newIte)`.
      })
      .catch((error) => {
        // 6. If the background save fails, inform the user without disrupting their flow.
        // console.error('Failed to save translation to backend', error);
        // Alert.alert('Offline', 'Translation shown, but failed to save to your online history.');
        // You might want to remove the optimistic item from history here if the save fails.
      });
  };

  const handleTranslate = async (inputType: InputType, text: string) => {
    if (!text.trim()) return;
    setIsLoading(true);
    setCurrentApiTranslation(null);
    try {
      const response = await translateText({ text, sourceLang, targetLang });
      if (response.success && typeof response.message === "string") {
        await handleApiTranslationSuccess(
          text,
          response.message,
          sourceLang,
          targetLang,
          inputType
        );
      } else {
        setResultText("");
        Alert.alert(
          "Translation Error",
          response.message || "Failed to translate text."
        );
      }
    } catch (error: any) {
      setResultText("");
      //console.error('Translate API error', error);
      Alert.alert(
        "API Error",
        error.response?.data?.message ||
          error.message ||
          "An unexpected error occurred."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleSpeechToText = async (uri: string) => {
    if (!uri || typeof uri !== "string" || !uri.trim()) {
      Alert.alert("Error", "No valid audio URI provided for transcription.");
      // console.error('[HomeScreen] handleSpeechToText: Invalid URI received:', uri);
      return;
    }
    console.log(
      `[HomeScreen] handleSpeechToText: Transcribing audio from: ${uri}`
    );
    setIsLoading(true);
    setResultText("");
    setCurrentApiTranslation(null);
    setIsFavorite(false);

    try {
      // Add a small delay to allow file system to catch up
      await new Promise((resolve) => setTimeout(resolve, 500));

      let fileInfo = await FileSystem.getInfoAsync(uri);
      console.log(
        "[HomeScreen] handleSpeechToText: FileInfo for " +
          uri +
          " (after delay):",
        JSON.stringify(fileInfo)
      );

      if (!fileInfo.exists) {
        console.warn(
          `[HomeScreen] handleSpeechToText: File does not exist at ${uri} after delay.`
        );
        const parentDirUri = uri.substring(0, uri.lastIndexOf("/"));
        console.log(
          `[HomeScreen] handleSpeechToText: Parent directory URI: ${parentDirUri}`
        );

        try {
          const parentDirInfo = await FileSystem.getInfoAsync(parentDirUri);
          console.log(
            `[HomeScreen] handleSpeechToText: Info for parent directory ${parentDirUri}:`,
            JSON.stringify(parentDirInfo)
          );

          if (parentDirInfo.exists && parentDirInfo.isDirectory) {
            console.log(
              `[HomeScreen] handleSpeechToText: Attempting to list contents of parent directory: ${parentDirUri}`
            );
            const dirContents =
              await FileSystem.readDirectoryAsync(parentDirUri);
            console.log(
              `[HomeScreen] handleSpeechToText: Contents of ${parentDirUri}:`,
              dirContents
            );
          } else {
            console.warn(
              `[HomeScreen] handleSpeechToText: Parent directory ${parentDirUri} does not exist or is not a directory.`
            );
          }

          // Re-check fileInfo after attempting to interact with parent directory
          fileInfo = await FileSystem.getInfoAsync(uri);
          console.log(
            "[HomeScreen] handleSpeechToText: FileInfo after parent dir check:",
            JSON.stringify(fileInfo)
          );
          if (!fileInfo.exists) {
            Alert.alert(
              "File Error",
              `Audio file not found at ${uri}. Directory logs captured.`
            );
            setIsLoading(false);
            return;
          }
        } catch (dirError: any) {
          // console.error(`[HomeScreen] handleSpeechToText: Error accessing/reading parent directory ${parentDirUri}:`, dirError.message, dirError.stack);
          // Alert.alert('File System Error', `Could not access parent directory ${parentDirUri}. Error: ${dirError.message}`);
          setIsLoading(false);
          return;
        }
      }
      const fileData = {
        uri: uri,
        name:
          uri.split("/").pop() || Platform.OS === "ios"
            ? "recording.wav"
            : "recording.3gp",
        type: Platform.OS === "ios" ? "audio/wav" : "audio/awb", // Ensure this matches your recording options
      } as any;

      const transcriptionResult = await speechToText(
        fileData as unknown as File,
        sourceLang.split("-")[0]
      );
      console.log(
        "Transcription Result from API:",
        JSON.stringify(transcriptionResult)
      );

      if (transcriptionResult && transcriptionResult.success) {
        // Assuming the transcription is in the 'message' field for successful responses
        // Or if there's a specific data field, e.g., transcriptionResult.data.transcription
        const transcribedText = transcriptionResult.message; // Adjust if backend sends it differently
        setInputText(transcribedText);
        // Automatically translate the transcribed text
        await handleTranslate(InputType.TEXT, transcribedText);
      } else {
        Alert.alert(
          "Transcription Failed",
          transcriptionResult.message || "Could not transcribe audio."
        );
        setInputText(""); // Clear input text on failure
      }
    } catch (error: any) {
      // console.error('[HomeScreen] Speech to text error:', error);
      Alert.alert("Error", error.message || "Failed to transcribe audio.");
      setInputText(""); // Clear input text on error
    } finally {
      setIsLoading(false);
    }
  };

  const handleTextToSpeech = async (
    textToPlay: string,
    languageCodeParam?: string
  ) => {
    // Determine the language code for the TTS API call
    const effectiveLanguageCode =
      languageCodeParam ||
      (textToPlay === resultText ? targetLang : sourceLang);

    console.log(
      `handleTextToSpeech called with text: "${textToPlay}", languageCode: "${effectiveLanguageCode}"`
    );

    if (!textToPlay.trim() || isLoading) return;
    if (!user) {
      Alert.alert("Authentication Error", "User not found.");
      return;
    }

    // Stop any currently playing audio before starting new one
    if (player && playerStatus.isLoaded) {
      try {
        await player.pause();
      } catch (e) {
        console.log("No audio was playing to pause");
      }
    }

    setIsLoading(true);
    try {
      const ttsRequest = {
        text: textToPlay,
        languageCode: effectiveLanguageCode,
      };
      const apiResponse = await textToSpeech(ttsRequest);

      if (
        apiResponse.success &&
        apiResponse.message === "TTS_AUDIO_GENERATED" &&
        typeof apiResponse.data === "string"
      ) {
        const base64AudioData = apiResponse.data;
        const tempAudioFileName = `tts_audio_${Date.now()}.mp3`;
        const tempAudioUri = FileSystem.documentDirectory + tempAudioFileName;

        try {
          // Write the base64 audio data to file
          await FileSystem.writeAsStringAsync(tempAudioUri, base64AudioData, {
            encoding: FileSystem.EncodingType.Base64,
          });

          // Verify file was created
          const fileInfo = await FileSystem.getInfoAsync(tempAudioUri);
          if (!fileInfo.exists) {
            throw new Error("Audio file was not created successfully");
          }

          console.log(
            `Audio file created successfully at: ${tempAudioUri}, size: ${fileInfo.size} bytes`
          );

          // Clean up previous audio file if it exists
          if (currentPlaybackUri && currentPlaybackUri !== tempAudioUri) {
            try {
              const oldFileInfo =
                await FileSystem.getInfoAsync(currentPlaybackUri);
              if (oldFileInfo.exists) {
                await FileSystem.deleteAsync(currentPlaybackUri, {
                  idempotent: true,
                });
                console.log(`Cleaned up old audio file: ${currentPlaybackUri}`);
              }
            } catch (cleanupError) {
              console.log("Failed to cleanup old audio file:", cleanupError);
            }
          }

          // Set the new URI and trigger playback
          setCurrentPlaybackUri(tempAudioUri);
          setShouldPlayNextUri(true);
        } catch (fileError) {
          // console.error('Error writing audio file:', fileError);
          Alert.alert("File Error", "Failed to save audio file for playback.");
        }
      } else if (!apiResponse.success) {
        // Handle specific TTS errors
        if (apiResponse.message === "TTS_UNAVAILABLE") {
          Alert.alert(
            "Text-to-Speech Unavailable",
            (apiResponse.data as string) ||
              "TTS is not available for the selected language."
          );
        } else if (apiResponse.message === "GENERAL_TTS_ERROR") {
          Alert.alert(
            "Text-to-Speech Error",
            (apiResponse.data as string) ||
              "An error occurred during text-to-speech conversion."
          );
        } else {
          Alert.alert(
            "Text-to-Speech Error",
            apiResponse.message || "Failed to retrieve audio data."
          );
        }
      } else {
        // console.error('Unexpected API response structure for TTS:', apiResponse);
        Alert.alert(
          "Text-to-Speech Error",
          "Received an unexpected response from the server."
        );
      }
    } catch (error: any) {
      // console.error('Text-to-Speech API error:', error);
      Alert.alert(
        "Text-to-Speech Error",
        error.message || "Could not convert text to speech."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleFavorite = async () => {
    if (!currentApiTranslation) return;

    // --- OFFLINE-FIRST FAVORITE TOGGLE ---
    // 1. Immediately update the UI state for instant feedback
    const newFavoriteState = !isFavorite;
    setIsFavorite(newFavoriteState);

    // 2. Call the offline-first storage function
    try {
      await toggleFavorite(currentApiTranslation);
    } catch (e) {
      // If the local storage update fails, revert the UI and show an error
      // console.error("Failed to update favorite status locally.", e);
      setIsFavorite(!newFavoriteState);
      // Alert.alert("Error", "Could not update favorite status.");
    }
  };

  const openSaveModal = async (item: ApiTranslationResponse) => {
    setItemToSave(item);
    setIsFoldersLoading(true);

    try {
      const defaultFolder = await initializeDefaultFolder();
      const folders = await getFolders();
      console.log("Loaded folders for save modal:", folders);

      setUserFolders(folders);

      const found = folders.find((f) => f.id === defaultFolder.id);
      setSelectedFolderId(
        found ? String(found.id) : folders[0] ? String(folders[0].id) : ""
      );

      setIsSaveModalVisible(true);
    } catch (error) {
      Alert.alert("Error", "Could not load your folders.");
    } finally {
      setIsFoldersLoading(false);
    }
  };

  // Replace the entire openSaveModal function with this one

  const handleCreateNewFolderInPopup = () => {
    Alert.prompt(
      "New Folder",
      "Enter a name for your new folder:",
      async (folderName) => {
        if (folderName) {
          try {
            // This call will now return almost instantly
            const newFolder = await createFolderOptimistic(folderName);

            // The UI state updates immediately
            setUserFolders((prev) => [...prev, newFolder]);
            setSelectedFolderId(newFolder.id);
            Alert.alert(
              "Success",
              `Folder "${folderName}" created and selected.`
            );
          } catch (err: any) {
            Alert.alert("Error", `Could not create folder: ${err.message}`);
          }
          // The loading state is no longer necessary here as the process is instantaneous.
        }
      }
    );
  };

  const handleSaveItem = async () => {
    if (!itemToSave || !selectedFolderId) {
      Alert.alert("Error", "No item or folder selected.");
      return;
    }
    setIsLoading(true);
    try {
      await saveItemToFolder(itemToSave, selectedFolderId);
      Alert.alert("Success", "Item saved successfully!");
      setIsSaveModalVisible(false);
      setItemToSave(null);
    } catch (err: any) {
      Alert.alert("Error", "Could not save item.");
    } finally {
      setIsLoading(false);
    }
  };

  // --- ALL ORIGINAL UI HANDLERS ARE PRESERVED ---

  const handleCopyTranslatedText = async () => {
    if (resultText && resultText.trim() !== "") {
      await Clipboard.setStringAsync(resultText);
      Alert.alert("Copied!", "Translated text copied to clipboard.");
    } else {
      Alert.alert("Nothing to Copy", "There is no translated text to copy.");
    }
  };

  const handleCopyInputText = async () => {
    if (inputText && inputText.trim() !== "") {
      await Clipboard.setStringAsync(inputText);
      Alert.alert("Copied!", "Input text copied to clipboard.");
    } else {
      Alert.alert("Nothing to Copy", "There is no input text to copy.");
    }
  };

  const handleSelectLanguage = (language: Language) => {
    if (languageModalType === "source") setSourceLang(language.code);
    else if (languageModalType === "target") setTargetLang(language.code);
    setResultText("");
    setCurrentApiTranslation(null);
    setIsLanguageModalVisible(false);
  };

  const handleSwapLanguages = () => {
    setSourceLang(targetLang);
    setTargetLang(sourceLang);
    setResultText("");
    setCurrentApiTranslation(null);
  };

  // Media and recording handlers remain unchanged
  const handleImageOcrAndTranslate = async (
    imageAsset: ImagePicker.ImagePickerAsset
  ) => {
    if (!imageAsset.uri) {
      Alert.alert("Error", "Image URI is missing.");
      return;
    }
    setIsLoading(true);
    try {
      const file = {
        uri: imageAsset.uri,
        name:
          imageAsset.fileName || imageAsset.uri.split("/").pop() || "photo.jpg",
        type: imageAsset.mimeType || "image/jpeg",
      } as any;

      const ocrResponse: ApiResponse = await ocr(file);

      if (ocrResponse?.success) {
        const extractedText = ocrResponse.message;
        setInputText(extractedText);
        await handleTranslate(InputType.IMAGE, extractedText);
      } else {
        Alert.alert(
          "OCR Failed",
          ocrResponse.message || "Could not extract text from image."
        );
      }
    } catch (error: any) {
      console.error("Error during OCR or translation:", error);
      Alert.alert(
        "Processing Error",
        error.message || "Failed to process image."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const startRecording = async () => {
    try {
      await audioRecorder.prepareToRecordAsync();
      audioRecorder.record();
      setIsRecording(true);
    } catch (err: any) {
      Alert.alert(
        "Recording Error",
        `Failed to start recording: ${err.message}`
      );
    }
  };

  const stopRecording = async () => {
    if (!audioRecorder.isRecording) return;
    setIsRecording(false);
    try {
      await audioRecorder.stop();
      const uri = `file:///${audioRecorder.uri}`;
      if (uri) await handleSpeechToText(uri);
    } catch (error: any) {
      Alert.alert("Error", `Failed to stop recording: ${error.message}`);
    }
  };

  const handleAudioRecord = () =>
    isRecording ? stopRecording() : startRecording();

  const handleTakePicture = async () => {
    const result = await ImagePicker.launchCameraAsync({ quality: 0.8 });
    if (!result.canceled) await handleImageOcrAndTranslate(result.assets[0]);
  };

  const handleSelectImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ quality: 0.8 });
    if (!result.canceled) await handleImageOcrAndTranslate(result.assets[0]);
  };

  const prepareForMediaInput = () => {
    setInputText("");
    setResultText("");
    setCurrentApiTranslation(null);
    setSelectedImage(null);
    setAudioUri(null);
  };

  // ... handleSpeechToText and handleTextToSpeech logic remains ...

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
            <TouchableOpacity
              onPress={() => {
                setLanguageModalType("source");
                setIsLanguageModalVisible(true);
              }}
              style={styles.languageButton}
            >
              <Text style={styles.languageButtonText}>
                {sourceLang.split("-")[0].toUpperCase()}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleSwapLanguages}
              style={{ padding: theme.spacing.sm }}
            >
              <Ionicons
                name="swap-horizontal"
                size={28}
                color={theme.colors.primaryOrange}
              />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                setLanguageModalType("target");
                setIsLanguageModalVisible(true);
              }}
              style={styles.languageButton}
            >
              <Text style={styles.languageButtonText}>
                {targetLang.split("-")[0].toUpperCase()}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.inputHeaderActions}>
            <Text style={styles.inputLangText}>
              {sourceLang.split("-")[0].toUpperCase()} Input
            </Text>
            <View style={styles.resultIcons}>
              <TouchableOpacity
                onPress={() => {
                  handleTextToSpeech(inputText, sourceLang);
                }}
                style={styles.iconButton}
                disabled={!inputText.trim()}
              >
                <Ionicons
                  name="volume-high-outline"
                  size={24}
                  color={
                    !inputText.trim()
                      ? theme.colors.mediumGray
                      : theme.colors.primaryOrange
                  }
                />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleCopyInputText}
                style={styles.iconButton}
                disabled={!inputText.trim()}
              >
                <Ionicons
                  name="copy-outline"
                  size={24}
                  color={
                    !inputText.trim()
                      ? theme.colors.mediumGray
                      : theme.colors.primaryOrange
                  }
                />
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
            <TouchableOpacity
              onPress={() => setInputText("")}
              style={styles.clearInputButton}
            >
              <Ionicons
                name="close-circle"
                size={24}
                color={theme.colors.mediumGray}
              />
            </TouchableOpacity>
          ) : null}

          {isLoading && (
            <ActivityIndicator
              size="large"
              color={theme.colors.primaryOrange}
              style={styles.activityIndicator}
            />
          )}

          {resultText && !isLoading && (
            <View style={styles.resultDisplayCard}>
              <View style={styles.resultHeaderActions}>
                <Text style={styles.resultLangText}>
                  {targetLang.split("-")[0].toUpperCase()} Translation
                </Text>
                <View style={styles.resultIcons}>
                  <TouchableOpacity
                    onPress={() => handleTextToSpeech(resultText, targetLang)}
                    style={styles.iconButton}
                  >
                    <Ionicons
                      name="volume-high-outline"
                      size={24}
                      color={theme.colors.primaryOrange}
                    />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleCopyTranslatedText}
                    style={styles.iconButton}
                  >
                    <Ionicons
                      name="copy-outline"
                      size={24}
                      color={theme.colors.primaryOrange}
                    />
                  </TouchableOpacity>
                  {currentApiTranslation && (
                    <>
                      <TouchableOpacity
                        onPress={handleToggleFavorite}
                        style={styles.iconButton}
                      >
                        <Ionicons
                          name={isFavorite ? "heart" : "heart-outline"}
                          size={24}
                          color={theme.colors.primaryOrange}
                        />
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => openSaveModal(currentApiTranslation)}
                        style={styles.iconButton}
                      >
                        <Ionicons
                          name="bookmark-outline"
                          size={24}
                          color={theme.colors.primaryOrange}
                        />
                      </TouchableOpacity>
                    </>
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
          >
            <Ionicons
              name={isRecording ? "mic" : "mic"}
              size={28}
              color={theme.colors.primaryOrange}
            />
            <Text style={styles.actionButtonText}>
              {isRecording ? "Stop" : "Record"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              prepareForMediaInput();
              handleTakePicture();
            }}
            style={styles.actionButton}
          >
            <Ionicons
              name="camera-outline"
              size={28}
              color={theme.colors.primaryOrange}
            />
            <Text style={styles.actionButtonText}>Camera</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              prepareForMediaInput();
              handleSelectImage();
            }}
            style={styles.actionButton}
          >
            <Ionicons
              name="image-outline"
              size={28}
              color={theme.colors.primaryOrange}
            />
            <Text style={styles.actionButtonText}>Gallery</Text>
          </TouchableOpacity>
        </View>

        <View
          style={[
            styles.actionButtonsContainer,
            { marginTop: theme.spacing.sm },
          ]}
        >
          <TouchableOpacity
            onPress={() => handleTranslate(InputType.TEXT, inputText)}
            style={[
              styles.actionButton,
              {
                backgroundColor: theme.colors.white,
                flex: 1,
                marginHorizontal: theme.spacing.md,
              },
            ]}
            disabled={
              isLoading || (!inputText.trim() && !audioUri && !selectedImage)
            }
          >
            <Ionicons
              name="language-outline"
              size={28}
              color={theme.colors.primaryOrange}
            />
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

      <Modal
        animationType="slide"
        transparent={true}
        visible={isSaveModalVisible}
        onRequestClose={() => setIsSaveModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Save to Folder</Text>
            {isFoldersLoading ? (
              <ActivityIndicator />
            ) : (
              <>
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={selectedFolderId}
                    onValueChange={(itemValue: string) =>
                      setSelectedFolderId(itemValue)
                    }
                  >
                    {userFolders.map((folder) => (
                      <Picker.Item
                        key={String(folder.id)}
                        label={folder.name}
                        value={String(folder.id)}
                      />
                    ))}
                  </Picker>
                </View>
                <View style={styles.modalButtonContainer}>
                  <Button
                    title="New Folder"
                    onPress={handleCreateNewFolderInPopup}
                  />
                </View>
              </>
            )}
            <View style={styles.modalButtonContainer}>
              <Button
                title="Cancel"
                onPress={() => setIsSaveModalVisible(false)}
                color="#888"
              />
              <Button
                title="Save"
                onPress={handleSaveItem}
                disabled={isFoldersLoading || !selectedFolderId}
              />
            </View>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
};

// LanguageSelectionModal and styles remain unchanged from the original file.

const LanguageSelectionModal: React.FC<{
  visible: boolean;
  onClose: () => void;
  onSelectLanguage: (language: Language) => void;
  languages: Language[];
}> = ({ visible, onClose, onSelectLanguage, languages }) => {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredLanguages = languages.filter(
    (lang) =>
      lang.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lang.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const renderItem = ({ item }: { item: Language }) => (
    <TouchableOpacity
      style={styles.modalLanguageItem}
      onPress={() => {
        onSelectLanguage(item);
        // This modal also calls onClose directly, which is fine.
        onClose();
      }}
    >
      <Text style={styles.modalLanguageText}>
        {item.name} ({item.code.toUpperCase()})
      </Text>
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
  container: { flex: 1, backgroundColor: theme.colors.lightGray },
  scrollContentContainer: { paddingBottom: theme.spacing.lg },
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
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
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
    textTransform: "uppercase",
  },
  inputHeaderActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
  },
  inputLangText: {
    ...theme.typography.caption,
    color: theme.colors.primaryOrange,
    fontWeight: "bold",
    textTransform: "uppercase",
  },
  textInputArea: {
    ...theme.typography.h3,
    color: theme.colors.darkGray,
    minHeight: 100,
    textAlignVertical: "top",
    padding: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  clearInputButton: {
    position: "absolute",
    top: theme.spacing.lg + 94,
    right: theme.spacing.md,
  },
  activityIndicator: { marginVertical: theme.spacing.md },
  resultDisplayCard: {
    backgroundColor: theme.colors.lightGray,
    borderRadius: theme.borders.radiusMedium,
    padding: theme.spacing.md,
    marginTop: theme.spacing.md,
  },
  resultHeaderActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing.sm,
  },
  resultLangText: {
    ...theme.typography.caption,
    color: theme.colors.primaryOrange,
    fontWeight: "bold",
    textTransform: "uppercase",
  },
  resultIcons: { flexDirection: "row" },
  iconButton: { padding: theme.spacing.sm, marginLeft: theme.spacing.sm },
  translatedText: { ...theme.typography.h3, color: theme.colors.darkGray },
  actionButtonsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginHorizontal: theme.spacing.md,
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  actionButton: {
    backgroundColor: theme.colors.white,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.sm,
    borderRadius: theme.borders.radiusLarge,
    alignItems: "center",
    justifyContent: "center",
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
  // Modal styles (for both modals)
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borders.radiusLarge,
    padding: theme.spacing.lg,
    width: "90%",
    maxHeight: "80%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 5,
    marginBottom: 15,
  },
  modalButtonContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 20,
  },
  // Style that was causing the error, now corrected
  languageItemText: {
    ...theme.typography.body1, // FIX: Changed 'body' to 'body1'
    color: theme.colors.darkGray,
    textAlign: "center",
  },
  // Styles for the new Language Selection Modal
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
    paddingVertical: theme.spacing.sm,
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
    alignItems: "center",
  },
  modalCloseButtonText: {
    color: theme.colors.white,
    fontSize: 16,
    fontWeight: "600",
  },
});

export default HomeScreen;
