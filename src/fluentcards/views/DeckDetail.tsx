import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { collection, doc, setDoc, deleteDoc, onSnapshot, query, where, updateDoc, getDocs, writeBatch } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { handleFirestoreError, OperationType } from '../lib/firebaseUtils';
import { useAuth } from '../components/AuthProvider';
import type { Deck, Flashcard } from '../types';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { ArrowLeft, Play, Plus, BookKey, Wand2, Download, Trash2, Loader2, Edit2, X, Check, Globe, RotateCcw, FileText } from 'lucide-react';
import { addFurigana } from '../lib/furiganaService';
import { FuriganaText } from '../components/FuriganaText';
import { v4 as uuidv4 } from 'uuid';
import { getEmptyFSRSCard, fsrcCardToFlashcardProperties } from '../lib/fsrs';
import { LANGUAGES } from '../lib/tts';
import { generateTranslation } from '../services/translationService';
import { toast } from 'sonner';

export function DeckDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [deck, setDeck] = useState<Deck | null>(null);
  const [cards, setCards] = useState<Flashcard[]>([]);

  useEffect(() => {
    if (!id || !user) return;

    const unsubscribeDeck = onSnapshot(
      doc(db, 'decks', id),
      (snapshot) => {
        if (snapshot.exists() && snapshot.data()?.userId === user.uid) {
          setDeck(snapshot.data() as Deck);
        } else {
          setDeck(null);
        }
      },
      (error) => handleFirestoreError(error, OperationType.GET, `decks/${id}`)
    );

    const unsubscribeCards = onSnapshot(
      query(collection(db, 'cards'), where('deckId', '==', id), where('userId', '==', user.uid)),
      (snapshot) => {
        setCards(snapshot.docs.map(doc => doc.data() as Flashcard));
      },
      (error) => handleFirestoreError(error, OperationType.LIST, 'cards')
    );

    return () => {
      unsubscribeDeck();
      unsubscribeCards();
    };
  }, [id, user]);

  const [isAdding, setIsAdding] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [csvContent, setCsvContent] = useState('');
  const [isProcessingCsv, setIsProcessingCsv] = useState(false);
  const [front, setFront] = useState('');
  const [back, setBack] = useState('');
  const [language, setLanguage] = useState(LANGUAGES[0].code);
  const [targetLanguage, setTargetLanguage] = useState(LANGUAGES[0].code);
  const [useMnemonic, setUseMnemonic] = useState(true);
  const [isTranslating, setIsTranslating] = useState(false);
  const [isAddingFurigana, setIsAddingFurigana] = useState(false);

  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [editingCardId, setEditingCardId] = useState<string | null>(null);
  const [editFront, setEditFront] = useState('');
  const [editBack, setEditBack] = useState('');
  const [editLanguage, setEditLanguage] = useState(LANGUAGES[0].code);
  const [editTargetLanguage, setEditTargetLanguage] = useState(LANGUAGES[0].code);

  const [isEditingDeck, setIsEditingDeck] = useState(false);
  const [deckEditName, setDeckEditName] = useState('');
  const [deckEditDesc, setDeckEditDesc] = useState('');
  const [isDeletingDeck, setIsDeletingDeck] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  const [selectedCards, setSelectedCards] = useState<Set<string>>(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [bulkLanguage, setBulkLanguage] = useState(LANGUAGES[0].code);

  const handleBulkUpdateLanguage = async () => {
    if (selectedCards.size === 0) return;
    const batch = writeBatch(db);
    selectedCards.forEach(id => {
      batch.update(doc(db, 'cards', id), { language: bulkLanguage });
    });
    try {
      await batch.commit();
      toast.success(`Updated pronunciation for ${selectedCards.size} cards`);
      setSelectedCards(new Set());
      setIsSelectionMode(false);
    } catch (error) {
       handleFirestoreError(error, OperationType.UPDATE, 'cards');
       toast.error('Failed to update language for selected cards.');
    }
  };

  const toggleSelectionMode = () => {
    setIsSelectionMode(!isSelectionMode);
    setSelectedCards(new Set());
  };

  const toggleCardSelection = (id: string) => {
    const newSet = new Set(selectedCards);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedCards(newSet);
  };

  const selectAllCards = () => {
    if (cards && selectedCards.size === cards.length) {
      setSelectedCards(new Set());
    } else if (cards) {
      setSelectedCards(new Set(cards.map(c => c.id)));
    }
  };

  if (!deck) return (
    <div className="flex flex-col items-center justify-center h-64 text-center p-6">
      <div className="w-8 h-8 border-[3px] border-cinnabar-100 border-t-cinnabar-500 rounded-full animate-spin mb-3" />
      <p className="text-ink-400 dark:text-sumi-300 font-semibold text-sm">Loading deck...</p>
    </div>
  );

  const now = new Date();
  const dueCards = cards?.filter(c => new Date(c.due) <= now) || [];

  const handleTranslate = async () => {
    if (!front.trim() || isTranslating) return;
    setIsTranslating(true);
    try {
      const result = await generateTranslation(front, language, targetLanguage);
      setBack(result);
    } catch (err) {
      console.error(err);
      toast.error('Failed to generate translation. The free service might be rate limited.');
    } finally {
      setIsTranslating(false);
    }
  };

  const handleFurigana = async () => {
    if (!front.trim() || isAddingFurigana) return;
    setIsAddingFurigana(true);
    try {
      const parsed = await addFurigana(front);
      setFront(parsed);
    } catch (err) {
      console.error(err);
      toast.error('Failed to generate furigana.');
    } finally {
      setIsAddingFurigana(false);
    }
  };

  const handleEditTranslate = async (sourceLang: string) => {
    if (!editFront.trim() || isTranslating) return;
    setIsTranslating(true);
    try {
      const result = await generateTranslation(editFront, sourceLang, editTargetLanguage);
      setEditBack(result);
    } catch (err) {
      console.error(err);
      toast.error('Failed to generate translation. The free service might be rate limited.');
    } finally {
      setIsTranslating(false);
    }
  };

  const handleEditFurigana = async () => {
    if (!editFront.trim() || isAddingFurigana) return;
    setIsAddingFurigana(true);
    try {
      const parsed = await addFurigana(editFront);
      setEditFront(parsed);
    } catch (err) {
      console.error(err);
      toast.error('Failed to generate furigana.');
    } finally {
      setIsAddingFurigana(false);
    }
  };

  const handleDeleteDeck = async () => {
    try {
      await deleteDoc(doc(db, 'decks', deck.id));
      const snapshot = await getDocs(query(collection(db, 'cards'), where('deckId', '==', deck.id), where('userId', '==', user.uid)));
      const batch = writeBatch(db);
      snapshot.docs.forEach(doc => batch.delete(doc.ref));
      await batch.commit();
      navigate('/');
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `decks/${deck.id}`);
    }
  };

  const handleResetProgress = async () => {
    if (!deck || !cards || cards.length === 0) return;

    if (!confirmReset) {
      setConfirmReset(true);
      setTimeout(() => setConfirmReset(false), 3000);
      return;
    }

    setIsResetting(true);
    try {
      const batch = writeBatch(db);
      const emptyFsrsData = fsrcCardToFlashcardProperties(getEmptyFSRSCard());

      cards.forEach(card => {
        batch.update(doc(db, 'cards', card.id), {
          due: emptyFsrsData.due!.toISOString(),
          stability: emptyFsrsData.stability,
          difficulty: emptyFsrsData.difficulty,
          elapsed_days: emptyFsrsData.elapsed_days,
          scheduled_days: emptyFsrsData.scheduled_days,
          reps: emptyFsrsData.reps,
          lapses: emptyFsrsData.lapses,
          state: emptyFsrsData.state,
          last_review: null,
        });
      });

      await batch.commit();
      setConfirmReset(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `decks/${deck.id}/reset`);
    } finally {
      setIsResetting(false);
    }
  };

  const handleUpdateDeck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deckEditName.trim() || !user) return;
    try {
      await updateDoc(doc(db, 'decks', deck.id), {
        name: deckEditName.trim(),
        description: deckEditDesc.trim(),
        isPublic: deck.isPublic ?? false,
        authorName: deck.authorName || user.displayName || user.email?.split('@')[0] || 'Anonymous'
      });
      setIsEditingDeck(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `decks/${deck.id}`);
    }
  };

  const handleAddCard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!front.trim() || !back.trim() || !deck || !user) return;

    const fsrsData = fsrcCardToFlashcardProperties(getEmptyFSRSCard());
    const newCardId = uuidv4();
    try {
      await setDoc(doc(db, 'cards', newCardId), {
        id: newCardId,
        userId: user.uid,
        deckId: deck.id,
        front: front.trim(),
        back: back.trim(),
        language,
        targetLanguage,
        useMnemonic,
        due: fsrsData.due!.toISOString(),
        stability: fsrsData.stability,
        difficulty: fsrsData.difficulty,
        elapsed_days: fsrsData.elapsed_days,
        scheduled_days: fsrsData.scheduled_days,
        reps: fsrsData.reps,
        lapses: fsrsData.lapses,
        state: fsrsData.state,
        last_review: null,
        isPublic: deck.isPublic ?? false,
      });

      setFront('');
      setBack('');
      document.getElementById('front-input')?.focus();
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'cards');
    }
  };

  const handleImportCSV = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!csvContent.trim() || !deck || !user) return;
    setIsProcessingCsv(true);

    try {
      const rows = csvContent.split('\n').filter(r => r.trim());
      const batch = writeBatch(db);
      const fsrsData = fsrcCardToFlashcardProperties(getEmptyFSRSCard());

      let count = 0;
      for (const row of rows) {
        const firstCommaIdx = row.indexOf(',');
        if (firstCommaIdx === -1) continue;

        let frontText = row.slice(0, firstCommaIdx).trim();
        let backText = row.slice(firstCommaIdx + 1).trim();

        frontText = frontText.replace(/(^"|"$)/g, '').trim();
        backText = backText.replace(/(^"|"$)/g, '').trim();

        if (frontText && backText) {
          const newCardId = uuidv4();
          batch.set(doc(db, 'cards', newCardId), {
            id: newCardId,
            userId: user.uid,
            deckId: deck.id,
            front: frontText,
            back: backText,
            language,
            targetLanguage,
            useMnemonic,
            due: fsrsData.due!.toISOString(),
            stability: fsrsData.stability,
            difficulty: fsrsData.difficulty,
            elapsed_days: fsrsData.elapsed_days,
            scheduled_days: fsrsData.scheduled_days,
            reps: fsrsData.reps,
            lapses: fsrsData.lapses,
            state: fsrsData.state,
            last_review: null,
            isPublic: deck.isPublic ?? false,
          });
          count++;
        }
      }

      if (count > 0) {
        await batch.commit();
        toast.success(`Successfully imported ${count} cards!`);
      } else {
        toast.error('No valid rows found. Format should be: Front,Back');
      }
      setIsImporting(false);
      setCsvContent('');
    } catch (error) {
       handleFirestoreError(error, OperationType.CREATE, 'cards');
       toast.error('Failed to import cards.');
    } finally {
      setIsProcessingCsv(false);
    }
  };

  const handleDeleteCard = async (cardId: string) => {
    if (deletingId === cardId) {
      try {
        await deleteDoc(doc(db, 'cards', cardId));
        setDeletingId(null);
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `cards/${cardId}`);
      }
    } else {
      setDeletingId(cardId);
      setTimeout(() => {
        setDeletingId(current => current === cardId ? null : current);
      }, 3000);
    }
  };

  const handleUpdateCard = async (cardId: string, currentCardIsPublic: boolean | undefined, e: React.FormEvent) => {
    e.preventDefault();
    if (!editFront.trim() || !editBack.trim()) return;
    try {
      const cardRef = doc(db, 'cards', cardId);
      await updateDoc(cardRef, {
        front: editFront.trim(),
        back: editBack.trim(),
        language: editLanguage,
        targetLanguage: editTargetLanguage,
        isPublic: currentCardIsPublic ?? false,
      });
      setEditingCardId(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `cards/${cardId}`);
    }
  };

  const handleExportDeck = async () => {
    if (!deck || !cards) return;
    const exportData = {
      deck: { name: deck.name, description: deck.description },
      cards: cards.map(c => ({ front: c.front, back: c.back, language: c.language, targetLanguage: c.targetLanguage, useMnemonic: c.useMnemonic }))
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${deck.name}-export.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col h-full bg-transparent">
      {/* Header */}
      <div className="p-5 border-b border-parchment-200 dark:border-sumi-700 sticky top-0 z-10 flex flex-col gap-3 bg-white/80 dark:bg-sumi-800/80 backdrop-blur-md">
        <div className="flex items-center justify-between">
          <Link to="/" className="inline-flex items-center text-base font-bold text-ink-500 dark:text-sumi-300 hover:text-ink-800 dark:hover:text-sumi-50 transition-colors shrink-0">
            <ArrowLeft size={20} className="mr-1" /> <span className="hidden sm:inline">Decks</span>
          </Link>
          <div className="flex items-center justify-end gap-1 shrink-0">
            <Button variant="ghost" size="sm" onClick={() => {
              if (isEditingDeck) {
                setIsEditingDeck(false);
              } else {
                setIsEditingDeck(true);
                setDeckEditName(deck.name);
                setDeckEditDesc(deck.description || '');
              }
            }} className="h-9 sm:h-10 w-9 sm:w-auto px-0 sm:px-3 text-sm font-bold text-ink-500 dark:text-sumi-300 rounded-full sm:rounded-lg hover:text-white hover:bg-cinnabar-500">
              <Edit2 size={18} className="sm:mr-1" /> <span className="hidden sm:inline">{isEditingDeck ? 'Cancel' : 'Edit'}</span>
            </Button>
            <Button variant="ghost" size="sm" onClick={() => {
              if (isDeletingDeck) {
                handleDeleteDeck();
              } else {
                setIsDeletingDeck(true);
                setTimeout(() => setIsDeletingDeck(false), 3000);
              }
            }} className={`h-9 sm:h-10 w-9 sm:w-auto px-0 sm:px-3 text-sm font-bold rounded-full sm:rounded-lg ${isDeletingDeck ? 'bg-cinnabar-100 text-cinnabar-600 hover:bg-cinnabar-200' : 'text-ink-500 dark:text-sumi-300 hover:text-white hover:bg-cinnabar-400'}`}>
              {isDeletingDeck ? <Check size={18} className="sm:mr-1" /> : <Trash2 size={18} className="sm:mr-1" />}
              <span className="hidden sm:inline">{isDeletingDeck ? 'Confirm' : 'Delete'}</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={async () => {
                try {
                  const newState = !deck.isPublic;
                  await updateDoc(doc(db, 'decks', deck.id), {
                    isPublic: newState,
                    authorName: deck.authorName || user?.displayName || user?.email?.split('@')[0] || 'Anonymous'
                  });

                  const batch = writeBatch(db);
                  cards.forEach(c => {
                    batch.update(doc(db, 'cards', c.id), { isPublic: newState });
                  });
                  if (cards.length > 0) {
                    await batch.commit();
                  }
                } catch (err) {
                  console.error(err);
                  toast.error('Error updating public status. Ensure the deck has an authorname.');
                }
              }}
              className={`h-9 sm:h-10 w-9 sm:w-auto px-0 sm:px-3 text-sm font-bold rounded-full sm:rounded-lg ${deck.isPublic ? 'text-slateblue-500 hover:text-white hover:bg-slateblue-400 bg-slateblue-50 dark:bg-slateblue-900/30' : 'text-ink-500 dark:text-sumi-300 hover:text-white hover:bg-slateblue-400'}`}
              title={deck.isPublic ? "Public" : "Make Public"}
            >
              {deck.isPublic ? <Globe size={18} className="sm:mr-1" /> : <Globe size={18} className="sm:mr-1 opacity-50" />}
              <span className="hidden sm:inline">{deck.isPublic ? 'Public' : 'Make Public'}</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleResetProgress}
              disabled={isResetting || cards.length === 0}
              className={`h-9 sm:h-10 w-9 sm:w-auto px-0 sm:px-3 text-sm font-bold rounded-full sm:rounded-lg transition-all ${
                confirmReset
                  ? "bg-cinnabar-500 text-white hover:bg-cinnabar-600"
                  : "bg-cream dark:bg-sumi-600 text-ink-500 dark:text-sumi-300 hover:text-white hover:bg-cinnabar-500"
              }`}
              title={confirmReset ? "Click again to confirm" : "Reset Progress"}
            >
              <RotateCcw size={18} className={`sm:mr-1 ${isResetting ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">{confirmReset ? "Click to confirm" : "Reset"}</span>
            </Button>
            <Button variant="ghost" size="sm" onClick={handleExportDeck} className="h-9 sm:h-10 w-9 sm:w-auto px-0 sm:px-3 text-sm font-bold text-ink-500 dark:text-sumi-300 rounded-full sm:rounded-lg hover:text-white hover:bg-cinnabar-500" title="Export">
              <Download size={18} className="sm:mr-1" /> <span className="hidden sm:inline">Export</span>
            </Button>
          </div>
        </div>
        {isEditingDeck ? (
          <form onSubmit={handleUpdateDeck} className="flex flex-col gap-3 mt-2">
            <Input
              value={deckEditName}
              onChange={e => setDeckEditName(e.target.value)}
              placeholder="Deck Name"
              className="font-display text-xl font-bold bg-cream dark:bg-sumi-600 border-parchment-200 dark:border-sumi-600 focus:border-cinnabar-400 rounded-lg text-ink-700 dark:text-sumi-100"
              autoFocus
            />
            <Input
              value={deckEditDesc}
              onChange={e => setDeckEditDesc(e.target.value)}
              placeholder="Deck Description (optional)"
              className="text-sm bg-cream dark:bg-sumi-600 border-parchment-200 dark:border-sumi-600 focus:border-cinnabar-400 rounded-lg text-ink-500 dark:text-sumi-300"
            />
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" size="sm" onClick={() => setIsEditingDeck(false)} className="text-ink-500 dark:text-sumi-300 hover:bg-cinnabar-50 dark:hover:bg-sumi-600 rounded-lg">Cancel</Button>
              <Button type="submit" size="sm" disabled={!deckEditName.trim()} className="bg-cinnabar-500 hover:bg-cinnabar-600 text-white rounded-lg">Save Changes</Button>
            </div>
          </form>
        ) : (
          <div className="flex items-center justify-between mt-2 gap-2">
            <div className="flex flex-col min-w-0 mr-2">
              <h1 className="font-display text-2xl sm:text-3xl font-bold truncate text-ink-800 dark:text-sumi-50">{deck.name}</h1>
              {deck.description && <p className="text-sm font-semibold text-ink-500 dark:text-sumi-300 mt-1 truncate">{deck.description}</p>}
            </div>
            <Button
              onClick={() => navigate(`/study/${deck.id}`)}
              disabled={dueCards.length === 0}
              className="h-12 px-5 sm:px-6 rounded-lg shadow-sm shrink-0 bg-cinnabar-500 hover:bg-cinnabar-600 text-white text-base"
            >
              <Play size={20} className="mr-1 sm:mr-2 fill-current" />
              <span className="hidden sm:inline">Study ({dueCards.length})</span>
              <span className="inline sm:hidden">({dueCards.length})</span>
            </Button>
          </div>
        )}
      </div>

      <div className="p-5 space-y-5 flex-1">
        {/* Add Card / Import CSV panel */}
        <div className="bg-white dark:bg-sumi-700 border-2 border-parchment-200 dark:border-sumi-600 rounded-xl p-5 shadow-sm">
          {!isAdding && !isImporting ? (
            <div className="flex flex-col sm:flex-row gap-3">
              <Button variant="outline" className="flex-1 border-dashed border-2 border-parchment-200 dark:border-sumi-600 text-ink-500 dark:text-sumi-300 hover:bg-cream dark:hover:bg-sumi-600 rounded-lg h-12 text-sm font-bold" onClick={() => setIsAdding(true)}>
                <Plus size={22} className="mr-2" /> Add Flashcard
              </Button>
              <Button variant="outline" className="flex-1 border-dashed border-2 border-parchment-200 dark:border-sumi-600 text-ink-500 dark:text-sumi-300 hover:bg-cream dark:hover:bg-sumi-600 rounded-lg h-12 text-sm font-bold" onClick={() => setIsImporting(true)}>
                <FileText size={22} className="mr-2" /> Import CSV
              </Button>
            </div>
          ) : isImporting ? (
            <form onSubmit={handleImportCSV} className="space-y-4">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-xs font-bold tracking-widest text-ink-500 dark:text-sumi-300 uppercase">Import CSV</h3>
              </div>
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-ink-400 dark:text-sumi-400 mb-1 pl-1 block">Pronunciation Language</label>
                    <div className="relative">
                      <BookKey size={14} className="absolute left-3 top-3 text-ink-400 dark:text-sumi-400" />
                      <select
                        className="w-full h-10 pl-9 pr-2 rounded-lg border-2 border-parchment-200 dark:border-sumi-600 bg-cream dark:bg-sumi-600 text-sm font-bold text-ink-500 dark:text-sumi-300 appearance-none focus:outline-none focus:ring-2 focus:ring-cinnabar-300"
                        value={language}
                        onChange={e => setLanguage(e.target.value)}
                      >
                        {LANGUAGES.map(lang => (
                          <option key={lang.code} value={lang.code}>{lang.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-ink-400 dark:text-sumi-400 mb-1 pl-1 block">Paste CSV Content (Format: Front,Back)</label>
                  <textarea
                    rows={6}
                    value={csvContent}
                    onChange={(e) => setCsvContent(e.target.value)}
                    placeholder="e.g.&#10;hello,こんにちは&#10;world,世界"
                    className="w-full rounded-lg border-2 border-parchment-200 dark:border-sumi-600 bg-cream dark:bg-sumi-600 text-ink-700 dark:text-sumi-100 p-3 text-sm focus:border-cinnabar-400 focus:ring-0 resize-y min-h-[120px]"
                    autoFocus
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="ghost" onClick={() => { setIsImporting(false); setCsvContent(''); }} className="text-ink-500 dark:text-sumi-300 hover:bg-cinnabar-50 dark:hover:bg-sumi-600 rounded-lg">Cancel</Button>
                <Button type="submit" disabled={!csvContent.trim() || isProcessingCsv} className="bg-cinnabar-500 hover:bg-cinnabar-600 text-white rounded-lg">
                  {isProcessingCsv ? <Loader2 size={20} className="animate-spin mr-2" /> : <FileText size={20} className="mr-2" />}
                  Import
                </Button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleAddCard} className="space-y-4">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-xs font-bold tracking-widest text-ink-500 dark:text-sumi-300 uppercase">New Card</h3>
              </div>

              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-1 pl-1 pr-1">
                    <label className="text-xs font-bold text-ink-400 dark:text-sumi-400 truncate mr-1">Front (Expression/Word)</label>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {(language.startsWith('ja') || language.startsWith('zh')) && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={handleFurigana}
                          disabled={isAddingFurigana || !front.trim()}
                          className="h-6 w-6 rounded-full text-cinnabar-500 dark:text-cinnabar-300 hover:text-cinnabar-600 bg-cinnabar-50 dark:bg-cinnabar-900/40 hover:bg-cinnabar-100 p-0"
                          title="Auto-add Furigana"
                        >
                          {isAddingFurigana ? <Loader2 size={12} className="animate-spin" /> : <span className="text-[10px] font-bold">Aあ</span>}
                        </Button>
                      )}
                    </div>
                  </div>
                  <Input
                    id="front-input"
                    lang={language}
                    placeholder="e.g., 明日[あした]は"
                    value={front}
                    onChange={e => setFront(e.target.value)}
                    autoFocus
                    className="rounded-lg border-parchment-200 dark:border-sumi-600 focus:border-cinnabar-400 focus:ring-cinnabar-200"
                  />
                  <p className="text-[10px] sm:text-xs text-ink-400 dark:text-sumi-400 mt-1 pl-1 italic">
                    Hint: Type Kanji[furigana] to add pronunciation (e.g. 漢[かん]字[じ])
                  </p>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1 pl-1 pr-1">
                    <label className="text-[11px] sm:text-xs font-bold text-ink-400 dark:text-sumi-400 truncate mr-1">Back (Meaning)</label>
                    <div className="flex items-center gap-1.5 shrink-0">
                       <span className="text-[10px] font-bold text-ink-400 dark:text-sumi-400 uppercase tracking-wider hidden sm:inline">To:</span>
                       <select
                         className="text-[11px] sm:text-xs font-bold bg-cream dark:bg-sumi-600 rounded-xl px-1 sm:px-2 py-1 border-parchment-200 dark:border-sumi-600 text-ink-700 dark:text-sumi-100 focus:ring-0 cursor-pointer w-[80px] sm:w-[120px] truncate"
                         value={targetLanguage}
                         onChange={e => setTargetLanguage(e.target.value)}
                       >
                         {LANGUAGES.map(lang => (
                           <option key={lang.code} value={lang.code}>{lang.name}</option>
                         ))}
                       </select>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Input
                      lang={targetLanguage}
                      placeholder="e.g., Hello / Good afternoon"
                      value={back}
                      onChange={e => setBack(e.target.value)}
                      className="flex-1 rounded-lg border-parchment-200 dark:border-sumi-600 focus:border-cinnabar-400 focus:ring-cinnabar-200"
                    />
                    <Button
                      type="button"
                      onClick={handleTranslate}
                      disabled={isTranslating || !front.trim()}
                      className="shrink-0 px-3.5 bg-cinnabar-50 dark:bg-cinnabar-900/40 hover:bg-cinnabar-100 dark:hover:bg-cinnabar-900/60 text-ink-700 dark:text-sumi-100 border-none h-10 rounded-lg"
                      variant="outline"
                      title="Auto Generate Translation"
                    >
                      {isTranslating ? <Loader2 size={20} className="animate-spin" /> : <Wand2 size={20} />}
                    </Button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="min-w-0">
                    <label className="text-[11px] font-bold text-ink-400 dark:text-sumi-400 mb-1 pl-1 block truncate">Pronunciation</label>
                    <div className="relative">
                      <BookKey size={18} className="absolute left-2 top-3 text-ink-400 dark:text-sumi-400" />
                      <select
                         className="w-full h-11 pl-8 pr-2 rounded-lg border-2 border-parchment-200 dark:border-sumi-600 bg-cream dark:bg-sumi-600 text-xs font-bold text-ink-500 dark:text-sumi-300 appearance-none focus:outline-none focus:ring-2 focus:ring-cinnabar-300 truncate"
                        value={language}
                        onChange={e => setLanguage(e.target.value)}
                      >
                         {LANGUAGES.map(lang => (
                           <option key={lang.code} value={lang.code}>{lang.name}</option>
                         ))}
                      </select>
                    </div>
                  </div>
                  <div className="min-w-0">
                    <label className="text-[11px] font-bold text-ink-400 dark:text-sumi-400 mb-1 pl-1 block truncate">Mnemonic</label>
                    <label className="flex items-center justify-center gap-1 sm:gap-2 h-11 px-1 sm:px-3 rounded-lg border-2 border-parchment-200 dark:border-sumi-600 bg-cream dark:bg-sumi-600 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={useMnemonic}
                        onChange={e => setUseMnemonic(e.target.checked)}
                        className="rounded-full border-ink-400 dark:border-sumi-400 bg-white dark:bg-sumi-700 text-ink-700 dark:text-sumi-100 focus:ring-cinnabar-300 h-4 w-4 shrink-0"
                      />
                      <span className="flex items-center gap-1 font-bold text-ink-500 dark:text-sumi-300 text-[10px] sm:text-xs whitespace-nowrap"><Wand2 size={16} className="text-ink-400 dark:text-sumi-400 shrink-0"/> Auto Gen</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-4 border-t border-parchment-200 dark:border-sumi-600">
                <Button type="button" variant="ghost" size="sm" onClick={() => setIsAdding(false)} className="rounded-lg text-ink-500 dark:text-sumi-300 hover:bg-cinnabar-50 dark:hover:bg-sumi-600">Done</Button>
                <Button type="submit" size="sm" disabled={!front.trim() || !back.trim()} className="rounded-lg bg-cinnabar-500 hover:bg-cinnabar-600 text-white shadow-sm">Add Another</Button>
              </div>
            </form>
          )}
        </div>

        {/* Cards List */}
        <div className="space-y-4 pt-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pl-2 pr-2 gap-3">
            <h3 className="text-xs font-bold tracking-widest text-ink-500 dark:text-sumi-300 uppercase">All Cards ({cards?.length || 0})</h3>

            {cards && cards.length > 0 && (
              <div className="flex items-center gap-2">
                {isSelectionMode && (
                  <>
                     <div className="flex items-center bg-white dark:bg-sumi-700 border-2 border-parchment-200 dark:border-sumi-600 rounded-lg px-2 h-9 text-xs shadow-sm">
                       <label className="flex items-center gap-1.5 cursor-pointer">
                         <input
                           type="checkbox"
                           checked={selectedCards.size === cards.length && cards.length > 0}
                           onChange={selectAllCards}
                           className="rounded-full border-ink-400 dark:border-sumi-400 text-ink-700 dark:text-sumi-100 focus:ring-cinnabar-300"
                         />
                         <span className="font-bold text-ink-500 dark:text-sumi-300">All</span>
                       </label>
                     </div>
                     <div className="flex items-center gap-1.5 bg-white dark:bg-sumi-700 border-2 border-parchment-200 dark:border-sumi-600 rounded-lg px-2.5 h-9 shadow-sm shrink-0">
                       <select
                         className="text-xs font-bold bg-transparent border-none text-ink-700 dark:text-sumi-100 focus:ring-0 cursor-pointer w-[60px] sm:w-[90px] truncate p-0"
                         value={bulkLanguage}
                         onChange={e => setBulkLanguage(e.target.value)}
                       >
                         {LANGUAGES.map(lang => (
                           <option key={lang.code} value={lang.code}>{lang.name}</option>
                         ))}
                       </select>
                       <Button
                         variant="ghost"
                         size="sm"
                         onClick={handleBulkUpdateLanguage}
                         disabled={selectedCards.size === 0}
                         className="h-6 px-2 ml-1 bg-cinnabar-500 hover:bg-cinnabar-600 text-white rounded-lg text-[10px] font-bold"
                       >
                         Apply ({selectedCards.size})
                       </Button>
                     </div>
                  </>
                )}
                <Button
                  variant={isSelectionMode ? "outline" : "ghost"}
                  size="sm"
                  onClick={toggleSelectionMode}
                  className={`h-9 px-3 rounded-lg text-xs font-bold ${isSelectionMode ? 'border-parchment-200 dark:border-sumi-500 bg-cream dark:bg-sumi-600 text-ink-700 dark:text-sumi-100' : 'text-ink-500 dark:text-sumi-300 hover:bg-cinnabar-50 dark:hover:bg-sumi-600'}`}
                >
                  {isSelectionMode ? 'Done' : 'Select'}
                </Button>
              </div>
            )}
          </div>
          <div className="space-y-3">
            {cards && cards.length > 0 ? cards.map(card => (
              editingCardId === card.id ? (
                <form
                  key={card.id}
                  onSubmit={(e) => handleUpdateCard(card.id, card.isPublic, e)}
                  className="p-3 bg-white dark:bg-sumi-700 border-2 border-cinnabar-300 dark:border-cinnabar-700 rounded-lg flex flex-col md:flex-row items-start md:items-center gap-3 shadow-sm"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 flex-1 w-full">
                    <div className="flex flex-col justify-end">
                      <div className="flex items-center justify-between mb-1 pl-1">
                         <span className="text-[10px] font-bold text-ink-400 dark:text-sumi-400 uppercase tracking-wider">Front</span>
                         {(editLanguage.startsWith('ja') || editLanguage.startsWith('zh')) && (
                           <Button
                             type="button"
                             variant="ghost"
                             size="sm"
                             onClick={handleEditFurigana}
                             disabled={isAddingFurigana || !editFront.trim()}
                             className="h-5 w-5 rounded-md text-cinnabar-500 dark:text-cinnabar-300 hover:text-cinnabar-600 bg-cinnabar-50 dark:bg-cinnabar-900/40 hover:bg-cinnabar-100 p-0"
                             title="Auto-add Furigana"
                           >
                             {isAddingFurigana ? <Loader2 size={10} className="animate-spin" /> : <span className="text-[9px] font-bold">Aあ</span>}
                           </Button>
                         )}
                      </div>
                      <Input
                        lang={editLanguage}
                        value={editFront}
                        onChange={e => setEditFront(e.target.value)}
                        placeholder="Front of card (e.g. 漢[かん]字[じ])"
                        className="bg-cream dark:bg-sumi-600 border-parchment-200 dark:border-sumi-600 focus:border-cinnabar-400 rounded-lg mb-1 h-9 text-sm"
                        autoFocus
                      />
                      <p className="text-[10px] text-ink-400 dark:text-sumi-400 mb-1.5 pl-1 italic">
                        Type Kanji[furigana] to add pronunciation
                      </p>
                      <div className="flex items-center justify-between pl-1 pr-1 mb-1">
                        <label className="text-[10px] font-bold text-ink-400 dark:text-sumi-400 uppercase tracking-wider truncate mr-1">Pronunciation:</label>
                        <select
                          className="text-[10px] sm:text-[11px] font-bold bg-cream dark:bg-sumi-600 rounded-lg px-1 sm:px-1.5 py-0.5 border-parchment-200 dark:border-sumi-600 text-ink-700 dark:text-sumi-100 focus:ring-0 cursor-pointer w-[70px] sm:w-[100px] truncate"
                          value={editLanguage}
                          onChange={e => setEditLanguage(e.target.value)}
                        >
                          {LANGUAGES.map(lang => (
                            <option key={lang.code} value={lang.code}>{lang.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="flex flex-col justify-end gap-1.5 pt-2 md:pt-0">
                      <div className="flex items-center justify-between pl-1 pr-1 mb-1">
                        <label className="text-[10px] font-bold text-ink-500 dark:text-sumi-300 uppercase tracking-wider truncate mr-1">To:</label>
                        <select
                          className="text-[10px] sm:text-[11px] font-bold bg-cream dark:bg-sumi-600 rounded-lg px-1 sm:px-1.5 py-0.5 border-parchment-200 dark:border-sumi-600 text-ink-700 dark:text-sumi-100 focus:ring-0 cursor-pointer w-[70px] sm:w-[100px] truncate"
                          value={editTargetLanguage}
                          onChange={e => setEditTargetLanguage(e.target.value)}
                        >
                          {LANGUAGES.map(lang => (
                            <option key={lang.code} value={lang.code}>{lang.name}</option>
                          ))}
                        </select>
                      </div>
                      <div className="flex gap-2">
                        <Input
                          lang={editTargetLanguage}
                          value={editBack}
                          onChange={e => setEditBack(e.target.value)}
                          placeholder="Back of card"
                          className="bg-cream dark:bg-sumi-600 border-parchment-200 dark:border-sumi-600 focus:border-cinnabar-400 rounded-lg flex-1 h-9 text-sm"
                        />
                        <Button
                          type="button"
                          onClick={() => handleEditTranslate(card.language)}
                          disabled={isTranslating || !editFront.trim()}
                          className="shrink-0 px-2.5 bg-cinnabar-50 dark:bg-cinnabar-900/40 hover:bg-cinnabar-100 dark:hover:bg-cinnabar-900/60 text-ink-700 dark:text-sumi-100 border-none h-9 rounded-lg text-xs font-bold"
                          variant="outline"
                          title="Auto Generate Translation"
                        >
                          {isTranslating ? <Loader2 size={16} className="animate-spin" /> : <Wand2 size={16} />}
                        </Button>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 mt-3 md:mt-0 self-end md:self-auto shrink-0">
                    <button
                      type="button"
                      onClick={() => setEditingCardId(null)}
                      className="p-1.5 rounded-full text-ink-400 dark:text-sumi-400 hover:text-ink-700 dark:hover:text-sumi-50 hover:bg-cinnabar-50 dark:hover:bg-sumi-600 transition-colors"
                      title="Cancel"
                    >
                      <X size={18} />
                    </button>
                    <button
                      type="submit"
                      disabled={!editFront.trim() || !editBack.trim()}
                      className="p-1.5 rounded-full text-white bg-cinnabar-500 hover:bg-cinnabar-600 shadow-sm transition-colors disabled:opacity-50"
                      title="Save"
                    >
                      <Check size={18} />
                    </button>
                  </div>
                </form>
              ) : (
                <div
                  key={card.id}
                  className={`p-3 bg-white dark:bg-sumi-700 border-2 rounded-lg group hover:shadow-sm transition-all flex items-center gap-3 ${isSelectionMode ? (selectedCards.has(card.id) ? 'border-cinnabar-400 bg-cream dark:bg-sumi-600 cursor-pointer' : 'border-parchment-200 dark:border-sumi-600 cursor-pointer') : 'border-parchment-200 dark:border-sumi-600 hover:border-cinnabar-200 dark:hover:border-cinnabar-700'}`}
                  onClick={() => isSelectionMode && toggleCardSelection(card.id)}
                >
                  {isSelectionMode && (
                    <div className="shrink-0 pl-1">
                      <input
                        type="checkbox"
                        checked={selectedCards.has(card.id)}
                        onChange={() => toggleCardSelection(card.id)}
                        className="rounded-full border-ink-400 dark:border-sumi-400 text-ink-700 dark:text-sumi-100 focus:ring-cinnabar-300 h-4 w-4 cursor-pointer pointer-events-none"
                      />
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-3 flex-1 min-w-0">
                    <div lang={card.language || undefined} className="text-sm font-bold text-ink-700 dark:text-sumi-100 border-r border-parchment-200 dark:border-sumi-600 pr-2 overflow-hidden break-words">
                      <FuriganaText text={card.front} />
                    </div>
                    <div lang={card.targetLanguage || undefined} className="text-sm font-semibold text-ink-500 dark:text-sumi-300 overflow-hidden break-words">
                      <FuriganaText text={card.back} />
                    </div>
                  </div>
                  <div className="flex items-center gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity shrink-0">
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setEditingCardId(card.id);
                        setEditFront(card.front);
                        setEditBack(card.back);
                        setEditLanguage(card.language || LANGUAGES[0].code);
                      }}
                      className="p-1.5 rounded-full transition-all flex items-center justify-center text-ink-400 dark:text-sumi-400 hover:text-white hover:bg-cinnabar-500 bg-cream dark:bg-sumi-600 md:bg-transparent"
                      aria-label="Edit card"
                      title="Edit card"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleDeleteCard(card.id);
                      }}
                      className={`p-1.5 rounded-full transition-all flex items-center justify-center ${
                        deletingId === card.id
                          ? 'bg-cinnabar-100 dark:bg-cinnabar-900/40 text-cinnabar-600 opacity-100'
                          : 'text-ink-400 dark:text-sumi-400 hover:text-white hover:bg-cinnabar-400 bg-cream dark:bg-sumi-600 md:bg-transparent'
                      }`}
                      aria-label="Delete card"
                      title={deletingId === card.id ? "Click again to confirm" : "Delete card"}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12 flex flex-col items-center bg-white dark:bg-sumi-700/30 rounded-xl border-2 border-dashed border-parchment-200 dark:border-sumi-600">
                <div className="w-14 h-14 bg-cinnabar-100 dark:bg-cinnabar-900/30 rounded-full flex items-center justify-center mb-3">
                  <BookKey size={24} className="text-ink-400 dark:text-sumi-400" />
                </div>
                <p className="text-ink-500 dark:text-sumi-300 font-semibold">No cards yet</p>
                <p className="text-ink-400 dark:text-sumi-400 text-sm mt-1">Add a flashcard above to get started</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
