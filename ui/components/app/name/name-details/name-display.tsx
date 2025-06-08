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
};

function doesHaveDisplayName(name: string | null): name is string {
  return Boolean(name);
}

const getTrustSignalIconColor = (state: TrustSignalState | null) => {
  switch (state) {
    case TrustSignalState.Verified:
      return IconColor.successDefault;
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
  }: NameDisplayProps) => {
    const { name, hasPetname, image } = useDisplayName({
      value,
      type,
      preferContractSymbol,
      variation,
    });

    const trustSignals = useTrustSignals(value, type);

    const hasDisplayName = doesHaveDisplayName(name);
    const displayText = trustSignals.label || name;
    const shouldShowTrustSignals = trustSignals.state !== null;

    return (
      <div
        className={classnames({
          name: true,
          name__clickable: Boolean(handleClick),
          name__saved: hasPetname,
          name__recognized_unsaved: !hasPetname && hasDisplayName,
          name__missing: !hasDisplayName,
          name__verified: trustSignals.state === TrustSignalState.Verified,
          name__warning: trustSignals.state === TrustSignalState.Warning,
          name__malicious: trustSignals.state === TrustSignalState.Malicious,
          name__unknown: trustSignals.state === TrustSignalState.Unknown,
        })}
        onClick={handleClick}
      >
        {(() => {
          if (shouldShowTrustSignals && trustSignals.iconName) {
            return (
              <Icon
                name={trustSignals.iconName}
                className="name__trust-signal-icon"
                size={IconSize.Md}
                color={getTrustSignalIconColor(trustSignals.state)}
              />
            );
          }
          if (hasDisplayName) {
            return <Identicon address={value} diameter={16} image={image} />;
          }
          return (
            <Icon
              name={IconName.Question}
              className="name__icon"
              size={IconSize.Md}
            />
          );
        })()}
        {hasDisplayName || shouldShowTrustSignals ? (
          <ShortenedName name={displayText || name || ''} />
        ) : (
          <FormattedName value={value} type={type} />
        )}
      </div>
    );
  },
);

export default NameDisplay;
