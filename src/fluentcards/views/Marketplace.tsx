import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collection, query, where, getDocs, doc, setDoc, writeBatch, getCountFromServer } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { handleFirestoreError, OperationType } from '../lib/firebaseUtils';
import { useAuth } from '../components/AuthProvider';
import { Search, Globe, Copy, Users, Layers } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import type { Deck, Flashcard } from '../types';
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
      const cardsQuery = query(collection(db, 'cards'), where('deckId', '==', deck.id));
      const cardsSnapshot = await getDocs(cardsQuery);
      const originalCards = cardsSnapshot.docs.map(doc => doc.data() as Flashcard);

      const newDeckId = uuidv4();
      const newDeck: Deck = {
        id: newDeckId,
        userId: user.uid,
        name: `Clone of ${deck.name}`,
        description: deck.description,
        createdAt: Date.now(),
        isPublic: false,
      };

      await setDoc(doc(db, 'decks', newDeckId), newDeck);

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
    <div className="p-5 space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold tracking-tight text-ink-800 dark:text-sumi-50 flex items-center gap-2">
          <Globe className="text-ink-500 dark:text-sumi-300" size={28} /> Discover Decks
        </h1>
      </div>

      <div className="sticky top-0 bg-cream dark:bg-sumi-800/60 backdrop-blur-md pt-2 pb-4 z-10 -mx-5 px-5">
         <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400 dark:text-sumi-400 pointer-events-none" size={20} />
            <Input
              placeholder="Search public decks..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-11 h-12 text-base rounded-lg border-parchment-200 dark:border-sumi-600 focus:border-cinnabar-400 focus:ring-cinnabar-200 w-full"
            />
         </div>
      </div>

      {loading ? (
        <div className="flex justify-center p-12">
          <div className="animate-spin text-ink-500 dark:text-sumi-300">
             <Globe size={36} />
          </div>
        </div>
      ) : filteredDecks.length === 0 ? (
        <div className="text-center py-16 flex flex-col items-center bg-white dark:bg-sumi-700/50 rounded-xl border-2 border-dashed border-parchment-200 dark:border-sumi-600">
          <div className="w-20 h-20 bg-cinnabar-100 dark:bg-cinnabar-900/30 rounded-full flex items-center justify-center mb-4">
            <Search className="w-10 h-10 text-ink-400 dark:text-sumi-400" />
          </div>
          <p className="text-ink-500 dark:text-sumi-300 font-semibold text-base">No public decks found. Be the first to share one!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredDecks.map((deck, index) => (
            <div
              key={deck.id}
              className="p-5 bg-white dark:bg-sumi-700 border-2 border-parchment-200 dark:border-sumi-600 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 group"
              style={{ animation: `fadeInUp 0.4s ease-out ${index * 0.06}s both` }}
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-display text-xl font-bold text-ink-700 dark:text-sumi-100">{deck.name}</h3>
                  <div className="flex items-center gap-3 text-sm text-ink-500 dark:text-sumi-300 mt-1.5">
                    <div className="flex items-center gap-1.5">
                      <Users size={16} />
                      <span className="font-semibold">{deck.authorName || 'Anonymous'}</span>
                    </div>
                    {deck.cardCount !== undefined && (
                      <div className="flex items-center gap-1.5">
                        <Layers size={16} />
                        <span className="font-semibold">{deck.cardCount} {deck.cardCount === 1 ? 'card' : 'cards'}</span>
                      </div>
                    )}
                  </div>
                </div>
                <Button
                  onClick={() => handleCloneDeck(deck)}
                  size="sm"
                  disabled={importingId === deck.id}
                  className="bg-cream dark:bg-sumi-600 hover:bg-cinnabar-50 dark:hover:bg-sumi-500 text-cinnabar-500 dark:text-cinnabar-300 rounded-lg px-3 h-10"
                  title="Clone to my library"
                >
                  {importingId === deck.id ? (
                    <div className="w-5 h-5 border-2 border-cinnabar-500 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Copy size={18} />
                  )}
                  <span className="ml-1.5 font-bold text-sm">Clone</span>
                </Button>
              </div>

              {deck.description && (
                <p className="text-sm text-ink-500 dark:text-sumi-300 mb-2 line-clamp-2 leading-relaxed">
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
