import type { CSSProperties } from 'react';
import type { Fit } from '@rive-app/react-canvas';
import {
  ENVIRONMENT_TYPE_POPUP,
  ENVIRONMENT_TYPE_SIDEPANEL,
} from '../../../../../shared/constants/app';

export const RIVE_COMPONENT_STYLE: CSSProperties = {
  width: '100%',
  height: '100%',
};

const BASE_CONTAINER_STYLE: CSSProperties = {
  height: '280px',
  width: '100%',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
};

const FIT_CONTAIN = 'contain' as Fit;
const FIT_COVER = 'cover' as Fit;

/**
 * Get container styles based on viewport type.
 *
 * @param environmentType - The current environment type
 * @returns Container style and fit mode for the Rive animation
 */
export const getPerpsTutorialAnimationLayout = (
  environmentType: string,
): { containerStyle: CSSProperties; fit: Fit } => {
  if (environmentType === ENVIRONMENT_TYPE_SIDEPANEL) {
    return { containerStyle: BASE_CONTAINER_STYLE, fit: FIT_CONTAIN };
  }

  if (environmentType === ENVIRONMENT_TYPE_POPUP) {
    return {
      containerStyle: {
        ...BASE_CONTAINER_STYLE,
        height: '200px',
        maxWidth: '340px',
      },
      fit: FIT_CONTAIN,
    };
  }

  return {
    containerStyle: { ...BASE_CONTAINER_STYLE, maxWidth: '280px' },
    fit: FIT_COVER,
  };
};
