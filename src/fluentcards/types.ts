import { State } from 'ts-fsrs';

export interface Deck {
  id: string;
  userId?: string;
  name: string;
  description: string;
  createdAt: number;
  isPublic: boolean;
  authorName?: string;
}

export interface Flashcard {
  id: string;
  userId?: string;
  deckId: string;
  front: string;
  back: string;
  language: string;
  targetLanguage?: string;
  useMnemonic: boolean;
  isPublic: boolean;

  // FSRS state
  due: Date;
  stability: number;
  difficulty: number;
  elapsed_days: number;
  scheduled_days: number;
  reps: number;
  lapses: number;
  state: State;
  last_review: Date | null;
}

export interface ReviewLog {
  id: string;
  userId?: string;
  cardId: string;
  rating: number;
  reviewedAt: number;
}
