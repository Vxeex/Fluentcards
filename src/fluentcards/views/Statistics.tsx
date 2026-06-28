import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../components/AuthProvider';
import { Link } from 'react-router-dom';
import { ArrowLeft, Brain, Flame, Target, Calendar, BarChart3, Clock, AlertTriangle, Share2 } from 'lucide-react';
import { shareProgress } from '../lib/progressCard';
import { computeStreak } from '../lib/streakUtils';
import type { Flashcard } from '../types';

interface ReviewData {
  id: string;
  cardId: string;
  rating: number;
  reviewedAt: number;
}

export function Statistics() {
  const { dataService, isGuest, signInWithGoogle } = useAuth();
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [reviews, setReviews] = useState<ReviewData[]>([]);

  useEffect(() => {
    const unsubCards = dataService.subscribeCards(undefined, setCards);
    const unsubReviews = dataService.subscribeReviews(setReviews as any);
    return () => { unsubCards(); unsubReviews(); };
  }, [dataService]);

  const stats = useMemo(() => {
    const totalCards = cards.length;
    const totalReviews = reviews.length;
    const againCount = reviews.filter(r => r.rating === 0).length;
    const retention = totalReviews > 0 ? ((totalReviews - againCount) / totalReviews) * 100 : 0;
    const avgStability = totalCards > 0 ? cards.reduce((s, c) => s + (c.stability || 0), 0) / totalCards : 0;
    const avgDifficulty = totalCards > 0 ? cards.reduce((s, c) => s + (c.difficulty || 0), 0) / totalCards : 0;
    const masteredCount = cards.filter(c => (c.stability || 0) > 90).length;
    const lapsedCount = cards.filter(c => (c.lapses || 0) > 3).length;

    const newCards = cards.filter(c => c.state === 0).length;
    const learningCards = cards.filter(c => c.state === 1).length;
    const reviewCards = cards.filter(c => c.state === 2).length;
    const relearningCards = cards.filter(c => c.state === 3).length;

    const stabilityBuckets = [
      { label: '< 1 day', min: 0, max: 1, count: 0, color: 'from-rose-400 to-rose-500' },
      { label: '1–7 days', min: 1, max: 7, count: 0, color: 'from-gold-400 to-gold-500' },
      { label: '7–30 days', min: 7, max: 30, count: 0, color: 'from-emerald-400 to-emerald-500' },
      { label: '30–90 days', min: 30, max: 90, count: 0, color: 'from-cinnabar-400 to-cinnabar-500' },
      { label: '90+ days', min: 90, max: Infinity, count: 0, color: 'from-sky-400 to-sky-500' },
    ];
    cards.forEach(c => {
      const s = c.stability || 0;
      const b = stabilityBuckets.find(b => s >= b.min && s < b.max);
      if (b) b.count++;
    });

    const difficultyBuckets = [
      { label: 'Easy (0–3)', min: 0, max: 3, count: 0, color: 'from-cinnabar-400 to-cinnabar-500' },
      { label: 'Medium (3–6)', min: 3, max: 6, count: 0, color: 'from-gold-400 to-gold-500' },
      { label: 'Hard (6–10)', min: 6, max: 10, count: 0, color: 'from-rose-400 to-rose-500' },
    ];
    cards.forEach(c => {
      const d = c.difficulty || 5;
      const b = difficultyBuckets.find(b => d >= b.min && d < b.max);
      if (b) b.count++;
    });

    const now = new Date();
    const dailyReviews: { day: string; count: number }[] = [];
    let maxDailyReviews = 0;
    for (let i = 13; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const label = i === 0 ? 'Today' : d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
      const count = reviews.filter(r => {
        if (!r.reviewedAt) return false;
        return new Date(r.reviewedAt).toISOString().split('T')[0] === dateStr;
      }).length;
      if (count > maxDailyReviews) maxDailyReviews = count;
      dailyReviews.push({ day: label, count });
    }

    const forecast: { day: string; count: number }[] = [];
    let maxForecast = 0;
    for (let i = 0; i < 7; i++) {
      const d = new Date(now);
      d.setDate(d.getDate() + i);
      const dateStr = d.toISOString().split('T')[0];
      const label = i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
      const count = cards.filter(c => {
        if (!c.due) return false;
        return new Date(c.due).toISOString().split('T')[0] === dateStr;
      }).length;
      if (count > maxForecast) maxForecast = count;
      forecast.push({ day: label, count });
    }

    const hasOverdue = forecast.length > 0 && forecast[0].count > 50;

    return {
      totalCards, totalReviews, retention: Math.round(retention * 10) / 10,
      avgStability: Math.round(avgStability * 10) / 10,
      avgDifficulty: Math.round(avgDifficulty * 10) / 10,
      masteredCount, lapsedCount,
      newCards, learningCards, reviewCards, relearningCards,
      stabilityBuckets, difficultyBuckets, dailyReviews, maxDailyReviews,
      forecast, maxForecast, hasOverdue,
    };
  }, [cards, reviews]);

  const getRetentionColor = (r: number) => {
    if (r >= 90) return 'text-emerald-500';
    if (r >= 80) return 'text-gold-500';
    return 'text-rose-500';
  };

  const getRetentionRingColor = (r: number) => {
    if (r >= 90) return 'stroke-emerald-500';
    if (r >= 80) return 'stroke-gold-500';
    return 'stroke-rose-500';
  };

  const circumference = 2 * Math.PI * 54;
  const offset = circumference - (stats.retention / 100) * circumference;

  return (
    <div className="p-5 space-y-5 pb-8">
      {/* Guest prompt */}
      {isGuest && (
        <div className="p-4 bg-gradient-to-r from-cinnabar-50 to-teal-50 dark:from-cinnabar-900/20 dark:to-emerald-900/20 rounded-xl border border-cinnabar-200 dark:border-cinnabar-800 text-center">
          <BarChart3 size={24} className="text-cinnabar-400 mx-auto mb-2" />
          <p className="text-sm font-semibold text-ink-700 dark:text-sumi-100">Your Statistics</p>
          <p className="text-xs text-ink-500 dark:text-sumi-300 mt-1 mb-3">Sign in to see full statistics across all devices.</p>
          <button onClick={signInWithGoogle} className="text-sm font-bold text-cinnabar-500 hover:text-cinnabar-600 underline">Sign in with Google</button>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center gap-3" style={{ animation: 'springLeft 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)' }}>
        <Link to="/" className="p-1.5 text-ink-400 hover:text-ink-700 dark:text-sumi-300 dark:hover:text-sumi-50 transition-all hover:-translate-x-0.5">
          <ArrowLeft size={22} />
        </Link>
        <h1 className="font-display text-2xl font-bold tracking-tight text-ink-800 dark:text-sumi-50">Statistics</h1>
        <button
          onClick={() => shareProgress({ ...stats, streak: computeStreak(), studyDays: 0 })}
          className="ml-auto p-2 rounded-lg text-ink-400 hover:text-cinnabar-500 hover:bg-cinnabar-50 dark:hover:bg-sumi-700 transition-all active:scale-90"
          title="Share Progress"
        >
          <Share2 size={20} />
        </button>
      </div>

      {stats.totalCards === 0 ? (
        <div className="text-center py-16 flex flex-col items-center bg-white/50 dark:bg-sumi-700/30 rounded-xl border-2 border-dashed border-parchment-200 dark:border-sumi-600">
          <BarChart3 size={48} className="text-ink-300 dark:text-sumi-500 mb-3" />
          <p className="text-ink-500 dark:text-sumi-300 font-semibold">No data yet</p>
          <p className="text-ink-400 dark:text-sumi-400 text-sm mt-1">Create a deck, add some cards, and start studying. Your stats will appear here once you complete your first review session.</p>
        </div>
      ) : (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-2 gap-3" style={{ animation: 'springUp 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) 0.05s both' }}>
            <div className="bg-white/70 dark:bg-sumi-700/70 backdrop-blur-sm border-2 border-parchment-200 dark:border-sumi-600 rounded-xl p-4 text-center transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">
              <p className="text-2xl font-bold text-ink-800 dark:text-sumi-50">{stats.totalCards}</p>
              <div className="flex items-center justify-center gap-1 mt-1">
                <Brain size={14} className="text-ink-400 dark:text-sumi-400 shrink-0" />
                <p className="text-xs font-semibold text-ink-400 dark:text-sumi-400">Cards</p>
              </div>
            </div>
            <div className="bg-white/70 dark:bg-sumi-700/70 backdrop-blur-sm border-2 border-parchment-200 dark:border-sumi-600 rounded-xl p-4 text-center transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">
              <p className="text-2xl font-bold text-ink-800 dark:text-sumi-50">{stats.totalReviews}</p>
              <div className="flex items-center justify-center gap-1 mt-1">
                <Flame size={14} className="text-ink-400 dark:text-sumi-400 shrink-0" />
                <p className="text-xs font-semibold text-ink-400 dark:text-sumi-400">Reviews</p>
              </div>
            </div>
            <div className="bg-white/70 dark:bg-sumi-700/70 backdrop-blur-sm border-2 border-parchment-200 dark:border-sumi-600 rounded-xl p-4 text-center transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">
              <p className="text-2xl font-bold text-cinnabar-500">{stats.masteredCount}</p>
              <div className="flex items-center justify-center gap-1 mt-1">
                <Target size={14} className="text-ink-400 dark:text-sumi-400 shrink-0" />
                <p className="text-xs font-semibold text-ink-400 dark:text-sumi-400">Mastered</p>
              </div>
            </div>
            <div className="bg-white/70 dark:bg-sumi-700/70 backdrop-blur-sm border-2 border-parchment-200 dark:border-sumi-600 rounded-xl p-4 text-center transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">
              <p className="text-2xl font-bold text-ink-800 dark:text-sumi-50">{stats.avgStability}d</p>
              <div className="flex items-center justify-center gap-1 mt-1">
                <Clock size={14} className="text-ink-400 dark:text-sumi-400 shrink-0" />
                <p className="text-xs font-semibold text-ink-400 dark:text-sumi-400">Avg Stability</p>
              </div>
            </div>
          </div>

          {/* Retention rate */}
          <div
            className="bg-white/70 dark:bg-sumi-700/70 backdrop-blur-sm border-2 border-parchment-200 dark:border-sumi-600 rounded-xl p-5 shadow-sm"
            style={{ animation: 'springUp 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) 0.1s both' }}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xs font-bold tracking-widest text-ink-400 dark:text-sumi-400 uppercase">Retention Rate</h2>
              <span className={`text-sm font-bold ${getRetentionColor(stats.retention)}`}>
                {stats.retention >= 90 ? 'Great' : stats.retention >= 80 ? 'Good' : 'Needs Work'}
              </span>
            </div>
            <div className="flex items-center gap-6">
              <div className="relative w-28 h-28 shrink-0">
                <svg className="w-28 h-28 -rotate-90" viewBox="0 0 120 120">
                  <circle cx="60" cy="60" r="54" fill="none" stroke="currentColor" strokeWidth="8"
                    className="text-slate-100 dark:text-sumi-600" />
                  <circle cx="60" cy="60" r="54" fill="none" strokeWidth="8" strokeLinecap="round"
                    className={getRetentionRingColor(stats.retention)}
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    style={{ transition: 'stroke-dashoffset 1s cubic-bezier(0.34, 1.56, 0.64, 1)' }} />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className={`text-2xl font-extrabold ${getRetentionColor(stats.retention)}`}>
                    {stats.retention}%
                  </span>
                </div>
              </div>
              <div className="flex-1 space-y-2 min-w-0">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-semibold text-ink-500 dark:text-sumi-300">Again (failed)</span>
                  <span className="font-bold text-ink-800 dark:text-sumi-50">{reviews.filter(r => r.rating === 0).length}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="font-semibold text-ink-500 dark:text-sumi-300">Passed</span>
                  <span className="font-bold text-ink-800 dark:text-sumi-50">{reviews.filter(r => r.rating > 0).length}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="font-semibold text-ink-500 dark:text-sumi-300">Lapsed cards (&gt;3 lapses)</span>
                  <span className="font-bold text-ink-800 dark:text-sumi-50">{stats.lapsedCount}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Card maturity */}
          <div
            className="bg-white/70 dark:bg-sumi-700/70 backdrop-blur-sm border-2 border-parchment-200 dark:border-sumi-600 rounded-xl p-5 shadow-sm"
            style={{ animation: 'springUp 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) 0.15s both' }}
          >
            <h2 className="text-xs font-bold tracking-widest text-ink-400 dark:text-sumi-400 uppercase mb-4">Card Maturity</h2>
            {stats.totalCards > 0 ? (
              <div className="flex gap-2">
                {[
                  { label: 'New', count: stats.newCards, color: 'bg-slate-300 dark:bg-sumi-500' },
                  { label: 'Learning', count: stats.learningCards, color: 'bg-gold-400' },
                  { label: 'Review', count: stats.reviewCards, color: 'bg-emerald-500' },
                  { label: 'Relearn', count: stats.relearningCards, color: 'bg-rose-400' },
                ].map((item) => {
                  const pct = stats.totalCards > 0 ? (item.count / stats.totalCards) * 100 : 0;
                  return (
                    <div key={item.label} className="flex-1 text-center">
                      <div className="h-32 bg-slate-100 dark:bg-sumi-600 rounded-xl relative overflow-hidden mb-2 group">
                        <div
                          className={`absolute bottom-0 w-full ${item.color} rounded-xl transition-all duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)]`}
                          style={{
                            height: `${Math.max(pct, item.count > 0 ? 6 : 0)}%`,
                          }}
                        >
                          {item.count > 0 && pct > 15 && (
                            <span className="absolute inset-0 flex items-start justify-center pt-2 text-[11px] font-bold text-white dark:text-white drop-shadow-sm">
                              {item.count}
                            </span>
                          )}
                        </div>
                        {/* Show count on hover if bar is too small */}
                        {item.count > 0 && pct <= 15 && (
                          <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[11px] font-bold text-ink-500 dark:text-sumi-300 opacity-0 group-hover:opacity-100 transition-opacity">
                            {item.count}
                          </span>
                        )}
                      </div>
                      <p className="text-lg font-bold text-ink-800 dark:text-sumi-50">{item.count}</p>
                      <p className="text-[10px] font-bold text-ink-400 dark:text-sumi-400">{item.label}</p>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-sm font-semibold text-ink-400 dark:text-sumi-400">Study cards to see your maturity breakdown</p>
              </div>
            )}
          </div>

          {/* Stability distribution */}
          <div
            className="bg-white/70 dark:bg-sumi-700/70 backdrop-blur-sm border-2 border-parchment-200 dark:border-sumi-600 rounded-xl p-5 shadow-sm"
            style={{ animation: 'springUp 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) 0.2s both' }}
          >
            <h2 className="text-xs font-bold tracking-widest text-ink-400 dark:text-sumi-400 uppercase mb-4">Stability Distribution</h2>
            <div className="space-y-2.5">
              {stats.stabilityBuckets.map(b => {
                const pct = stats.totalCards > 0 ? (b.count / stats.totalCards) * 100 : 0;
                return (
                  <div key={b.label}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-semibold text-ink-500 dark:text-sumi-300">{b.label}</span>
                      <span className="font-bold text-ink-800 dark:text-sumi-50">{b.count}</span>
                    </div>
                    <div className="w-full h-3 bg-slate-100 dark:bg-sumi-600 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full bg-gradient-to-r ${b.color}`}
                        style={{
                          width: `${pct}%`,
                          transition: 'width 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)',
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Difficulty distribution */}
          <div
            className="bg-white/70 dark:bg-sumi-700/70 backdrop-blur-sm border-2 border-parchment-200 dark:border-sumi-600 rounded-xl p-5 shadow-sm"
            style={{ animation: 'springUp 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) 0.25s both' }}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xs font-bold tracking-widest text-ink-400 dark:text-sumi-400 uppercase">Difficulty</h2>
              <span className="text-xs font-bold text-ink-400 dark:text-sumi-400">Avg: {stats.avgDifficulty}</span>
            </div>
            <div className="space-y-2.5">
              {stats.difficultyBuckets.map(b => {
                const pct = stats.totalCards > 0 ? (b.count / stats.totalCards) * 100 : 0;
                return (
                  <div key={b.label}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-semibold text-ink-500 dark:text-sumi-300">{b.label}</span>
                      <span className="font-bold text-ink-800 dark:text-sumi-50">{b.count}</span>
                    </div>
                    <div className="w-full h-3 bg-slate-100 dark:bg-sumi-600 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full bg-gradient-to-r ${b.color}`}
                        style={{
                          width: `${pct}%`,
                          transition: 'width 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)',
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Daily review history */}
          <div
            className="bg-white/70 dark:bg-sumi-700/70 backdrop-blur-sm border-2 border-parchment-200 dark:border-sumi-600 rounded-xl p-5 shadow-sm"
            style={{ animation: 'springUp 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) 0.3s both' }}
          >
            <div className="flex items-center gap-2 mb-4">
              <Calendar size={14} className="text-ink-400 dark:text-sumi-400" />
              <h2 className="text-xs font-bold tracking-widest text-ink-400 dark:text-sumi-400 uppercase">Reviews — Last 14 Days</h2>
            </div>
            <div className="flex items-end gap-1.5 h-28">
              {stats.dailyReviews.map((d, i) => {
                const height = stats.maxDailyReviews > 0 ? (d.count / stats.maxDailyReviews) * 100 : 0;
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                    <span className="text-[9px] font-bold text-ink-400 dark:text-sumi-400">{d.count}</span>
                    <div
                      className="w-full bg-gradient-to-t from-cinnabar-400 to-cinnabar-300 rounded-t-md transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]"
                      style={{ height: `${Math.max(height, d.count > 0 ? 4 : 0)}%` }}
                    />
                    <span className="text-[8px] font-semibold text-ink-400 dark:text-sumi-400 whitespace-nowrap overflow-hidden text-ellipsis max-w-full text-center">
                      {i === 0 ? 'Now' : i === 1 ? 'Yest' : d.day.slice(0, 3)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Review forecast */}
          <div
            className="bg-white/70 dark:bg-sumi-700/70 backdrop-blur-sm border-2 border-parchment-200 dark:border-sumi-600 rounded-xl p-5 shadow-sm"
            style={{ animation: 'springUp 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) 0.35s both' }}
          >
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 size={14} className="text-ink-400 dark:text-sumi-400" />
              <h2 className="text-xs font-bold tracking-widest text-ink-400 dark:text-sumi-400 uppercase">Review Forecast — Next 7 Days</h2>
            </div>
            {stats.hasOverdue && (
              <div className="flex items-center gap-2 mb-3 px-3 py-2 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-lg">
                <AlertTriangle size={14} className="text-rose-500 shrink-0" />
                <p className="text-xs font-semibold text-rose-600 dark:text-rose-300">{stats.forecast[0].count} cards due today. Consider increasing daily study volume.</p>
              </div>
            )}
            <div className="flex items-end gap-1.5 h-28">
              {stats.forecast.map((d, i) => {
                const height = stats.maxForecast > 0 ? (d.count / stats.maxForecast) * 100 : 0;
                const isOverdue = i === 0 && d.count > 50;
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                    <span className={`text-[9px] font-bold ${isOverdue ? 'text-rose-500' : 'text-ink-400 dark:text-sumi-400'}`}>{d.count}</span>
                    <div
                      className={`w-full rounded-t-md transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
                        isOverdue
                          ? 'bg-gradient-to-t from-rose-400 to-rose-300'
                          : i <= 1
                            ? 'bg-gradient-to-t from-cinnabar-400 to-cinnabar-300'
                            : 'bg-gradient-to-t from-emerald-400 to-emerald-300'
                      }`}
                      style={{ height: `${Math.max(height, d.count > 0 ? 4 : 0)}%` }}
                    />
                    <span className="text-[8px] font-semibold text-ink-400 dark:text-sumi-400 whitespace-nowrap overflow-hidden text-ellipsis max-w-full text-center">
                      {d.day.length > 6 ? d.day.slice(0, 3) : d.day}
                    </span>
                  </div>
                );
              })}
            </div>
            <p className="text-[10px] text-ink-400 dark:text-sumi-400 mt-2 text-center">
              Based on your cards' due dates
            </p>
          </div>
        </>
      )}
    </div>
  );
}
