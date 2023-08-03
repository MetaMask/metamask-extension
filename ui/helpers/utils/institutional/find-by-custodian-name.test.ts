import { CUSTODIAN_WEBSITES } from '../../../../shared/constants/institutional/custodian-websites';
import { findCustodianByDisplayName } from './find-by-custodian-name';

describe('findCustodianByDisplayName', () => {
  it('should return the custodian if the display name is found in custodianKey', () => {
    const displayName = 'Qredo';
    const custodian = findCustodianByDisplayName(displayName);
    expect(custodian).toBe(CUSTODIAN_WEBSITES.QREDO);
  });

  it('should return the custodian if the display name is found in custodianDisplayName', () => {
    const displayName = 'Saturn Custody';
    const custodian = findCustodianByDisplayName(displayName);
    expect(custodian).toBe(CUSTODIAN_WEBSITES.SATURN);
  });

  it('should return null if no matching custodian is found', () => {
    const displayName = 'Non-existent Custodian';
    const custodian = findCustodianByDisplayName(displayName);
    expect(custodian).toBeNull();
  });
});
