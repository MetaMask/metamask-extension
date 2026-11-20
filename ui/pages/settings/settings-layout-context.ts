import { createContext, useContext } from 'react';

/**
 * Whether Settings is rendered with the compact layout (popup or narrow
 * sidepanel). In the compact layout, the header shows a single title instead
 * of the fullscreen breadcrumbs.
 */
export const CompactSettingsLayoutContext = createContext(false);

export const useIsCompactSettingsLayout = () =>
  useContext(CompactSettingsLayoutContext);
