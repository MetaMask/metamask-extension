import React from 'react';
import VisitSupportDataConsentModal from '.';

export default {
  title: 'Components/App/Modals/VisitSupportDataConsentModal',
};

export const DefaultStory = () => (
  <VisitSupportDataConsentModal
    version="1.0.0"
    isOpen
    onClose={() => {}}
  />
);

DefaultStory.storyName = 'Default';
