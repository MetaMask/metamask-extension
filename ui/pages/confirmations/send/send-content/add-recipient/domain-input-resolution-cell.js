import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { I18nContext } from '../../../../../contexts/i18n';
import Identicon from '../../../../../components/ui/identicon';
import Confusable from '../../../../../components/ui/confusable';
import {
  AvatarIcon,
  BadgeWrapper,
  BadgeWrapperPosition,
  IconName,
  IconSize,
  Text,
} from '../../../../../components/component-library';
import {
  BackgroundColor,
  IconColor,
  TextVariant,
} from '../../../../../helpers/constants/design-system';
import { ellipsify } from '../../send.utils';
import Tooltip from '../../../../../components/ui/tooltip';

export default function DomainInputResolutionCell({
  domainType,
  address,
  domainName,
  resolvingSnap,
  onClick,
  protocol,
}) {
  const t = useContext(I18nContext);

  const isTitleOverflowing = () => {
    const el = document.querySelector(
      '.send__select-recipient-wrapper__group-item__title',
    );
    return el.offsetWidth < el.scrollWidth;
  };

  ///: BEGIN:ONLY_INCLUDE_IF(build-flask)
  if (domainType === 'Other') {
    // Snap provided resolution.
    return (
      <div
        key={address}
        className="send__select-recipient-wrapper__group-item"
        onClick={onClick}
      >
        <Tooltip title={t('suggestedBy', [<b key="0">{resolvingSnap}</b>])}>
          <BadgeWrapper
            badge={
              <AvatarIcon
                iconName={IconName.Snaps}
                size={IconSize.Sm}
                backgroundColor={IconColor.infoDefault}
                borderColor={BackgroundColor.backgroundDefault}
                borderWidth={2}
                iconProps={{
                  color: IconColor.infoInverse,
                }}
              />
            }
            position={BadgeWrapperPosition.bottomRight}
          >
            <Identicon address={address} diameter={28} />
          </BadgeWrapper>
        </Tooltip>
        <div className="send__select-recipient-wrapper__group-item__content">
          <div className="send__select-recipient-wrapper__group-item__title">
            <Tooltip
              position="bottom"
              title={domainName}
              style={{
                visibility: isTitleOverflowing() ? 'visible' : 'hidden',
              }}
            >
              <Confusable input={domainName} />
            </Tooltip>
          </div>
          <Text>{ellipsify(address)}</Text>
          <div className="send__select-recipient-wrapper__group-item__subtitle">
            <Text variant={TextVariant.bodySm}>{protocol}</Text>
          </div>
        </div>
      </div>
    );
  }
  ///: END:ONLY_INCLUDE_IF
  return (
    <div
      key={address}
      className="send__select-recipient-wrapper__group-item"
      onClick={onClick}
    >
      <Identicon address={address} diameter={28} />
      <div className="send__select-recipient-wrapper__group-item__content">
        <div className="send__select-recipient-wrapper__group-item__title">
          {domainName ? (
            <Tooltip
              position="bottom"
              title={domainName}
              style={{
                visibility: isTitleOverflowing() ? 'visible' : 'hidden',
              }}
            >
              <Confusable input={domainName} />
            </Tooltip>
          ) : (
            ellipsify(address)
          )}
        </div>
        {domainName && (
          <div className="send__select-recipient-wrapper__group-item__subtitle">
            {ellipsify(address)}
          </div>
        )}
        {domainType === 'ENS' && (
          <Text variant={TextVariant.bodySm}>Ethereum Name Service</Text>
        )}
      </div>
    </div>
  );
}

DomainInputResolutionCell.propTypes = {
  domainType: PropTypes.string.isRequired,
  address: PropTypes.string.isRequired,
  domainName: PropTypes.string.isRequired,
  resolvingSnap: PropTypes.string.isRequired,
  onClick: PropTypes.func,
  protocol: PropTypes.func,
};
