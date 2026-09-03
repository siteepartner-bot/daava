import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Header } from './components/Header';
import { BottomNavigation } from './components/BottomNavigation';
import { AboutModal } from './components/AboutModal';
import { ToastContainer, ToastMessage } from './components/Toast';
import { ErrorState } from './components/ErrorState';

import { LandingView } from './views/LandingView';
import { SelectModeView } from './views/SelectModeView';
import { InputStoryView } from './views/InputStoryView';
import { LoadingAIView } from './views/LoadingAIView';
import { AnalysisResultView } from './views/AnalysisResultView';
import { SuggestedResponseView } from './views/SuggestedResponseView';
import { CoupleCreateView } from './views/CoupleCreateView';
import { CoupleInviteView } from './views/CoupleInviteView';
import { CoupleJoinView } from './views/CoupleJoinView';
import { CoupleStoryView } from './views/CoupleStoryView';
import { CoupleWaitingView } from './views/CoupleWaitingView';
import { CoupleComparisonView } from './views/CoupleComparisonView';
import { EndingView } from './views/EndingView';
import { HistoryView } from './views/HistoryView';
import { SettingsView } from './views/SettingsView';
import { AuthView } from './views/AuthView';
import { ProfileView } from './views/ProfileView';

import {
  AppView,
  AnalysisMode,
  StoryInputState,
  ConflictAnalysisResult,
  SavedConflictRecord,
  ResponseTone,
  CoupleSessionPublicState,
  LocalCoupleSessionAuth,
} from './types';
import { DEFAULT_ANALYSIS_RESULT } from './data/mockData';
import { analyzeConflict } from './services/analysisService';
import {
  getActiveSessionAuth,
  getCoupleSessionStatus,
  clearActiveSessionAuth,
} from './services/coupleService';
import {
  getHistory,
  saveConflictToHistory,
  updateConflictAnalysisInHistory,
  deleteHistoryItem,
  clearAllHistory,
} from './utils/storage';
import {
  User,
  UserStats,
  fetchCurrentUserProfile,
  getUserHistoryFromApi,
  saveAnalysisToApi,
  syncLocalStorageHistoryOnce,
  deleteAnalysisFromApi,
  clearUserHistoryFromApi,
} from './services/authService';

export default function App() {
  const [currentView, setCurrentView] = useState<AppView>('landing');
  const [mode, setMode] = useState<AnalysisMode>('solo');
  const [storyState, setStoryState] = useState<StoryInputState>({
    mode: 'solo',
    storyText: '',
    category: null,
    emotion: null,
  });

  const [analysisResult, setAnalysisResult] = useState<ConflictAnalysisResult>(
    DEFAULT_ANALYSIS_RESULT
  );
  const [historyItems, setHistoryItems] = useState<SavedConflictRecord[]>([]);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [isAILoadingDone, setIsAILoadingDone] = useState(false);

  // Couple Session States (Step 5)
  const [coupleSession, setCoupleSession] = useState<CoupleSessionPublicState | null>(null);
  const [coupleAuth, setCoupleAuth] = useState<LocalCoupleSessionAuth | null>(null);
  const [urlJoinCode, setUrlJoinCode] = useState<string>('');

  // Modals & Toasts
  const [isAboutModalOpen, setIsAboutModalOpen] = useState(false);
  const [aboutModalTab, setAboutModalTab] = useState<'how-it-works' | 'about-us' | 'privacy'>('how-it-works');
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // User & Auth state
  const [user, setUser] = useState<User | null>(null);
  const [userStats, setUserStats] = useState<UserStats | null>(null);

  // Load history & check user session on initial render
  useEffect(() => {
    // 1. Initial local history fallback
    const savedLocal = getHistory();
    setHistoryItems(savedLocal);

    // 2. Fetch authenticated user profile if token exists
    fetchCurrentUserProfile()
      .then(async (res) => {
        if (res.user) {
          setUser(res.user);
          setUserStats(res.stats || null);
          // Sync offline LocalStorage history to database once
          const dbHistory = await syncLocalStorageHistoryOnce();
          if (dbHistory) {
            setHistoryItems(dbHistory);
          } else {
            const apiHistory = await getUserHistoryFromApi();
            if (apiHistory) setHistoryItems(apiHistory);
          }
        }
      })
      .catch((err) => {
        console.log('No active auth session:', err);
      });

    // 3. Check URL for join code: ?join=CODE or ?code=CODE or /join/CODE
    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search);
      let code = searchParams.get('join') || searchParams.get('code') || '';

      if (!code && window.location.pathname.startsWith('/join/')) {
        const parts = window.location.pathname.split('/');
        code = parts[parts.length - 1] || '';
      }

      if (code) {
        const cleanCode = code.toUpperCase();
        setUrlJoinCode(cleanCode);

        const cachedAuth = getActiveSessionAuth();
        if (cachedAuth && cachedAuth.joinCode !== cleanCode) {
          clearActiveSessionAuth();
          setCoupleAuth(null);
          setCoupleSession(null);
        }

        setCurrentView('couple-join');
        return;
      }

      // 4. Check for active couple session in storage
      const cachedAuth = getActiveSessionAuth();
      if (cachedAuth) {
        setCoupleAuth(cachedAuth);
        getCoupleSessionStatus(cachedAuth.sessionId, cachedAuth.token)
          .then((latestSession) => {
            setCoupleSession(latestSession);
            if (cachedAuth.role === 'participantA') {
              setCurrentView('couple-invite');
            } else {
              if (latestSession.isParticipantBCompleted) {
                setCurrentView('couple-waiting');
              } else {
                setCurrentView('couple-story');
              }
            }
          })
          .catch((err) => {
            console.warn('Failed to restore active session:', err);
            clearActiveSessionAuth();
          });
      }
    }
  }, []);

  const addToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Date.now().toString() + Math.random().toString(36).substring(2, 5);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      removeToast(id);
    }, 3500);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const handleOpenAbout = (tab: 'how-it-works' | 'about-us' | 'privacy' = 'how-it-works') => {
    setAboutModalTab(tab);
    setIsAboutModalOpen(true);
  };

  // Flow Navigation Handlers
  const handleUpdateResponses = (updatedResponses: Record<ResponseTone, string>) => {
    setAnalysisResult((prev) => {
      const updated: ConflictAnalysisResult = {
        ...prev,
        suggestedResponses: updatedResponses,
      };
      const newHistory = updateConflictAnalysisInHistory(updated);
      setHistoryItems(newHistory);
      return updated;
    });
  };

  const handleStartAnalysis = (selectedMode: AnalysisMode) => {
    setMode(selectedMode);
    setStoryState((prev) => ({ ...prev, mode: selectedMode }));
    setAnalysisError(null);
    setIsAILoadingDone(false);

    if (selectedMode === 'couple') {
      setCurrentView('couple-create');
    } else {
      setCurrentView('input-story');
    }
  };

  const handleModeSelect = (selectedMode: AnalysisMode) => {
    setMode(selectedMode);
    setStoryState((prev) => ({ ...prev, mode: selectedMode }));
    setAnalysisError(null);
    setIsAILoadingDone(false);

    if (selectedMode === 'couple') {
      setCurrentView('couple-create');
    } else {
      setCurrentView('input-story');
    }
  };

  const handleStorySubmit = async (state: StoryInputState) => {
    setStoryState(state);
    setAnalysisError(null);
    setIsAILoadingDone(false);
    setCurrentView('loading-ai');

    try {
      // Execute the decoupled conflict analyzer
      const result = await analyzeConflict({
        mode: state.mode,
        storyText: state.storyText,
        category: state.category,
        emotion: state.emotion,
        gender: state.gender,
      });

      setAnalysisResult(result);

      // Save to localStorage history
      const updatedHistory = saveConflictToHistory(
        state.mode,
        state.storyText,
        state.category,
        state.emotion,
        result,
        state.gender
      );
      setHistoryItems(updatedHistory);

      // Save to backend database if user is authenticated
      if (user) {
        const latestSavedRecord = updatedHistory[0];
        if (latestSavedRecord) {
          saveAnalysisToApi(latestSavedRecord).then((apiHistory) => {
            if (apiHistory) setHistoryItems(apiHistory);
          });
        }
      }

      setIsAILoadingDone(true);
    } catch (err: any) {
      console.error('Error during conflict analysis:', err);
      setIsAILoadingDone(false);
      setAnalysisError(err?.message || 'یه مشکل موقت پیش اومده. دوباره امتحان کن.');
    }
  };

  const handleAILoadingComplete = useCallback(() => {
    if (analysisError) {
      return;
    }
    if (mode === 'couple') {
      setCurrentView('couple-create');
    } else {
      setCurrentView('analysis-result');
    }
  }, [analysisError, mode]);

  // Couple Session Events
  const handleCoupleSessionCreated = (session: CoupleSessionPublicState, auth: LocalCoupleSessionAuth) => {
    setCoupleSession(session);
    setCoupleAuth(auth);
    setMode('couple');
    setCurrentView('couple-invite');
  };

  const handleCoupleJoined = (session: CoupleSessionPublicState, auth: LocalCoupleSessionAuth) => {
    setCoupleSession(session);
    setCoupleAuth(auth);
    setMode('couple');
    if (session.isParticipantBCompleted) {
      setCurrentView('couple-waiting');
    } else {
      setCurrentView('couple-story');
    }
  };

  const handleCoupleStorySubmitted = (session: CoupleSessionPublicState) => {
    setCoupleSession(session);
    if (coupleAuth?.role === 'participantA') {
      setCurrentView('couple-invite');
    } else {
      setCurrentView('couple-waiting');
    }
  };

  const handleLeaveCoupleSession = () => {
    clearActiveSessionAuth();
    setCoupleSession(null);
    setCoupleAuth(null);
    setUrlJoinCode('');
    setCurrentView('landing');
  };

  const handleSelectHistoryItem = (item: SavedConflictRecord) => {
    setMode(item.mode);
    setStoryState({
      mode: item.mode,
      storyText: item.story,
      category: item.category,
      emotion: item.emotion,
      gender: item.gender,
    });
    setAnalysisResult(item.analysis);
    setCurrentView('analysis-result');
  };

  const handleDeleteHistoryItem = (id: string) => {
    const updated = deleteHistoryItem(id);
    setHistoryItems(updated);
    if (user) {
      deleteAnalysisFromApi(id).then((apiHistory) => {
        if (apiHistory) setHistoryItems(apiHistory);
      });
    }
  };

  const handleClearAllHistory = () => {
    clearAllHistory();
    setHistoryItems([]);
    if (user) {
      clearUserHistoryFromApi().then(() => {
        setHistoryItems([]);
      });
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF8F5] text-[#2D2A32] relative selection:bg-purple-200">
      {/* Global Header */}
      <Header
        currentView={currentView}
        user={user}
        onNavigate={(view) => {
          setAnalysisError(null);
          setCurrentView(view);
        }}
        onOpenAbout={handleOpenAbout}
      />

      {/* Main View Area */}
      <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 pt-4 md:pt-8 pb-28 md:pb-16">
        <AnimatePresence mode="wait">
          <motion.div
            key={analysisError ? 'error-view' : currentView}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="w-full"
          >
            {/* Error State if Analysis Fails */}
            {analysisError ? (
              <ErrorState
                title="نتونستم این بار تحلیلش کنم 🤍"
                message="یه مشکل موقت پیش اومده. دوباره امتحان کن."
                onRetry={() => {
                  setAnalysisError(null);
                  handleStorySubmit(storyState);
                }}
                onBack={() => {
                  setAnalysisError(null);
                  setCurrentView('input-story');
                }}
              />
            ) : (
              <>
                {/* Page 1: Landing Page */}
                {currentView === 'landing' && (
                  <LandingView
                    onStartAnalysis={handleStartAnalysis}
                    onNavigate={setCurrentView}
                    onOpenAbout={handleOpenAbout}
                  />
                )}

                {/* Page 2: Select Mode */}
                {currentView === 'select-mode' && (
                  <SelectModeView
                    onSelectMode={handleModeSelect}
                    onBack={() => setCurrentView('landing')}
                  />
                )}

                {/* Page 3: Input Story */}
                {currentView === 'input-story' && (
                  <InputStoryView
                    mode={mode}
                    initialState={storyState}
                    onSubmit={handleStorySubmit}
                    onBack={() => setCurrentView('select-mode')}
                  />
                )}

                {/* Page 4: Loading AI */}
                {currentView === 'loading-ai' && (
                  <LoadingAIView
                    isDone={isAILoadingDone}
                    onComplete={handleAILoadingComplete}
                  />
                )}

                {/* Page 5: Analysis Result */}
                {currentView === 'analysis-result' && (
                  <AnalysisResultView
                    data={analysisResult}
                    mode={mode}
                    isGuest={!user}
                    onNavigateToAuth={() => setCurrentView('auth')}
                    onProceedToResponse={() => setCurrentView('suggested-response')}
                    onProceedToCouple={() => setCurrentView('couple-create')}
                    onReanalyze={() => setCurrentView('input-story')}
                    onBack={() => setCurrentView('input-story')}
                  />
                )}

                {/* Page 6: Suggested Response */}
                {currentView === 'suggested-response' && (
                  <SuggestedResponseView
                    data={analysisResult}
                    mode={mode}
                    onProceedToEnding={() => setCurrentView('ending')}
                    onProceedToCoupleInvite={() => setCurrentView('couple-create')}
                    onReanalyze={() => setCurrentView('input-story')}
                    onBack={() => setCurrentView('analysis-result')}
                    onNotify={addToast}
                    onUpdateResponses={handleUpdateResponses}
                  />
                )}

                {/* Couple Step: Create Couple Session */}
                {currentView === 'couple-create' && (
                  <CoupleCreateView
                    initialStoryState={storyState}
                    onSessionCreated={handleCoupleSessionCreated}
                    onGoToJoinWithCode={() => setCurrentView('couple-join')}
                    onBack={() => setCurrentView('select-mode')}
                    onNotify={addToast}
                  />
                )}

                {/* Couple Step: Invite View for Participant A */}
                {currentView === 'couple-invite' && coupleSession && coupleAuth && (
                  <CoupleInviteView
                    session={coupleSession}
                    auth={coupleAuth}
                    onSessionUpdated={setCoupleSession}
                    onOpenStoryEditor={() => setCurrentView('couple-story')}
                    onProceedToComparison={() => setCurrentView('couple-comparison')}
                    onBack={() => setCurrentView('landing')}
                    onLeaveSession={handleLeaveCoupleSession}
                    onNotify={addToast}
                  />
                )}

                {/* Couple Step: Join View for Participant B */}
                {currentView === 'couple-join' && (
                  <CoupleJoinView
                    initialCode={urlJoinCode}
                    onJoined={handleCoupleJoined}
                    onBack={() => setCurrentView('landing')}
                    onNotify={addToast}
                  />
                )}

                {/* Couple Step: Story Submission for Participant B (or A) */}
                {currentView === 'couple-story' && coupleSession && coupleAuth && (
                  <CoupleStoryView
                    session={coupleSession}
                    auth={coupleAuth}
                    onStorySubmitted={handleCoupleStorySubmitted}
                    onBack={() => {
                      if (coupleAuth.role === 'participantA') {
                        setCurrentView('couple-invite');
                      } else {
                        setCurrentView('couple-join');
                      }
                    }}
                    onNotify={addToast}
                  />
                )}

                {/* Couple Step: Waiting & Real-time Status */}
                {currentView === 'couple-waiting' && coupleSession && coupleAuth && (
                  <CoupleWaitingView
                    session={coupleSession}
                    auth={coupleAuth}
                    onSessionUpdated={setCoupleSession}
                    onProceedToComparison={() => setCurrentView('couple-comparison')}
                    onLeaveSession={handleLeaveCoupleSession}
                    onNotify={addToast}
                  />
                )}

                {/* Couple Comparison View (Step 6) */}
                {currentView === 'couple-comparison' && (
                  <CoupleComparisonView
                    session={coupleSession}
                    auth={coupleAuth}
                    onSessionUpdated={setCoupleSession}
                    onProceedToEnding={() => setCurrentView('ending')}
                    onBack={() => {
                      if (coupleAuth?.role === 'participantA') {
                        setCurrentView('couple-invite');
                      } else {
                        setCurrentView('couple-waiting');
                      }
                    }}
                    onNotify={addToast}
                  />
                )}

                {/* Page 9: Ending & 2-Minute Challenge */}
                {currentView === 'ending' && (
                  <EndingView
                    onStartNew={() => {
                      setStoryState({
                        mode: 'solo',
                        storyText: '',
                        category: null,
                        emotion: null,
                      });
                      setCurrentView('input-story');
                    }}
                    onOpenAbout={() => handleOpenAbout('about-us')}
                    onNotify={addToast}
                  />
                )}

                {/* History Tab */}
                {currentView === 'history' && (
                  <HistoryView
                    historyItems={historyItems}
                    isGuest={!user}
                    onNavigateToAuth={() => setCurrentView('auth')}
                    onSelectHistoryItem={handleSelectHistoryItem}
                    onDeleteItem={handleDeleteHistoryItem}
                    onStartNew={() => setCurrentView('input-story')}
                    onNotify={addToast}
                  />
                )}

                {/* Settings Tab */}
                {currentView === 'settings' && (
                  <SettingsView
                    user={user}
                    stats={userStats}
                    onNavigateToAuth={() => setCurrentView('auth')}
                    onNavigateToProfile={() => setCurrentView('profile')}
                    onLogout={() => {
                      setUser(null);
                      setUserStats(null);
                      setHistoryItems(getHistory());
                      setCurrentView('landing');
                    }}
                    onOpenAbout={handleOpenAbout}
                    onClearAllHistory={handleClearAllHistory}
                    onNotify={addToast}
                  />
                )}

                {/* Auth View (Login / Register) */}
                {currentView === 'auth' && (
                  <AuthView
                    onSuccess={(loggedInUser, stats) => {
                      setUser(loggedInUser);
                      setUserStats(stats || null);
                      addToast(`خوش آمدید ${loggedInUser.name} عزیز 🤍`, 'success');
                      // Load user history from API
                      getUserHistoryFromApi().then((apiHistory) => {
                        if (apiHistory) setHistoryItems(apiHistory);
                      });
                      setCurrentView('profile');
                    }}
                    onBack={() => setCurrentView('settings')}
                  />
                )}

                {/* User Profile View */}
                {currentView === 'profile' && user && (
                  <ProfileView
                    user={user}
                    stats={userStats}
                    onUpdateUser={(updated) => setUser(updated)}
                    onLogout={() => {
                      setUser(null);
                      setUserStats(null);
                      setHistoryItems(getHistory());
                      setCurrentView('landing');
                    }}
                    onBack={() => setCurrentView('settings')}
                    addToast={addToast}
                  />
                )}
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Mobile Bottom Navigation */}
      <BottomNavigation
        currentView={currentView}
        onNavigate={(view) => {
          setAnalysisError(null);
          setCurrentView(view);
        }}
      />

      {/* About & Philosophy Modal */}
      <AboutModal
        isOpen={isAboutModalOpen}
        onClose={() => setIsAboutModalOpen(false)}
        defaultTab={aboutModalTab}
      />

      {/* Toast Notification Container */}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </div>
  );
}
