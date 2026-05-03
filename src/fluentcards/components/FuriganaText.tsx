import React from 'react';

interface FuriganaTextProps {
  text: string;
  className?: string;
}

export const FuriganaText: React.FC<FuriganaTextProps> = ({ text, className = '' }) => {
  if (!text) return null;

  const regex = /([一-龯々]+)\[(.*?)\]/g;
  let lastIndex = 0;
  const elements: React.ReactNode[] = [];
  let match;
  let elementIndex = 0;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      elements.push(
        <span key={`text-${elementIndex++}`}>
          {text.slice(lastIndex, match.index)}
        </span>
      );
    }

    elements.push(
      <ruby key={`ruby-${elementIndex++}`} className="px-px">
        {match[1]}
        <rt className="text-[0.6em] text-cinnabar-400 dark:text-cinnabar-300 select-none pb-0.5">{match[2]}</rt>
      </ruby>
    );

    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    elements.push(
      <span key={`text-${elementIndex++}`}>
        {text.slice(lastIndex)}
      </span>
    );
  }

  return <span className={className}>{elements}</span>;
};
