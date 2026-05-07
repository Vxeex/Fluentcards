import React, { useState, useEffect, useMemo } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../components/AuthProvider';
import { Search as SearchIcon, BookOpen, ArrowLeft } from 'lucide-react';
import { Input } from '../components/ui/Input';
import { Link } from 'react-router-dom';
import { FuriganaText } from '../components/FuriganaText';
import type { Deck, Flashcard } from '../types';

export function Search() {
  const { user } = useAuth();
  const [query_str, setQuery] = useState('');
  const [decks, setDecks] = useState<Deck[]>([]);
  const [cards, setCards] = useState<Flashcard[]>([]);

  useEffect(() => {
    if (!user) return;
    const unsubDecks = onSnapshot(
      query(collection(db, 'decks'), where('userId', '==', user.uid)),
      (snap) => setDecks(snap.docs.map(d => d.data() as Deck))
    );
    const unsubCards = onSnapshot(
      query(collection(db, 'cards'), where('userId', '==', user.uid)),
      (snap) => setCards(snap.docs.map(d => d.data() as Flashcard))
    );
    return () => { unsubDecks(); unsubCards(); };
  }, [user]);

  const deckMap = useMemo(() => {
    const m = new Map<string, Deck>();
    decks.forEach(d => m.set(d.id, d));
    return m;
  }, [decks]);

  const results = useMemo(() => {
    if (!query_str.trim()) return [];
    const q = query_str.toLowerCase();
    return cards.filter(c =>
      c.front.toLowerCase().includes(q) ||
      c.back.toLowerCase().includes(q)
    ).slice(0, 50);
  }, [cards, query_str]);

  return (
    <div className="p-5 space-y-5">
      <div className="flex items-center gap-3">
        <Link to="/" className="p-1.5 text-ink-400 hover:text-ink-700 dark:text-sumi-300 dark:hover:text-sumi-50 transition-colors">
          <ArrowLeft size={22} />
        </Link>
        <h1 className="font-display text-2xl font-bold tracking-tight text-ink-800 dark:text-sumi-50">Search</h1>
      </div>

      <div className="relative">
        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400 dark:text-sumi-400 pointer-events-none" size={20} />
        <Input
          placeholder="Search cards and phrases..."
          value={query_str}
          onChange={e => setQuery(e.target.value)}
          className="pl-11 h-12 text-base rounded-lg border-parchment-200 dark:border-sumi-600 focus:border-cinnabar-400 focus:ring-cinnabar-200 w-full"
          autoFocus
        />
      </div>

      {query_str.trim() && (
        <p className="text-sm text-ink-400 dark:text-sumi-400 font-semibold">
          {results.length} {results.length === 1 ? 'result' : 'results'} for "{query_str}"
        </p>
      )}

      {results.length > 0 ? (
        <div className="space-y-2">
          {results.map(card => {
            const deck = deckMap.get(card.deckId);
            return (
              <Link
                key={card.id}
                to={`/deck/${card.deckId}`}
                className="block p-4 bg-white dark:bg-sumi-700 border-2 border-parchment-200 dark:border-sumi-600 rounded-xl hover:border-cinnabar-200 dark:hover:border-cinnabar-700 hover:shadow-sm transition-all"
              >
                <div className="grid grid-cols-2 gap-3">
                  <div className="text-sm font-bold text-ink-700 dark:text-sumi-100 border-r border-parchment-200 dark:border-sumi-600 pr-3 break-words">
                    <FuriganaText text={card.front} />
                  </div>
                  <div className="text-sm font-semibold text-ink-500 dark:text-sumi-300 break-words">
                    <FuriganaText text={card.back} />
                  </div>
                </div>
                {deck && (
                  <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-parchment-100 dark:border-sumi-600">
                    <BookOpen size={14} className="text-ink-400 dark:text-sumi-400" />
                    <span className="text-xs font-semibold text-ink-400 dark:text-sumi-400">{deck.name}</span>
                  </div>
                )}
              </Link>
            );
          })}
        </div>
      ) : query_str.trim() && (
        <div className="text-center py-16 flex flex-col items-center">
          <div className="w-16 h-16 bg-cinnabar-100 dark:bg-cinnabar-900/30 rounded-full flex items-center justify-center mb-4">
            <SearchIcon className="w-8 h-8 text-ink-400 dark:text-sumi-400" />
          </div>
          <p className="text-ink-500 dark:text-sumi-300 font-semibold">No cards match your search</p>
          <p className="text-ink-400 dark:text-sumi-400 text-sm mt-1">Try a different word or phrase</p>
        </div>
      )}

      {!query_str.trim() && (
        <div className="text-center py-16 flex flex-col items-center">
          <div className="w-16 h-16 bg-cinnabar-100 dark:bg-cinnabar-900/30 rounded-full flex items-center justify-center mb-4">
            <SearchIcon className="w-8 h-8 text-ink-400 dark:text-sumi-400" />
          </div>
          <p className="text-ink-500 dark:text-sumi-300 font-semibold">Search across all your cards</p>
          <p className="text-ink-400 dark:text-sumi-400 text-sm mt-1">Search by front or back content</p>
        </div>
      )}
    </div>
  );
}
