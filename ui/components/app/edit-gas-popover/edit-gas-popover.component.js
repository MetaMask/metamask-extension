import React, { useContext } from 'react';
import PropTypes from 'prop-types';

import Popover from '../../ui/popover';
import Button from '../../ui/button';
import EditGasDisplay from '../edit-gas-display';

import { I18nContext } from '../../../contexts/i18n';

export default function EditGasPopover({
  popoverTitle,
  confirmButtonText,
  editGasDisplayProps,
}) {
  const t = useContext(I18nContext);

  const title = popoverTitle || t('editGasTitle');
  const footerButtonText = confirmButtonText || t('save');

  return (
    <Popover
      title={title}
      onClose={() => console.log('Closing!')}
      footer={
        <>
          <Button type="primary">{footerButtonText}</Button>
        </>
      }
    >
      <div style={{ padding: '20px' }}>
        <EditGasDisplay {...editGasDisplayProps} />
      </div>
    </Popover>
  );
}

EditGasPopover.propTypes = {
  popoverTitle: PropTypes.string,
  editGasDisplayProps: PropTypes.object,
  confirmButtonText: PropTypes.string,
};

EditGasPopover.defaultProps = {
  popoverTitle: '',
  editGasDisplayProps: {},
  confirmButtonText: '',
};
