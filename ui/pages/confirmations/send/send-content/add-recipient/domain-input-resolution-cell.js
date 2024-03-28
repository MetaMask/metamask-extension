import React, {
  ///: BEGIN:ONLY_INCLUDE_IF(build-flask)
  useContext,
  ///: END:ONLY_INCLUDE_IF
  useRef,
  useEffect,
  useState,
} from 'react';
import PropTypes from 'prop-types';
///: BEGIN:ONLY_INCLUDE_IF(build-flask)
import { I18nContext } from '../../../../../contexts/i18n';
///: END:ONLY_INCLUDE_IF
import Identicon from '../../../../../components/ui/identicon';
import Confusable from '../../../../../components/ui/confusable';
import {
  ///: BEGIN:ONLY_INCLUDE_IF(build-flask)
  AvatarIcon,
  BadgeWrapper,
  IconName,
  IconSize,
  ///: END:ONLY_INCLUDE_IF
  Text,
} from '../../../../../components/component-library';
import {
  ///: BEGIN:ONLY_INCLUDE_IF(build-flask)
  BackgroundColor,
  IconColor,
  ///: END:ONLY_INCLUDE_IF
  TextColor,
  TextVariant,
} from '../../../../../helpers/constants/design-system';
import { ellipsify } from '../../send.utils';
import Tooltip from '../../../../../components/ui/tooltip';

export default function DomainInputResolutionCell({
  domainType,
  address,
  domainName,
  ///: BEGIN:ONLY_INCLUDE_IF(build-flask)
  resolvingSnap,
  ///: END:ONLY_INCLUDE_IF
  onClick,
  protocol,
}) {
  ///: BEGIN:ONLY_INCLUDE_IF(build-flask)
  const t = useContext(I18nContext);
  ///: END:ONLY_INCLUDE_IF
  const titleRef = useRef(null);
  const breakpointRef = useRef(null);
  const [isTitleOverflowing, setIsTitleOverflowing] = useState(false);

  useEffect(() => {
    let isOverflowing =
      titleRef.current.offsetWidth < titleRef.current.scrollWidth;
    const breakpointLength = titleRef.current.textContent.length;

    if (isOverflowing && !breakpointRef.current) {
      breakpointRef.current = breakpointLength;
    }

    if (!isOverflowing) {
      if (breakpointRef.current) {
        if (domainName.length >= breakpointRef.current) {
          isOverflowing = true;
        } else {
          isOverflowing = false;
          breakpointRef.current = null;
        }
      }
    }

    if (isOverflowing !== isTitleOverflowing) {
      setIsTitleOverflowing(isOverflowing);
    }
  }, [domainName, isTitleOverflowing]);

  const OverflowingTitle = () => (
    <Tooltip
      containerClassName="send__select-recipient-wrapper__group-item__title-tooltip"
      wrapperClassName="send__select-recipient-wrapper__group-item__title-tooltip-container"
      position="bottom"
      title={domainName}
    >
      <Confusable
        asText
        input={domainName}
        confusableWrapperName="send__select-recipient-wrapper__group-item__title-confusable-wrapper"
      />
    </Tooltip>
  );

  ///: BEGIN:ONLY_INCLUDE_IF(build-flask)
  if (domainType === 'Other') {
    // Snap provided resolution.
    return (
      <div
        key={address}
        className="send__select-recipient-wrapper__group-item"
        onClick={onClick}
      >
        <Tooltip title={t('suggestedBy', [resolvingSnap])}>
          <BadgeWrapper
            badge={
              <AvatarIcon
                iconName={IconName.Snaps}
                size={IconSize.Xs}
                className="send__select-recipient-wrapper__group-item__avatar"
                backgroundColor={IconColor.infoDefault}
                borderColor={BackgroundColor.backgroundDefault}
                borderWidth={2}
                iconProps={{
                  color: IconColor.infoInverse,
                  style: { width: '12px', height: '12px' },
                }}
              />
            }
            positionObj={{
              bottom: '30%',
              right: '30%',
              transform: 'scale(1) translate(25%, 70%)',
              width: '20px',
              height: '20px',
            }}
          >
            <Identicon address={address} diameter={32} />
          </BadgeWrapper>
        </Tooltip>
        <div className="send__select-recipient-wrapper__group-item__content">
          <div
            ref={titleRef}
            className="send__select-recipient-wrapper__group-item__title"
          >
            {isTitleOverflowing ? (
              <OverflowingTitle />
            ) : (
              <Confusable asText input={domainName} />
            )}
          </div>
          <Text color={TextColor.textAlternative}>{ellipsify(address)}</Text>
          <div className="send__select-recipient-wrapper__group-item__subtitle">
            <Text
              color={TextColor.textAlternative}
              variant={TextVariant.bodySm}
            >
              {protocol}
            </Text>
          </div>
        </div>
      </div>
    );
  }
  ///: END:ONLY_INCLUDE_IF
  const Title = () => {
    if (domainName && isTitleOverflowing) {
      return <OverflowingTitle />;
    } else if (domainName && !isTitleOverflowing) {
      return <Confusable asText input={domainName} />;
    }
    return ellipsify(address);
  };

  return (
    <div
      key={address}
      className="send__select-recipient-wrapper__group-item"
      onClick={onClick}
    >
      <Identicon address={address} diameter={32} />
      <div className="send__select-recipient-wrapper__group-item__content">
        <div
          ref={titleRef}
          className="send__select-recipient-wrapper__group-item__title"
        >
          <Title />
        </div>
        {domainName && (
          <div className="send__select-recipient-wrapper__group-item__subtitle">
            <Text color={TextColor.textAlternative}>{ellipsify(address)}</Text>
          </div>
        )}
        {domainType === 'ENS' && (
          <Text color={TextColor.textAlternative} variant={TextVariant.bodySm}>
            {protocol}
          </Text>
        )}
      </div>
    </div>
  );
}

DomainInputResolutionCell.propTypes = {
  domainType: PropTypes.string.isRequired,
  address: PropTypes.string.isRequired,
  domainName: PropTypes.string.isRequired,
  ///: BEGIN:ONLY_INCLUDE_IF(build-flask)
  resolvingSnap: PropTypes.string.isRequired,
  ///: END:ONLY_INCLUDE_IF
  onClick: PropTypes.func,
  protocol: PropTypes.string,
};
