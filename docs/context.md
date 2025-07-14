# 🌐 Rosetta — AI-Optimized Product Specification

## 1. Overview

Rosetta is a multilingual, multi-input translation assistant that allows users to translate between two languages using text, speech, image (OCR), and handwriting input. It supports real-time bilingual conversations, translation history, and saved phrases. The system uses a secure Spring Boot backend, third-party APIs for NLP tasks, and a React Native (Expo) frontend.

## 2. Goals

* Provide accurate translation using multiple input types: text, speech, image, and handwriting
* Enable real-time bilingual conversations with speech input/output
* Allow users to save, view, and organize translation history and phrases
* Protect third-party API keys and backend logic securely

## 3. Architecture

### Frontend

* **Technology**: React Native (Expo)
* **Platforms**: iOS, Android
* **Responsibilities**:

  * Capture text, audio, images, and handwriting input
  * Display translated text and play TTS
  * Store local history for offline use
  * Manage user sessions with JWT

### Backend

* **Technology**: Spring Boot
* **Responsibilities**:

  * RESTful APIs for translation, image OCR, speech transcription, and TTS
  * Secure user authentication with JWT
  * Data persistence via PostgreSQL
  * API key management (Google, etc.)

### Database

* **Technology**: PostgreSQL
* **Purpose**:

  * Store user profiles, preferences, history, saved phrases, and conversation logs

### Security

* JWT-based user authentication
* API keys stored on the server
* Spring Security to protect all endpoints
* CORS setup for React Native

### Third-party Services

* Google Translate API
* Google Cloud Vision API (OCR)
* Google Cloud Speech-to-Text
* Google Cloud Text-to-Speech

---

## 4. UI Design & Navigation

### 🏠 Main View

```
[ Input Language ]
- Text Input Field
- 🎤 Mic (Speech Input)
- 📷 Camera (Image Input)
- ✍️ Canvas (Handwriting)

[ Output Language ]
- Translated Text
- 🔊 Speaker Icon (TTS)
- 📋 Copy

[ Bottom Controls ]
- [Lang1] ⇄ [Lang2]
- ➕ New Translation
```

### 🗣️ Conversation View

* 🔁 Speaker A ⇄ Speaker B setup
* Two mic buttons
* Two text areas
* TTS on both sides
* Auto scroll conversation

### 💾 Saved View

* Tabs: 🗒️ Phrases | 🎙️ Transcripts
* Folder navigation
* Favorite, delete, rename, organize

### 🕓 History View

* Grouped by: Today | Yesterday | Last 7 Days | Earlier
* List of translations with re-translate and favorite buttons

### Persistent Navigation

* Bottom Tab Bar: Home | Conversation | Saved | History
* Top Bar (non-main): Back | Home

---

## 5. Core Features

### 🧠 Translation

* Inputs: text, mic (speech), image (OCR), handwriting (canvas)
* Output: translated text + TTS playback
* Flow:

```
React Native → Spring Boot API → Google API → Spring Boot → React Native UI
```

### 🗣️ Live Conversation

* Mic input per speaker
* Auto-detect and translate
* Read out responses
* Save transcript (optional)

### 📚 Saved Translations

* Manually saved by user
* Categorize as "phrase" or "transcript"
* Folder support with optional notes

### 🕓 History

* Automatic storage of all translations
* Time-stamped, grouped by recency
* Re-translate and favorite options

### 👤 Authentication

* JWT-based auth: Register | Login | Logout
* User-specific history and saved items

---

## 6. Additional Features

### 🌟 Phrase of the Day

* Rotating phrase based on selected language
* TTS support and optional notifications

---

## 7. Technical Notes

* **Speech Input**: Use Expo Audio + Google Speech-to-Text
* **Image Input**: Expo Camera + Google Vision OCR
* **TTS**: Backend requests Google TTS, returns playable audio URL
* **Offline Mode**: Use AsyncStorage to store history and cache results
* **Security**: Never expose API keys to the frontend

---

## 8. Development Roadmap

| Phase | Features                              |
| ----- | ------------------------------------- |
| 1     | Text Translation, TTS, Copy           |
| 2     | Speech & Image Input                  |
| 3     | History & Saved Views                 |
| 4     | Conversation Mode                     |
| 5     | Authentication & Cloud Sync           |
| 6     | Phrase of the Day, Performance Polish |

---

## 9. Data Model Overview

### users

```
id UUID (PK)
username VARCHAR
email VARCHAR
password_hash VARCHAR
created_at TIMESTAMP
last_login TIMESTAMP
preferred_source_lang VARCHAR
preferred_target_lang VARCHAR
settings JSON
```

### translations

```
id UUID (PK)
user_id UUID (FK)
source_text TEXT
target_text TEXT
source_lang VARCHAR
target_lang VARCHAR
input_type ENUM('text','speech','image','handwriting')
is_favorite BOOLEAN
tags JSON
created_at TIMESTAMP
```

### saved\_items

```
id UUID (PK)
user_id UUID (FK)
translation_id UUID (FK)
category ENUM('phrase', 'transcript')
folder_id UUID (nullable FK)
name VARCHAR
notes TEXT
created_at TIMESTAMP
```

### folders

```
id UUID (PK)
user_id UUID (FK)
name VARCHAR
parent_folder_id UUID (nullable FK)
created_at TIMESTAMP
```

### conversation\_sessions

```
id UUID (PK)
user_id UUID (FK)
language_a VARCHAR
language_b VARCHAR
title VARCHAR
created_at TIMESTAMP
ended_at TIMESTAMP
```

### conversation\_messages

```
id UUID (PK)
session_id UUID (FK)
speaker ENUM('a', 'b')
original_text TEXT
translated_text TEXT
audio_url VARCHAR
created_at TIMESTAMP
```

### daily\_phrases

```
id UUID (PK)
phrase_date DATE
source_lang VARCHAR
target_lang VARCHAR
source_text TEXT
translated_text TEXT
category VARCHAR
difficulty ENUM('beginner', 'intermediate', 'advanced')
```

---

## 10. Folder Structure (Project Scaffolding)

### Frontend

```
frontend/
├── src/
│   ├── assets/
│   ├── components/
│   ├── screens/
│   ├── services/
│   ├── navigation/
│   ├── context/
│   ├── hooks/
│   ├── utils/
│   ├── constants/
│   └── App.tsx
```

### Backend

```
backend/
├── src/main/java/com/translationapp/
│   ├── controller/
│   ├── model/
│   ├── repository/
│   ├── service/
│   ├── config/
│   ├── security/
│   ├── dto/
│   └── util/
├── src/main/resources/
│   └── application.properties
└── pom.xml
```

---

## 11. AI Agent Instructions

To build this application to completion:

1. Scaffold backend with Spring Boot, configure PostgreSQL, and implement JWT-based auth
2. Create REST endpoints for:

   * POST `/auth/login`, `/auth/register`
   * POST `/translate`
   * POST `/tts`
   * POST `/ocr`
   * POST `/speech`
3. Create React Native frontend with Expo:

   * Setup navigation and bottom tabs
   * Build `HomeScreen`, `ConversationScreen`, `SavedScreen`, `HistoryScreen`, `LoginScreen`, `RegisterScreen`
4. Integrate Google APIs via backend
5. Use AsyncStorage for offline history caching
6. Optimize for speed, accessibility, and clarity
7. Run end-to-end tests for each feature in each phase
8. Ensure all API keys are hidden from frontend
9. Document all endpoints and flows
10. Package app for release with splash screen, logo, and polished onboarding flow
