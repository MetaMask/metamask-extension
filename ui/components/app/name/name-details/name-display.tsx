import React, { memo } from 'react';
import { NameType } from '@metamask/name-controller';
import classnames from 'classnames';
import Identicon from '../../../ui/identicon';
import { Icon, IconSize } from '../../../component-library';
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

const NameDisplay = memo(
  ({
    value,
    type,
    preferContractSymbol,
    variation,
    handleClick,
  }: NameDisplayProps) => {
    const { name, image, icon, displayState } = useDisplayName({
      value,
      type,
      preferContractSymbol,
      variation,
    });

    const renderIcon = () => {
      // If icon exists, use it (trust signal /unknown)
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

      // Otherwise, use Identicon
      return <Identicon address={value} diameter={16} image={image} />;
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
