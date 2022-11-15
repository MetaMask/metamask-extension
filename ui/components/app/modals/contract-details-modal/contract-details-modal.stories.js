import React, { useState } from 'react';
import Button from '../../../ui/button';
import ContractDetailsModal from './contract-details-modal';

export default {
  title: 'Components/App/Modals/ContractDetailsModal',
  id: __filename,
  argTypes: {
    onClosePopover: {
      action: 'Close Contract Details',
    },
    onOpenPopover: {
      action: 'Open Contract Details',
    },
    tokenName: {
      control: {
        type: 'text',
      },
    },
    address: {
      control: {
        type: 'text',
      },
    },
  },
  args: {
    tokenName: 'DAI',
    address: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
  },
};

export const DefaultStory = (args) => {
  const [showContractDetails, setshowContractDetails] = useState(false);
  return (
    <>
      <Button
        onClick={() => {
          args.onOpenPopover();
          setshowContractDetails(true);
        }}
      >
        Verify contract details
      </Button>
      {showContractDetails && (
        <ContractDetailsModal
          onClose={() => {
            args.onClosePopover();
            setshowContractDetails(false);
          }}
          {...args}
        />
      )}
    </>
  );
};

DefaultStory.storyName = 'Default';
