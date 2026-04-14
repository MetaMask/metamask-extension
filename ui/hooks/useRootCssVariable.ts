import { useEffect } from 'react';

export function useRootCssVariable(name: string, value: string) {
  useEffect(() => {
    const root = document.documentElement;
    const previousValue = root.style.getPropertyValue(name);

    root.style.setProperty(name, value);

    return () => {
      if (previousValue) {
        root.style.setProperty(name, previousValue);
      } else {
        root.style.removeProperty(name);
      }
    };
  }, [name, value]);
}
