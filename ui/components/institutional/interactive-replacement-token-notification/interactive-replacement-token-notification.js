import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import PropTypes from 'prop-types';
import { getCurrentKeyring, getSelectedAddress } from '../../../selectors';
import { getInteractiveReplacementToken } from '../../../selectors/institutional/selectors';
import { getIsUnlocked } from '../../../ducks/metamask/metamask';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { mmiActionsFactory } from '../../../store/institutional/institution-background';
import { sha256 } from '../../../../shared/modules/hash.utils';
import {
  Size,
  IconColor,
  AlignItems,
  DISPLAY,
  BLOCK_SIZES,
  JustifyContent,
  TextColor,
  TextVariant,
  BackgroundColor,
} from '../../../helpers/constants/design-system';
import {
  Icon,
  IconName,
  IconSize,
  ButtonLink,
  Text,
} from '../../component-library';

import Box from '../../ui/box';

const InteractiveReplacementTokenNotification = ({ isVisible }) => {
  const t = useI18nContext();
  const dispatch = useDispatch();
  const mmiActions = mmiActionsFactory();

  const keyring = useSelector(getCurrentKeyring);
  const address = useSelector(getSelectedAddress);
  const isUnlocked = useSelector(getIsUnlocked);
  const interactiveReplacementToken = useSelector(
    getInteractiveReplacementToken,
  );

  const [showNotification, setShowNotification] = useState(isVisible);

  useEffect(() => {
    const handleShowNotification = async () => {
      const hasInteractiveReplacementToken =
        interactiveReplacementToken &&
        Boolean(Object.keys(interactiveReplacementToken).length);

      if (!/^Custody/u.test(keyring.type)) {
        setShowNotification(false);
        return;
      } else if (!hasInteractiveReplacementToken) {
        setShowNotification(false);
        return;
      }

      const token = await dispatch(mmiActions.getCustodianToken());
      const custodyAccountDetails = await dispatch(
        mmiActions.getAllCustodianAccountsWithToken(
          keyring.type.split(' - ')[1],
          token,
        ),
      );

      const showNotificationValue =
        isUnlocked &&
        interactiveReplacementToken.oldRefreshToken &&
        custodyAccountDetails &&
        Boolean(Object.keys(custodyAccountDetails).length);

      let tokenAccount;

      if (Array.isArray(custodyAccountDetails)) {
        tokenAccount = custodyAccountDetails
          .filter(
            (item) => item.address.toLowerCase() === address.toLowerCase(),
          )
          .map((item) => ({
            token: item.authDetails?.refreshToken,
          }))[0];
      }

      const refreshTokenAccount = await sha256(
        tokenAccount?.token + interactiveReplacementToken.url,
      );

      setShowNotification(
        showNotificationValue &&
          refreshTokenAccount === interactiveReplacementToken.oldRefreshToken,
      );
    };

    handleShowNotification();
  }, [
    dispatch,
    address,
    interactiveReplacementToken,
    isUnlocked,
    keyring,
    mmiActions,
  ]);

  return showNotification ? (
    <Box
      width={BLOCK_SIZES.FULL}
      display={DISPLAY.FLEX}
      justifyContent={JustifyContent.center}
      alignItems={AlignItems.center}
      padding={[1, 2]}
      backgroundColor={BackgroundColor.backgroundAlternative}
      marginBottom={1}
      className="interactive-replacement-token-notification"
      data-testid="interactive-replacement-token-notification"
    >
      <Icon
        name={IconName.Danger}
        color={IconColor.errorDefault}
        size={IconSize.Xl}
      />
      <Text variant={TextVariant.bodyXs} gap={2} color={TextColor.errorDefault}>
        {t('custodySessionExpired')}
      </Text>
      <ButtonLink
        data-testid="show-modal"
        size={Size.auto}
        marginLeft={1}
        onClick={() => {
          dispatch(mmiActions.showInteractiveReplacementTokenModal());
        }}
      >
        {t('learnMore')}
      </ButtonLink>
    </Box>
  ) : null;
};

export default InteractiveReplacementTokenNotification;

InteractiveReplacementTokenNotification.propTypes = {
  isVisible: PropTypes.bool,
};
