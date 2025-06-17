import { IconName } from '../../components/component-library';
import { IconColor } from '../constants/design-system';
import { TrustSignalDisplayState } from '../../hooks/useTrustSignals';

export type TrustSignalIconProps = {
  name: IconName;
  color: IconColor;
};

/**
 * Get icon properties based on trust signal state, returns null if no icon is needed
 *
 * @param state - The trust signal display state
 * @returns Object containing icon name and color
 */
export function getTrustSignalIcon(
  state: TrustSignalDisplayState | undefined,
): TrustSignalIconProps | null {
  if (!state) {
    return null;
  }

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
