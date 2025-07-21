import React, { useCallback } from 'react';

import { useDispatch } from 'react-redux';
import {
  Box,
  Button,
  ButtonIcon,
  ButtonIconSize,
  ButtonVariant,
  IconName,
  Text,
} from '../../../../../components/component-library';
import {
  AlignItems,
  BackgroundColor,
  BlockSize,
  BorderRadius,
  Display,
  FlexDirection,
  FontWeight,
  IconColor,
  JustifyContent,
  TextColor,
  TextVariant,
} from '../../../../../helpers/constants/design-system';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { rejectAllApprovals } from '../../../../../store/actions';
import { useConfirmationNavigation } from '../../../hooks/useConfirmationNavigation';
import { useConfirmContext } from '../../../context/confirm';

export type NavProps = {
  confirmationId?: string;
};

export const Nav = ({ confirmationId }: NavProps) => {
  const t = useI18nContext();
  const dispatch = useDispatch();

  const { count, getIndex, navigateToIndex } = useConfirmationNavigation();

  const position = getIndex(confirmationId);

  const onNavigateButtonClick = useCallback(
    (change: number) => {
      navigateToIndex(position + change);
    },
    [position, navigateToIndex],
  );

  const onRejectAll = useCallback(async () => {
    await dispatch(rejectAllApprovals());
  }, [dispatch]);

  if (count <= 1) {
    return null;
  }

  return (
    <Box
      alignItems={AlignItems.center}
      backgroundColor={BackgroundColor.backgroundDefault}
      display={Display.Flex}
      flexDirection={FlexDirection.Row}
      justifyContent={JustifyContent.spaceBetween}
      padding={3}
      width={BlockSize.Full}
      style={{
        zIndex: 2,
        position: 'relative',
      }}
    >
      <Box alignItems={AlignItems.center} display={Display.Flex}>
        <ButtonIcon
          ariaLabel="Previous Confirmation"
          data-testid="confirm-nav__previous-confirmation"
          backgroundColor={BackgroundColor.backgroundAlternative}
          borderRadius={BorderRadius.full}
          className="confirm_nav__left_btn"
          color={IconColor.iconAlternative}
          disabled={position === 0}
          iconName={IconName.ArrowLeft}
          onClick={() => onNavigateButtonClick(-1)}
          size={ButtonIconSize.Sm}
        />
        <Text
          color={TextColor.textAlternative}
          marginInline={2}
          variant={TextVariant.bodySm}
          data-testid="confirm-page-nav-position"
        >
          {position + 1} of {count}
        </Text>
        <ButtonIcon
          ariaLabel="Next Confirmation"
          data-testid="confirm-nav__next-confirmation"
          backgroundColor={BackgroundColor.backgroundAlternative}
          borderRadius={BorderRadius.full}
          className="confirm_nav__right_btn"
          color={IconColor.iconAlternative}
          disabled={position === count - 1}
          iconName={IconName.ArrowRight}
          onClick={() => onNavigateButtonClick(1)}
          size={ButtonIconSize.Sm}
        />
      </Box>
      <Button
        borderRadius={BorderRadius.XL}
        className="confirm_nav__reject_all"
        data-testid="confirm-nav__reject-all"
        fontWeight={FontWeight.Normal}
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31879
        // eslint-disable-next-line @typescript-eslint/no-misused-promises
        onClick={onRejectAll}
        paddingLeft={3}
        paddingRight={3}
        startIconName={IconName.Close}
        type={ButtonVariant.Secondary}
      >
        {t('rejectAll')}
      </Button>
    </Box>
  );
};

export const ConfirmNav = () => {
  const { currentConfirmation } = useConfirmContext();
  return <Nav confirmationId={currentConfirmation?.id} />;
};
