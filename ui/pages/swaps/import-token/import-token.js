import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { I18nContext } from '../../../contexts/i18n';
import UrlIcon from '../../../components/ui/url-icon';
import Popover from '../../../components/ui/popover';
import Button from '../../../components/ui/button';
import Box from '../../../components/ui/box';
import { Text } from '../../../components/component-library';
import ActionableMessage from '../../../components/ui/actionable-message/actionable-message';
import {
  TextVariant,
  FONT_WEIGHT,
  AlignItems,
  DISPLAY,
} from '../../../helpers/constants/design-system';

export default function ImportToken({
  onImportTokenCloseClick,
  onImportTokenClick,
  setIsImportTokenModalOpen,
  tokenForImport,
}) {
  const t = useContext(I18nContext);
  const ImportTokenModalFooter = (
    <>
      <Button
        type="secondary"
        className="page-container__footer-button"
        onClick={onImportTokenCloseClick}
      >
        {t('cancel')}
      </Button>
      <Button
        type="primary"
        className="page-container__footer-button"
        onClick={onImportTokenClick}
        data-testid="page-container__import-button"
      >
        {t('import')}
      </Button>
    </>
  );

  return (
    <Popover
      title={t('importTokenQuestion')}
      onClose={() => setIsImportTokenModalOpen(false)}
      footer={ImportTokenModalFooter}
    >
      <Box
        paddingRight={6}
        paddingBottom={4}
        paddingLeft={4}
        alignItems={AlignItems.center}
        display={DISPLAY.FLEX}
        className="import-token"
      >
        <ActionableMessage type="danger" message={t('importTokenWarning')} />
        <UrlIcon
          url={tokenForImport.iconUrl}
          className="import-token__token-icon"
          fallbackClassName="import-token__token-icon"
          name={tokenForImport.symbol}
        />
        <Text
          variant={TextVariant.headingSm}
          as="h4"
          fontWeight={FONT_WEIGHT.BOLD}
          boxProps={{ marginTop: 2, marginBottom: 3 }}
        >
          {tokenForImport.name || ''}
        </Text>
        <Text variant={TextVariant.bodySm} as="h6">{t('contract')}:</Text>
        <Text
          variant={TextVariant.bodySm}
          className="import-token__contract-address"
          as="h6"
          boxProps={{ marginBottom: 6 }}>
          {tokenForImport.address || ''}
        </Text>
      </Box>
    </Popover>
  );
}

ImportToken.propTypes = {
  onImportTokenCloseClick: PropTypes.func,
  onImportTokenClick: PropTypes.func,
  setIsImportTokenModalOpen: PropTypes.func,
  tokenForImport: PropTypes.object,
};
