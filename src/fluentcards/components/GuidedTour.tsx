import { useState } from 'react';
import { LogoIcon } from './LogoIcon';
import { Button } from './ui/Button';

const TOUR_KEY = 'fc_tour_completed';

interface StepProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  highlight: string;
}

const steps: StepProps[] = [
  {
    title: 'Here\'s your deck',
    description: 'We added a starter deck to get you going. Tap on any deck to see your flashcards and start learning.',
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
      </svg>
    ),
    highlight: 'Tap a deck to open it'
  },
  {
    title: 'Tap to flip',
    description: 'Each card has a front (the question) and a back (the answer). Tap anywhere on the card to flip it and check your knowledge.',
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 5H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-1"/>
        <path d="M17 8h4v4"/>
        <path d="M13 12h-2"/>
        <path d="M9 12H7"/>
      </svg>
    ),
    highlight: 'Tap the card to reveal the answer'
  },
  {
    title: 'Rate your recall',
    description: 'After flipping, tell the app how well you remembered. Again / Hard / Good / Easy — the FSRS algorithm learns your memory and schedules the perfect review time.',
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
      </svg>
    ),
    highlight: 'Rate how well you remembered'
  }
];

export function GuidedTour() {
  const [currentStep, setCurrentStep] = useState(0);
  const [isDismissed, setIsDismissed] = useState(() => localStorage.getItem(TOUR_KEY) === 'true');

  if (isDismissed) return null;

  const step = steps[currentStep];
  const isLast = currentStep === steps.length - 1;

  const handleNext = () => {
    if (isLast) {
      localStorage.setItem(TOUR_KEY, 'true');
      setIsDismissed(true);
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleSkip = () => {
    localStorage.setItem(TOUR_KEY, 'true');
    setIsDismissed(true);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={handleSkip}
      />

      {/* Tour card */}
      <div
        className="relative w-full max-w-sm bg-white dark:bg-sumi-800 rounded-2xl shadow-2xl border border-parchment-200 dark:border-sumi-600 overflow-hidden"
        style={{ animation: 'springUp 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)' }}
      >
        {/* Progress bar */}
        <div className="h-1 bg-parchment-100 dark:bg-sumi-700">
          <div
            className="h-full bg-gradient-to-r from-cinnabar-400 to-cinnabar-500 transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]"
            style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
          />
        </div>

        <div className="p-6">
          {/* Icon circle */}
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cinnabar-100 to-cinnabar-200 dark:from-cinnabar-900/40 dark:to-cinnabar-800/40 flex items-center justify-center mb-5 text-cinnabar-500 dark:text-cinnabar-300 mx-auto">
            {step.icon}
          </div>

          {/* Step indicator */}
          <div className="text-center mb-2">
            <span className="text-[11px] font-bold tracking-widest text-cinnabar-500 dark:text-cinnabar-400 uppercase">
              Step {currentStep + 1} of {steps.length}
            </span>
          </div>

          {/* Title */}
          <h2 className="font-display text-xl font-bold text-center text-ink-800 dark:text-sumi-50 mb-2">
            {step.title}
          </h2>

          {/* Description */}
          <p className="text-sm text-ink-500 dark:text-sumi-300 text-center leading-relaxed mb-4">
            {step.description}
          </p>

          {/* Tip box */}
          <div className="bg-gradient-to-r from-cinnabar-50 to-teal-50 dark:from-cinnabar-900/20 dark:to-emerald-900/20 rounded-xl p-3 border border-cinnabar-100 dark:border-cinnabar-800 mb-5">
            <p className="text-xs font-semibold text-cinnabar-700 dark:text-cinnabar-300 text-center">
              💡 {step.highlight}
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between">
            <button
              onClick={handleSkip}
              className="text-xs font-semibold text-ink-400 dark:text-sumi-400 hover:text-ink-600 dark:hover:text-sumi-200 transition-colors"
            >
              Skip tour
            </button>
            <Button
              onClick={handleNext}
              size="sm"
              className="bg-gradient-to-br from-cinnabar-400 to-cinnabar-600 hover:from-cinnabar-500 hover:to-cinnabar-700 text-white rounded-lg shadow-sm px-6"
            >
              {isLast ? 'Got it!' : 'Next'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
