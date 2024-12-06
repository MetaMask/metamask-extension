import { providerErrors, serializeError } from '@metamask/rpc-errors';
import React, { useCallback } from 'react';
import { useDispatch } from 'react-redux';

import { QueueType } from '../../../../../../shared/constants/metametrics';
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
import { rejectPendingApproval } from '../../../../../store/actions';
import { useConfirmContext } from '../../../context/confirm';
import { useQueuedConfirmationsEvent } from '../../../hooks/useQueuedConfirmationEvents';
import { useConfirmationNavigation } from '../../../hooks/useConfirmationNavigation';

const Nav = () => {
  const t = useI18nContext();
  const dispatch = useDispatch();
  const { currentConfirmation } = useConfirmContext();

  const { confirmations, count, getIndex, navigateToIndex } =
    useConfirmationNavigation();

  const position = getIndex(currentConfirmation?.id);

  const onNavigateButtonClick = useCallback(
    (change: number) => {
      navigateToIndex(position + change);
    },
    [position, navigateToIndex],
  );

  const onRejectAll = useCallback(() => {
    confirmations.forEach((conf) => {
      dispatch(
        rejectPendingApproval(
          conf.id,
          serializeError(providerErrors.userRejectedRequest()),
        ),
      );
    });
  }, [confirmations]);

  useQueuedConfirmationsEvent(QueueType.NavigationHeader);

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
      style={{
        zIndex: 2,
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

export default Nav;
