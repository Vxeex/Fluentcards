export const blogToDecks: Record<string, { id: string; name: string; description: string }[]> = {
  'japanese-flashcard-study-guide': [
    { id: 'starter-jlpt-n5', name: 'JLPT N5 Vocabulary', description: 'Essential vocabulary for the JLPT N5 exam' },
  ],
  'learn-japanese-kanji-with-flashcards': [
    { id: 'starter-jlpt-n5', name: 'JLPT N5 Vocabulary', description: 'Practice kanji readings with this starter deck' },
  ],
  'jlpt-n5-study-guide': [
    { id: 'starter-jlpt-n5', name: 'JLPT N5 Vocabulary', description: 'The perfect companion deck for JLPT N5 prep' },
  ],
  'best-way-to-learn-japanese-vocabulary': [
    { id: 'starter-jlpt-n5', name: 'JLPT N5 Vocabulary', description: 'Start building your Japanese vocabulary' },
  ],
  'how-to-use-spaced-repetition': [
    { id: 'starter-jlpt-n5', name: 'JLPT N5 Vocabulary', description: 'Apply spaced repetition with real vocabulary' },
    { id: 'starter-spanish-101', name: 'Spanish 101', description: 'Try spaced repetition with Spanish basics' },
  ],
  'how-to-create-effective-flashcards': [
    { id: 'starter-jlpt-n5', name: 'JLPT N5 Vocabulary', description: 'See effective flashcards in action' },
    { id: 'starter-french-basics', name: 'French Basics', description: 'Practice with French vocabulary' },
    { id: 'starter-chinese-basics', name: 'Mandarin Chinese Basics', description: 'Apply flashcard principles to Chinese' },
  ],
  'learn-korean-vocabulary-with-flashcards': [
    { id: 'starter-korean-basics', name: 'Korean Basics', description: 'Start learning Korean vocabulary' },
  ],
  'learn-spanish-vocabulary-with-flashcards': [
    { id: 'starter-spanish-101', name: 'Spanish 101', description: 'Start learning Spanish vocabulary' },
  ],
  'fsrs-spaced-repetition-algorithm': [
    { id: 'starter-jlpt-n5', name: 'JLPT N5 Vocabulary', description: 'See FSRS in action' },
  ],
  'language-islands': [
    { id: 'starter-jlpt-n5', name: 'JLPT N5 Vocabulary', description: 'Build your first Language Island' },
    { id: 'starter-korean-basics', name: 'Korean Basics', description: 'Expand your Language Islands' },
    { id: 'starter-spanish-101', name: 'Spanish 101', description: 'Practice with real sentences' },
  ],
  'the-language-reflex': [
    { id: 'starter-jlpt-n5', name: 'JLPT N5 Vocabulary', description: 'Train your language reflex' },
    { id: 'starter-german-basics', name: 'German Basics', description: 'Build your German reflex' },
  ],
  '8-hour-upgrade-sleep-vocabulary': [
    { id: 'starter-jlpt-n5', name: 'JLPT N5 Vocabulary', description: 'Prepare vocabulary for sleep-state priming' },
  ],
  'performance-athlete-meeting-freeze': [
    { id: 'starter-jlpt-n5', name: 'JLPT N5 Vocabulary', description: 'Build meeting-ready vocabulary' },
  ],
  'bizarre-mnemonics': [
    { id: 'starter-spanish-101', name: 'Spanish 101', description: 'Practice mnemonics with Spanish' },
    { id: 'starter-jlpt-n5', name: 'JLPT N5 Vocabulary', description: 'Apply mnemonics to Japanese' },
  ],
  'north-star-strategy': [
    { id: 'starter-jlpt-n5', name: 'JLPT N5 Vocabulary', description: 'Start your North Star journey' },
  ],
  'beyond-the-textbook-polyglot-secrets': [
    { id: 'starter-jlpt-n5', name: 'JLPT N5 Vocabulary', description: 'Go beyond the textbook' },
    { id: 'starter-spanish-101', name: 'Spanish 101', description: 'Practice polyglot methods' },
  ],
  'dli-language-learning-method': [
    { id: 'starter-korean-basics', name: 'Korean Basics', description: 'Train like a military linguist' },
  ],
};

export const deckToBlogs: Record<string, { slug: string; title: string }[]> = {
  'starter-jlpt-n5': [
    { slug: '/blog/japanese-flashcard-study-guide/', title: 'Japanese Flashcard Study Guide' },
    { slug: '/blog/learn-japanese-kanji-with-flashcards/', title: 'Learn Japanese Kanji with Flashcards' },
    { slug: '/blog/jlpt-n5-study-guide/', title: 'JLPT N5 Study Guide' },
    { slug: '/blog/best-way-to-learn-japanese-vocabulary/', title: 'The Best Way to Learn Japanese Vocabulary' },
    { slug: '/blog/language-islands/', title: 'Language Islands' },
  ],
  'starter-korean-basics': [
    { slug: '/blog/learn-korean-vocabulary-with-flashcards/', title: 'Learn Korean Vocabulary with Flashcards' },
    { slug: '/blog/language-islands/', title: 'Language Islands' },
    { slug: '/blog/dli-language-learning-method/', title: 'DLI Language Learning Method' },
  ],
  'starter-spanish-101': [
    { slug: '/blog/learn-spanish-vocabulary-with-flashcards/', title: 'Learn Spanish Vocabulary with Flashcards' },
    { slug: '/blog/how-to-use-spaced-repetition/', title: 'How to Use Spaced Repetition' },
    { slug: '/blog/language-islands/', title: 'Language Islands' },
  ],
  'starter-french-basics': [
    { slug: '/blog/how-to-create-effective-flashcards/', title: 'How to Create Effective Flashcards' },
    { slug: '/blog/how-to-stay-consistent-with-language-learning/', title: 'How to Stay Consistent' },
    { slug: '/blog/language-islands/', title: 'Language Islands' },
  ],
  'starter-german-basics': [
    { slug: '/blog/how-to-use-spaced-repetition/', title: 'How to Use Spaced Repetition' },
    { slug: '/blog/the-language-reflex/', title: 'The Language Reflex' },
    { slug: '/blog/language-islands/', title: 'Language Islands' },
  ],
  'starter-chinese-basics': [
    { slug: '/blog/best-way-to-learn-japanese-vocabulary/', title: 'Vocabulary Learning Tips' },
    { slug: '/blog/how-to-create-effective-flashcards/', title: 'How to Create Effective Flashcards' },
    { slug: '/blog/language-islands/', title: 'Language Islands' },
  ],
  'starter-italian-basics': [
    { slug: '/blog/how-to-stay-consistent-with-language-learning/', title: 'How to Stay Consistent' },
    { slug: '/blog/beyond-the-textbook-polyglot-secrets/', title: 'Polyglot Secrets' },
    { slug: '/blog/language-islands/', title: 'Language Islands' },
  ],
};
