import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { collection, doc, setDoc, deleteDoc, onSnapshot, query, where, getDocs, writeBatch } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { handleFirestoreError, OperationType } from '../lib/firebaseUtils';
import { useAuth } from '../components/AuthProvider';
import { Plus, BookOpen, Trash2, DownloadCloud } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { v4 as uuidv4 } from 'uuid';
import { getEmptyFSRSCard, fsrcCardToFlashcardProperties } from '../lib/fsrs';
import type { Deck, Flashcard } from '../types';
import { toast } from 'sonner';

export function Home() {
  const [deckName, setDeckName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  const [decks, setDecks] = useState<Deck[]>([]);
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [deletingDeckId, setDeletingDeckId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    const unsubscribeDecks = onSnapshot(
      query(collection(db, 'decks'), where('userId', '==', user.uid)),
      (snapshot) => {
        setDecks(snapshot.docs.map(doc => doc.data() as Deck));
      },
      (error) => handleFirestoreError(error, OperationType.LIST, 'decks')
    );

    const unsubscribeCards = onSnapshot(
      query(collection(db, 'cards'), where('userId', '==', user.uid)),
      (snapshot) => {
        setCards(snapshot.docs.map(doc => doc.data() as Flashcard));
      },
      (error) => handleFirestoreError(error, OperationType.LIST, 'cards')
    );

    return () => {
      unsubscribeDecks();
      unsubscribeCards();
    };
  }, [user]);

  const handleCreateDeck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deckName.trim() || !user) return;

    try {
      const newDeckId = uuidv4();
      await setDoc(doc(db, 'decks', newDeckId), {
        id: newDeckId,
        userId: user.uid,
        name: deckName.trim(),
        description: '',
        createdAt: Date.now(),
        isPublic: false,
        authorName: user.displayName || user.email?.split('@')[0] || 'Anonymous'
      });
      setDeckName('');
      setIsCreating(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'decks');
    }
  };

  const handleDeleteDeck = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (deletingDeckId !== id) {
      setDeletingDeckId(id);
      setTimeout(() => setDeletingDeckId(null), 3000);
      return;
    }

    try {
      await deleteDoc(doc(db, 'decks', id));

      const q = query(collection(db, 'cards'), where('deckId', '==', id), where('userId', '==', user!.uid));
      const cardsSnapshot = await getDocs(q);
      const batch = writeBatch(db);
      cardsSnapshot.forEach(doc => {
        batch.delete(doc.ref);
      });
      await batch.commit();
      setDeletingDeckId(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'decks');
    }
  };

  const handleImportDeck = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (!data.deck || !data.cards) throw new Error("Invalid deck format");

        const newDeckId = uuidv4();
        await setDoc(doc(db, 'decks', newDeckId), {
          id: newDeckId,
          userId: user.uid,
          name: data.deck.name,
          description: data.deck.description || '',
          createdAt: Date.now(),
          isPublic: false,
          authorName: user.displayName || user.email?.split('@')[0] || 'Anonymous'
        });

        const batch = writeBatch(db);
        data.cards.forEach((c: any) => {
          const fsrsData = fsrcCardToFlashcardProperties(getEmptyFSRSCard());
          const newCardId = uuidv4();
          batch.set(doc(db, 'cards', newCardId), {
            id: newCardId,
            userId: user.uid,
            deckId: newDeckId,
            front: c.front,
            back: c.back,
            language: c.language || 'en-US',
            useMnemonic: c.useMnemonic ?? true,
            due: fsrsData.due!.toISOString(),
            stability: fsrsData.stability,
            difficulty: fsrsData.difficulty,
            elapsed_days: fsrsData.elapsed_days,
            scheduled_days: fsrsData.scheduled_days,
            reps: fsrsData.reps,
            lapses: fsrsData.lapses,
            state: fsrsData.state,
            last_review: null,
            isPublic: false
          });
        });

        await batch.commit();
        toast.success('Deck imported successfully!');
      } catch (err) {
        console.error(err);
        toast.error('Failed to import deck. Ensure it is a valid JSON export.');
      }
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  const getDueCount = (deckId: string) => {
    const now = new Date();
    return cards.filter(c => c.deckId === deckId && new Date(c.due) <= now).length;
  };

  const getTotalCount = (deckId: string) => {
    return cards.filter(c => c.deckId === deckId).length;
  };

  return (
    <div className="p-5 space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold tracking-tight text-ink-800 dark:text-sumi-50">Your Decks</h1>
        <div className="flex gap-2">
          <input
            type="file"
            accept=".json"
            className="hidden"
            ref={fileInputRef}
            onChange={handleImportDeck}
          />
          <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} title="Import Deck" className="border-parchment-200 dark:border-sumi-600 text-ink-500 dark:text-sumi-300 hover:bg-cream dark:hover:bg-sumi-600 rounded-lg">
            <DownloadCloud size={20} />
          </Button>
          <Button onClick={() => setIsCreating(!isCreating)} size="sm" className="bg-cinnabar-500 hover:bg-cinnabar-600 text-white rounded-lg shadow-sm">
            <Plus size={20} className="mr-2" /> New Deck
          </Button>
        </div>
      </div>

      {isCreating && (
        <form onSubmit={handleCreateDeck} className="p-5 bg-white dark:bg-sumi-700 border-2 border-parchment-200 dark:border-sumi-600 rounded-xl space-y-3 shadow-sm">
          <h2 className="text-xs font-bold tracking-widest text-ink-400 dark:text-sumi-300 mb-1">Create New Deck</h2>
          <Input
            placeholder="Deck Name (e.g., JLPT N5 Vocabulary)"
            value={deckName}
            onChange={(e) => setDeckName(e.target.value)}
            autoFocus
            className="rounded-lg border-parchment-200 dark:border-sumi-600 focus:border-cinnabar-400 focus:ring-cinnabar-200"
          />
          <div className="flex gap-2 justify-end pt-2">
            <Button type="button" variant="ghost" size="sm" onClick={() => setIsCreating(false)} className="text-ink-500 dark:text-sumi-300 hover:bg-cinnabar-50 dark:hover:bg-sumi-600 rounded-lg">Cancel</Button>
            <Button type="submit" size="sm" disabled={!deckName.trim()} className="bg-cinnabar-500 hover:bg-cinnabar-600 text-white rounded-lg">Create</Button>
          </div>
        </form>
      )}

      {decks && decks.length === 0 && !isCreating && (
        <div className="text-center py-16 flex flex-col items-center bg-white dark:bg-sumi-700/50 rounded-xl border-2 border-dashed border-parchment-200 dark:border-sumi-600">
          <div className="w-20 h-20 bg-cinnabar-100 dark:bg-cinnabar-900/30 rounded-full flex items-center justify-center mb-4">
            <BookOpen className="w-10 h-10 text-ink-400 dark:text-sumi-400" />
          </div>
          <p className="text-ink-500 dark:text-sumi-300 font-semibold text-base">No decks yet. Create one to start learning!</p>
        </div>
      )}

      <div className="space-y-3">
        {decks?.map((deck, index) => {
          const dueCount = getDueCount(deck.id);
          const totalCount = getTotalCount(deck.id);

          return (
            <div
              key={deck.id}
              onClick={() => navigate(`/deck/${deck.id}`)}
              className="cursor-pointer block p-5 bg-white dark:bg-sumi-700 border-2 border-parchment-200 dark:border-sumi-600 rounded-xl shadow-sm hover:shadow-md hover:border-cinnabar-200 dark:hover:border-cinnabar-700 hover:-translate-y-0.5 transition-all duration-300 group"
              style={{ animation: `fadeInUp 0.4s ease-out ${index * 0.08}s both` }}
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex flex-col">
                  <h3 className="font-display text-xl font-bold text-ink-700 dark:text-sumi-100 flex items-center gap-2">
                    {deck.name}
                    {deck.isPublic && <span className="px-2 py-0.5 rounded-full bg-slateblue-50 dark:bg-slateblue-900/40 text-slateblue-500 dark:text-slateblue-300 text-[10px] font-bold uppercase tracking-wider">Public</span>}
                  </h3>
                </div>
                <button
                  onClick={(e) => handleDeleteDeck(deck.id, e)}
                  title={deletingDeckId === deck.id ? "Click again to delete" : "Delete deck"}
                  className={`p-2 rounded-full transition-all z-10 ${
                    deletingDeckId === deck.id
                      ? "text-cinnabar-500 bg-cinnabar-100 dark:bg-cinnabar-900/40 opacity-100"
                      : "text-ink-200 dark:text-sumi-500 hover:text-cinnabar-400 hover:bg-cinnabar-50 dark:hover:bg-sumi-600 opacity-100 sm:opacity-0 group-hover:opacity-100"
                  }`}
                >
                  <Trash2 size={20} />
                </button>
              </div>
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-cream dark:bg-sumi-600 border border-parchment-200 dark:border-sumi-500 rounded-lg">
                  <span className={`font-bold text-lg leading-none ${dueCount > 0 ? 'text-ink-800 dark:text-sumi-50' : 'text-ink-400 dark:text-sumi-400'}`}>
                    {dueCount}
                  </span>
                  <span className="text-ink-500 dark:text-sumi-300 font-semibold">Due reviews</span>
                </div>
                <div className="text-ink-400 dark:text-sumi-400 font-semibold flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-slateblue-300 dark:bg-slateblue-600"></div>{totalCount} cards
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
