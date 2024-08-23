import React, { useContext, useRef, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { I18nContext } from '../../../../../contexts/i18n';
import Confusable from '../../../../ui/confusable';
import {
  AvatarAccount,
  Box,
  AvatarIcon,
  AvatarIconSize,
  BadgeWrapper,
  IconName,
  Text,
} from '../../../../component-library';
import {
  AlignItems,
  Display,
  BackgroundColor,
  BorderColor,
  IconColor,
  TextColor,
  TextVariant,
} from '../../../../../helpers/constants/design-system';
import { ellipsify } from '../../../../../pages/confirmations/send/send.utils';
import Tooltip from '../../../../ui/tooltip';

type DomainInputResolutionCellArgs = {
  domainType: string;
  address: string;
  protocol?: string;
  domainName: string;
  resolvingSnap?: string;
  onClick: () => void;
};

export const DomainInputResolutionCell = ({
  domainType,
  address,
  domainName,
  resolvingSnap = '',
  onClick,
  protocol,
}: DomainInputResolutionCellArgs) => {
  const t: (key: string, params: unknown[]) => string = useContext(I18nContext);
  const titleRef = useRef<null | HTMLDivElement>(null);
  const breakpointRef = useRef<null | number>(null);
  const [isTitleOverflowing, setIsTitleOverflowing] = useState(false);

  useEffect(() => {
    if (!titleRef.current) {
      return;
    }

    let isOverflowing =
      titleRef.current.offsetWidth < titleRef.current.scrollWidth;
    const breakpointLength = titleRef.current.textContent?.length;

    if (isOverflowing && !breakpointRef.current && breakpointLength) {
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
      containerClassName="multichain-send-page__recipient__item__title-tooltip"
      wrapperClassName="multichain-send-page__recipient__item__title-tooltip-container"
      position="bottom"
      title={domainName}
    >
      <Confusable
        asText
        input={domainName}
        confusableWrapperName="multichain-send-page__recipient__item__title-confusable-wrapper"
      />
    </Tooltip>
  );

  if (domainType === 'Other') {
    // Snap provided resolution.
    return (
      <Box
        key={address}
        className="multichain-send-page__recipient__item"
        onClick={() => onClick()}
        display={Display.Flex}
        alignItems={AlignItems.center}
        paddingBottom={2}
        style={{ cursor: 'pointer' }}
      >
        <Tooltip title={t('suggestedBySnap', [resolvingSnap])}>
          <BadgeWrapper
            badge={
              <AvatarIcon
                iconName={IconName.Snaps}
                size={AvatarIconSize.Xs}
                className="multichain-send-page__recipient__item__avatar"
                backgroundColor={BackgroundColor.infoDefault}
                borderColor={BorderColor.backgroundDefault}
                borderWidth={2}
                iconProps={{
                  color: IconColor.infoInverse,
                  style: { width: '12px', height: '12px' },
                  name: IconName.Snaps,
                }}
              />
            }
            positionObj={{
              bottom: '25%',
              right: '10%',
            }}
            badgeContainerProps={{
              className: 'multichain-send-page__recipient__item__badge',
            }}
          >
            <AvatarAccount address={address} />
          </BadgeWrapper>
        </Tooltip>
        <Box
          className="multichain-send-page__recipient__item__content"
          paddingLeft={4}
          style={{ overflow: 'hidden' }}
        >
          <Box
            ref={titleRef}
            className="multichain-send-page__recipient__item__title"
            data-testid="multichain-send-page__recipient__item__title"
            display={Display.Flex}
          >
            {isTitleOverflowing ? (
              <OverflowingTitle />
            ) : (
              <Confusable asText input={domainName} />
            )}
          </Box>
          <Text color={TextColor.textAlternative}>{ellipsify(address)}</Text>
          <Box
            className="multichain-send-page__recipient__item__subtitle"
            data-testid="multichain-send-page__recipient__item__subtitle"
          >
            <Text
              color={TextColor.textAlternative}
              variant={TextVariant.bodySm}
            >
              {protocol}
            </Text>
          </Box>
        </Box>
      </Box>
    );
  }
  const getTitle = () => {
    if (domainName && isTitleOverflowing) {
      return <OverflowingTitle />;
    } else if (domainName && !isTitleOverflowing) {
      return <Confusable asText input={domainName} />;
    }
    return ellipsify(address);
  };

  return (
    <Box
      key={address}
      className="multichain-send-page__recipient__item"
      onClick={() => onClick()}
      display={Display.Flex}
      alignItems={AlignItems.center}
      paddingBottom={2}
      style={{ cursor: 'pointer' }}
    >
      <Box
        className="multichain-send-page__recipient__item__avatar-wrapper"
        display={Display.Flex}
        alignItems={AlignItems.center}
      >
        <AvatarAccount address={address} />
      </Box>
      <Box
        className="multichain-send-page__recipient__item__content"
        paddingLeft={4}
        style={{ overflow: 'hidden' }}
      >
        <Box
          ref={titleRef}
          className="multichain-send-page__recipient__item__title"
          data-testid="multichain-send-page__recipient__item__title"
          display={Display.Flex}
        >
          {getTitle()}
        </Box>
        {domainName && (
          <Box
            className="multichain-send-page__recipient__item__subtitle"
            data-testid="multichain-send-page__recipient__item__subtitle"
          >
            <Text color={TextColor.textAlternative}>{ellipsify(address)}</Text>
          </Box>
        )}
        {domainType === 'ENS' && (
          <Text color={TextColor.textAlternative} variant={TextVariant.bodySm}>
            {protocol}
          </Text>
        )}
      </Box>
    </Box>
  );
};

DomainInputResolutionCell.propTypes = {
  domainType: PropTypes.string.isRequired,
  address: PropTypes.string.isRequired,
  domainName: PropTypes.string.isRequired,
  resolvingSnap: PropTypes.string.isRequired,
  onClick: PropTypes.func,
  protocol: PropTypes.string,
};
