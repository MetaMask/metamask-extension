import React, { memo } from 'react';
import { NameType } from '@metamask/name-controller';
import classnames from 'classnames';
import Identicon from '../../../ui/identicon';
import { Icon, IconSize, IconName } from '../../../component-library';
import { useDisplayName } from '../../../../hooks/useDisplayName';
import { TrustSignalDisplayState } from '../../../../hooks/useTrustSignals';
import ShortenedName from './shortened-name';
import FormattedName from './formatted-value';

export type NameDisplayProps = {
  preferContractSymbol?: boolean;
  value: string;
  type: NameType;
  variation: string;
  handleClick?: () => void;
};

function doesHaveDisplayName(name: string | null): name is string {
  return Boolean(name);
}

const NameDisplay = memo(
  ({
    value,
    type,
    preferContractSymbol,
    variation,
    handleClick,
  }: NameDisplayProps) => {
    const { name, hasPetname, image, icon, displayState } = useDisplayName({
      value,
      type,
      preferContractSymbol,
      variation,
    });

    const hasDisplayName = doesHaveDisplayName(name);

    const renderIcon = () => {
      // Priority 1: Malicious state should always show trust signal icon
      if (displayState === TrustSignalDisplayState.Malicious) {
        if (icon) {
          return (
            <Icon
              name={icon.name}
              className="name__icon"
              size={IconSize.Md}
              color={icon.color}
            />
          );
        }
      }

      // Priority 2: Show Identicon for other states with display names or petnames
      if (
        hasDisplayName ||
        hasPetname ||
        // Special case: Warning state always shows Identicon
        displayState === TrustSignalDisplayState.Warning
      ) {
        return <Identicon address={value} diameter={16} image={image} />;
      }

      // Priority 3: Show trust signal icon for other states
      if (icon) {
        return (
          <Icon
            name={icon.name}
            className="name__icon"
            size={IconSize.Md}
            color={icon.color}
          />
        );
      }

      // Default: Unknown state icon
      return (
        <Icon
          name={IconName.Question}
          className="name__icon"
          size={IconSize.Md}
        />
      );
    };

    return (
      <div
        className={classnames({
          name: true,
          name__clickable: Boolean(handleClick),
          name__saved: displayState === TrustSignalDisplayState.Petname,
          name__recognized_unsaved:
            displayState === TrustSignalDisplayState.Recognized,
          name__missing: displayState === TrustSignalDisplayState.Unknown,
          name__malicious: displayState === TrustSignalDisplayState.Malicious,
          name__verified: displayState === TrustSignalDisplayState.Verified,
          name__warning: displayState === TrustSignalDisplayState.Warning,
        })}
        onClick={handleClick}
      >
        {renderIcon()}
        {name ? (
          <ShortenedName name={name} />
        ) : (
          <FormattedName value={value} type={type} />
        )}
      </div>
    );
  },
);

export default NameDisplay;
