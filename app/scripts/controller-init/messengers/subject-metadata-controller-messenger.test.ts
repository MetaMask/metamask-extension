import { Messenger } from '@metamask/messenger';
import { getRootMessenger } from '../../lib/messenger';
import { getSubjectMetadataControllerMessenger } from './subject-metadata-controller-messenger';

describe('getSubjectMetadataControllerMessenger', () => {
  it('returns a restricted messenger', () => {
    const messenger = getRootMessenger<never, never>();
    const SubjectMetadataControllerMessenger =
      getSubjectMetadataControllerMessenger(messenger);

    expect(SubjectMetadataControllerMessenger).toBeInstanceOf(Messenger);
  });
});
