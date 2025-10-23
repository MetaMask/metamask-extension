import { Messenger } from '@metamask/messenger';
import { getSubjectMetadataControllerMessenger } from './subject-metadata-controller-messenger';
import { getRootMessenger } from '.';

describe('getSubjectMetadataControllerMessenger', () => {
  it('returns a restricted messenger', () => {
    const messenger = getRootMessenger<never, never>();
    const SubjectMetadataControllerMessenger =
      getSubjectMetadataControllerMessenger(messenger);

    expect(SubjectMetadataControllerMessenger).toBeInstanceOf(Messenger);
  });
});
