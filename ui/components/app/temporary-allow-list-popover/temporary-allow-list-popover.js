import { useTransactionModalContext } from '../../../contexts/transaction-modal';
import Popover from '../../ui/popover';

import React, { useContext, useState } from 'react';
import PropTypes from 'prop-types';
import { useSelector, useDispatch } from 'react-redux';
import { useParams } from 'react-router-dom';
import withModalProps from '../../../helpers/higher-order-components/with-modal-props';
import Box from '../../ui/box';
import SenderToRecipient from '../../ui/sender-to-recipient';
import {
  BannerAlert,
  ButtonIcon,
  ButtonLink,
  ButtonPrimary,
  ButtonSecondary,
  FormTextField,
  Icon,
  IconName,
  IconSize,
  Label,
  Text,
} from '../../component-library';
import {
  AlignItems,
  DISPLAY,
  FLEX_DIRECTION,
  IconColor,
  JustifyContent,
  SEVERITIES,
  Size,
  TextAlign,
  TextVariant,
} from '../../../helpers/constants/design-system';
import { isTokenMethodAction } from '../../../helpers/utils/transactions.util';
import { getTokenAddressParam } from '../../../helpers/utils/token-util';

import { useI18nContext } from '../../../hooks/useI18nContext';
import { useAssetDetails } from '../../../hooks/useAssetDetails';
import CheckBox from '../../ui/check-box';
import { grantTemporaryAllowList, cancelTx } from '../../../store/actions';
import { getDisabledRpcMethodPreferences, getUnapprovedTransactions } from '../../../selectors';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import { TransactionType } from '../../../../shared/constants/transaction';
import { MetaMetricsContext } from '../../../contexts/metametrics';

const TemporaryAllowListPopover = () => {
  const t = useI18nContext();
  const { closeAllModals, currentModal } = useTransactionModalContext();

  if (currentModal !== 'temporaryAllowList') {
    return null;
  }

  const [isEthSignChecked, setIsEthSignChecked] = useState(false);
  const [showTextField, setShowTextField] = useState(false);
  const [inputKeyword, setInputKeyword] = useState('');
  const disabledRpcMethodPreferences = useSelector(
    getDisabledRpcMethodPreferences,
  );
  const unapprovedTxs = useSelector(getUnapprovedTransactions);

  const dispatch = useDispatch();
  const trackEvent = useContext(MetaMetricsContext);
  const { id } = useParams();
  const txData = unapprovedTxs[id] || {};

  const isValidTokenMethod = isTokenMethodAction(txData.type);

  const {
    toAddress: tokenToAddress,
  } = useAssetDetails(txData.txParams?.to, txData.txParams?.from, txData.txParams?.data);
  const tokenAddressParam = getTokenAddressParam(txData);

  let toAddress = txData.txParams?.to;
  if (txData.type !== TransactionType.simpleSend) {
    toAddress = tokenToAddress || tokenAddressParam || toAddress;
  }

  const handleSubmit = () => {
    dispatch(
      grantTemporaryAllowList(txData),
    );
    closeAllModals();
  };

  const handleCancel = async () => {
    await dispatch(cancelTx({ id }));
    closeAllModals()
  };

  const isValid = inputKeyword === 'I trust this address';
  return (
    <Popover
      className="advanced-gas-fee-popover"
    >
      <Box
        className="eth-sign-modal"
        display={DISPLAY.FLEX}
        flexDirection={FLEX_DIRECTION.COLUMN}
        justifyContent={JustifyContent.flexStart}
        padding={4}
      >
        <Box
          display={DISPLAY.FLEX}
          flexDirection={FLEX_DIRECTION.ROW}
          marginBottom={4}
          justifyContent={JustifyContent.center}
        >
          <Icon
            className="eth-sign-modal__warning-icon"
            name={IconName.Danger}
            color={IconColor.errorDefault}
            size={IconSize.Lg}
          />
          <ButtonIcon
            className="eth-sign-modal__close"
            iconName={IconName.Close}
            size={Size.SM}
            onClick={handleCancel}
            ariaLabel={t('close')}
          />
        </Box>

        <Text
          variant={TextVariant.headingMd}
          textAlign={TextAlign.Center}
          marginBottom={6}
        >
          {'Are you sure you want to proceed?'}
        </Text>
        <Text variant={TextVariant.bodyMd}>
          {`This transaction will be sent to:`}
        </Text>
        {toAddress ? (<SenderToRecipient
          hideSender={true}
          addressOnly={true}
          recipientAddress={toAddress}
        />) : null}
        <br />
        <Text variant={TextVariant.bodyMd}>
          {`This is not in your allow list. Are you sure you trust this address?`}
        </Text>
        <br />
        {showTextField ? (
          <FormTextField
            id="enter-eth-sign-text"
            label={'Enter "I trust this address" to continue'}
            error={inputKeyword.length > 0 && !isValid}
            helpText={
              inputKeyword.length > 0 &&
              !isValid &&
              t('toggleEthSignModalFormError')
            }
            onChange={(event) => setInputKeyword(event.target.value)}
            value={inputKeyword}
            onPaste={(event) => event.preventDefault()}
          />
        ) : (
          <Box
            flexDirection={FLEX_DIRECTION.ROW}
            alignItems={AlignItems.flexStart}
            gap={2}
          >
            <CheckBox
              id="eth-sign__checkbox"
              className="eth-sign__checkbox"
              dataTestId="eth-sign__checkbox"
              checked={isEthSignChecked}
              onClick={() => {
                setIsEthSignChecked(!isEthSignChecked);
              }}
            />
            <Label htmlFor="eth-sign__checkbox">
              <Text variant={TextVariant.bodyMd} as="span">
                {'I acknowledge I am sending to an address that is not in my allow list.'}
              </Text>
            </Label>
          </Box>
        )}
        <Box
          display={DISPLAY.FLEX}
          flexDirection={FLEX_DIRECTION.ROW}
          justifyContent={JustifyContent.spaceBetween}
          gap={4}
          marginTop={6}
        >
          <ButtonSecondary onClick={handleCancel} size={Size.LG} block>
            {t('cancel')}
          </ButtonSecondary>
          {showTextField ? (
            <ButtonPrimary
              danger
              block
              disabled={!isValid}
              onClick={handleSubmit}
              size={Size.LG}
            >
              {t('enableSnap')}
            </ButtonPrimary>
          ) : (
            <ButtonPrimary
              block
              disabled={!isEthSignChecked}
              size={Size.LG}
              onClick={() => {
                setShowTextField(true);
                trackEvent({
                  category: MetaMetricsEventCategory.Settings,
                  event: MetaMetricsEventName.OnboardingWalletAdvancedSettings,
                  properties: {
                    location: 'Settings',
                    enable_eth_sign: true,
                  },
                });
              }}
            >
              {t('continue')}
            </ButtonPrimary>
          )}
        </Box>
      </Box>
    </Popover>
  );
};

export default TemporaryAllowListPopover;
