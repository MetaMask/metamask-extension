import React, { useState } from 'react';
import { Box, Button } from '@metamask/design-system-react';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { PRIVACY_ITEMS } from '../search-config';
import ExportYourDataModal from './export-your-data-modal';

export const ExportYourDataItem = () => {
  const t = useI18nContext();
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <Box className="mt-2" marginHorizontal={4}>
        <Button
          data-testid="privacy-tab-export-your-data-button"
          onClick={() => setShowModal(true)}
          className="text-text-default !bg-transparent p-0 text-left"
        >
          {t(PRIVACY_ITEMS['export-your-data'])}
        </Button>
      </Box>
      {showModal && <ExportYourDataModal onClose={() => setShowModal(false)} />}
    </>
  );
};
