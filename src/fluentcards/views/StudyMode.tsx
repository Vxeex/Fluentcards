import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../components/AuthProvider';
import { db } from '../lib/firebase';
import { collection, doc, updateDoc, setDoc, onSnapshot, query, where } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../lib/firebaseUtils';
import type { Flashcard, Deck } from '../types';
import { Rating } from 'ts-fsrs';
import { flashcardToFSRSCard, repeatCard, fsrcCardToFlashcardProperties } from '../lib/fsrs';
import { speak } from '../lib/tts';
import { Button } from '../components/ui/Button';
import { ArrowLeft, Volume2, RotateCcw } from 'lucide-react';
import { FuriganaText } from '../components/FuriganaText';
import { extractReadingForSpeech } from '../lib/speechUtils';
import { v4 as uuidv4 } from 'uuid';

const RATING_LABELS = {
  [Rating.Again]: { label: 'Again', style: 'bg-cinnabar-50 hover:bg-cinnabar-100 border-cinnabar-200 text-cinnabar-600 active:bg-cinnabar-200' },
  [Rating.Hard]: { label: 'Hard', style: 'bg-gold-50 hover:bg-gold-100 border-gold-200 text-gold-700 active:bg-gold-200' },
  [Rating.Good]: { label: 'Good', style: 'bg-emerald-50 hover:bg-emerald-100 border-emerald-200 text-emerald-600 active:bg-emerald-200' },
  [Rating.Easy]: { label: 'Easy', style: 'bg-slateblue-50 hover:bg-slateblue-100 border-slateblue-200 text-slateblue-600 active:bg-slateblue-200' },
};

export function StudyMode() {
  const { id } = useParams<{ id: string }>();
  const [sessionStartTime] = useState(Date.now());
  const [cardsReviewCount, setCardsReviewCount] = useState(0);
  const { user } = useAuth();

  const [deck, setDeck] = useState<Deck | null>(null);
  const [allCards, setAllCards] = useState<Flashcard[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!id || !user) return;

    const unsubscribeDeck = onSnapshot(
      doc(db, 'decks', id),
      (snapshot) => {
        if (snapshot.exists()) {
          setDeck(snapshot.data() as Deck);
        }
      },
      (error) => handleFirestoreError(error, OperationType.GET, `decks/${id}`)
    );

    const unsubscribeCards = onSnapshot(
      query(collection(db, 'cards'), where('deckId', '==', id), where('userId', '==', user.uid)),
      (snapshot) => {
        setAllCards(snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            ...data,
            due: new Date(data.due),
            last_review: data.last_review ? new Date(data.last_review) : null
          } as Flashcard;
        }));
        setIsLoading(false);
      },
      (error) => handleFirestoreError(error, OperationType.LIST, 'cards')
    );

    return () => {
      unsubscribeDeck();
      unsubscribeCards();
    };
  }, [id, user]);

  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [dueCards, setDueCards] = useState<Flashcard[]>([]);
  const [isFinished, setIsFinished] = useState(false);
  const [speechRate, setSpeechRate] = useState(1.0);

  useEffect(() => {
    if (allCards && allCards.length > 0 && dueCards.length === 0 && !isFinished && cardsReviewCount === 0) {
      const now = new Date();
      const due = allCards.filter(c => c.due <= now);
      if (due.length > 0) {
        setDueCards(due);
      } else {
        setIsFinished(true);
      }
    }
  }, [allCards, dueCards.length, isFinished, cardsReviewCount]);

  const currentCard = dueCards[currentCardIndex];

  const [mnemonicImageUrl, setMnemonicImageUrl] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    if (currentCard?.useMnemonic) {
      setMnemonicImageUrl(null);
      const keyword = currentCard.back ? currentCard.back : 'study';
      const prompt = `a visual mnemonic textbook illustration on a clean white background for the concept of: ${keyword}`;
      const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=400&height=300&nologo=true`;

      const img = new Image();
      img.onload = () => {
        if (active) setMnemonicImageUrl(url);
      };
      img.onerror = () => {
        if (active) {
          const numericId = currentCard.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
          setMnemonicImageUrl(`https://loremflickr.com/400/300/${encodeURIComponent(keyword.split(' ')[0])}?lock=${numericId}`);
        }
      };
      img.src = url;
    } else {
      setMnemonicImageUrl(null);
    }
    return () => { active = false; };
  }, [currentCard?.id, currentCard?.useMnemonic, currentCard?.back]);

  useEffect(() => {
    if (currentCard && !isFlipped) {
      speak(extractReadingForSpeech(currentCard.front), currentCard.language, speechRate);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentCard, isFlipped]);

  if (isLoading || !deck) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6">
        <div className="w-8 h-8 border-[3px] border-cinnabar-100 border-t-cinnabar-500 rounded-full animate-spin mb-3" />
        <p className="text-ink-400 dark:text-sumi-300 font-semibold text-sm">Loading study session...</p>
      </div>
    );
  }

  if (isFinished || dueCards.length === 0) {
    const minutes = Math.round((Date.now() - sessionStartTime) / 60000);
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 text-center">
        <div className="w-24 h-24 bg-cinnabar-100 dark:bg-cinnabar-900/30 rounded-full flex items-center justify-center mb-6 shadow-sm border-[6px] border-white dark:border-sumi-700">
          <span className="font-display text-4xl">FC</span>
        </div>
        <h2 className="font-display text-3xl font-bold mb-2 text-ink-800 dark:text-sumi-50 tracking-tight">Session Complete!</h2>
        <p className="text-ink-500 dark:text-sumi-300 font-semibold mb-8 max-w-xs text-base">
          Reviewed {cardsReviewCount} cards in {minutes} {minutes === 1 ? 'minute' : 'minutes'}. Great job!
        </p>
        <Link to={`/deck/${deck.id}`}>
          <Button className="bg-cinnabar-500 hover:bg-cinnabar-600 text-white rounded-lg shadow-sm px-8 text-base">Back to Deck</Button>
        </Link>
      </div>
    );
  }

  if (!currentCard) return (
    <div className="flex flex-col items-center justify-center h-full p-6">
      <div className="w-8 h-8 border-[3px] border-cinnabar-100 border-t-cinnabar-500 rounded-full animate-spin mb-3" />
      <p className="text-ink-400 dark:text-sumi-300 font-semibold text-sm">Preparing cards...</p>
    </div>
  );

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const handleMuteToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    speak(extractReadingForSpeech(currentCard.front), currentCard.language, speechRate);
  };

  const handleRate = async (rating: Rating) => {
    if (!user) return;
    const fsrsCard = flashcardToFSRSCard(currentCard);
    const now = new Date();

    const scheduling_cards = repeatCard(fsrsCard, now);
    const recordLog = scheduling_cards[rating].log;
    const nextCardState = scheduling_cards[rating].card;
    const cardProps = fsrcCardToFlashcardProperties(nextCardState);

    try {
      await updateDoc(doc(db, 'cards', currentCard.id), {
        due: cardProps.due!.toISOString(),
        stability: cardProps.stability,
        difficulty: cardProps.difficulty,
        elapsed_days: cardProps.elapsed_days,
        scheduled_days: cardProps.scheduled_days,
        reps: cardProps.reps,
        lapses: cardProps.lapses,
        state: cardProps.state,
        last_review: cardProps.last_review ? cardProps.last_review.toISOString() : null,
      });

      const newReviewId = uuidv4();
      await setDoc(doc(db, 'reviews', newReviewId), {
        id: newReviewId,
        userId: user.uid,
        cardId: currentCard.id,
        rating,
        reviewedAt: now.getTime(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `cards/${currentCard.id}`);
    }

    setCardsReviewCount(prev => prev + 1);

    if (currentCardIndex + 1 < dueCards.length) {
      setCurrentCardIndex(prev => prev + 1);
      setIsFlipped(false);
    } else {
      setIsFinished(true);
    }
  };

  return (
    <div className="flex flex-col h-full bg-transparent overflow-hidden relative">
      {/* Progress bar */}
      <div className="absolute top-0 left-0 w-full h-1 bg-parchment-100 dark:bg-sumi-700 z-50">
        <div
          className="h-full bg-cinnabar-500 transition-all duration-300 ease-out"
          style={{ width: `${Math.max(2, ((currentCardIndex + 1) / dueCards.length) * 100)}%` }}
        />
      </div>

      {/* Top bar */}
      <div className="flex items-center justify-between p-5 bg-white/80 dark:bg-sumi-800/80 border-b border-parchment-100 dark:border-sumi-700 backdrop-blur-md shrink-0 pt-8">
        <Link to={`/deck/${deck.id}`} className="p-1.5 text-ink-500 dark:text-sumi-300 hover:text-ink-700 dark:hover:text-sumi-50 transition-colors pl-0">
          <ArrowLeft size={24} />
        </Link>
        <div className="px-4 py-1.5 bg-white dark:bg-sumi-700 border border-parchment-200 dark:border-sumi-600 rounded-full text-sm font-bold shadow-sm flex items-center gap-2">
          <span className="text-cinnabar-500 dark:text-cinnabar-300">{currentCardIndex + 1}</span>
          <span className="text-parchment-200 dark:text-sumi-500 font-semibold">/</span>
          <span className="text-ink-500 dark:text-sumi-300">{dueCards.length}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold text-ink-500 dark:text-sumi-300">{speechRate.toFixed(1)}x</span>
          <input
            type="range"
            min="0.5"
            max="2.0"
            step="0.1"
            value={speechRate}
            onChange={(e) => setSpeechRate(parseFloat(e.target.value))}
            className="w-20 sm:w-24 h-1.5 bg-cinnabar-100 dark:bg-sumi-600 rounded-lg appearance-none cursor-pointer accent-cinnabar-500"
            title="Speech Rate"
          />
        </div>
      </div>

      {/* Card area */}
      <div className="flex-1 overflow-hidden p-5 flex flex-col items-center justify-center [perspective:1000px]">
        <div
          className={`w-full max-w-sm flex-1 max-h-[600px] rounded-2xl transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] cursor-pointer group [transform-style:preserve-3d] ${isFlipped ? '[transform:rotateY(180deg)]' : ''}`}
          onClick={handleFlip}
        >
          {/* FRONT FACE */}
          <div className="absolute inset-0 w-full h-full bg-gradient-to-b from-cinnabar-200/60 to-cinnabar-100/30 p-2 rounded-2xl shadow-lg [backface-visibility:hidden] group-hover:scale-[1.01] transition-transform">
            <div className="w-full h-full bg-white dark:bg-sumi-700 rounded-xl p-6 flex flex-col relative overflow-hidden border-2 border-white dark:border-sumi-600">

              <div className="absolute top-4 right-4 z-30">
                <button
                  onClick={handleMuteToggle}
                  className="p-2.5 bg-cream dark:bg-sumi-600 hover:bg-cinnabar-50 dark:hover:bg-sumi-500 rounded-full border border-parchment-200 dark:border-sumi-600 group/btn transition-all shadow-sm"
                >
                  <Volume2 size={24} className="text-ink-500 dark:text-sumi-300 group-hover/btn:scale-110 transition-transform" />
                </button>
              </div>

              <div className="flex-1 w-full flex flex-col overflow-y-auto scrollbar-hide pt-12 pb-4">
                <div className="w-full flex flex-col items-center justify-center relative text-center flex-1 px-2">
                  {currentCard.useMnemonic && (
                    <div className="w-full h-44 bg-cream dark:bg-sumi-600 rounded-xl border-2 border-parchment-200 dark:border-sumi-600 overflow-hidden relative mb-5 shadow-inner flex items-center justify-center p-2 shrink-0">
                      <div className="absolute inset-0 flex items-center justify-center text-ink-400 dark:text-sumi-400 text-xs font-bold">Loading mnemonic...</div>
                      {mnemonicImageUrl && (
                        <img
                          src={mnemonicImageUrl}
                          alt="Mnemonic"
                          className="w-full h-full object-contain opacity-80 hover:opacity-100 transition-all relative z-10 rounded-lg bg-white dark:bg-sumi-700"
                          loading="lazy"
                        />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-cinnabar-100/30 to-transparent z-20 pointer-events-none"></div>
                    </div>
                  )}

                  <h2 lang={currentCard.language || undefined} className={`${currentCard.front.length > 100 ? 'text-lg' : currentCard.front.length > 50 ? 'text-xl' : currentCard.front.length > 20 ? 'text-2xl' : 'text-4xl'} font-extrabold tracking-tight mb-2 leading-tight text-ink-700 dark:text-sumi-100 w-full break-words whitespace-pre-wrap`}>
                    <FuriganaText text={currentCard.front} />
                  </h2>
                </div>
              </div>
            </div>
          </div>

          {/* BACK FACE */}
          <div className="absolute inset-0 w-full h-full bg-gradient-to-b from-cinnabar-200/60 to-cinnabar-100/30 p-2 rounded-2xl shadow-lg [backface-visibility:hidden] [transform:rotateY(180deg)] group-hover:scale-[1.01] transition-transform">
            <div className="w-full h-full bg-white dark:bg-sumi-700 rounded-xl p-6 flex flex-col relative overflow-hidden border-2 border-white dark:border-sumi-600">

              <div className="absolute top-4 right-4 z-30">
                <button
                  onClick={handleMuteToggle}
                  className="p-2.5 bg-cream dark:bg-sumi-600 hover:bg-cinnabar-50 dark:hover:bg-sumi-500 rounded-full border border-parchment-200 dark:border-sumi-600 group/btn transition-all shadow-sm"
                >
                  <Volume2 size={24} className="text-ink-500 dark:text-sumi-300 group-hover/btn:scale-110 transition-transform" />
                </button>
              </div>

              <div className="flex-1 w-full flex flex-col overflow-y-auto scrollbar-hide pt-12 pb-4">
                <div className="w-full flex-col items-center justify-center relative text-center flex shrink-0 mb-4 px-2">
                  <h2 lang={currentCard.language || undefined} className="text-base font-bold tracking-tight text-ink-400 dark:text-sumi-400 opacity-70 w-full break-words whitespace-pre-wrap">
                    {currentCard.front}
                  </h2>
                </div>

                <div className="flex-1 w-full pt-4 border-t-2 border-dashed border-parchment-200 dark:border-sumi-600 flex flex-col items-center justify-center text-center px-2">
                  <h3 lang={currentCard.targetLanguage || undefined} className={`${currentCard.back.length > 150 ? 'text-base font-semibold' : currentCard.back.length > 100 ? 'text-lg font-bold' : currentCard.back.length > 50 ? 'text-xl font-extrabold' : 'text-2xl font-extrabold'} text-ink-700 dark:text-sumi-100 tracking-wide w-full leading-relaxed pb-4 break-words whitespace-pre-wrap`}>
                    <FuriganaText text={currentCard.back} />
                  </h3>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Rating buttons */}
      <div className="p-5 bg-white/80 dark:bg-sumi-800/80 border-t border-parchment-100 dark:border-sumi-700 backdrop-blur-md shrink-0">
        <div className="max-w-sm mx-auto w-full text-center">
          {!isFlipped ? (
            <div className="text-ink-500 dark:text-sumi-300 font-bold text-sm animate-pulse mb-2">
              Tap the card to show answer
            </div>
          ) : (
            <div className="flex gap-2">
              {[Rating.Again, Rating.Hard, Rating.Good, Rating.Easy].map(rating => {
                const conf = RATING_LABELS[rating as keyof typeof RATING_LABELS];
                return (
                  <button
                    key={rating}
                    onClick={() => handleRate(rating)}
                    className={`flex-1 py-3.5 border-2 rounded-lg flex flex-col items-center transition-all active:scale-95 shadow-sm font-bold text-sm ${conf.style}`}
                  >
                    <span>{conf.label}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
