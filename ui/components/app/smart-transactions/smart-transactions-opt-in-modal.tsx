import React from 'react';
import { useDispatch } from 'react-redux';

import { useI18nContext } from '../../../hooks/useI18nContext';
import {
  TextColor,
  Display,
  FlexDirection,
  BlockSize,
  AlignItems,
  TextAlign,
  JustifyContent,
  TextVariant,
  IconColor,
} from '../../../helpers/constants/design-system';
import {
  Modal,
  ModalOverlay,
  Text,
  Box,
  Button,
  ButtonVariant,
  ModalHeader,
  ModalContent,
  ButtonLink,
  ButtonLinkSize,
  AvatarIcon,
  IconName,
  AvatarIconSize,
} from '../../component-library';
import { setSmartTransactionsOptInStatus } from '../../../store/actions';
import { SMART_TRANSACTIONS_LEARN_MORE_URL } from '../../../../shared/constants/smartTransactions';

export type SmartTransactionsOptInModalProps = {
  isOpen: boolean;
};

export default function SmartTransactionsOptInModal({
  isOpen,
}: SmartTransactionsOptInModalProps) {
  const t = useI18nContext();
  const dispatch = useDispatch();

  const onEnableSmartTransactions = () => {
    dispatch(setSmartTransactionsOptInStatus(true));
  };
  const onNotRightNow = () => {
    dispatch(setSmartTransactionsOptInStatus(false));
  };

  const LearnMoreLink = () => {
    return (
      <ButtonLink
        size={ButtonLinkSize.Inherit}
        textProps={{
          variant: TextVariant.bodyMd,
          alignItems: AlignItems.flexStart,
        }}
        as="a"
        href={SMART_TRANSACTIONS_LEARN_MORE_URL}
        target="_blank"
        rel="noopener noreferrer"
      >
        {t('learnMoreUpperCaseWithDot')}
      </ButtonLink>
    );
  };

  const EnableSmartTransactionsButton = () => {
    return (
      <Button
        marginTop={8}
        variant={ButtonVariant.Primary}
        onClick={onEnableSmartTransactions}
        width={BlockSize.Full}
      >
        {t('enableSmartTransactions')}
      </Button>
    );
  };

  const NotRightNowLink = () => {
    return (
      <Button
        marginTop={2}
        type="link"
        variant={ButtonVariant.Link}
        onClick={onNotRightNow}
        width={BlockSize.Full}
      >
        {t('notRightNow')}
      </Button>
    );
  };

  const Description = () => {
    return (
      <Box display={Display.Flex} flexDirection={FlexDirection.Column}>
        <Text variant={TextVariant.bodyMd} marginTop={4}>
          {t('smartTransactionsDescription')}
        </Text>
        <Text variant={TextVariant.bodyMd} marginTop={4}>
          {t('smartTransactionsDescription2')}
        </Text>
        <Text variant={TextVariant.bodyMd} marginTop={4}>
          {t('smartTransactionsDescription3', [<LearnMoreLink />])}
        </Text>
      </Box>
    );
  };

  const Benefit = ({
    text,
    iconName,
  }: {
    text: string;
    iconName: IconName;
  }) => {
    return (
      <Box
        display={Display.Flex}
        flexDirection={FlexDirection.Column}
        className="mm-smart-transactions-opt-in-modal__benefit"
        textAlign={TextAlign.Center}
        alignItems={AlignItems.center}
        justifyContent={JustifyContent.flexStart}
      >
        <AvatarIcon
          iconName={iconName}
          size={AvatarIconSize.Md}
          color={IconColor.primaryDefault}
        />
        <Text
          variant={TextVariant.bodyXs}
          color={TextColor.textAlternative}
          marginTop={1}
        >
          {text}
        </Text>
      </Box>
    );
  };

  const Benefits = () => {
    return (
      <Box
        display={Display.Flex}
        flexDirection={FlexDirection.Row}
        justifyContent={JustifyContent.center}
        marginTop={4}
      >
        <Benefit
          text={t('smartTransactionsBenefit1')}
          iconName={IconName.Confirmation}
        />
        <Benefit
          text={t('smartTransactionsBenefit2')}
          iconName={IconName.SecurityTick}
        />
        <Benefit
          text={t('smartTransactionsBenefit3')}
          iconName={IconName.Clock}
        />
      </Box>
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onEnableSmartTransactions}
      isClosedOnOutsideClick={false}
      isClosedOnEscapeKey={false}
      className="mm-modal__custom-scrollbar mm-smart-transactions-opt-in-modal"
      autoFocus={false}
    >
      <ModalOverlay />
      <ModalContent>
        <ModalHeader
          alignItems={AlignItems.center}
          justifyContent={JustifyContent.center}
        >
          {t('introducingSmartTransactions')}
        </ModalHeader>
        <Box
          display={Display.Flex}
          flexDirection={FlexDirection.Column}
          paddingLeft={4}
          paddingRight={4}
        >
          <Benefits />
          <Description />
          <EnableSmartTransactionsButton />
          <NotRightNowLink />
        </Box>
      </ModalContent>
    </Modal>
  );
}
