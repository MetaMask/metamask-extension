import React from 'react';
import { Box, BoxBackgroundColor } from '@metamask/design-system-react';
import PermissionPageContainerContent from '../../components/app/permission-page-container/permission-page-container-content/permission-page-container-content.component';
import PermissionsConnectFooter from '../../components/app/permissions-connect-footer/permissions-connect-footer.component';
import PageContainerFooter from '../../components/ui/page-container/page-container-footer/page-container-footer.component';

export default {
  title: 'Pages/PermissionsConnect',
};

export const PermissionPageContainerComponent = () => {
  return (
    <div className="page-container permission-approval-container">
      <PermissionPageContainerContent
        subjectMetadata={{
          extensionId: '1',
          iconUrl: './gnosis.svg',
          name: 'Gnosis - Manage Digital Assets',
          origin: 'https://gnosis-safe.io',
        }}
        selectedPermissions={{
          eth_accounts: true,
        }}
      />
      <Box
        className="permission-approval-container__footers"
        backgroundColor={BoxBackgroundColor.BackgroundAlternative}
      >
        <PermissionsConnectFooter />
        <PageContainerFooter
          cancelButtonType="default"
          onSubmit={() => {
            /* no-op */
          }}
          submitText="connect"
        />
      </Box>
    </div>
  );
};
