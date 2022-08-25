import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { I18nContext } from '../../../contexts/i18n';
import UrlIcon from '../../../components/ui/url-icon';
import Popover from '../../../components/ui/popover';
import Button from '../../../components/ui/button';
import Box from '../../../components/ui/box';
import Typography from '../../../components/ui/typography';
import ActionableMessage from '../../../components/ui/actionable-message/actionable-message';
import {
  TYPOGRAPHY,
  FONT_WEIGHT,
  ALIGN_ITEMS,
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
        alignItems={ALIGN_ITEMS.CENTER}
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
        <Typography
          ariant={TYPOGRAPHY.H4}
          fontWeight={FONT_WEIGHT.BOLD}
          boxProps={{ marginTop: 2, marginBottom: 3 }}
        >
          {tokenForImport.name}
        </Typography>
        <Typography variant={TYPOGRAPHY.H6}>{t('contract')}:</Typography>
        <Typography
          className="import-token__contract-address"
          variant={TYPOGRAPHY.H7}
          boxProps={{ marginBottom: 6 }}
        >
          {tokenForImport.address}
        </Typography>
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
