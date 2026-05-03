import React from 'react';

interface FuriganaTextProps {
  text: string;
  className?: string;
}

export const FuriganaText: React.FC<FuriganaTextProps> = ({ text, className = '' }) => {
  // Parses text like 漢字[かんじ] or 漢[かん]字[じ] into ruby elements.
  // We use a regex to match sequences of kanji followed by brackets.
  // The kanji block regex: /([一-龯々]+)\[([^\]]+)\]/g
  
  if (!text) return null;

  const regex = /([一-龯々]+)\[(.*?)\]/g;
  let lastIndex = 0;
  const elements: React.ReactNode[] = [];
  let match;
  let elementIndex = 0;

  while ((match = regex.exec(text)) !== null) {
    // Add text before the match
    if (match.index > lastIndex) {
      elements.push(
        <span key={`text-${elementIndex++}`}>
          {text.slice(lastIndex, match.index)}
        </span>
      );
    }

    // Add exactly matched kanji as ruby
    elements.push(
      <ruby key={`ruby-${elementIndex++}`} className="px-px">
        {match[1]}
        <rt className="text-[0.6em] text-slate-400 dark:text-slate-500 select-none pb-0.5">{match[2]}</rt>
      </ruby>
    );

    lastIndex = regex.lastIndex;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    elements.push(
      <span key={`text-${elementIndex++}`}>
        {text.slice(lastIndex)}
      </span>
    );
  }

  return <span className={className}>{elements}</span>;
};
