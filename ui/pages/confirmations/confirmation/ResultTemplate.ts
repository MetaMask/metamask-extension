import { ApprovalType } from '@metamask/controller-utils';
import {
  ApprovalRequest,
  ErrorOptions,
  SuccessOptions,
} from '@metamask/approval-controller';
import { IconName, IconSize } from '../../../components/component-library';
import {
  FontWeight,
  BlockSize,
  AlignItems,
  FlexDirection,
  JustifyContent,
  TypographyVariant,
  TextAlign,
  IconColor,
  BackgroundColor,
} from '../../../helpers/constants/design-system';
import { resolvePendingApproval } from '../../../store/actions';
import {
  processError,
  processHeader,
  processString,
  TemplateRendererComponent,
} from './util';

export type ResultTemplateActions = {
  resolvePendingApproval: typeof resolvePendingApproval;
};

export type ResultType = ApprovalType.ResultSuccess | ApprovalType.ResultError;

export class ResultTemplate {
  #type: ResultType;

  constructor(type: ResultType) {
    this.#type = type;
  }

  getValues(
    pendingApproval: ApprovalRequest<any>,
    t: (key: string) => string,
    actions: any,
  ) {
    const content = this.#getContent(pendingApproval.requestData || {}, t);

    return {
      content,
      submitText: t('ok'),
      onSubmit: () =>
        actions.resolvePendingApproval(
          pendingApproval.id,
          pendingApproval.requestData,
        ),
      networkDisplay: false,
    };
  }

  #getContent(
    requestData: SuccessOptions | ErrorOptions,
    t: any,
  ): (undefined | string | TemplateRendererComponent)[] {
    const { error, header, icon, message, title } = requestData as any;
    const isSuccess = this.#type === ApprovalType.ResultSuccess;

    return [
      ...(processHeader(header) ?? []),
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
              style: {
                alignSelf: AlignItems.stretch,
              },
            },
            children: [
              icon === null
                ? undefined
                : {
                    key: 'icon',
                    element: 'AvatarIcon',
                    props: {
                      iconName:
                        icon ??
                        (isSuccess ? IconName.Confirmation : IconName.Warning),
                      size: IconSize.Xl,
                      iconProps: { size: IconSize.Xl },
                      color: isSuccess
                        ? IconColor.successDefault
                        : IconColor.errorDefault,
                      backgroundColor: isSuccess
                        ? BackgroundColor.successMuted
                        : BackgroundColor.errorMuted,
                    },
                    children: 'Icon',
                  },
              title === null
                ? undefined
                : {
                    key: 'title',
                    element: 'Typography',
                    props: {
                      variant: TypographyVariant.H3,
                      fontWeight: FontWeight.Bold,
                    },
                    children:
                      title ??
                      (isSuccess
                        ? t('resultPageSuccess')
                        : t('resultPageError')),
                  },
              {
                key: 'message',
                element: 'Box',
                props: {
                  alignItems: AlignItems.center,
                  textAlign: TextAlign.Center,
                  flexDirection: FlexDirection.Column,
                  width: BlockSize.Full,
                },
                children: isSuccess
                  ? processString(message, t('resultPageSuccessDefaultMessage'))
                  : processError(error, t('resultPageErrorDefaultMessage')),
              },
            ],
          },
        ],
      },
    ];
  }
}
