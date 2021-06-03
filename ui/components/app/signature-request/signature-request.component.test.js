import React from 'react';
import { shallowWithContext } from '../../../../test/lib/render-helpers';
import SignatureRequest from './signature-request.component';

describe('Signature Request Component', () => {
  describe('render', () => {
    const fromAddress = '0x123456789abcdef';
    it('should render a div with one child', () => {
      const wrapper = shallowWithContext(
        <SignatureRequest
          clearConfirmTransaction={() => undefined}
          cancel={() => undefined}
          sign={() => undefined}
          txData={{
            msgParams: {
              data: '{"message": {"from": {"name": "hello"}}}',
              from: fromAddress,
            },
          }}
          fromAccount={{ address: fromAddress }}
        />,
      );

      expect(wrapper.is('div')).toStrictEqual(true);
      expect(wrapper).toHaveLength(1);
      expect(wrapper.hasClass('signature-request')).toStrictEqual(true);
    });
  });
});
