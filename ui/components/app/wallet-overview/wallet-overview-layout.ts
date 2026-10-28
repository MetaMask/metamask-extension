import classnames from 'clsx';

import { useFullScreenDesign } from '../../../hooks/useFullScreenDesign';
import { getEnvironmentType } from '../../../../shared/lib/environment-type';
import {
  ENVIRONMENT_TYPE_FULLSCREEN,
  ENVIRONMENT_TYPE_SIDEPANEL,
} from '../../../../shared/constants/app';

// Centered in fullscreen and side panel (left-aligned when the side panel is narrow).
export const getBalanceAlignmentClassName = () => {
  const environmentType = getEnvironmentType();
  const isFullScreenDesign = useFullScreenDesign();
  const isSidepanel = environmentType === ENVIRONMENT_TYPE_SIDEPANEL;
  const isFullscreenOrSidepanel =
    isFullScreenDesign || isSidepanel || environmentType === ENVIRONMENT_TYPE_FULLSCREEN;

  return classnames(isFullscreenOrSidepanel ? 'items-center' : 'items-start', {
    'max-[490px]:items-start': isSidepanel,
  });
};
