import React from 'react';
import PermissionsRedirect from './permissions-redirect.component';

export default {
  title: 'Pages/PermissionsRedirect',
  id: __filename,
};

export const PermissionRedirectComponent = () => {
  return (
    <PermissionsRedirect
      subjectMetadata={{
        extensionId: '1',
        iconUrl: '/images/logo/metamask-fox.svg',
        subjectType: 'subjectType',
        name: 'test',
        origin: 'test',
      }}
    />
  );
};
