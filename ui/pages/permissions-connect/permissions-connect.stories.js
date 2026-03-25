import React from 'react';
import { Box } from '../../components/component-library';
import { PermissionPageContainerContent } from '../../components/app/permission-page-container';
import PermissionsConnectFooter from '../../components/app/permissions-connect-footer';
import { PageContainerFooter } from '../../components/ui/page-container';
import { BackgroundColor } from '../../helpers/constants/design-system';

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
        backgroundColor={BackgroundColor.backgroundAlternative}
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
