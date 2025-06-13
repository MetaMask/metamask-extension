import React, { memo } from 'react';
import { NameType } from '@metamask/name-controller';
import Identicon from '../../../ui/identicon';
import { Icon, IconName, IconSize } from '../../../component-library';
import { IconColor } from '../../../../helpers/constants/design-system';
import { useTrustSignalDisplay } from '../../../../hooks/useTrustSignalDisplay';
import { TrustSignalState } from '../../../../hooks/useTrustSignals';
import ShortenedName from './shortened-name';
import FormattedName from './formatted-value';

export type NameDisplayProps = {
  /** Whether to prefer contract symbol over contract name */
  preferContractSymbol?: boolean;
  /** The address or value to display */
  value: string;
  /** The type of the value (e.g., Ethereum address) */
  type: NameType;
  /** The variation context (e.g., chain ID) */
  variation: string;
  /** Click handler for opening the name details modal */
  handleClick?: () => void;
  /**
   * Whether to show trust signal indicators (verified, warning, malicious).
   * Should only be true for "Interacting with" scenarios like transaction 'to' addresses.
   */
  showTrustSignals?: boolean;
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
    const {
      trustState,
      displayName,
      hasPetname,
      hasRecognizedName,
      iconType,
      iconName,
      image,
    } = useTrustSignalDisplay({
      value,
      type,
      variation,
      preferContractSymbol,
      showTrustSignals,
    });

    // Component decides CSS based on state
    const getClassNames = () => {
      const classes = ['name'];

      if (handleClick) {
        classes.push('name__clickable');
      }

      // Name status classes
      if (hasPetname) {
        classes.push('name__saved');
      } else if (hasRecognizedName) {
        classes.push('name__recognized_unsaved');
      } else {
        classes.push('name__missing');
      }

      // Trust signal classes (only when showing trust signals and no petname)
      if (showTrustSignals && trustState && !hasPetname) {
        // eslint-disable-next-line default-case
        switch (trustState) {
          case TrustSignalState.Verified:
            classes.push('name__verified');
            break;
          case TrustSignalState.Warning:
            classes.push('name__warning');
            break;
          case TrustSignalState.Unknown:
            classes.push('name__unknown');
            break;
        }
      }

      // Malicious always applies
      if (showTrustSignals && trustState === TrustSignalState.Malicious) {
        classes.push('name__malicious');
      }

      return classes;
    };

    // Component decides icon color based on state
    const getIconColor = () => {
      if (iconType !== 'trust-signal' || !trustState) {
        return undefined;
      }

      switch (trustState) {
        case TrustSignalState.Verified:
          return IconColor.infoDefault;
        case TrustSignalState.Warning:
          return IconColor.warningDefault;
        case TrustSignalState.Malicious:
          return IconColor.errorDefault;
        default:
          return undefined;
      }
    };

    return (
      <div className={getClassNames().join(' ')} onClick={handleClick}>
        {iconType === 'identicon' && (
          <Identicon address={value} diameter={16} image={image} />
        )}
        {iconType === 'trust-signal' && iconName && (
          <Icon
            name={iconName}
            size={IconSize.Md}
            color={getIconColor()}
            className="name__trust-signal-icon"
          />
        )}
        {iconType === 'question' && (
          <Icon
            name={IconName.Question}
            size={IconSize.Md}
            className="name__icon"
          />
        )}
        {displayName ? (
          <ShortenedName name={displayName} />
        ) : (
          <FormattedName value={value} type={type} />
        )}
      </div>
    );
  },
);

export default NameDisplay;
