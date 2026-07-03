import type { HardwareHdPathOptionData } from '../types';

/** Props for SelectHdPathPage. */
export type SelectHdPathPageProps = {
  hdPaths: HardwareHdPathOptionData[];
  selectedPath: string;
  /** Called when the user confirms the pending path with Continue. */
  onPathChange: (path: string) => void;
  onBack: () => void;
};
