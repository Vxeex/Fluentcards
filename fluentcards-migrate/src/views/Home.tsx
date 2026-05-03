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
import { Deck, Flashcard } from '../types';
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
            due: fsrsData.due!.toISOString(), // Store dates as ISO strings
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
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight text-slate-800 dark:text-slate-100">Your Decks</h1>
        <div className="flex gap-2">
          <input 
            type="file" 
            accept=".json" 
            className="hidden" 
            ref={fileInputRef} 
            onChange={handleImportDeck} 
          />
          <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} title="Import Deck" className="border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg">
            <DownloadCloud size={20} />
          </Button>
          <Button onClick={() => setIsCreating(!isCreating)} size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-md border-b-4 border-indigo-600 active:border-b-0 active:translate-y-1">
            <Plus size={20} className="mr-2" /> New Deck
          </Button>
        </div>
      </div>

      {isCreating && (
        <form onSubmit={handleCreateDeck} className="p-5 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 rounded-xl space-y-3 shadow-lg shadow-indigo-100/50">
          <h2 className="text-sm font-bold tracking-widest text-slate-400 dark:text-slate-500 dark:text-slate-400 mb-2">Create New Deck</h2>
          <Input 
            placeholder="Deck Name (e.g., JLPT N5 Vocabulary)" 
            value={deckName} 
            onChange={(e) => setDeckName(e.target.value)}
            autoFocus
            className="rounded-lg border-slate-300 dark:border-slate-600 focus:border-indigo-600 focus:ring-indigo-200"
          />
          <div className="flex gap-2 justify-end pt-2">
            <Button type="button" variant="ghost" size="sm" onClick={() => setIsCreating(false)} className="text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg">Cancel</Button>
            <Button type="submit" size="sm" disabled={!deckName.trim()} className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg">Create</Button>
          </div>
        </form>
      )}

      {decks && decks.length === 0 && !isCreating && (
        <div className="text-center py-16 flex flex-col items-center bg-white dark:bg-slate-900/50 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-600">
          <div className="w-24 h-24 bg-indigo-100 rounded-full flex items-center justify-center mb-4">
            <BookOpen className="w-12 h-12 text-slate-400 dark:text-slate-500 dark:text-slate-400" />
          </div>
          <p className="text-slate-600 dark:text-slate-300 font-medium text-lg">No decks yet. Create one to start learning!</p>
        </div>
      )}

      <div className="space-y-4">
        {decks?.map(deck => {
          const dueCount = getDueCount(deck.id);
          const totalCount = getTotalCount(deck.id);
          
          return (
            <div 
              key={deck.id} 
              onClick={() => navigate(`/deck/${deck.id}`)}
              className="cursor-pointer block p-5 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 rounded-xl shadow-sm hover:shadow-md hover:border-slate-400 hover:-translate-y-1 transition-all duration-300 group"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex flex-col">
                  <h3 className="font-bold text-xl text-slate-700 dark:text-slate-200 flex items-center gap-2">
                    {deck.name}
                    {deck.isPublic && <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-500 text-xs font-bold uppercase tracking-wider">Public</span>}
                  </h3>
                </div>
                <button 
                  onClick={(e) => handleDeleteDeck(deck.id, e)}
                  title={deletingDeckId === deck.id ? "Click again to delete" : "Delete deck"}
                  className={`p-2 rounded-full transition-all z-10 ${
                    deletingDeckId === deck.id 
                      ? "text-rose-500 bg-rose-100 opacity-100" 
                      : "text-indigo-200 hover:text-rose-400 hover:bg-rose-50 opacity-100 sm:opacity-0 group-hover:opacity-100"
                  }`}
                >
                  <Trash2 size={22} />
                </button>
              </div>
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg">
                  <span className={`font-black text-lg leading-none ${dueCount > 0 ? 'text-slate-800 dark:text-slate-100' : 'text-slate-400 dark:text-slate-500 dark:text-slate-400'}`}>
                    {dueCount}
                  </span>
                  <span className="text-slate-600 dark:text-slate-300/80 font-medium">Due reviews</span>
                </div>
                <div className="text-slate-400 dark:text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-300"></div>{totalCount} cards
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
