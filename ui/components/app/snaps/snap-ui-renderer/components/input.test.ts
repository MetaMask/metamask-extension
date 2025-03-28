import { Box, Input } from '@metamask/snaps-sdk/jsx';
import { waitFor } from '@testing-library/react';
import { renderInterface } from '../test-utils';

describe('SnapUIInput', () => {
  it('re-focuses after re-render', async () => {
    const {
      container,
      getAllByRole,
      getByRole,
      updateInterface,
      getRenderCount,
    } = renderInterface(Box({ children: Input({ name: 'input' }) }));

    const input = getByRole('textbox');
    input.focus();
    expect(input).toHaveFocus();

    updateInterface(
      Box({ children: [Input({ name: 'input' }), Input({ name: 'input2' })] }),
    );

    const inputs = getAllByRole('textbox');
    expect(inputs).toHaveLength(2);

    await waitFor(() => expect(inputs[0]).toHaveFocus());

    expect(getRenderCount()).toBe(2);

    expect(container).toMatchSnapshot();
  });
});
