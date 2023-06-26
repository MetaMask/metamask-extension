import { mapToTemplate } from '../../../../../components/app/snaps/snap-ui-renderer';
import { DelineatorType } from '../../../../../helpers/constants/snaps';

function getValues(pendingApproval) {
  const {
    snapName,
    snapId,
    interfaceId,
    requestState: { content, state },
  } = pendingApproval;
  const elementKeyIndex = { value: 0 };

  return {
    content: [
      {
        element: 'Box',
        key: 'snap-interface-content-wrapper',
        props: {
          marginLeft: 4,
          marginRight: 4,
        },
        children: {
          element: 'SnapDelineator',
          key: 'snap-delineator',
          props: {
            type: DelineatorType.Content,
            snapName,
          },
          // TODO: Replace with SnapUIRenderer when we don't need to inject the input manually.
          children: mapToTemplate({
            element: content,
            elementKeyIndex,
            interfaceId,
            snapId,
            state,
          }),
        },
      },
    ],
  };
}

const snapAlert = {
  getValues,
};

export default snapAlert;
