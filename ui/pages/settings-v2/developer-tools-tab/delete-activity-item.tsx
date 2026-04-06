import React, { useContext, useState } from 'react';
import { Button } from '@metamask/design-system-react';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import { DEVELOPER_TOOLS_ITEMS } from '../search-config';
import DeleteActivityModal from './delete-activity-modal';

export const DeleteActivityItem = () => {
  const t = useI18nContext();
  const { trackEvent } = useContext(MetaMetricsContext);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const handleDeleteActivity = () => {
    trackEvent({
      category: MetaMetricsEventCategory.Settings,
      event: MetaMetricsEventName.AccountReset,
      properties: {},
    });
    setShowDeleteModal(true);
  };

  return (
    <>
      <Button
        data-testid="developer-options-delete-activity-and-nonce-data"
        onClick={handleDeleteActivity}
        className="text-bg !bg-transparent px-4 py-0 text-left"
      >
        {t(DEVELOPER_TOOLS_ITEMS['delete-activity-and-nonce-data'])}
      </Button>
      {showDeleteModal && (
        <DeleteActivityModal onClose={() => setShowDeleteModal(false)} />
      )}
    </>
  );
};
