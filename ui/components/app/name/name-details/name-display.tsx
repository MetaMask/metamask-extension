import React, { memo } from 'react';
import classnames from 'classnames';
import { NameType } from '@metamask/name-controller';
import Identicon from '../../../ui/identicon';
import { Icon, IconName, IconSize } from '../../../component-library';
import { useDisplayName } from '../../../../hooks/useDisplayName';
import {
  useTrustSignals,
  TrustSignalState,
} from '../../../../hooks/useTrustSignals';
import { IconColor } from '../../../../helpers/constants/design-system';
import ShortenedName from './shortened-name';
import FormattedName from './formatted-value';

export type NameDisplayProps = {
  preferContractSymbol?: boolean;
  value: string;
  type: NameType;
  variation: string;
  handleClick?: () => void;
  showTrustSignals?: boolean;
};

function doesHaveDisplayName(name: string | null): name is string {
  return Boolean(name);
}

const getTrustSignalIconColor = (state: TrustSignalState | null) => {
  switch (state) {
    case TrustSignalState.Verified:
      return IconColor.infoDefault;
    case TrustSignalState.Warning:
      return IconColor.warningDefault;
    case TrustSignalState.Malicious:
      return IconColor.errorDefault;
    case TrustSignalState.Unknown:
    default:
      return IconColor.iconAlternative;
  }
};

const NameDisplay = memo(
  ({
    value,
    type,
    preferContractSymbol,
    variation,
    handleClick,
    showTrustSignals = false,
  }: NameDisplayProps) => {
    const { name, hasPetname, image } = useDisplayName({
      value,
      type,
      preferContractSymbol,
      variation,
    });

    const trustSignals = useTrustSignals(value);

    const hasDisplayName = doesHaveDisplayName(name);
    const shouldShowTrustSignals =
      showTrustSignals && trustSignals.state !== null;

    // If trust signals are present, use the label if available, otherwise show address
    // If no trust signals, use normal display logic
    // If pet name is saved, prioritize pet name over trust signal label
    const getDisplayContent = () => {
      if (hasPetname && hasDisplayName) {
        return <ShortenedName name={name} />;
      }

      if (shouldShowTrustSignals) {
        if (trustSignals.label) {
          return <ShortenedName name={trustSignals.label} />;
        }
        return <FormattedName value={value} type={type} />;
      }

      if (hasDisplayName) {
        return <ShortenedName name={name} />;
      }

      return <FormattedName value={value} type={type} />;
    };

    return (
      <div
        className={classnames({
          name: true,
          name__clickable: Boolean(handleClick),
          name__saved: hasPetname,
          name__recognized_unsaved: !hasPetname && hasDisplayName,
          name__missing: !hasDisplayName,
          name__verified:
            shouldShowTrustSignals &&
            trustSignals.state === TrustSignalState.Verified &&
            !hasPetname,
          name__warning:
            shouldShowTrustSignals &&
            trustSignals.state === TrustSignalState.Warning &&
            !hasPetname,
          name__malicious:
            shouldShowTrustSignals &&
            trustSignals.state === TrustSignalState.Malicious,
          name__unknown:
            shouldShowTrustSignals &&
            trustSignals.state === TrustSignalState.Unknown &&
            !hasPetname,
        })}
        onClick={handleClick}
      >
        {(() => {
          // Trust signals logic - applies to both saved and unsaved addresses
          if (shouldShowTrustSignals && trustSignals.iconName) {
            // For Warning and Unknown states with pet name saved, use Identicon
            if (
              hasPetname &&
              (trustSignals.state === TrustSignalState.Warning ||
                trustSignals.state === TrustSignalState.Unknown)
            ) {
              return <Identicon address={value} diameter={16} image={image} />;
            }
            // For all other states, show trust signal icon
            return (
              <Icon
                name={trustSignals.iconName}
                className="name__trust-signal-icon"
                size={IconSize.Md}
                color={getTrustSignalIconColor(trustSignals.state)}
              />
            );
          }

          // Saved names (petnames) without trust signals
          if (hasPetname) {
            return <Identicon address={value} diameter={16} image={image} />;
          }

          // Regular unsaved but recognized addresses
          if (hasDisplayName) {
            return <Identicon address={value} diameter={16} image={image} />;
          }

          // Unknown addresses
          return (
            <Icon
              name={IconName.Question}
              className="name__icon"
              size={IconSize.Md}
            />
          );
        })()}
        {getDisplayContent()}
      </div>
    );
  },
);

export default NameDisplay;
