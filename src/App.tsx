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
import { CoupleInviteView } from './views/CoupleInviteView';
import { CoupleComparisonView } from './views/CoupleComparisonView';
import { EndingView } from './views/EndingView';
import { HistoryView } from './views/HistoryView';
import { SettingsView } from './views/SettingsView';

import {
  AppView,
  AnalysisMode,
  StoryInputState,
  ConflictAnalysisResult,
  SavedConflictRecord,
} from './types';
import { DEFAULT_ANALYSIS_RESULT } from './data/mockData';
import { analyzeConflict } from './services/analysisService';
import {
  getHistory,
  saveConflictToHistory,
  deleteHistoryItem,
  clearAllHistory,
} from './utils/storage';

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

  // Modals & Toasts
  const [isAboutModalOpen, setIsAboutModalOpen] = useState(false);
  const [aboutModalTab, setAboutModalTab] = useState<'how-it-works' | 'about-us' | 'privacy'>('how-it-works');
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Load history from localStorage on initial render
  useEffect(() => {
    const saved = getHistory();
    setHistoryItems(saved);
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
  const handleStartAnalysis = (selectedMode: AnalysisMode) => {
    setMode(selectedMode);
    setStoryState((prev) => ({ ...prev, mode: selectedMode }));
    setAnalysisError(null);
    setIsAILoadingDone(false);
    setCurrentView('input-story');
  };

  const handleModeSelect = (selectedMode: AnalysisMode) => {
    setMode(selectedMode);
    setStoryState((prev) => ({ ...prev, mode: selectedMode }));
    setAnalysisError(null);
    setIsAILoadingDone(false);
    setCurrentView('input-story');
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
      });

      setAnalysisResult(result);

      // Save to localStorage history only upon successful analysis
      const updatedHistory = saveConflictToHistory(
        state.mode,
        state.storyText,
        state.category,
        state.emotion,
        result
      );
      setHistoryItems(updatedHistory);
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
      setCurrentView('couple-invite');
    } else {
      setCurrentView('analysis-result');
    }
  }, [analysisError, mode]);

  const handleSelectHistoryItem = (item: SavedConflictRecord) => {
    setMode(item.mode);
    setStoryState({
      mode: item.mode,
      storyText: item.story,
      category: item.category,
      emotion: item.emotion,
    });
    setAnalysisResult(item.analysis);
    setCurrentView('analysis-result');
  };

  const handleDeleteHistoryItem = (id: string) => {
    const updated = deleteHistoryItem(id);
    setHistoryItems(updated);
  };

  const handleClearAllHistory = () => {
    clearAllHistory();
    setHistoryItems([]);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF8F5] text-[#2D2A32] relative selection:bg-purple-200">
      {/* Global Header */}
      <Header
        currentView={currentView}
        onNavigate={(view) => {
          setAnalysisError(null);
          setCurrentView(view);
        }}
        onOpenAbout={handleOpenAbout}
      />

      {/* Main View Area */}
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 pb-20 md:pb-12">
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
                    onProceedToResponse={() => setCurrentView('suggested-response')}
                    onProceedToCouple={() => setCurrentView('couple-comparison')}
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
                    onProceedToCoupleInvite={() => setCurrentView('couple-invite')}
                    onReanalyze={() => setCurrentView('input-story')}
                    onBack={() => setCurrentView('analysis-result')}
                    onNotify={addToast}
                  />
                )}

                {/* Page 7: Couple Invite */}
                {currentView === 'couple-invite' && (
                  <CoupleInviteView
                    onPartnerJoined={() => setCurrentView('couple-comparison')}
                    onBack={() => setCurrentView('analysis-result')}
                    onNotify={addToast}
                  />
                )}

                {/* Page 8: Couple Comparison */}
                {currentView === 'couple-comparison' && (
                  <CoupleComparisonView
                    data={analysisResult}
                    onProceedToEnding={() => setCurrentView('ending')}
                    onBack={() => setCurrentView('couple-invite')}
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
                    onSelectHistoryItem={handleSelectHistoryItem}
                    onDeleteItem={handleDeleteHistoryItem}
                    onStartNew={() => setCurrentView('input-story')}
                    onNotify={addToast}
                  />
                )}

                {/* Settings Tab */}
                {currentView === 'settings' && (
                  <SettingsView
                    onOpenAbout={handleOpenAbout}
                    onClearAllHistory={handleClearAllHistory}
                    onNotify={addToast}
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
