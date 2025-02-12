import { useEffect } from 'react';

// Custom hook for logging state changes
export const useLogChangeEffect = (
  componentName: string,
  name: string,
  value: unknown,
) => {
  useEffect(() => {
    console.log(`${componentName} - ${name} changed`);
  }, [value]);
};
