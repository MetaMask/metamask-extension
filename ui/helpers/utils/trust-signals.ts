import { IconName } from '../../components/component-library';
import { IconColor } from '../constants/design-system';
import { TrustSignalDisplayState } from '../../hooks/useTrustSignals';

export type TrustSignalIconProps = {
  name: IconName;
  color: IconColor;
};

export type TrustSignalCssContext = {
  hasPetname?: boolean;
  hasDisplayName?: boolean;
  isClickable?: boolean;
};

/**
 * Get icon properties based on trust signal state
 *
 * @param state - The trust signal display state
 * @returns Object containing icon name and color
 */
export function getTrustSignalIcon(
  state: TrustSignalDisplayState,
): TrustSignalIconProps | null {
  switch (state) {
    case TrustSignalDisplayState.Malicious:
      return {
        name: IconName.Danger,
        color: IconColor.errorDefault,
      };
    case TrustSignalDisplayState.Verified:
      return {
        name: IconName.VerifiedFilled,
        color: IconColor.infoDefault,
      };
    case TrustSignalDisplayState.Warning:
      // Warning state shows identicon, not a warning icon
      return null;
    case TrustSignalDisplayState.Unknown:
      return {
        name: IconName.Question,
        color: IconColor.iconDefault,
      };
    case TrustSignalDisplayState.Petname:
    case TrustSignalDisplayState.Recognized:
      // These states use identicon, not an icon
      return null;
    default:
      return {
        name: IconName.Question,
        color: IconColor.iconDefault,
      };
  }
}

/**
 * Get CSS classes based on trust signal state and context
 *
 * @param state - The trust signal display state
 * @param context - Additional context like hasPetname, hasDisplayName, isClickable
 * @returns Array of CSS class names to apply
 */
export function getTrustSignalCssClasses(
  state: TrustSignalDisplayState,
  context: TrustSignalCssContext = {},
): string[] {
  const {
    hasPetname = false,
    hasDisplayName = false,
    isClickable = false,
  } = context;

  const baseClasses = ['name'];

  if (isClickable) {
    baseClasses.push('name__clickable');
  }

  switch (state) {
    case TrustSignalDisplayState.Malicious:
      baseClasses.push('name__malicious');
      if (hasPetname) {
        baseClasses.push('name__saved');
      } else if (!hasDisplayName) {
        baseClasses.push('name__missing');
      }
      break;

    case TrustSignalDisplayState.Verified:
      baseClasses.push('name__verified');
      break;

    case TrustSignalDisplayState.Warning:
      baseClasses.push('name__warning');
      if (hasDisplayName && !hasPetname) {
        baseClasses.push('name__recognized_unsaved');
      } else if (!hasDisplayName) {
        baseClasses.push('name__missing');
      }
      break;

    case TrustSignalDisplayState.Petname:
      baseClasses.push('name__saved');
      break;

    case TrustSignalDisplayState.Recognized:
      baseClasses.push('name__recognized_unsaved');
      break;

    case TrustSignalDisplayState.Unknown:
    default:
      if (hasPetname) {
        baseClasses.push('name__saved');
      } else if (hasDisplayName) {
        baseClasses.push('name__recognized_unsaved');
      } else {
        baseClasses.push('name__missing');
      }
      break;
  }

  return baseClasses;
}
