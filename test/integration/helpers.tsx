import nock from 'nock';
import { act, fireEvent, screen, waitFor } from '@testing-library/react';

export const createMockImplementation = <T,>(requests: Record<string, T>) => {
  return (method: string): Promise<T | undefined> => {
    if (method in requests) {
      return Promise.resolve(requests[method]);
    }
    return Promise.resolve(undefined);
  };
};

export function mock4byte(hexSignature: string, textSignature?: string) {
  const mockEndpoint = nock('https://www.4byte.directory:443', {
    encodedQueryParams: true,
  })
    .persist()
    .get('/api/v1/signatures/')
    .query({ hex_signature: hexSignature })
    .reply(200, {
      results: [
        {
          id: 235447,
          created_at: '2021-09-14T02:07:09.805000Z',
          text_signature: textSignature ?? 'mintNFTs(uint256)',
          hex_signature: hexSignature,
          bytes_signature: ';K\u0013 ',
        },
      ],
    });
  return mockEndpoint;
}

/**
 * Clicks on an element identified by the given test ID.
 *
 * @param testId - The test ID of the element to be clicked.
 * @returns A promise that resolves when the click action is completed.
 */
export const clickElementById = async (testId: string) => {
  await act(async () => {
    fireEvent.click(await screen.findByTestId(testId));
  });
};

/**
 * Waits for an element with the specified test ID to be present in the document.
 *
 * @param testId - The test ID of the element to wait for.
 * @returns A promise that resolves when the element is found in the document.
 */
export const waitForElementById = async (testId: string) => {
  await waitFor(() => {
    expect(screen.getByTestId(testId)).toBeInTheDocument();
  });
};

/**
 * Changes the value of an input element identified by the given test ID.
 *
 * @param testId - The test ID of the input element to change.
 * @param value - The value to set for the input element.
 * @returns A promise that resolves when the change action is completed.
 */
export const changeInputValue = async (testId: string, value: string) => {
  await act(async () => {
    fireEvent.change(await screen.findByTestId(testId), { target: { value } });
  });
};

/**
 * Waits for an element with the specified text to be present in the document.
 *
 * @param text - The text content of the element to wait for.
 * @returns A promise that resolves when the element is found in the document.
 */
export const waitForElementByText = async (text: string) => {
  await waitFor(() => {
    expect(screen.getByText(text)).toBeInTheDocument();
  });
};

/**
 * Waits for an element with the specified text to not be present in the document.
 *
 * @param text - The text content of the element to wait for.
 * @returns A promise that resolves when the element is not found in the document.
 */
export const waitForElementByTextToNotBePresent = async (text: string) => {
  await waitFor(() => {
    expect(screen.queryByText(text)).not.toBeInTheDocument();
  });
};

/**
 * Clicks on an element identified by the given text.
 *
 * @param text - The text content of the element to be clicked.
 * @returns A promise that resolves when the click action is completed.
 */
export const clickElementByText = async (text: string) => {
  await act(async () => {
    fireEvent.click(await screen.findByText(text));
  });
};
