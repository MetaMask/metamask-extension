import { useState } from 'react';
import { useEventListener } from './useEventListener';

export const useWindowFocus = () => {
  const [isFocused, setIsFocused] = useState(document.hasFocus());

  useEventListener('focus', () => setIsFocused(true));
  useEventListener('blur', () => setIsFocused(false));

  return isFocused;
};
