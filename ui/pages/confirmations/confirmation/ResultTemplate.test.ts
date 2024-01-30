import { ApprovalType } from '@metamask/controller-utils';
import { ApprovalRequest } from '@metamask/approval-controller';
import { isArray } from 'lodash';
import {
  BackgroundColor,
  IconColor,
} from '../../../helpers/constants/design-system';
import { IconName } from '../../../components/component-library';
import { ResultTemplate, ResultTemplateActions } from './ResultTemplate';
import { TemplateRendererComponent } from './util';

const PENDING_APPROVAL_MOCK = {
  id: 'testApprovalId',
  requestData: { testProperty: 'testValue' },
} as ApprovalRequest<any>;

const T_MOCK = () => 'TestLabel';

function flattenContent(
  content:
    | undefined
    | string
    | TemplateRendererComponent
    | (string | TemplateRendererComponent | undefined)[],
): (string | TemplateRendererComponent)[] {
  if (content === undefined) {
    return [];
  }

  if (typeof content === 'string') {
    return [content];
  }

  if (isArray(content)) {
    return content.map((t) => flattenContent(t)).flat();
  }

  return [content, ...flattenContent(content.children)];
}

function expectContentToHaveKey(
  content: (string | TemplateRendererComponent | undefined)[],
  key: string,
  expected: boolean,
) {
  expect(
    flattenContent(content).some(
      (t) => (t as TemplateRendererComponent).key === key,
    ),
  ).toBe(expected);
}

describe('ResultTemplate', () => {
  let actionsMock: jest.Mocked<ResultTemplateActions>;

  beforeEach(() => {
    actionsMock = {
      resolvePendingApproval: jest.fn(),
    };
  });

  describe('getValues', () => {
    it('returns submitText', () => {
      const template = new ResultTemplate(ApprovalType.ResultSuccess);

      expect(
        template.getValues(PENDING_APPROVAL_MOCK, T_MOCK, actionsMock)
          .submitText,
      ).toEqual(expect.any(String));
    });

    it('returns disabled networkDisplay', () => {
      const template = new ResultTemplate(ApprovalType.ResultSuccess);

      expect(
        template.getValues(PENDING_APPROVAL_MOCK, T_MOCK, actionsMock)
          .networkDisplay,
      ).toBe(false);
    });

    it('returns onSubmit that resolves pending approval', () => {
      const template = new ResultTemplate(ApprovalType.ResultSuccess);

      template.getValues(PENDING_APPROVAL_MOCK, T_MOCK, actionsMock).onSubmit();

      expect(actionsMock.resolvePendingApproval).toHaveBeenCalledTimes(1);
      expect(actionsMock.resolvePendingApproval).toHaveBeenCalledWith(
        PENDING_APPROVAL_MOCK.id,
        PENDING_APPROVAL_MOCK.requestData,
      );
    });

    describe('returns content', () => {
      it('with multiple templates', () => {
        const template = new ResultTemplate(ApprovalType.ResultSuccess);

        const { content } = template.getValues(
          PENDING_APPROVAL_MOCK,
          T_MOCK,
          actionsMock,
        );

        expect(content).toEqual(expect.any(Array));
        expect(content.length).toBeGreaterThan(0);
      });

      it('with templates if no request data', () => {
        const template = new ResultTemplate(ApprovalType.ResultSuccess);

        const { content } = template.getValues(
          { ...PENDING_APPROVAL_MOCK, requestData: undefined },
          T_MOCK,
          actionsMock,
        );

        expect(content).toEqual(expect.any(Array));
        expect(content.length).toBeGreaterThan(0);
      });

      it('with icon by default', () => {
        const template = new ResultTemplate(ApprovalType.ResultSuccess);

        const { content } = template.getValues(
          PENDING_APPROVAL_MOCK,
          T_MOCK,
          actionsMock,
        );

        expectContentToHaveKey(content, 'icon', true);
      });

      it('with title by default', () => {
        const template = new ResultTemplate(ApprovalType.ResultSuccess);

        const { content } = template.getValues(
          PENDING_APPROVAL_MOCK,
          T_MOCK,
          actionsMock,
        );

        expectContentToHaveKey(content, 'title', true);
      });

      it('with no title if disabled', () => {
        const template = new ResultTemplate(ApprovalType.ResultSuccess);

        const { content } = template.getValues(
          {
            ...PENDING_APPROVAL_MOCK,
            requestData: { ...PENDING_APPROVAL_MOCK.requestData, title: null },
          },
          T_MOCK,
          actionsMock,
        );

        expectContentToHaveKey(content, 'title', false);
      });

      it('with no icon if disabled', () => {
        const template = new ResultTemplate(ApprovalType.ResultSuccess);

        const { content } = template.getValues(
          {
            ...PENDING_APPROVAL_MOCK,
            requestData: { ...PENDING_APPROVAL_MOCK.requestData, icon: null },
          },
          T_MOCK,
          actionsMock,
        );

        expectContentToHaveKey(content, 'icon', false);
      });

      it('with success icon if approval type is success', () => {
        const template = new ResultTemplate(ApprovalType.ResultSuccess);

        const { content } = template.getValues(
          PENDING_APPROVAL_MOCK,
          T_MOCK,
          actionsMock,
        );

        expect(
          flattenContent(content).some(
            (t: any) =>
              t.key === 'icon' &&
              t.props.iconName === IconName.Confirmation &&
              t.props.color === IconColor.successDefault &&
              t.props.backgroundColor === BackgroundColor.successMuted,
          ),
        ).toBe(true);
      });

      it('with error icon if approval type is error', () => {
        const template = new ResultTemplate(ApprovalType.ResultError);

        const { content } = template.getValues(
          PENDING_APPROVAL_MOCK,
          T_MOCK,
          actionsMock,
        );

        expect(
          flattenContent(content).some(
            (t: any) =>
              t.key === 'icon' &&
              t.props.iconName === IconName.Warning &&
              t.props.color === IconColor.errorDefault &&
              t.props.backgroundColor === BackgroundColor.errorMuted,
          ),
        ).toBe(true);
      });
    });
  });
});
