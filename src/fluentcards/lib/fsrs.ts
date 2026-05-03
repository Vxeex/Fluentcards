import { FSRS, createEmptyCard } from 'ts-fsrs';
import type { Card as FSRSCard } from 'ts-fsrs';
import type { Flashcard } from '../types';

const fsrs = new FSRS({});

export function getEmptyFSRSCard(): FSRSCard {
  return createEmptyCard();
}

export function repeatCard(card: FSRSCard, now: Date) {
  return fsrs.repeat(card, now);
}

export function fsrcCardToFlashcardProperties(card: FSRSCard): Partial<Flashcard> & { learning_steps?: number[] } {
  return {
    due: card.due,
    stability: card.stability,
    difficulty: card.difficulty,
    elapsed_days: card.elapsed_days,
    scheduled_days: card.scheduled_days,
    reps: card.reps,
    lapses: card.lapses,
    state: card.state,
    last_review: card.last_review || null,
  };
}

export function flashcardToFSRSCard(card: Flashcard): FSRSCard {
  return {
    due: card.due,
    stability: card.stability,
    difficulty: card.difficulty,
    elapsed_days: card.elapsed_days,
    scheduled_days: card.scheduled_days,
    reps: card.reps,
    lapses: card.lapses,
    state: card.state,
    last_review: card.last_review || undefined,
  } as FSRSCard;
}
