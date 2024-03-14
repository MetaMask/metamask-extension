import React, { forwardRef, useImperativeHandle, useState } from 'react';
import { useHistory } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  AlignItems,
  BackgroundColor,
  Display,
  FlexDirection,
  JustifyContent,
  TextColor,
  TextVariant,
} from '../../../helpers/constants/design-system';
import {
  AvatarToken,
  AvatarTokenSize,
  Box,
  ButtonIcon,
  ButtonIconSize,
  IconName,
  Text,
} from '../../../components/component-library';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { DEFAULT_ROUTE } from '../../../helpers/constants/routes';
import { getIsUnlocked } from '../../../ducks/metamask/metamask';
import { getEnvironmentType } from '../../../../app/scripts/lib/util';
import { ENVIRONMENT_TYPE_POPUP } from '../../../../shared/constants/app';
import MetafoxLogo from '../../../components/ui/metafox-logo';

const AssetHeader = forwardRef(
  (
    {
      image,
      balance,
      optionsButton,
    }: {
      image: string;
      balance: {
        display: string;
        fiat?: string;
      };
      optionsButton: React.ReactNode;
    },
    ref,
  ) => {
    const t = useI18nContext();
    const history = useHistory();
    const isUnlocked = useSelector(getIsUnlocked);
    const popupStatus = getEnvironmentType() === ENVIRONMENT_TYPE_POPUP;

    const [balanceOpacity, setBalanceOpacity] = useState(0);
    useImperativeHandle(ref, () => ({ setBalanceOpacity }));

    return (
      <>
        {isUnlocked && !popupStatus ? (
          <Box
            display={[Display.None, Display.Flex]}
            alignItems={AlignItems.center}
            margin={2}
            className="multichain-app-header-logo"
            data-testid="app-header-logo"
            justifyContent={JustifyContent.center}
          >
            <MetafoxLogo
              unsetIconHeight
              onClick={() => history.push(DEFAULT_ROUTE)}
            />
          </Box>
        ) : null}

        <Box
          display={Display.Flex}
          backgroundColor={BackgroundColor.backgroundDefault}
          justifyContent={JustifyContent.spaceBetween}
          flexDirection={FlexDirection.Row}
          alignItems={AlignItems.center}
          padding={4}
          className="asset__header"
        >
          <ButtonIcon
            size={ButtonIconSize.Sm}
            ariaLabel={t('back')}
            iconName={IconName.ArrowLeft}
            onClick={() => history.push(DEFAULT_ROUTE)}
          />
          {balanceOpacity > 0 && (
            <Box
              style={{ opacity: balanceOpacity }}
              display={Display.Flex}
              flexDirection={FlexDirection.Column}
              alignItems={AlignItems.center}
            >
              <Text variant={TextVariant.bodyMdBold}>{balance.fiat}</Text>
              <Box
                display={Display.Flex}
                alignItems={AlignItems.center}
                gap={2}
              >
                <AvatarToken src={image} size={AvatarTokenSize.Xs} />
                <Text
                  variant={TextVariant.bodySm}
                  color={TextColor.textAlternative}
                >
                  {balance.display}
                </Text>
              </Box>
            </Box>
          )}
          {optionsButton}
        </Box>
      </>
    );
  },
);

export default AssetHeader;
