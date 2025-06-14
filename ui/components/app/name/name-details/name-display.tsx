import React, { memo } from 'react';
import { NameType } from '@metamask/name-controller';
import Identicon from '../../../ui/identicon';
import { Icon, IconName, IconSize } from '../../../component-library';
import { IconColor } from '../../../../helpers/constants/design-system';
import { useAddressTrustSignalState } from '../../../../hooks/useTrustSignalState';
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
    const { displayState, image } = useAddressTrustSignalState({
      value,
      type,
      variation,
      preferContractSymbol,
      showTrustSignals,
    });

    // Build CSS classes from state
    const getClassNames = () => {
      const classes = ['name'];

      if (handleClick) {
        classes.push('name__clickable');
      }

      // Add all state-specific classes
      classes.push(...displayState.cssClasses);

      return classes;
    };

    // Map icon color strings to IconColor enum
    const getIconColor = () => {
      if (!displayState.iconColor) {
        return undefined;
      }

      const colorMap: Record<string, IconColor> = {
        'info-default': IconColor.infoDefault,
        'warning-default': IconColor.warningDefault,
        'error-default': IconColor.errorDefault,
      };

      return colorMap[displayState.iconColor];
    };

    return (
      <div className={getClassNames().join(' ')} onClick={handleClick}>
        {displayState.iconType === 'identicon' && (
          <Identicon address={value} diameter={16} image={image} />
        )}
        {displayState.iconType === 'trust-signal' && displayState.iconName && (
          <Icon
            name={displayState.iconName}
            size={IconSize.Md}
            color={getIconColor()}
            className="name__trust-signal-icon"
          />
        )}
        {displayState.iconType === 'question' && (
          <Icon
            name={IconName.Question}
            size={IconSize.Md}
            className="name__icon"
          />
        )}
        {displayState.displayName ? (
          <ShortenedName name={displayState.displayName} />
        ) : (
          <FormattedName value={value} type={type} />
        )}
      </div>
    );
  },
);

export default NameDisplay;
