import React, { useState, useEffect, useMemo } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../components/AuthProvider';
import { Link } from 'react-router-dom';
import { ArrowLeft, Trophy, Flame, Brain, Zap, Star, Target, BookOpen } from 'lucide-react';
import type { Flashcard, Deck } from '../types';

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  condition: (cards: Flashcard[], decks: Deck[]) => boolean;
  progress?: { current: number; total: number };
}

export function Achievements() {
  const { user } = useAuth();
  const [decks, setDecks] = useState<Deck[]>([]);
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);

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
    const unsubReviews = onSnapshot(
      query(collection(db, 'reviews'), where('userId', '==', user.uid)),
      (snap) => setReviews(snap.docs.map(d => d.data())),
    );
    return () => { unsubDecks(); unsubCards(); unsubReviews(); };
  }, [user]);

  const totalReviews = reviews.length;
  const totalCards = cards.length;
  const totalDecks = decks.length;
  const hasDueCards = cards.filter(c => new Date(c.due) <= new Date()).length === 0;
  const hasHighStability = cards.filter(c => c.stability && c.stability > 180).length >= 5;
  const masteredCards = cards.filter(c => c.stability && c.stability > 90).length;

  const achievements: Achievement[] = useMemo(() => [
    {
      id: 'first-deck',
      title: 'First Steps',
      description: 'Create your first deck',
      icon: <Star size={22} />,
      condition: () => totalDecks >= 1,
    },
    {
      id: 'five-decks',
      title: 'Collector',
      description: 'Create 5 decks',
      icon: <BookOpen size={22} />,
      condition: () => totalDecks >= 5,
      progress: { current: Math.min(totalDecks, 5), total: 5 },
    },
    {
      id: 'first-card',
      title: 'Cardmaster',
      description: 'Add 100 flashcards',
      icon: <Brain size={22} />,
      condition: () => totalCards >= 100,
      progress: { current: Math.min(totalCards, 100), total: 100 },
    },
    {
      id: 'first-review',
      title: 'Diligent',
      description: 'Complete 100 reviews',
      icon: <Zap size={22} />,
      condition: () => totalReviews >= 100,
      progress: { current: Math.min(totalReviews, 100), total: 100 },
    },
    {
      id: 'thousand-reviews',
      title: 'Scholar',
      description: 'Complete 1,000 reviews',
      icon: <Trophy size={22} />,
      condition: () => totalReviews >= 1000,
      progress: { current: Math.min(totalReviews, 1000), total: 1000 },
    },
    {
      id: 'mastered',
      title: 'Mastery',
      description: 'Master 5 cards (stability > 90 days)',
      icon: <Target size={22} />,
      condition: () => masteredCards >= 5,
      progress: { current: Math.min(masteredCards, 5), total: 5 },
    },
    {
      id: 'consistency',
      title: 'Consistent',
      description: 'Complete all due reviews',
      icon: <Flame size={22} />,
      condition: () => hasDueCards && totalReviews > 0,
    },
    {
      id: 'all-clear',
      title: 'Marathoner',
      description: 'Reach 180-day stability on any card',
      icon: <Flame size={22} />,
      condition: () => hasHighStability,
    },
  ], [totalDecks, totalCards, totalReviews, hasDueCards, hasHighStability, masteredCards]);

  const earnedCount = achievements.filter(a => a.condition(cards, decks)).length;
  const progressPercent = Math.round((earnedCount / achievements.length) * 100);

  return (
    <div className="p-5 space-y-5">
      <div className="flex items-center gap-3">
        <Link to="/" className="p-1.5 text-ink-400 hover:text-ink-700 dark:text-sumi-300 dark:hover:text-sumi-50 transition-colors">
          <ArrowLeft size={22} />
        </Link>
        <h1 className="font-display text-2xl font-bold tracking-tight text-ink-800 dark:text-sumi-50">Achievements</h1>
      </div>

      {/* Progress overview */}
      <div className="bg-white dark:bg-sumi-700 border-2 border-parchment-200 dark:border-sumi-600 rounded-xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold tracking-widest text-ink-400 dark:text-sumi-400 uppercase">Progress</span>
          <span className="text-sm font-bold text-ink-700 dark:text-sumi-100">{earnedCount} / {achievements.length}</span>
        </div>
        <div className="w-full h-3 bg-slate-100 dark:bg-sumi-600 rounded-full overflow-hidden">
          <div
            className="h-full bg-cinnabar-500 rounded-full transition-all duration-700 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white dark:bg-sumi-700 border-2 border-parchment-200 dark:border-sumi-600 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-ink-800 dark:text-sumi-50">{totalDecks}</p>
          <p className="text-xs font-semibold text-ink-400 dark:text-sumi-400">Decks</p>
        </div>
        <div className="bg-white dark:bg-sumi-700 border-2 border-parchment-200 dark:border-sumi-600 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-ink-800 dark:text-sumi-50">{totalCards}</p>
          <p className="text-xs font-semibold text-ink-400 dark:text-sumi-400">Cards</p>
        </div>
        <div className="bg-white dark:bg-sumi-700 border-2 border-parchment-200 dark:border-sumi-600 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-ink-800 dark:text-sumi-50">{totalReviews}</p>
          <p className="text-xs font-semibold text-ink-400 dark:text-sumi-400">Reviews</p>
        </div>
      </div>

      {/* Achievements */}
      <div className="space-y-2">
        {achievements.map(a => {
          const earned = a.condition(cards, decks);
          return (
            <div
              key={a.id}
              className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${
                earned
                  ? 'bg-white dark:bg-sumi-700 border-cinnabar-200 dark:border-cinnabar-700'
                  : 'bg-transparent border-parchment-200 dark:border-sumi-600 opacity-60'
              }`}
            >
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                earned
                  ? 'bg-cinnabar-100 dark:bg-cinnabar-900/40 text-cinnabar-500 dark:text-cinnabar-300'
                  : 'bg-slate-100 dark:bg-sumi-600 text-ink-400 dark:text-sumi-400'
              }`}>
                {a.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-bold ${earned ? 'text-ink-800 dark:text-sumi-50' : 'text-ink-400 dark:text-sumi-400'}`}>
                  {a.title}
                </p>
                <p className="text-xs text-ink-500 dark:text-sumi-300">{a.description}</p>
                {a.progress && !earned && (
                  <div className="mt-1.5 w-full h-1.5 bg-slate-100 dark:bg-sumi-600 rounded-full overflow-hidden">
                    <div className="h-full bg-cinnabar-300 rounded-full" style={{ width: `${(a.progress.current / a.progress.total) * 100}%` }} />
                  </div>
                )}
              </div>
              <div className="shrink-0">
                {earned ? (
                  <span className="text-xs font-bold text-cinnabar-500 bg-cinnabar-50 dark:bg-cinnabar-900/40 px-2.5 py-1 rounded-full">Earned</span>
                ) : (
                  <span className="text-xs font-bold text-ink-400 dark:text-sumi-400">Locked</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
