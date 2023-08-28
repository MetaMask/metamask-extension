import React, { useState } from 'react';
import PropTypes from 'prop-types';
import {
  Modal,
  ModalContent,
  ModalOverlay,
  ModalHeader,
  IconName,
  AvatarIcon,
  AvatarIconSize,
  Text,
  Checkbox,
  Box,
  Button,
  BUTTON_VARIANT,
} from '../../../component-library';
import {
  BackgroundColor,
  IconColor,
  Size,
  TextVariant,
} from '../../../../helpers/constants/design-system';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { SnapUIRenderer } from '../snap-ui-renderer';
import { DelineatorType } from '../../../../helpers/constants/snaps';

export default function TxInsightWarnings({
  warnings,
  type = 'confirming',
  origin,
  onCancel,
  onSubmit,
}) {
  const t = useI18nContext();
  const defaultWarningsState = warnings.reduce((state, warning) => {
    state[warning.snapId] = false;
    return state;
  }, {});

  const [warningsState, setWarningsState] = useState(defaultWarningsState);
  const [isChecked, setIsChecked] = useState(false);

  const handleOnChange = () => setIsChecked(!isChecked);

  const Warnings = () => {
    return warnings.map((warning, idx) => {
      const { snapId, content } = warning;
      return (
        <SnapUIRenderer
          key={`${snapId}-${idx}`}
          snapId={snapId}
          data={content}
          delineatorType={DelineatorType.Warning}
          onClick={() => {
            setWarningsState({ ...warningsState, [snapId]: true });
          }}
          isCollapsable
        />
      );
    });
  };

  // move this to an enum that defines the language to be used in this modal on the various
  // screens that will offer transaction insights, should be indexed on "type".
  const results = {
    confirming: { noun: 'confirmation', imperative: 'confirm' },
    signing: { noun: 'signature', imperative: 'sign' },
  };

  return (
    <Modal
      isOpen
      isClosedOnEscapeKey={false}
      isClosedOnOutsideClick={false}
      className="tx-insights-warnings-modal"
    >
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>
          <AvatarIcon
            iconName={IconName.Warning}
            size={AvatarIconSize.Lg}
            color={IconColor.errorInverse}
            backgroundColor={BackgroundColor.errorMuted}
          />
          <Text variant={TextVariant.headingMd}>
            {t('transactionInsightWarningHeader')}
          </Text>
        </ModalHeader>
        <Text variant={TextVariant.bodyMd}>
          {t('transactionInsightWarningContent', [
            warnings.length,
            type,
            results[type].noun,
          ])}
        </Text>
        <Warnings />
        <Checkbox
          isChecked={isChecked}
          onChange={handleOnChange}
          label={t('transactionInsightWarningCheckboxMessage', [
            results[type].imperative,
            origin,
          ])}
        />
        <Box>
          <Button
            size={Size.LG}
            variant={BUTTON_VARIANT.SECONDARY}
            onClick={onCancel}
          >
            {t('cancel')}
          </Button>
          <Button
            size={Size.LG}
            danger
            onClick={onSubmit}
            disabled={!isChecked}
          >
            {t(`${results[type].imperative}`)}
          </Button>
        </Box>
      </ModalContent>
    </Modal>
  );
}

TxInsightWarnings.propTypes = {
  /**
   * An array of warnings returned from tx-insight snaps that deem their content 'critical'
   */
  warnings: PropTypes.arrayOf(PropTypes.object),
  /**
   * A limited set of actions defining the type of transaction
   */
  type: PropTypes.oneOf(['confirming', 'signing']),
  /**
   * Origin initiating the transaction
   */
  origin: PropTypes.string.isRequired,
  /**
   * Cancel function
   */
  onCancel: PropTypes.func.isRequired,
  /**
   * Submit function
   */
  onSubmit: PropTypes.func.isRequired,
};
