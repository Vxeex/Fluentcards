import type { User } from 'firebase/auth';
import {
  collection,
  doc,
  getDocs,
  onSnapshot,
  query,
  setDoc,
  updateDoc,
  deleteDoc,
  writeBatch,
  where,
} from 'firebase/firestore';
import type { Unsubscribe } from 'firebase/firestore';
import { db } from './firebase';
import type { Deck, Flashcard, ReviewLog } from '../types';
import { getEmptyFSRSCard, fsrcCardToFlashcardProperties } from './fsrs';

const LS_KEYS = {
  decks: 'fc_decks',
  cards: 'fc_cards',
  reviews: 'fc_reviews',
  studyCount: 'fc_study_count',
} as const;

// ---- LocalStorage helpers ----

function lsGet<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function lsSet(key: string, value: unknown) {
  localStorage.setItem(key, JSON.stringify(value));
}

// localStorage handles Dates poorly — convert ISO strings back to Date
function reviveDates(obj: unknown): unknown {
  if (!obj || typeof obj !== 'object') return obj;
  for (const key of Object.keys(obj as Record<string, unknown>)) {
    const val = (obj as Record<string, unknown>)[key];
    if (typeof val === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(val)) {
      (obj as Record<string, unknown>)[key] = new Date(val);
    } else if (Array.isArray(val)) {
      val.forEach(reviveDates);
    }
  }
  return obj;
}

// ---- DataService ----

export function createDataService(user: User | null) {
  const isGuest = !user;
  const uid = user?.uid || 'local';

  // ---- Decks ----

  function getDecks(): Promise<Deck[]> {
    if (isGuest) {
      return Promise.resolve(lsGet<Deck[]>(LS_KEYS.decks, []));
    }
    return getDocs(query(collection(db, 'decks'), where('userId', '==', uid)))
      .then(snap => snap.docs.map(d => ({ id: d.id, ...d.data() } as Deck)));
  }

  function subscribeDecks(onChange: (decks: Deck[]) => void): Unsubscribe | (() => void) {
    if (isGuest) {
      const emit = () => onChange(lsGet<Deck[]>(LS_KEYS.decks, []));
      emit();
      window.addEventListener('storage', emit);
      window.addEventListener('fc-update', emit);
      return () => {
        window.removeEventListener('storage', emit);
        window.removeEventListener('fc-update', emit);
      };
    }
    return onSnapshot(
      query(collection(db, 'decks'), where('userId', '==', uid)),
      snap => onChange(snap.docs.map(d => ({ id: d.id, ...d.data() } as Deck)))
    );
  }

  function addDeck(deck: Deck): Promise<void> {
    if (isGuest) {
      const decks = lsGet<Deck[]>(LS_KEYS.decks, []);
      decks.push(deck);
      lsSet(LS_KEYS.decks, decks);
      window.dispatchEvent(new CustomEvent('fc-update'));
      return Promise.resolve();
    }
    return setDoc(doc(db, 'decks', deck.id), { ...deck, userId: uid });
  }

  function deleteDeck(id: string): Promise<void> {
    if (isGuest) {
      const decks = lsGet<Deck[]>(LS_KEYS.decks, []).filter(d => d.id !== id);
      lsSet(LS_KEYS.decks, decks);
      const cards = lsGet<Flashcard[]>(LS_KEYS.cards, []).filter(c => c.deckId !== id);
      lsSet(LS_KEYS.cards, cards);
      window.dispatchEvent(new CustomEvent('fc-update'));
      return Promise.resolve();
    }
    return deleteDoc(doc(db, 'decks', id));
  }

  function updateDeck(id: string, data: Partial<Deck>): Promise<void> {
    if (isGuest) {
      const decks = lsGet<Deck[]>(LS_KEYS.decks, []);
      const idx = decks.findIndex(d => d.id === id);
      if (idx >= 0) {
        decks[idx] = { ...decks[idx], ...data };
        lsSet(LS_KEYS.decks, decks);
      }
      window.dispatchEvent(new CustomEvent('fc-update'));
      return Promise.resolve();
    }
    return updateDoc(doc(db, 'decks', id), data);
  }

  // ---- Cards ----

  function getCards(deckId?: string): Promise<Flashcard[]> {
    if (isGuest) {
      const all = lsGet<Flashcard[]>(LS_KEYS.cards, []);
      return Promise.resolve(
        deckId ? all.filter(c => c.deckId === deckId).map(c => reviveDates(c) as Flashcard) : all.map(c => reviveDates(c) as Flashcard)
      );
    }
    const constraints = [where('userId', '==', uid)];
    if (deckId) constraints.push(where('deckId', '==', deckId));
    return getDocs(query(collection(db, 'cards'), ...constraints))
      .then(snap => snap.docs.map(d => {
        const data = d.data() as Record<string, unknown>;
        return {
          id: d.id,
          ...data,
          due: (data.due as any)?.toDate?.() || new Date(data.due as string),
          last_review: data.last_review ? (data.last_review as any)?.toDate?.() || new Date(data.last_review as string) : null,
        } as Flashcard;
      }));
  }

  function subscribeCards(deckId: string | undefined, onChange: (cards: Flashcard[]) => void): Unsubscribe | (() => void) {
    if (isGuest) {
      const emit = () => {
        const all = lsGet<Flashcard[]>(LS_KEYS.cards, []);
        const filtered = deckId ? all.filter(c => c.deckId === deckId) : all;
        onChange(filtered.map(c => reviveDates(c) as Flashcard));
      };
      emit();
      window.addEventListener('storage', emit);
      window.addEventListener('fc-update', emit);
      return () => {
        window.removeEventListener('storage', emit);
        window.removeEventListener('fc-update', emit);
      };
    }
    const constraints = [where('userId', '==', uid)];
    if (deckId) constraints.push(where('deckId', '==', deckId));
    return onSnapshot(
      query(collection(db, 'cards'), ...constraints),
      snap => onChange(snap.docs.map(d => {
        const data = d.data() as Record<string, unknown>;
        return {
          id: d.id,
          ...data,
          due: (data.due as any)?.toDate?.() || new Date(data.due as string),
          last_review: data.last_review ? (data.last_review as any)?.toDate?.() || new Date(data.last_review as string) : null,
        } as Flashcard;
      }))
    );
  }

  function addCard(card: Flashcard): Promise<void> {
    if (isGuest) {
      const cards = lsGet<Flashcard[]>(LS_KEYS.cards, []);
      cards.push(card);
      lsSet(LS_KEYS.cards, cards);
      window.dispatchEvent(new CustomEvent('fc-update'));
      return Promise.resolve();
    }
    return setDoc(doc(db, 'cards', card.id), { ...card, userId: uid });
  }

  function updateCard(id: string, data: Partial<Flashcard>): Promise<void> {
    if (isGuest) {
      const cards = lsGet<Flashcard[]>(LS_KEYS.cards, []);
      const idx = cards.findIndex(c => c.id === id);
      if (idx >= 0) {
        cards[idx] = { ...cards[idx], ...data } as Flashcard;
        lsSet(LS_KEYS.cards, cards);
      }
      window.dispatchEvent(new CustomEvent('fc-update'));
      return Promise.resolve();
    }
    return updateDoc(doc(db, 'cards', id), data);
  }

  function deleteCard(id: string): Promise<void> {
    if (isGuest) {
      const cards = lsGet<Flashcard[]>(LS_KEYS.cards, []).filter(c => c.id !== id);
      lsSet(LS_KEYS.cards, cards);
      window.dispatchEvent(new CustomEvent('fc-update'));
      return Promise.resolve();
    }
    return deleteDoc(doc(db, 'cards', id));
  }

  // ---- Reviews ----

  function getReviews(): Promise<ReviewLog[]> {
    if (isGuest) {
      return Promise.resolve(lsGet<ReviewLog[]>(LS_KEYS.reviews, []));
    }
    return getDocs(query(collection(db, 'reviews'), where('userId', '==', uid)))
      .then(snap => snap.docs.map(d => ({ id: d.id, ...d.data() } as ReviewLog)));
  }

  function subscribeReviews(onChange: (reviews: ReviewLog[]) => void): Unsubscribe | (() => void) {
    if (isGuest) {
      const emit = () => onChange(lsGet<ReviewLog[]>(LS_KEYS.reviews, []));
      emit();
      window.addEventListener('storage', emit);
      window.addEventListener('fc-update', emit);
      return () => {
        window.removeEventListener('storage', emit);
        window.removeEventListener('fc-update', emit);
      };
    }
    return onSnapshot(
      query(collection(db, 'reviews'), where('userId', '==', uid)),
      snap => onChange(snap.docs.map(d => ({ id: d.id, ...d.data() } as ReviewLog)))
    );
  }

  function addReview(review: ReviewLog): Promise<void> {
    if (isGuest) {
      const reviews = lsGet<ReviewLog[]>(LS_KEYS.reviews, []);
      reviews.push(review);
      lsSet(LS_KEYS.reviews, reviews);
      window.dispatchEvent(new CustomEvent('fc-update'));
      return Promise.resolve();
    }
    return setDoc(doc(db, 'reviews', review.id), { ...review, userId: uid });
  }

  // ---- Bulk operations ----

  function importCards(deckId: string, cards: Array<{ front: string; back: string; language: string }>): Promise<void> {
    const newCards: Flashcard[] = cards.map((c, i) => ({
      id: crypto.randomUUID(),
      deckId,
      front: c.front,
      back: c.back,
      language: c.language,
      targetLanguage: '',
      useMnemonic: true,
      isPublic: false,
      ...fsrcCardToFlashcardProperties(getEmptyFSRSCard()),
      userId: uid,
    }));

    if (isGuest) {
      const existing = lsGet<Flashcard[]>(LS_KEYS.cards, []);
      lsSet(LS_KEYS.cards, [...existing, ...newCards]);
      window.dispatchEvent(new CustomEvent('fc-update'));
      return Promise.resolve();
    }

    const batch = writeBatch(db);
    newCards.forEach(c => batch.set(doc(db, 'cards', c.id), c));
    return batch.commit();
  }

  function resetProgress(deckId: string): Promise<void> {
    if (isGuest) {
      const cards = lsGet<Flashcard[]>(LS_KEYS.cards, []);
      const updated = cards.map(c => {
        if (c.deckId !== deckId) return c;
        return { ...c, ...fsrcCardToFlashcardProperties(getEmptyFSRSCard()) } as Flashcard;
      });
      lsSet(LS_KEYS.cards, updated);
      window.dispatchEvent(new CustomEvent('fc-update'));
      return Promise.resolve();
    }

    return getDocs(query(collection(db, 'cards'), where('deckId', '==', deckId), where('userId', '==', uid)))
      .then(snap => {
        const batch = writeBatch(db);
        snap.docs.forEach(d => {
          batch.update(doc(db, 'cards', d.id), fsrcCardToFlashcardProperties(getEmptyFSRSCard()));
        });
        return batch.commit();
      });
  }

  function deleteDeckCards(deckId: string): Promise<void> {
    if (isGuest) {
      const cards = lsGet<Flashcard[]>(LS_KEYS.cards, []).filter(c => c.deckId !== deckId);
      lsSet(LS_KEYS.cards, cards);
      window.dispatchEvent(new CustomEvent('fc-update'));
      return Promise.resolve();
    }

    return getDocs(query(collection(db, 'cards'), where('deckId', '==', deckId), where('userId', '==', uid)))
      .then(snap => {
        const batch = writeBatch(db);
        snap.docs.forEach(d => batch.delete(doc(db, 'cards', d.id)));
        return batch.commit();
      });
  }

  async function migrateGuestToAccount(): Promise<void> {
    if (!user) return;
    const localDecks = lsGet<Deck[]>(LS_KEYS.decks, []);
    const localCards = lsGet<Flashcard[]>(LS_KEYS.cards, []);
    const localReviews = lsGet<ReviewLog[]>(LS_KEYS.reviews, []);

    if (localDecks.length === 0 && localCards.length === 0 && localReviews.length === 0) return;

    // Fetch existing Firestore data to compare timestamps (newest wins)
    const [existingDecksSnap, existingCardsSnap, existingReviewsSnap] = await Promise.all([
      getDocs(query(collection(db, 'decks'), where('userId', '==', uid))),
      getDocs(query(collection(db, 'cards'), where('userId', '==', uid))),
      getDocs(query(collection(db, 'reviews'), where('userId', '==', uid))),
    ]);

    const existingDecks = new Map(existingDecksSnap.docs.map(d => [d.id, d.data() as Deck]));
    const existingCards = new Map(existingCardsSnap.docs.map(d => [d.id, d.data() as Flashcard]));
    const existingReviews = new Map(existingReviewsSnap.docs.map(d => [d.id, d.data() as ReviewLog]));

    const batch = writeBatch(db);
    let hasNewData = false;

    localDecks.forEach(d => {
      const existing = existingDecks.get(d.id);
      // Newest wins: keep the one with later createdAt
      if (!existing || d.createdAt > existing.createdAt) {
        batch.set(doc(db, 'decks', d.id), { ...d, userId: uid });
        hasNewData = true;
      }
    });

    localCards.forEach(c => {
      const existing = existingCards.get(c.id);
      const localTime = c.last_review ? new Date(c.last_review).getTime() : 0;
      const existingTime = existing?.last_review ? new Date(existing.last_review as any).getTime() : 0;
      // Newest wins based on last_review timestamp
      if (!existing || localTime > existingTime) {
        batch.set(doc(db, 'cards', c.id), { ...c, userId: uid });
        hasNewData = true;
      }
    });

    localReviews.forEach(r => {
      if (!existingReviews.has(r.id)) {
        batch.set(doc(db, 'reviews', r.id), { ...r, userId: uid });
        hasNewData = true;
      }
    });

    if (hasNewData) {
      await batch.commit();
    }

    // Clear local storage regardless — local data is preserved in Firestore
    localStorage.removeItem(LS_KEYS.decks);
    localStorage.removeItem(LS_KEYS.cards);
    localStorage.removeItem(LS_KEYS.reviews);
    localStorage.removeItem(LS_KEYS.studyCount);
    window.dispatchEvent(new CustomEvent('fc-update'));
  }

  // ---- Study session tracking ----

  function getStudyCount(): number {
    return lsGet<number>(LS_KEYS.studyCount, 0);
  }

  function incrementStudyCount(): void {
    lsSet(LS_KEYS.studyCount, getStudyCount() + 1);
    window.dispatchEvent(new CustomEvent('fc-update'));
  }

  function getDeck(id: string): Promise<Deck | null> {
    if (isGuest) {
      const decks = lsGet<Deck[]>(LS_KEYS.decks, []);
      return Promise.resolve(decks.find(d => d.id === id) || null);
    }
    return getDocs(query(collection(db, 'decks'), where('__name__', '==', id)))
      .then(snap => {
        if (snap.empty) return null;
        const d = snap.docs[0];
        return { id: d.id, ...d.data() } as Deck;
      });
  }

  return {
    isGuest,
    uid,
    getDecks,
    subscribeDecks,
    addDeck,
    deleteDeck,
    updateDeck,
    getCards,
    subscribeCards,
    addCard,
    updateCard,
    deleteCard,
    getReviews,
    subscribeReviews,
    addReview,
    importCards,
    resetProgress,
    deleteDeckCards,
    migrateGuestToAccount,
    getStudyCount,
    incrementStudyCount,
    getDeck,
  };
}

export type DataService = ReturnType<typeof createDataService>;
