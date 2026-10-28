import classnames from 'clsx';

import { getEnvironmentType } from '../../../../shared/lib/environment-type';
import {
  ENVIRONMENT_TYPE_FULLSCREEN,
  ENVIRONMENT_TYPE_SIDEPANEL,
} from '../../../../shared/constants/app';

export type WalletOverviewLayout = {
  isFullscreenOrSidepanel: boolean;
  isSidepanel: boolean;
};

export const getWalletOverviewLayout = (): WalletOverviewLayout => {
  const environmentType = getEnvironmentType();
  const isSidepanel = environmentType === ENVIRONMENT_TYPE_SIDEPANEL;

  return {
    isFullscreenOrSidepanel:
      isSidepanel || environmentType === ENVIRONMENT_TYPE_FULLSCREEN,
    isSidepanel,
  };
};

/**
 * Cross-axis alignment of the balance content: centered in fullscreen and
 * side panel, left-aligned in the popup. The side panel falls back to
 * left-aligned when it is at most 490px wide.
 *
 * @param layout - The environment based layout flags.
 * @param layout.isFullscreenOrSidepanel - Whether the UI is in fullscreen or the side panel.
 * @param layout.isSidepanel - Whether the UI is in the side panel.
 */
export const getBalanceAlignmentClassName = ({
  isFullscreenOrSidepanel,
  isSidepanel,
}: WalletOverviewLayout) =>
  classnames(isFullscreenOrSidepanel ? 'items-center' : 'items-start', {
    'max-[490px]:items-start': isSidepanel,
  });
