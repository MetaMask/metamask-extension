import React from 'react';
import { useSelector } from 'react-redux';
import PropTypes from 'prop-types';
import {
  Box,
  ButtonPrimary,
  ButtonSecondary,
  Text,
} from '../../component-library';
import {
  AlignItems,
  Display,
  Size,
  TextAlign,
  TextColor,
  TextVariant,
} from '../../../helpers/constants/design-system';
import TokenBalance from '../../ui/token-balance/token-balance';
import Identicon from '../../ui/identicon';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { getPendingTokens } from '../../../ducks/metamask/metamask';

export const ImportTokensModalConfirm = ({ onBackClick, onImportClick }) => {
  const t = useI18nContext();
  const pendingTokens = useSelector(getPendingTokens);

  return (
    <Box paddingTop={4} paddingBottom={4}>
      <Text textAlign={TextAlign.Center}>{t('likeToImportTokens')}</Text>
      <Box marginTop={4} marginBottom={4}>
        <Box display={Display.Flex}>
          <Text
            variant={TextVariant.bodySm}
            className="import-tokens-modal__token-name"
          >
            {t('token')}
          </Text>
          <Text
            variant={TextVariant.bodySm}
            className="import-tokens-modal__token-balance"
          >
            {t('balance')}
          </Text>
        </Box>
        <Box
          display={Display.Flex}
          className="import-tokens-modal__confirm-token-list"
        >
          {Object.entries(pendingTokens).map(([address, token]) => {
            const { name, symbol } = token;
            return (
              <Box
                key={address}
                marginBottom={4}
                display={Display.Flex}
                className="import-tokens-modal__confirm-token-list-item"
              >
                <Box
                  display={Display.Flex}
                  alignItems={AlignItems.center}
                  className="import-tokens-modal__confirm-token-list-item-wrapper"
                >
                  <Identicon diameter={36} address={address} />
                  <Box
                    marginInlineStart={4}
                    className="import-tokens-modal__confirm-token-list-item-wrapper__text"
                  >
                    <Text ellipsis>{name}</Text>
                    <Text
                      variant={TextVariant.bodySm}
                      color={TextColor.textAlternative}
                    >
                      {symbol}
                    </Text>
                  </Box>
                </Box>
                <Box
                  className="import-tokens-modal__token-balance"
                  alignItems={AlignItems.flexStart}
                >
                  <TokenBalance token={token} />
                </Box>
              </Box>
            );
          })}
        </Box>
        <Box display={Display.Flex} gap={2} marginTop={4}>
          <ButtonSecondary size={Size.LG} onClick={onBackClick} block>
            {t('back')}
          </ButtonSecondary>
          <ButtonPrimary
            size={Size.LG}
            onClick={onImportClick}
            block
            data-testid="import-tokens-modal-import-button"
          >
            {t('import')}
          </ButtonPrimary>
        </Box>
      </Box>
    </Box>
  );
};

ImportTokensModalConfirm.propTypes = {
  /**
   * Executes when the Back button is clicked
   */
  onBackClick: PropTypes.func.isRequired,
  /**
   * Executes when the Import button is clicked
   */
  onImportClick: PropTypes.func.isRequired,
};
