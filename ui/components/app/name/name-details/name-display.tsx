import React, { memo } from 'react';
import classnames from 'classnames';
import { NameType } from '@metamask/name-controller';
import Identicon from '../../../ui/identicon';
import { Icon, IconName, IconSize } from '../../../component-library';
import { useDisplayName } from '../../../../hooks/useDisplayName';
import { TrustSignalDisplayState } from '../../../../hooks/useTrustSignals';
import {
  getTrustSignalIcon,
  getTrustSignalCssClasses,
} from '../../../../helpers/utils/trust-signals';
import ShortenedName from './shortened-name';
import FormattedName from './formatted-value';

export type NameDisplayProps = {
  preferContractSymbol?: boolean;
  value: string;
  type: NameType;
  variation: string;
  handleClick?: () => void;
  trustSignalDisplayState?: TrustSignalDisplayState;
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
    trustSignalDisplayState,
  }: NameDisplayProps) => {
    const { name, hasPetname, image } = useDisplayName({
      value,
      type,
      preferContractSymbol,
      variation,
    });

    const hasDisplayName = doesHaveDisplayName(name);

    // Get icon properties from utility function
    const iconProps = trustSignalDisplayState
      ? getTrustSignalIcon(trustSignalDisplayState)
      : null;

    // Show identicon if no icon props (includes Warning, Petname, Recognized states)
    const shouldShowIdenticon = !iconProps;

    // Get CSS classes from utility function
    const cssClasses = trustSignalDisplayState
      ? getTrustSignalCssClasses(trustSignalDisplayState, {
          hasPetname,
          hasDisplayName,
          isClickable: Boolean(handleClick),
        }).join(' ')
      : classnames({
          name: true,
          name__clickable: Boolean(handleClick),
          name__saved: hasPetname,
          name__recognized_unsaved: !hasPetname && hasDisplayName,
          name__missing: !hasDisplayName,
        });

    return (
      <div className={cssClasses} onClick={handleClick}>
        {(() => {
          if (shouldShowIdenticon) {
            return <Identicon address={value} diameter={16} image={image} />;
          }
          if (iconProps) {
            return (
              <Icon
                name={iconProps.name}
                className="name__icon"
                size={IconSize.Md}
                color={iconProps.color}
              />
            );
          }
          return (
            <Icon
              name={IconName.Question}
              className="name__icon"
              size={IconSize.Md}
            />
          );
        })()}
        {hasDisplayName ? (
          <ShortenedName name={name} />
        ) : (
          <FormattedName value={value} type={type} />
        )}
      </div>
    );
  },
);

export default NameDisplay;
