import { ethErrors, serializeError } from 'eth-rpc-errors';
import React, { useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';

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
import {
  CONFIRM_TRANSACTION_ROUTE,
  SIGNATURE_REQUEST_PATH,
} from '../../../../../helpers/constants/routes';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import {
  currentConfirmationSelector,
  pendingConfirmationsSortedSelector,
} from '../../../../../selectors';
import { rejectPendingApproval } from '../../../../../store/actions';
import { isSignatureApprovalRequest } from '../../../utils';

const Nav = () => {
  const history = useHistory();
  const t = useI18nContext();
  const currentConfirmation = useSelector(currentConfirmationSelector);
  const pendingConfirmations = useSelector(pendingConfirmationsSortedSelector);
  const dispatch = useDispatch();

  const currentConfirmationPosition = useMemo(() => {
    if (pendingConfirmations?.length <= 0 || !currentConfirmation) {
      return 0;
    }
    return pendingConfirmations.findIndex(
      ({ id }) => id === currentConfirmation.id,
    );
  }, [currentConfirmation, pendingConfirmations]);

  const onNavigateToTransaction = useCallback(
    (pos: number) => {
      const nextConfirmation =
        pendingConfirmations[currentConfirmationPosition + pos];
      // todo: once all signature request pages are ported to new designs
      // SIGNATURE_REQUEST_PATH from path below can be removed
      // In new routing all confirmations will support
      // "/confirm-transaction/<confirmation_id>"
      history.replace(
        `${CONFIRM_TRANSACTION_ROUTE}/${
          pendingConfirmations[currentConfirmationPosition + pos].id
        }${
          isSignatureApprovalRequest(nextConfirmation)
            ? SIGNATURE_REQUEST_PATH
            : ''
        }`,
      );
    },
    [currentConfirmationPosition, pendingConfirmations],
  );

  const onRejectAll = useCallback(() => {
    pendingConfirmations.forEach((conf) => {
      dispatch(
        rejectPendingApproval(
          conf.id,
          serializeError(ethErrors.provider.userRejectedRequest()),
        ),
      );
    });
  }, [pendingConfirmations]);

  if (pendingConfirmations.length <= 1) {
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
    >
      <Box alignItems={AlignItems.center} display={Display.Flex}>
        <ButtonIcon
          ariaLabel="Previous Confirmation"
          backgroundColor={BackgroundColor.backgroundAlternative}
          borderRadius={BorderRadius.full}
          className="confirm_nav__left_btn"
          color={IconColor.iconAlternative}
          disabled={currentConfirmationPosition === 0}
          iconName={IconName.ArrowLeft}
          onClick={() => onNavigateToTransaction(-1)}
          size={ButtonIconSize.Sm}
        />
        <Text
          color={TextColor.textAlternative}
          marginInline={2}
          variant={TextVariant.bodySm}
        >
          {currentConfirmationPosition + 1} of {pendingConfirmations.length}
        </Text>
        <ButtonIcon
          ariaLabel="Next Confirmation"
          backgroundColor={BackgroundColor.backgroundAlternative}
          borderRadius={BorderRadius.full}
          className="confirm_nav__right_btn"
          color={IconColor.iconAlternative}
          disabled={
            currentConfirmationPosition === pendingConfirmations.length - 1
          }
          iconName={IconName.ArrowRight}
          onClick={() => onNavigateToTransaction(1)}
          size={ButtonIconSize.Sm}
        />
      </Box>
      <Button
        borderRadius={BorderRadius.XL}
        className="confirm_nav__reject_all"
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
