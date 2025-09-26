import { configureStore, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { persistStore, persistReducer, FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER } from 'redux-persist';
import storage from 'redux-persist/lib/storage';

// Types
export type CandidateId = string;
export type Difficulty = 'easy' | 'medium' | 'hard';

export interface QAItem {
  id: string;
  difficulty: Difficulty;
  question: string;
  answer?: string;
  timeTakenSec?: number;
  score?: number; // per question score
}

export interface CandidateProfile {
  name: string;
  email: string;
  phone: string;
  resumeMeta?: {
    fileName: string;
    fileType: string;
  };
}

export interface CandidateRecord {
  id: CandidateId;
  profile: CandidateProfile;
  qas: QAItem[];
  startedAt: number;
  completedAt?: number;
  finalScore?: number;
  summary?: string;
  chatHistory: Array<{ role: 'system' | 'assistant' | 'user'; content: string; ts: number }>; // for detailed view
}

export interface SessionState {
  currentCandidateId?: CandidateId;
  interviewStage: 'idle' | 'collecting_profile' | 'in_progress' | 'completed';
  currentQuestionIndex: number; // 0..5
  currentQuestionExpiresAt?: number; // epoch ms
  paused: boolean;
}

export interface RootPersistedState {
  candidates: Record<CandidateId, CandidateRecord>;
  candidateOrder: CandidateId[]; // for list ordering
  ui: { activeTab: 'interviewee' | 'interviewer'; darkMode: boolean };
  session: SessionState;
}

const initialState: RootPersistedState = {
  candidates: {},
  candidateOrder: [],
  ui: { activeTab: 'interviewee', darkMode: false },
  session: {
    interviewStage: 'idle',
    currentQuestionIndex: 0,
    paused: false,
  },
};

// Root slice (simple approach for this project size)
const rootSlice = createSlice({
  name: 'root',
  initialState,
  reducers: {
    setActiveTab(state, action: PayloadAction<'interviewee' | 'interviewer'>) {
      state.ui.activeTab = action.payload;
    },
    setDarkMode(state, action: PayloadAction<boolean>) {
      state.ui.darkMode = action.payload;
    },
    upsertCandidate(state, action: PayloadAction<CandidateRecord>) {
      const c = action.payload;
      state.candidates[c.id] = c;
      if (!state.candidateOrder.includes(c.id)) state.candidateOrder.push(c.id);
    },
    updateCandidate(state, action: PayloadAction<{ id: CandidateId; patch: Partial<CandidateRecord> }>) {
      const { id, patch } = action.payload;
      const existing = state.candidates[id];
      if (existing) {
        state.candidates[id] = { ...existing, ...patch };
      }
    },
    setSession(state, action: PayloadAction<Partial<SessionState>>) {
      state.session = { ...state.session, ...action.payload };
    },
    resetSession(state) {
      state.session = initialState.session;
    },
  },
});

const persistConfig = {
  key: 'crisp-root',
  storage,
  version: 1,
  whitelist: ['candidates', 'candidateOrder', 'ui', 'session'],
};

const persistedReducer = persistReducer(persistConfig, rootSlice.reducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
});

export const persistor = persistStore(store);

export const { setActiveTab, setDarkMode, upsertCandidate, updateCandidate, setSession, resetSession } = rootSlice.actions;

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
