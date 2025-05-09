import React, { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';

import { TextField } from '../../component-library';

type SrpWordProps = {
  onRender: (inputRef: React.RefObject<HTMLInputElement>) => void;
  word: string;
  index: number;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onNextWord: (index: number, value: string) => void;
  onDelete: (index: number) => void;
};

export default function SrpWord({
  onRender,
  word,
  index,
  onChange,
  onNextWord,
  onDelete,
}: SrpWordProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    // listen for keydown event for spacebar
    inputRef.current?.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        onNextWord(index, inputRef.current?.value ?? '');
      } else if (e.key === 'Backspace' && inputRef.current?.value === '') {
        onDelete(index);
      }
    });

    if (onRender) {
      onRender(inputRef);
    }
  }, []);

  return (
    <div className="srp-word">
      <TextField
        id={`srp-word-${index}`}
        startAccessory={index.toString()}
        value={word}
        ref={inputRef}
        onChange={onChange}
      />
    </div>
  );
}

SrpWord.propTypes = {
  onRender: PropTypes.func.isRequired,
  word: PropTypes.string.isRequired,
  index: PropTypes.number.isRequired,
  onChange: PropTypes.func.isRequired,
  onNextWord: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
};
