import React from 'react';
import classNames from 'classnames';
import { useSelector } from 'react-redux';
import {
  AlignItems,
  BackgroundColor,
  BorderColor,
  BorderRadius,
  Display,
  JustifyContent,
} from '../../../helpers/constants/design-system';
import {
  AvatarAccount,
  AvatarAccountSize,
  AvatarAccountVariant,
  BadgeWrapper,
  Box,
  BoxProps,
} from '../../component-library';
import { getUseBlockie } from '../../../selectors';
import Tooltip from '../../ui/tooltip';
///: BEGIN:ONLY_INCLUDE_IF(build-mmi)
import { getCustodianIconForAddress } from '../../../selectors/institutional/selectors';
///: END:ONLY_INCLUDE_IF
import { BadgeStatusProps } from './badge-status.types';

export const BadgeStatus: React.FC<BadgeStatusProps> = ({
  className = '',
  badgeBackgroundColor = BackgroundColor.backgroundAlternative,
  badgeBorderColor = BorderColor.borderMuted,
  address,
  isConnectedAndNotActive = false,
  text,
  ...props
}): JSX.Element => {
  const useBlockie = useSelector(getUseBlockie);

  ///: BEGIN:ONLY_INCLUDE_IF(build-mmi)
  const custodianIcon = useSelector((state) =>
    // @ts-expect-error todo - https://consensyssoftware.atlassian.net/browse/MMI-5367
    getCustodianIconForAddress(state, address),
  );
  ///: END:ONLY_INCLUDE_IF

  return (
    <Box
      className={classNames('multichain-badge-status', className)}
      data-testid="multichain-badge-status"
      as="button"
      display={Display.Flex}
      alignItems={AlignItems.center}
      justifyContent={JustifyContent.center}
      backgroundColor={BackgroundColor.transparent}
      {...(props as BoxProps<'div'>)}
    >
      <Tooltip
        style={{ display: 'flex' }}
        title={text}
        data-testid="multichain-badge-status__tooltip"
        position="bottom"
      >
        <BadgeWrapper
          positionObj={
            isConnectedAndNotActive
              ? { bottom: 2, right: 5 }
              : { bottom: -1, right: 2 }
          }
          badge={
            <Box
              className={classNames('multichain-badge-status__badge', {
                'multichain-badge-status__badge-not-connected':
                  isConnectedAndNotActive,
              })}
              backgroundColor={badgeBackgroundColor}
              borderRadius={BorderRadius.full}
              borderColor={badgeBorderColor}
              borderWidth={isConnectedAndNotActive ? 2 : 4}
            />
          }
        >
          {
            ///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
            <AvatarAccount
              borderColor={BorderColor.transparent}
              size={AvatarAccountSize.Md}
              address={address}
              variant={
                useBlockie
                  ? AvatarAccountVariant.Blockies
                  : AvatarAccountVariant.Jazzicon
              }
              marginInlineEnd={2}
            />
            ///: END:ONLY_INCLUDE_IF
          }

          {
            ///: BEGIN:ONLY_INCLUDE_IF(build-mmi)
            custodianIcon ? (
              <img
                src={custodianIcon}
                data-testid="custody-logo"
                className="custody-logo"
                alt="custody logo"
              />
            ) : (
              <AvatarAccount
                borderColor={BorderColor.transparent}
                size={AvatarAccountSize.Md}
                address={address}
                variant={
                  useBlockie
                    ? AvatarAccountVariant.Blockies
                    : AvatarAccountVariant.Jazzicon
                }
                marginInlineEnd={2}
              />
            )
            ///: END:ONLY_INCLUDE_IF
          }
        </BadgeWrapper>
      </Tooltip>
    </Box>
  );
};
