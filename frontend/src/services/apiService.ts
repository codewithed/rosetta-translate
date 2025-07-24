import axios from 'axios';
import { API_BASE_URL, AUTH_BASE_URL } from '../constants/api';
import { InputType } from '../constants/enums';

// TODO: Implement a proper way to store and retrieve the auth token (e.g., AsyncStorage)
let authToken: string | null = null; // This should ideally be loaded from AsyncStorage on app start

const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

const authApiClient = axios.create({
    baseURL: AUTH_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

apiClient.interceptors.request.use(
    (config) => {
        console.log('[API Interceptor] Request URL:', config.url);
        if (authToken) {
            config.headers.Authorization = `Bearer ${authToken}`;
            console.log('[API Interceptor] Authorization header set for URL:', config.url);
        } else {
            console.warn('[API Interceptor] No authToken found. Request to', config.url, 'will be unauthenticated.');
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// --- Auth Services ---
export interface LoginRequest {
    usernameOrEmail: string;
    password: string;
}

export interface SignUpRequest {
    username: string; 
    email: string;
    password: string;
}

export interface JwtAuthenticationResponse {
    accessToken: string;
    tokenType?: string; // Usually 'Bearer'
}

export interface ApiResponse<T = any> {
    success: boolean;
    message: string;
    data?: T;
}

export const login = async (credentials: LoginRequest): Promise<JwtAuthenticationResponse> => {
    const response = await authApiClient.post<JwtAuthenticationResponse>('/login', credentials);
    if (response.data.accessToken) {
        authToken = response.data.accessToken; // Store token
        // TODO: Persist token to AsyncStorage
    }
    return response.data;
};

export const signUp = async (userData: SignUpRequest): Promise<ApiResponse> => {
    const response = await authApiClient.post<ApiResponse>('/register', userData);
    return response.data;
};

export const logout = async (): Promise<void> => {
    authToken = null;
    // TODO: Remove token from AsyncStorage
};

// --- Translation Services ---
interface TranslateApiRequest {
    text: string;
    sourceLang?: string; // Optional, backend might auto-detect
    targetLang: string;
}

export const translateText = async (data: TranslateApiRequest): Promise<ApiResponse> => {
    const response = await apiClient.post<ApiResponse>('/translate', data);
    return response.data;
};

interface TtsApiRequest {
    text: string;
    languageCode: string;
}


export const textToSpeech = async (data: TtsApiRequest): Promise<ApiResponse<string>> => {
    const response = await apiClient.post<ApiResponse<string>>('/tts', data, {
        responseType: 'json', // Expect JSON response from backend
    });

    const apiResponse = response.data;

    if (apiResponse.success && apiResponse.message === "TTS_AUDIO_GENERATED" && typeof apiResponse.data === 'string') {
        // Data is already the Base64 string, return as is
        return apiResponse; // apiResponse.data is already the base64 string
    } else {
        // For TTS_UNAVAILABLE or other errors, data is already a string (user message or error detail)
        return apiResponse as ApiResponse<string>; 
    }

};

export const ocr = async (file: any): Promise<ApiResponse> => {
    console.log('[OCR Service] Attempting OCR. Current in-memory authToken:', authToken);
    const formData = new FormData();
    formData.append('file', file);

    const response = await apiClient.post<ApiResponse>('/ocr', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
    return response.data;
};

export const speechToText = async (file: any, languageCode:string): Promise<ApiResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('languageCode', languageCode);

    const response = await apiClient.post<ApiResponse>('/speech', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
    return response.data;
};

// Helper to update auth token (e.g., after login)
export const setAuthToken = (token: string | null) => {
    authToken = token;
};

export const getAuthToken = (): string | null => {
    return authToken;
}

// --- User Services ---
export interface UserPreferenceData {
    preferredSourceLang?: string | null;
    preferredTargetLang?: string | null;
}

export interface UserProfile {
    id: string;
    username: string;
    email: string;
    createdAt: string; // ISO date string
    lastLogin?: string | null; // ISO date string
    preferences: UserPreferenceData;
    settings?: string | null; // JSON string for other settings
}

export interface UserProfileUpdateRequest {
    preferences?: UserPreferenceData;
    settings?: string; // Must be a valid JSON string if provided
}

export const getUserProfile = async (): Promise<UserProfile> => {
    if (!authToken) throw new Error('No auth token available for getUserProfile');
    const response = await apiClient.get<UserProfile>('/user/me');
    return response.data;
};

export const updateUserProfile = async (profileData: UserProfileUpdateRequest): Promise<UserProfile> => {
    if (!authToken) throw new Error('No auth token available for updateUserProfile');
    const response = await apiClient.put<UserProfile>('/user/me', profileData);
    return response.data;
};

// Enum for Speaker, matching backend (A or B)
export enum Speaker {
    A = 'A',
    B = 'B',
}

// --- Translation History/Persistence Services ---
export interface CreateTranslationPayload {
    sourceText: string;
    targetText: string;
    sourceLang: string;
    targetLang: string;
    inputType: InputType;
}

export interface TranslationResponse {
    id: string;
    sourceText: string;
    targetText: string;
    sourceLang: string;
    targetLang: string;
    inputType: InputType;
    isFavorite: boolean;
    isSaved: boolean;
    tags?: string | null;
    createdAt: string; 
}

export interface Page<T> {
    content: T[];
    pageable: {
        sort: {
            sorted: boolean;
            unsorted: boolean;
            empty: boolean;
        };
        offset: number;
        pageNumber: number;
        pageSize: number;
        paged: boolean;
        unpaged: boolean;
    };
    last: boolean;
    totalPages: number;
    totalElements: number;
    size: number;
    number: number; 
    sort: {
        sorted: boolean;
        unsorted: boolean;
        empty: boolean;
    };
    first: boolean;
    numberOfElements: number;
    empty: boolean;
}

export const createTranslation = async (payload: CreateTranslationPayload): Promise<TranslationResponse> => {
    if (!authToken) throw new Error('No auth token available');
    const response = await apiClient.post<TranslationResponse>('/translations', payload);
    return response.data;
};

export const getTranslations = async (page: number = 0, size: number = 20): Promise<Page<TranslationResponse>> => {
    if (!authToken) throw new Error('No auth token available');
    const response = await apiClient.get<Page<TranslationResponse>>(`/translations?page=${page}&size=${size}`);
    return response.data;
};

export const deleteTranslation = async (id: string): Promise<ApiResponse> => {
    if (!authToken) throw new Error('No auth token available');
    const response = await apiClient.delete<ApiResponse>(`/translations/${id}`);
    return response.data;
};

export const toggleFavoriteTranslation = async (id: string): Promise<TranslationResponse> => {
    if (!authToken) throw new Error('No auth token available');
    const response = await apiClient.patch<TranslationResponse>(`/translations/${id}/favorite`, {});
    return response.data;
};

// --- Folder Services ---
export interface FolderCreatePayload {
    name: string;
    parentFolderId?: string | null;
}

export interface FolderResponse {
    id: string;
    name: string;
    parentFolderId?: string | null;
    createdAt: string; // ISO date string
    // subFolders and itemCount could be added if API supports them directly
}

export const createFolder = async (payload: FolderCreatePayload): Promise<FolderResponse> => {
    if (!authToken) throw new Error('No auth token available');
    const response = await apiClient.post<FolderResponse>('/folders', payload);
    return response.data;
};

export const getFolders = async (parentFolderId?: string | null): Promise<FolderResponse[]> => {
    if (!authToken) throw new Error('No auth token available');
    const params = parentFolderId ? { parentFolderId } : {};
    const response = await apiClient.get<FolderResponse[]>('/folders', { params });
    return response.data;
};

export const updateFolder = async (folderId: string, payload: { name: string }): Promise<FolderResponse> => {
    if (!authToken) throw new Error('No auth token available');
    const response = await apiClient.put<FolderResponse>(`/folders/${folderId}`, payload);
    return response.data;
};

export const deleteFolder = async (folderId: string): Promise<ApiResponse> => {
    if (!authToken) throw new Error('No auth token available');
    const response = await apiClient.delete<ApiResponse>(`/folders/${folderId}`);
    return response.data;
};

// --- SavedItem Services ---
export enum SavedItemCategory {
    PHRASE = 'PHRASE',
    WORD = 'WORD',
    SENTENCE = 'SENTENCE',
    PARAGRAPH = 'PARAGRAPH',
    TRANSCRIPT = 'TRANSCRIPT'
}

export interface SavedItemCreatePayload {
    translationId: string;
    category: SavedItemCategory;
    folderId?: string | null;
    name?: string;
    notes?: string;
}

export interface SavedItemUpdatePayload {
    name?: string;
    notes?: string;
    folderId?: string | null;
    setFolderIdNull?: boolean; // To explicitly move to root
}

export interface SavedItemResponse {
    id: string;
    translation: TranslationResponse; // Nested translation details
    folderId?: string | null;
    folderName?: string | null;
    name?: string;
    notes?: string;
    createdAt: string; // ISO date string
}

export const createSavedItem = async (payload: SavedItemCreatePayload): Promise<SavedItemResponse> => {
    if (!authToken) throw new Error('No auth token available');
    const response = await apiClient.post<SavedItemResponse>('/saved-items', payload);
    return response.data;
};

export const getSavedItems = async (
    category?: SavedItemCategory,
    folderId?: string | null,
    page: number = 0,
    size: number = 20,
    isFavorite?: boolean
): Promise<Page<SavedItemResponse>> => {
    if (!authToken) throw new Error('No auth token available');
    const params: any = { page, size };
    if (category) params.category = category;
    if (folderId) params.folderId = folderId;
    if (isFavorite !== undefined) params.isFavorite = isFavorite; // Pass the isFavorite flag to the backend
    const response = await apiClient.get<Page<SavedItemResponse>>('/saved-items', { params });
    return response.data;
};

export const getSavedItemDetails = async (savedItemId: string): Promise<SavedItemResponse> => {
    if (!authToken) throw new Error('No auth token available');
    const response = await apiClient.get<SavedItemResponse>(`/saved-items/${savedItemId}`);
    return response.data;
};

export const updateSavedItem = async (savedItemId: string, payload: SavedItemUpdatePayload): Promise<SavedItemResponse> => {
    if (!authToken) throw new Error('No auth token available');
    const response = await apiClient.put<SavedItemResponse>(`/saved-items/${savedItemId}`, payload);
    return response.data;
};

export const deleteSavedItem = async (savedItemId: string): Promise<ApiResponse> => {
    if (!authToken) throw new Error('No auth token available');
    const response = await apiClient.delete<ApiResponse>(`/saved-items/${savedItemId}`);
    return response.data;
};

// --- Conversation Services ---
export interface ConversationSessionCreatePayload {
    languageA: string;
    languageB: string;
    title?: string;
}

export interface ConversationMessageCreatePayload {
    sessionId: string;
    speaker: Speaker;
    originalText: string;
}

export interface ConversationMessageResponse {
    id: string;
    sessionId: string;
    speaker: Speaker;
    originalText: string;
    translatedText?: string;
    originalLanguage: string;
    translatedLanguage: string;
    createdAt: string; // ISO date string
}

export interface ConversationSessionResponse {
    id: string;
    userId: string;
    languageA: string;
    languageB: string;
    title?: string;
    createdAt: string; // ISO date string
    endedAt?: string | null; // ISO date string
    messages?: ConversationMessageResponse[]; 
}

export const getConversationSessions = async (page: number = 0, size: number = 10): Promise<Page<ConversationSessionResponse>> => {
    if (!authToken) throw new Error('No auth token available');
    const response = await apiClient.get<Page<ConversationSessionResponse>>(`/conversations?page=${page}&size=${size}`);
    return response.data;
};

export const createConversationSession = async (payload: ConversationSessionCreatePayload): Promise<ConversationSessionResponse> => {
    if (!authToken) throw new Error('No auth token available');
    const response = await apiClient.post<ConversationSessionResponse>('/conversations', payload);
    return response.data;
};

export const getConversationSessionDetails = async (sessionId: string): Promise<ConversationSessionResponse> => {
    if (!authToken) throw new Error('No auth token available');
    const response = await apiClient.get<ConversationSessionResponse>(`/conversations/${sessionId}`);
    return response.data;
};

export const addMessageToConversationSession = async (payload: ConversationMessageCreatePayload): Promise<ConversationMessageResponse> => {
    if (!authToken) throw new Error('No auth token available');
    const { sessionId, ...messageData } = payload;
    const response = await apiClient.post<ConversationMessageResponse>(`/conversations/${sessionId}/messages`, messageData);
    return response.data;
};

export const endConversationSession = async (sessionId: string): Promise<ConversationSessionResponse> => {
    if (!authToken) throw new Error('No auth token available');
    const response = await apiClient.patch<ConversationSessionResponse>(`/conversations/${sessionId}/end`, {});
    return response.data;
};

export const updateConversationSessionTitle = async (sessionId: string, title: string): Promise<ConversationSessionResponse> => {
    if (!authToken) throw new Error('No auth token available');
    const response = await apiClient.put<ConversationSessionResponse>(`/conversations/${sessionId}/title`, title, {
        headers: { 'Content-Type': 'text/plain' }
    });
    return response.data;
};

export const deleteConversationSession = async (sessionId: string): Promise<ApiResponse> => {
    if (!authToken) throw new Error('No auth token available');
    const response = await apiClient.delete<ApiResponse>(`/conversations/${sessionId}`);
    return response.data;
};