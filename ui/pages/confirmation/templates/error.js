import { IconName, IconSize } from '../../../components/component-library';
import {
  FontWeight,
  TextAlign,
  BlockSize,
  AlignItems,
  FlexDirection,
  JustifyContent,
  TypographyVariant,
  IconColor,
  BackgroundColor,
} from '../../../helpers/constants/design-system';
import { processError, processHeader } from '../util';

function getValues(pendingApproval, t, actions, _history) {
  return {
    content: [
      ...(processHeader(pendingApproval.requestData.header) ?? []),
      {
        key: 'container',
        element: 'Box',
        props: {
          flexDirection: FlexDirection.Column,
          alignItems: AlignItems.center,
          height: BlockSize.Full,
          padding: 4,
        },
        children: [
          {
            key: 'content',
            element: 'Box',
            props: {
              flexDirection: FlexDirection.Column,
              alignItems: AlignItems.center,
              justifyContent: JustifyContent.center,
              height: BlockSize.Full,
              paddingTop: 2,
              paddingBottom: 2,
            },
            children: [
              {
                key: 'icon',
                element: 'AvatarIcon',
                props: {
                  iconName: IconName.Warning,
                  size: IconSize.Xl,
                  iconProps: { size: IconSize.Xl },
                  color: IconColor.errorDefault,
                  backgroundColor: BackgroundColor.errorMuted,
                },
                children: 'Icon',
              },
              {
                key: 'heading',
                element: 'Typography',
                props: {
                  variant: TypographyVariant.H3,
                  fontWeight: FontWeight.Bold,
                  paddingBottom: 2,
                },
                children: t('resultPageError'),
              },
              {
                key: 'message',
                element: 'Box',
                props: {
                  alignItems: AlignItems.center,
                  textAlign: TextAlign.Center,
                  gap: 1,
                },
                children: processError(
                  pendingApproval.requestData.error,
                  t('resultPageErrorDefaultMessage'),
                ),
              },
            ],
          },
        ],
      },
    ],
    submitText: t('ok'),
    onSubmit: () =>
      actions.resolvePendingApproval(
        pendingApproval.id,
        pendingApproval.requestData,
      ),
    networkDisplay: false,
  };
}

const error = {
  getValues,
};

export default error;
