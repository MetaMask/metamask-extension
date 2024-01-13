import { ApprovalType } from '@metamask/controller-utils';
import { ResultTemplate } from '../ResultTemplate';

const template = new ResultTemplate(ApprovalType.ResultError);
const error = { getValues: template.getValues.bind(template) };

export default error;
