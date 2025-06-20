import { GitHub } from '@actions/github/lib/utils';

import { Label, createOrRetrieveLabel } from './label';

export enum LabelableType {
  Issue,
  PullRequest,
}

// A labelable object can be a pull request or an issue
export interface Labelable {
  id: string;
  type: LabelableType;
  number: number;
  repoOwner: string;
  repoName: string;
  createdAt: string;
  body: string;
  author: string;
  labels: {
    id: string;
    name: string;
  }[];
}

// This function tries to find a label on a labelable object (i.e. a pull request or an issue) if present
export function findLabel(
  labelable: Labelable,
  labelToFind: Label,
):
  | {
      id: string;
      name: string;
    }
  | undefined {
  // Check if label is present on labelable
  return labelable.labels.find((label) => label.name === labelToFind.name);
}

// This function adds label to a labelable object (i.e. a pull request or an issue)
export async function addLabelToLabelable(
  octokit: InstanceType<typeof GitHub>,
  labelable: Labelable,
  label: Label,
): Promise<void> {
  // Retrieve label from the labelable's repo, or create label if required
  const labelId = await createOrRetrieveLabel(
    octokit,
    labelable?.repoOwner,
    labelable?.repoName,
    label,
  );

  await addLabelByIdToLabelable(octokit, labelable, labelId);
}

// This function adds label by id to a labelable object (i.e. a pull request or an issue)
export async function addLabelByIdToLabelable(
  octokit: InstanceType<typeof GitHub>,
  labelable: Labelable,
  labelId: string,
): Promise<void> {
  const addLabelsToLabelableMutation = `
      mutation AddLabelsToLabelable($labelableId: ID!, $labelIds: [ID!]!) {
        addLabelsToLabelable(input: {labelableId: $labelableId, labelIds: $labelIds}) {
          clientMutationId
        }
      }
    `;

  await octokit.graphql(addLabelsToLabelableMutation, {
    labelableId: labelable?.id,
    labelIds: [labelId],
  });
}

// This function removes a label from a labelable object (i.e. a pull request or an issue)
export async function removeLabelFromLabelable(
  octokit: InstanceType<typeof GitHub>,
  labelable: Labelable,
  labelId: string,
): Promise<void> {
  const removeLabelsFromLabelableMutation = `
      mutation RemoveLabelsFromLabelable($labelableId: ID!, $labelIds: [ID!]!) {
        removeLabelsFromLabelable(input: {labelableId: $labelableId, labelIds: $labelIds}) {
          clientMutationId
        }
      }
    `;

  await octokit.graphql(removeLabelsFromLabelableMutation, {
    labelableId: labelable?.id,
    labelIds: [labelId],
  });
}

// This function removes a label from a labelable object (i.e. a pull request or an issue) if present
export async function removeLabelFromLabelableIfPresent(
  octokit: InstanceType<typeof GitHub>,
  labelable: Labelable,
  labelToRemove: Label,
): Promise<void> {
  // Check if label is present on labelable
  const labelFound = findLabel(labelable, labelToRemove);

  if (labelFound?.id) {
    // Remove label from labelable
    await removeLabelFromLabelable(octokit, labelable, labelFound?.id);
  }
}
