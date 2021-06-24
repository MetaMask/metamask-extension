import React, { useContext } from 'react';

import Popover from '../../ui/popover';
import Button from '../../ui/button';
import EditGasDisplay from '../edit-gas-display';

import { I18nContext } from '../../../contexts/i18n';

export default function EditGasPopover() {
  const t = useContext(I18nContext);

  return (
    <Popover
      title={t('editGasTitle')}
      onClose={() => console.log('Closing!')}
      footer={
        <>
          <Button type="primary">{t('save')}</Button>
        </>
      }
    >
      <div style={{ padding: '20px' }}>
        <EditGasDisplay />
      </div>
    </Popover>
  );
}
