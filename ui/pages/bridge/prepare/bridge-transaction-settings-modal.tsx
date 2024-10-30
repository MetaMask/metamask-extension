import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Button,
  ButtonPrimary,
  ButtonPrimarySize,
  ButtonSize,
  ButtonVariant,
  Icon,
  IconName,
  IconSize,
  Modal,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Text,
  TextField,
  TextFieldType,
} from '../../../components/component-library';
import { useI18nContext } from '../../../hooks/useI18nContext';
import Tooltip from '../../../components/ui/tooltip';
import {
  IconColor,
  TextVariant,
} from '../../../helpers/constants/design-system';
import { getSlippage } from '../../../ducks/bridge/selectors';
import { setSlippage } from '../../../ducks/bridge/actions';

const HARDCODED_SLIPPAGE_OPTIONS = [2, 3];

export const BridgeTransactionSettingsModal = ({
  onClose,
  isOpen,
}: Omit<React.ComponentProps<typeof Modal>, 'children'>) => {
  const t = useI18nContext();
  const dispatch = useDispatch();

  const slippage = useSelector(getSlippage);

  const [localSlippage, setLocalSlippage] = useState<number | undefined>(
    slippage,
  );
  const [customSlippage, setCustomSlippage] = useState<number | undefined>(
    slippage && [0.02, 0.03].includes(slippage) ? undefined : slippage,
  );
  const [showCustomButton, setShowCustomButton] = useState(true);

  return (
    <Modal className="bridge-settings-modal" isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader onClose={onClose}>{t('transactionSettings')}</ModalHeader>
        <Box className="content">
          <span className="slippage-label">
            <Text>{t('swapsMaxSlippage')}</Text>
            <Tooltip
              position="top"
              title={t('swapSlippageTooltip')}
              style={{ display: 'flex' }}
            >
              <Icon
                color={IconColor.iconMuted}
                name={IconName.Info}
                size={IconSize.Md}
              />
            </Tooltip>
          </span>
          <Box className="slippage-options">
            {HARDCODED_SLIPPAGE_OPTIONS.map((hardcodedSlippage) => {
              return (
                <Button
                  key={hardcodedSlippage}
                  size={ButtonSize.Sm}
                  onClick={() => {
                    setLocalSlippage(hardcodedSlippage);
                    setCustomSlippage(undefined);
                  }}
                  variant={
                    localSlippage === hardcodedSlippage
                      ? ButtonVariant.Primary
                      : ButtonVariant.Secondary
                  }
                >
                  <Text>{hardcodedSlippage}%</Text>
                </Button>
              );
            })}
            <span className="slippage-input">
              {showCustomButton ? (
                <Button
                  className={
                    customSlippage === undefined ? 'custom-button' : ''
                  }
                  size={ButtonSize.Sm}
                  variant={
                    customSlippage
                      ? ButtonVariant.Primary
                      : ButtonVariant.Secondary
                  }
                  onClick={() => {
                    setShowCustomButton(false);
                  }}
                >
                  <Text>
                    {customSlippage === undefined
                      ? t('customSlippage')
                      : `${customSlippage}%`}
                  </Text>
                </Button>
              ) : (
                <TextField
                  type={TextFieldType.Number}
                  value={customSlippage}
                  onChange={(e) => {
                    setLocalSlippage(undefined);
                    setCustomSlippage(Number(e.target?.value));
                  }}
                  autoFocus={true}
                  onBlur={() => setShowCustomButton(true)}
                  endAccessory={<span className="input-suffix">%</span>}
                />
              )}
            </span>
          </Box>
        </Box>
        <ModalFooter>
          <ButtonPrimary
            size={ButtonPrimarySize.Md}
            variant={TextVariant.bodyMd}
            disabled={(localSlippage || customSlippage) === slippage}
            onClick={() => {
              dispatch(setSlippage(localSlippage || customSlippage));
              onClose();
            }}
          >
            {t('update')}
          </ButtonPrimary>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};
