import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  getCurrentKeyring,
  getSelectedInternalAccount,
} from '../../../selectors';
import { getInteractiveReplacementToken } from '../../../selectors/institutional/selectors';
import { getIsUnlocked } from '../../../ducks/metamask/metamask';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { mmiActionsFactory } from '../../../store/institutional/institution-background';
import { showInteractiveReplacementTokenModal } from '../../../store/institutional/institution-actions';
import { sha256 } from '../../../../shared/modules/hash.utils';
import {
  IconColor,
  AlignItems,
  Display,
  BlockSize,
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
  Box,
  Text,
  ButtonLinkSize,
} from '../../component-library';

type InteractiveReplacementTokenNotificationProps = {
  isVisible?: boolean;
};

const InteractiveReplacementTokenNotification: React.FC<
  InteractiveReplacementTokenNotificationProps
> = ({ isVisible }) => {
  const t = useI18nContext();
  const dispatch = useDispatch();
  const mmiActions = mmiActionsFactory();

  const keyring = useSelector(getCurrentKeyring);
  const { address } = useSelector(getSelectedInternalAccount);
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

      // @ts-expect-error keyring type is wrong maybe?
      if (!/^Custody/u.test(keyring.type) || !hasInteractiveReplacementToken) {
        setShowNotification(false);
        return;
      }

      const token = (await dispatch(
        mmiActions.getCustodianToken(address),
      )) as unknown as string;
      const custodyAccountDetails = await dispatch(
        mmiActions.getAllCustodianAccountsWithToken(
          // @ts-expect-error keyring type is wrong maybe?
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
    address,
    interactiveReplacementToken?.oldRefreshToken,
    isUnlocked,
    dispatch,
    // @ts-expect-error keyring type is wrong maybe?
    keyring.type,
    interactiveReplacementToken,
    mmiActions,
  ]);

  return showNotification ? (
    <Box
      width={BlockSize.Full}
      display={Display.Flex}
      justifyContent={JustifyContent.center}
      alignItems={AlignItems.center}
      padding={[1, 2]}
      backgroundColor={BackgroundColor.backgroundAlternative}
      className="interactive-replacement-token-notification"
      data-testid="interactive-replacement-token-notification"
    >
      <Icon
        name={IconName.Danger}
        color={IconColor.errorDefault}
        size={IconSize.Md}
      />
      <Text variant={TextVariant.bodySm} gap={2} color={TextColor.errorDefault}>
        {t('custodySessionExpired')}
      </Text>
      <Text variant={TextVariant.bodySm}>
        <ButtonLink
          data-testid="show-modal"
          size={ButtonLinkSize.Inherit}
          marginLeft={1}
          onClick={() => {
            dispatch(showInteractiveReplacementTokenModal());
          }}
        >
          {t('learnMoreUpperCase')}
        </ButtonLink>
      </Text>
    </Box>
  ) : null;
};

export default InteractiveReplacementTokenNotification;
