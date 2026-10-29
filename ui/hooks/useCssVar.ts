import { useMemo } from 'react';

type Props = {
  name: `--${string}`;
  root?: HTMLElement;
};

export const useCssVar = ({ name, root }: Props) => {
  const resolvedRoot = root ?? document.documentElement;

  return useMemo(
    () => ({
      set: (value: string) => resolvedRoot.style.setProperty(name, value),
      get: () => resolvedRoot.style.getPropertyValue(name),
      remove: () => resolvedRoot.style.removeProperty(name),
    }),
    [name, resolvedRoot],
  );
};
