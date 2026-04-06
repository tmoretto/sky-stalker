'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * A single split-flap character that flips when its value changes.
 * Mimics a Solari board / airport departure display.
 */
function FlipDigit({ char, delay = 0 }: { char: string; delay?: number }) {
  const [display, setDisplay] = useState(char);
  const [prev, setPrev] = useState(char);
  const [flipping, setFlipping] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    if (char === display) return;

    // Stagger the flip start
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setPrev(display);
      setFlipping(true);

      // Half-way through the flip, swap the visible character
      const mid = setTimeout(() => {
        setDisplay(char);
      }, 150);

      // End the flip
      const end = setTimeout(() => {
        setFlipping(false);
        setPrev(char);
      }, 300);

      return () => {
        clearTimeout(mid);
        clearTimeout(end);
      };
    }, delay);

    return () => clearTimeout(timeoutRef.current);
  }, [char]); // eslint-disable-line react-hooks/exhaustive-deps

  const isSpace = display === ' ';

  return (
    <span
      className="flip-digit-wrapper"
      style={{ display: 'inline-block', position: 'relative', overflow: 'hidden' }}
    >
      {/* Static character (always visible, provides sizing) */}
      <span
        className="flip-digit-static"
        style={{ visibility: 'hidden' }}
      >
        {isSpace ? '\u00A0' : '0'}
      </span>

      {/* Flap layers */}
      <span
        className="flip-digit-cell"
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* Bottom half — shows the NEW value, revealed as top flap folds down */}
        <span
          className="flip-digit-bottom"
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            clipPath: 'inset(50% 0 0 0)',
          }}
        >
          {isSpace ? '\u00A0' : display}
        </span>

        {/* Top half — shows the CURRENT value */}
        <span
          className="flip-digit-top"
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            clipPath: 'inset(0 0 50% 0)',
          }}
        >
          {isSpace ? '\u00A0' : display}
        </span>

        {/* Animated top flap — folds down from old to new */}
        {flipping && (
          <span
            className="flip-digit-flap-top"
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              clipPath: 'inset(0 0 50% 0)',
              animation: 'flipTop 300ms ease-in forwards',
              backfaceVisibility: 'hidden',
              transformOrigin: 'bottom center',
            }}
          >
            {prev === ' ' ? '\u00A0' : prev}
          </span>
        )}

        {/* Animated bottom flap — unfolds to reveal new */}
        {flipping && (
          <span
            className="flip-digit-flap-bottom"
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              clipPath: 'inset(50% 0 0 0)',
              animation: 'flipBottom 300ms ease-out forwards',
              backfaceVisibility: 'hidden',
              transformOrigin: 'top center',
            }}
          >
            {isSpace ? '\u00A0' : display}
          </span>
        )}

        {/* Center divider line */}
        <span
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: '50%',
            height: '1px',
            background: 'rgba(0,0,0,0.4)',
            zIndex: 5,
          }}
        />
      </span>
    </span>
  );
}

interface FlipCounterProps {
  value: string;
  className?: string;
  /** Stagger delay between digits in ms (default 40) */
  stagger?: number;
}

/**
 * Airport departure board style flip counter.
 * Each character flips independently with a stagger effect.
 */
export function FlipCounter({ value, className = '', stagger = 40 }: FlipCounterProps) {
  return (
    <span className={`flip-counter inline-flex ${className}`}>
      {value.split('').map((char, i) => (
        <FlipDigit key={i} char={char} delay={i * stagger} />
      ))}
    </span>
  );
}
