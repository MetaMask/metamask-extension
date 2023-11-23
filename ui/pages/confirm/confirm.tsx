import React from 'react';
import { ConfirmTitle } from '../../components/app/confirm/shared/title';
import { ConfirmInfo } from '../../components/app/confirm/shared/info';
import { ConfirmInfoSection } from '../../components/app/confirm/shared/info-section';
import { ConfirmInfoRow } from '../../components/app/confirm/shared/info/row';
import { ConfirmInfoRowAddress } from '../../components/app/confirm/shared/info/row/address';
import { ConfirmInfoRowValueDouble } from '../../components/app/confirm/shared/info/row/value-double';
import {
  Content,
  Footer,
  Header,
  Page,
} from '../../components/multichain/pages/page';
import { BackgroundColor } from '../../helpers/constants/design-system';

export default function ConfirmPage(): React.ReactElement {
  return (
    <Page backgroundColor={BackgroundColor.backgroundAlternative}>
      <Header>Header</Header>
      <Content>
        <ConfirmTitle title="One-line request title" subtitle="Test" />
        <ConfirmInfo>
          <ConfirmInfoSection>
            <ConfirmInfoRow label="Account">
              <ConfirmInfoRowAddress
                address={'0x5CfE73b6021E818B776b421B1c4Db2474086a7e1'}
              />
            </ConfirmInfoRow>
          </ConfirmInfoSection>
          <ConfirmInfoSection>
            <ConfirmInfoRow label="Account">
              <ConfirmInfoRowValueDouble left={'0.1 ETH'} right={'100 TEST'} />
            </ConfirmInfoRow>
            <ConfirmInfoRow label="Account">
              <ConfirmInfoRowValueDouble left={'0.1 ETH'} right={'100 TEST'} />
            </ConfirmInfoRow>
            <ConfirmInfoRow label="Account">
              <ConfirmInfoRowValueDouble left={'0.1 ETH'} right={'100 TEST'} />
            </ConfirmInfoRow>
          </ConfirmInfoSection>
          <ConfirmInfoSection>Test</ConfirmInfoSection>
        </ConfirmInfo>
      </Content>
      <Footer>Footer</Footer>
    </Page>
  );
}
