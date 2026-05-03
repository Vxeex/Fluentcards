import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../components/AuthProvider';
import { db } from '../lib/firebase';
import { collection, doc, updateDoc, setDoc, onSnapshot, query, where } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../lib/firebaseUtils';
import { Flashcard, Deck } from '../types';
import { Rating } from 'ts-fsrs';
import { flashcardToFSRSCard, repeatCard, fsrcCardToFlashcardProperties } from '../lib/fsrs';
import { speak } from '../lib/tts';
import { Button } from '../components/ui/Button';
import { ArrowLeft, Volume2, CheckCircle2, RotateCcw } from 'lucide-react';
import { FuriganaText } from '../components/FuriganaText';
import { extractReadingForSpeech } from '../lib/speechUtils';
import { v4 as uuidv4 } from 'uuid';

// Map Rating enums to UI
const RATING_LABELS = {
  [Rating.Again]: { label: 'Again', text: 'text-rose-500', style: 'bg-rose-100 hover:bg-rose-200 border-rose-200 text-rose-500' },
  [Rating.Hard]: { label: 'Hard', text: 'text-orange-500', style: 'bg-orange-100 hover:bg-orange-200 border-orange-200 text-orange-500' },
  [Rating.Good]: { label: 'Good', text: 'text-emerald-500', style: 'bg-emerald-100 hover:bg-emerald-200 border-emerald-200 text-emerald-500' },
  [Rating.Easy]: { label: 'Easy', text: 'text-sky-500', style: 'bg-sky-100 hover:bg-sky-200 border-sky-200 text-sky-500' },
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
          // Ensure we pass back Date objects explicitly just in case FSRS logic relies on it although it should be fine if we map it properly later
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

  // Initialize due cards once they load
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
      setMnemonicImageUrl(null); // Reset while loading
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
      // Auto-pronounce on show (front)
      speak(extractReadingForSpeech(currentCard.front), currentCard.language, speechRate);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentCard, isFlipped]);

  if (isLoading || !deck) {
    return <div className="p-8 text-center text-gray-500">Loading...</div>;
  }

  if (isFinished || dueCards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 text-center animate-in fade-in zoom-in duration-300">
        <div className="w-24 h-24 bg-indigo-100 text-slate-800 dark:text-slate-100 rounded-full flex items-center justify-center mb-6 shadow-md border-[6px] border-white text-5xl">
          🎉
        </div>
        <h2 className="text-3xl font-extrabold mb-2 text-slate-800 dark:text-slate-100 tracking-tight">Otsukare!</h2>
        <p className="text-slate-600 dark:text-slate-300 font-medium mb-8 max-w-xs text-lg">
          Reviewed {cardsReviewCount} cards in {Math.round((Date.now() - sessionStartTime) / 60000)} minutes. Great job!
        </p>
        <Link to={`/deck/${deck.id}`}>
          <Button className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-md border-b-4 border-indigo-600 active:border-b-0 active:translate-y-1 px-8 text-lg">Back to Deck</Button>
        </Link>
      </div>
    );
  }

  if (!currentCard) return null;

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
    
    // Calculate new FSRS state
    const scheduling_cards = repeatCard(fsrsCard, now);
    const recordLog = scheduling_cards[rating].log;
    const nextCardState = scheduling_cards[rating].card;
    const cardProps = fsrcCardToFlashcardProperties(nextCardState);
    
    try {
      // Update DB
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
      
      // Log Review
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
    
    // Move to next card
    if (currentCardIndex + 1 < dueCards.length) {
      setCurrentCardIndex(prev => prev + 1);
      setIsFlipped(false);
    } else {
      setIsFinished(true);
    }
  };

  return (
    <div className="flex flex-col h-full bg-transparent overflow-hidden relative">
      {/* Top progress bar */}
      <div className="absolute top-0 left-0 w-full h-1 bg-slate-100 dark:bg-slate-800 z-50">
        <div 
          className="h-full bg-indigo-500 transition-all duration-300 ease-out"
          style={{ width: `${Math.max(2, ((currentCardIndex + 1) / dueCards.length) * 100)}%` }}
        />
      </div>

      <div className="flex items-center justify-between p-6 bg-white dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-700 backdrop-blur-md shrink-0 rounded-b-3xl pt-8">
        <Link to={`/deck/${deck.id}`} className="p-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 transition-colors pl-0">
          <ArrowLeft size={24} />
        </Link>
        <div className="px-4 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-full text-sm font-bold shadow-sm flex items-center gap-2">
          <span className="text-indigo-600 dark:text-indigo-400">{currentCardIndex + 1}</span>
          <span className="text-slate-300 font-medium">/</span>
          <span className="text-slate-500 dark:text-slate-400">{dueCards.length}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300">{speechRate.toFixed(1)}x</span>
          <input 
            type="range"
            min="0.5"
            max="2.0"
            step="0.1"
            value={speechRate} 
            onChange={(e) => setSpeechRate(parseFloat(e.target.value))}
            className="w-20 sm:w-24 h-1.5 bg-indigo-100 rounded-lg appearance-none cursor-pointer accent-indigo-400"
            title="Speech Rate"
          />
        </div>
      </div>

      <div className="flex-1 overflow-hidden p-6 flex flex-col items-center justify-center [perspective:1000px]">
        <div 
          className={`w-full max-w-sm flex-1 max-h-[600px] rounded-2xl transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] cursor-pointer group [transform-style:preserve-3d] ${isFlipped ? '[transform:rotateY(180deg)]' : ''}`}
          onClick={handleFlip}
        >
          {/* FRONT FACE */}
          <div className="absolute inset-0 w-full h-full bg-gradient-to-b from-indigo-200 to-indigo-100 p-2 rounded-2xl shadow-xl shadow-indigo-200/50 [backface-visibility:hidden] group-hover:scale-[1.02] transition-transform">
            <div className="w-full h-full bg-white dark:bg-slate-900 rounded-xl p-6 flex flex-col relative overflow-hidden border-2 border-white">
              
              <div className="absolute top-4 right-4 z-30">
                <button 
                  onClick={handleMuteToggle}
                  className="p-3 bg-slate-50 dark:bg-slate-800 hover:bg-indigo-100 rounded-full border border-slate-200 dark:border-slate-700 group/btn transition-all shadow-sm"
                >
                  <Volume2 size={28} className="text-slate-600 dark:text-slate-300 group-hover/btn:scale-110 transition-transform" />
                </button>
              </div>

              <div className="flex-1 w-full flex flex-col overflow-y-auto scrollbar-hide pt-14 pb-4">
                <div className="w-full flex flex-col items-center justify-center relative text-center flex-1 px-2 min-h-full min-h-[min-content]">
                  {currentCard.useMnemonic && (
                    <div className="w-full h-48 bg-slate-50 dark:bg-slate-800 rounded-xl border-2 border-slate-200 dark:border-slate-700 overflow-hidden relative group mb-6 shadow-inner flex items-center justify-center p-2 shrink-0">
                      <div className="absolute inset-0 flex items-center justify-center text-slate-400 dark:text-slate-500 dark:text-slate-400 text-xs font-bold">Loading mnemonic...</div>
                      {mnemonicImageUrl && (
                        <img 
                          src={mnemonicImageUrl} 
                          alt="Mnemonic" 
                          className="w-full h-full object-contain opacity-80 hover:opacity-100 transition-all relative z-10 rounded-lg bg-white dark:bg-slate-900"
                          loading="lazy"
                        />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-indigo-100/50 to-transparent z-20 pointer-events-none"></div>
                    </div>
                  )}
                  
                  <h2 lang={currentCard.language || undefined} className={`${currentCard.front.length > 100 ? 'text-lg' : currentCard.front.length > 50 ? 'text-xl' : currentCard.front.length > 20 ? 'text-2xl' : 'text-4xl'} font-extrabold tracking-tight mb-2 leading-tight text-slate-700 dark:text-slate-200 w-full break-words whitespace-pre-wrap`}>
                    <FuriganaText text={currentCard.front} />
                  </h2>
                </div>
              </div>

            </div>
          </div>

          {/* BACK FACE */}
          <div className="absolute inset-0 w-full h-full bg-gradient-to-b from-indigo-200 to-indigo-100 p-2 rounded-2xl shadow-xl shadow-indigo-200/50 [backface-visibility:hidden] [transform:rotateY(180deg)] group-hover:scale-[1.02] transition-transform">
            <div className="w-full h-full bg-white dark:bg-slate-900 rounded-xl p-6 flex flex-col relative overflow-hidden border-2 border-white">
              
              <div className="absolute top-4 right-4 z-30">
                <button 
                  onClick={handleMuteToggle}
                  className="p-3 bg-slate-50 dark:bg-slate-800 hover:bg-indigo-100 rounded-full border border-slate-200 dark:border-slate-700 group/btn transition-all shadow-sm"
                >
                  <Volume2 size={28} className="text-slate-600 dark:text-slate-300 group-hover/btn:scale-110 transition-transform" />
                </button>
              </div>

              <div className="flex-1 w-full flex flex-col overflow-y-auto scrollbar-hide pt-14 pb-4">
                <div className="w-full flex-col items-center justify-center relative text-center flex shrink-0 mb-4 px-2">
                  <h2 lang={currentCard.language || undefined} className="text-base font-bold tracking-tight text-slate-400 dark:text-slate-500 dark:text-slate-400 opacity-70 w-full break-words whitespace-pre-wrap">
                    {currentCard.front}
                  </h2>
                </div>

                <div className="flex-1 w-full pt-4 border-t-2 border-dashed border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center text-center px-2 min-h-0">
                  <h3 lang={currentCard.targetLanguage || undefined} className={`${currentCard.back.length > 150 ? 'text-base font-semibold' : currentCard.back.length > 100 ? 'text-lg font-bold' : currentCard.back.length > 50 ? 'text-xl font-extrabold' : 'text-2xl font-extrabold'} text-slate-700 dark:text-slate-200 tracking-wide w-full leading-relaxed pb-4 break-words whitespace-pre-wrap`}>
                    <FuriganaText text={currentCard.back} />
                  </h3>
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>

      <div className="p-6 bg-white dark:bg-slate-900/80 border-t border-slate-200 dark:border-slate-700 backdrop-blur-md pb-safe shrink-0 min-h-[104px] flex flex-col justify-center rounded-t-3xl">
        <div className="max-w-sm mx-auto w-full text-center">
          {!isFlipped ? (
            <div className="text-slate-600 dark:text-slate-300 font-bold text-sm animate-pulse mb-8">
              Tap the card to show answer
            </div>
          ) : (
            <div className="flex gap-3 relative top-[-10px]">
              {[Rating.Again, Rating.Hard, Rating.Good, Rating.Easy].map(rating => {
                const conf = RATING_LABELS[rating as keyof typeof RATING_LABELS];
                return (
                  <button
                    key={rating}
                    onClick={() => handleRate(rating)}
                    className={`flex-1 py-4 border-2 rounded-lg flex flex-col items-center transition-transform active:scale-95 shadow-sm border-b-4 active:border-b-2 active:translate-y-[2px] ${conf.style}`}
                  >
                    <span className="font-extrabold pb-1">{conf.label}</span>
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
