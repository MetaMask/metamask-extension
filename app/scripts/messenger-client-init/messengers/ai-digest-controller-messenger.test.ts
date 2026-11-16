import { Messenger } from '@metamask/messenger';
import { getRootMessenger } from '../../lib/messenger';
import { getAiDigestControllerMessenger } from './ai-digest-controller-messenger';

describe('getAiDigestControllerMessenger', () => {
  it('returns a restricted messenger', () => {
    const messenger = getRootMessenger<never, never>();
    const aiDigestControllerMessenger =
      getAiDigestControllerMessenger(messenger);

    expect(aiDigestControllerMessenger).toBeInstanceOf(Messenger);
  });

  it('delegates no additional actions or events', () => {
    const messenger = getRootMessenger<never, never>();
    const delegateSpy = jest.spyOn(messenger, 'delegate');

    getAiDigestControllerMessenger(messenger);

    expect(delegateSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        actions: [],
        events: [],
      }),
    );
  });
});
