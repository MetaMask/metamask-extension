import React, { useContext, useState } from 'react';
import PropTypes from 'prop-types';

import Popover from '../../ui/popover';
import Button from '../../ui/button';
import EditGasDisplay from '../edit-gas-display';
import EditGasDisplayEducation from '../edit-gas-display-education';

import { I18nContext } from '../../../contexts/i18n';

export default function EditGasPopover({
  popoverTitle,
  confirmButtonText,
  editGasDisplayProps,
}) {
  const t = useContext(I18nContext);
  const [showEducationContent, setShowEducationContent] = useState(false);

  const title = showEducationContent
    ? t('editGasEducationModalTitle')
    : popoverTitle || t('editGasTitle');
  const footerButtonText = confirmButtonText || t('save');

  return (
    <Popover
      title={title}
      onClose={() => console.log('Closing!')}
      onBack={
        showEducationContent ? () => setShowEducationContent(false) : undefined
      }
      footer={
        <>
          <Button type="primary">{footerButtonText}</Button>
        </>
      }
    >
      <div style={{ padding: '20px' }}>
        {showEducationContent ? (
          <EditGasDisplayEducation />
        ) : (
          <EditGasDisplay
            {...editGasDisplayProps}
            onEducationClick={() => setShowEducationContent(true)}
          />
        )}
      </div>
    </Popover>
  );
}

EditGasPopover.propTypes = {
  popoverTitle: PropTypes.string,
  editGasDisplayProps: PropTypes.object,
  confirmButtonText: PropTypes.string,
  showEducationButton: PropTypes.bool,
};

EditGasPopover.defaultProps = {
  popoverTitle: '',
  editGasDisplayProps: {},
  confirmButtonText: '',
  showEducationButton: false,
};
