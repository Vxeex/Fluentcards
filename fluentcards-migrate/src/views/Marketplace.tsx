import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collection, query, where, getDocs, doc, setDoc, writeBatch, getCountFromServer } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { handleFirestoreError, OperationType } from '../lib/firebaseUtils';
import { useAuth } from '../components/AuthProvider';
import { Search, Globe, Download, Users, Copy, Layers } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Deck, Flashcard } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { getEmptyFSRSCard, fsrcCardToFlashcardProperties } from '../lib/fsrs';
import { toast } from 'sonner';

export function Marketplace() {
  const [publicDecks, setPublicDecks] = useState<(Deck & { cardCount?: number })[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [importingId, setImportingId] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchDecks = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'decks'), where('isPublic', '==', true));
      const snapshot = await getDocs(q);
      const fetchedDecks = snapshot.docs.map(doc => doc.data() as Deck);
      
      const decksWithCounts = await Promise.all(fetchedDecks.map(async (deck) => {
        try {
          const cardsQuery = query(collection(db, 'cards'), where('deckId', '==', deck.id), where('isPublic', '==', true));
          const countSnapshot = await getCountFromServer(cardsQuery);
          return { ...deck, cardCount: countSnapshot.data().count };
        } catch (e) {
          console.error(`Error fetching card count for deck ${deck.id}:`, e);
          return { ...deck, cardCount: 0 };
        }
      }));
      setPublicDecks(decksWithCounts);
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'decks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDecks();
  }, []);

  const handleCloneDeck = async (deck: Deck) => {
    if (!user) {
      toast.error("Please log in to clone decks.");
      return;
    }
    
    setImportingId(deck.id);
    try {
      // 1. Fetch public cards for this deck
      const cardsQuery = query(collection(db, 'cards'), where('deckId', '==', deck.id));
      const cardsSnapshot = await getDocs(cardsQuery);
      const originalCards = cardsSnapshot.docs.map(doc => doc.data() as Flashcard);

      // 2. Create a local clone of the deck
      const newDeckId = uuidv4();
      const newDeck: Deck = {
        id: newDeckId,
        userId: user.uid,
        name: `Clone of ${deck.name}`,
        description: deck.description,
        createdAt: Date.now(),
        isPublic: false, // cloned decks default to private
      };

      await setDoc(doc(db, 'decks', newDeckId), newDeck);

      // 3. Clone cards using batch
      const batch = writeBatch(db);
      originalCards.forEach(c => {
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
      toast.success(`Successfully cloned "${deck.name}" with ${originalCards.length} cards!`);
    } catch (err) {
      console.error(err);
      toast.error('Failed to clone deck.');
    } finally {
      setImportingId(null);
    }
  };

  const filteredDecks = publicDecks.filter(d => 
    d.name.toLowerCase().includes(search.toLowerCase()) || 
    (d.description && d.description.toLowerCase().includes(search.toLowerCase())) ||
    (d.authorName && d.authorName.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <Globe className="text-slate-600 dark:text-slate-300" size={32} /> Discover Decks
        </h1>
      </div>

      <div className="sticky top-0 bg-white dark:bg-slate-900/60 backdrop-blur-md pt-2 pb-4 z-10 -mx-6 px-6">
         <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none" size={20} />
            <Input 
              placeholder="Search public decks..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-11 h-12 text-base rounded-lg border-slate-300 dark:border-slate-600 focus:border-indigo-600 focus:ring-indigo-200 w-full"
            />
         </div>
      </div>

      {loading ? (
        <div className="flex justify-center p-12">
          <div className="animate-spin text-slate-600 dark:text-slate-300">
             <Globe size={40} />
          </div>
        </div>
      ) : filteredDecks.length === 0 ? (
        <div className="text-center py-16 flex flex-col items-center bg-white dark:bg-slate-900/50 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-600">
          <div className="w-24 h-24 bg-indigo-100 rounded-full flex items-center justify-center mb-4">
            <Search className="w-12 h-12 text-slate-400 dark:text-slate-500" />
          </div>
          <p className="text-slate-600 dark:text-slate-300 font-medium text-lg">No public decks found. Be the first to share one!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredDecks.map(deck => (
            <div 
              key={deck.id} 
              className="p-5 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 group"
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-bold text-2xl text-slate-700 dark:text-slate-200">{deck.name}</h3>
                  <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300 mt-1">
                    <div className="flex items-center gap-1.5">
                      <Users size={16} /> 
                      <span className="font-medium text-base">{deck.authorName || 'Anonymous'}</span>
                    </div>
                    {deck.cardCount !== undefined && (
                      <div className="flex items-center gap-1.5">
                        <Layers size={16} />
                        <span className="font-medium text-base">{deck.cardCount} {deck.cardCount === 1 ? 'card' : 'cards'}</span>
                      </div>
                    )}
                  </div>
                </div>
                <Button 
                  onClick={() => handleCloneDeck(deck)}
                  size="sm"
                  disabled={importingId === deck.id}
                  className="bg-slate-50 dark:bg-slate-800 hover:bg-indigo-100 text-indigo-600 dark:text-indigo-400 rounded-xl px-3 h-10"
                  title="Clone to my library"
                >
                  {importingId === deck.id ? (
                    <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Copy size={18} />
                  )}
                  <span className="ml-1.5 font-bold text-base">Clone</span>
                </Button>
              </div>
              
              {deck.description && (
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-3 line-clamp-2 leading-relaxed">
                  {deck.description}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
