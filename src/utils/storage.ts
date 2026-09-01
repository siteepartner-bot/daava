import { SavedConflictRecord, ConflictAnalysisResult, AnalysisMode, ConflictCategory, EmotionType } from '../types';

const STORAGE_KEY = 'aromeshkon_conflict_history_v1';

/**
 * Retrieve all saved conflict records from localStorage
 */
export function getHistory(): SavedConflictRecord[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return [];
    const parsed = JSON.parse(data);
    if (Array.isArray(parsed)) {
      return parsed;
    }
    return [];
  } catch (error) {
    console.error('Failed to load history from localStorage:', error);
    return [];
  }
}

/**
 * Save a new conflict analysis record into localStorage
 */
export function saveConflictToHistory(
  mode: AnalysisMode,
  story: string,
  category: ConflictCategory | null,
  emotion: EmotionType | null,
  analysis: ConflictAnalysisResult
): SavedConflictRecord[] {
  try {
    const current = getHistory();
    const newRecord: SavedConflictRecord = {
      id: analysis.id || 'rec-' + Date.now().toString(36),
      timestamp: analysis.timestamp || Date.now(),
      date: analysis.date || 'امروز',
      mode,
      story,
      category,
      emotion,
      analysis,
    };

    // Place latest first, limit to 30 items
    const updated = [newRecord, ...current.filter((item) => item.id !== newRecord.id)].slice(0, 30);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch (error) {
    console.error('Failed to save record to localStorage:', error);
    return getHistory();
  }
}

/**
 * Delete a specific conflict record by id
 */
export function deleteHistoryItem(id: string): SavedConflictRecord[] {
  try {
    const current = getHistory();
    const updated = current.filter((item) => item.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch (error) {
    console.error('Failed to delete history item:', error);
    return getHistory();
  }
}

/**
 * Clear all records
 */
export function clearAllHistory(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear history:', error);
  }
}
