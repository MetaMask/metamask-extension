import React from 'react';
import VisitSupportDataConsentModal from './visit-support-data-consent-modal';

export default {
  title: 'Components/App/Modals/VisitSupportDataConsentModal',
};

export const DefaultStory = () => (
  <VisitSupportDataConsentModal isOpen onClose={() => {}} />
);

DefaultStory.storyName = 'Default';
