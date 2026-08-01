import React from 'react';
import { useRampsOrderEventToasts } from '../../../hooks/ramps/useRampsOrderEventToasts';

export function RampsOrderToastListener() {
  useRampsOrderEventToasts();
  return null;
}
