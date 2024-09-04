import { useState } from 'react';

export const useCustomSpendingCap = () => {
  const [customSpendingCap, setCustomSpendingCap] = useState('');

  return { customSpendingCap, setCustomSpendingCap };
};
