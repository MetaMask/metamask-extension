import { getSnapName as getSnapNameFromSubjectMetadata } from '../../../../../ui/helpers/utils/util';
import { SnapKeyringBuilderMessenger } from '../types';

export const getSnapName = (
  controllerMessenger: SnapKeyringBuilderMessenger,
  snapId: string,
): string => {
  const subjectMetadata = controllerMessenger.call(
    'SubjectMetadataController:getSubjectMetadata',
    snapId,
  );

  return getSnapNameFromSubjectMetadata(snapId, subjectMetadata);
};
