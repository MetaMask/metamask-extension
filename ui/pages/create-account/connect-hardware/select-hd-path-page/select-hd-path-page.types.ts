import type { HardwareHdPathOptionData } from '../types';

/**
 * Props for SelectHdPathPage.
 *
 * @property hdPaths - HD path options for the connected device.
 * @property selectedPath - Active HD derivation path.
 * @property onPathChange - Called when the user confirms a path selection.
 * @property onBack - Called when the user navigates back.
 */
export type SelectHdPathPageProps = {
  hdPaths: HardwareHdPathOptionData[];
  selectedPath: string;
  onPathChange: (path: string) => void;
  onBack: () => void;
};
