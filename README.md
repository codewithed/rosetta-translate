# Rosetta Translate

Rosetta Translate is a multilingual, multi-input translation assistant built with a modern tech stack. It enables users to translate between languages using text, speech, image (OCR), and handwriting input. The app supports real-time bilingual conversations, translation history, saved phrases, and folder organization. Rosetta is designed for speed, accessibility, and privacy, with a secure backend and offline support.

## 🚀 Tech Stack

### Frontend

- React Native (Expo)
- TypeScript
- AsyncStorage (offline history & saved items)
- Expo Camera & Audio (speech/image input)
- @react-native-picker/picker (folder selection)
- react-navigation (navigation & tabs)

### Backend

- Spring Boot (Java)
- PostgreSQL (data persistence)
- JWT-based authentication
- Google Cloud APIs (Translate, Vision OCR, Speech-to-Text, Text-to-Speech)

## ✨ Features

- **Text, Speech, Image, and Handwriting Translation**: Translate using any input method, with automatic language detection.
- **Real-Time Conversation Mode**: Bilingual conversation with speech input/output for both speakers.
- **Translation History**: All translations are automatically saved and grouped by recency.
- **Saved Phrases & Folder Organization**: Save translations, organize them in custom folders
- **Favorites**: Mark translations as favorites for quick access.
- **Offline Support**: History and saved items are available offline.
- **Authentication**: Secure login and registration with JWT.

## 🛠️ Setup & Installation

### Prerequisites

- Node.js & npm (or yarn)
- Java 21+ (for backend)
- PostgreSQL (local or cloud)
- Expo CLI (`npm install -g expo-cli`)

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/rosetta-translate.git
cd rosetta-translate
```

### 2. Backend Setup

```bash
cd backend
./mvnw spring-boot:run
```

The backend will start on `http://localhost:8080`

Make sure PostgreSQL is running and accessible.

### 3. Frontend Setup

```bash
cd frontend
npm install
expo start
```

Scan the QR code with Expo Go or run on a simulator.

## 🏗️ How It Works (Under the Hood)

### Frontend

- **Input**: Users enter text, record speech, capture images, or draw handwriting.
- **Processing**: The app sends input to the backend via REST API.
- **Translation**: The backend uses Google APIs for translation, OCR, and speech recognition.
- **Output**: Translated text is displayed, with options for TTS playback, copy, save, or favorite.
- **Storage**: History and saved items are stored locally (AsyncStorage) and synced to the backend.

### Backend

- **Authentication**: JWT tokens secure all endpoints.
- **Translation Flow**: Receives input, calls Google APIs, returns translated text and audio URLs.
- **Persistence**: Saves user history, favorites, folders, and saved items in PostgreSQL.
- **Security**: API keys are never exposed to the frontend.

## 📂 Project Structure

```
rosetta-translate/
├── frontend/           # React Native app
│   ├── src/
│   ├── components/
│   ├── screens/
│   └── services/
├── backend/            # Spring Boot API
│   ├── src/main/java/
│   ├── src/main/resources/
│   └── pom.xml
├── README.md
└── LICENSE
```

## 🧑‍💻 Development Tips

### Frontend

- Use Expo for fast iteration.
- Use `expo start -c` to clear cache if you see weird UI bugs.

### Backend

- Use `.env` for secrets.
- Use `./mvnw spring-boot:run` for local dev.

### Database

- Migrations are handled via Spring Boot.
- Check `application.properties` for DB config.

### API Keys

- Store Google API keys in backend `.env`, never in frontend.

---

**Rosetta Translate** — Your AI-powered multilingual assistant.
