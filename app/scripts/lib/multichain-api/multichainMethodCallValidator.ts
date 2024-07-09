import { MultiChainOpenRPCDocument } from '@metamask/api-specs';
import { rpcErrors } from '@metamask/rpc-errors';
import { ContentDescriptorObject, MethodObject, OpenrpcDocument } from '@open-rpc/meta-schema';
import dereferenceDocument from '@open-rpc/schema-utils-js/build/dereference-document';
import { makeCustomResolver } from '@open-rpc/schema-utils-js/build/parse-open-rpc-document';
import {ValidationError, Validator} from 'jsonschema'


const transformError = (error: ValidationError, param: ContentDescriptorObject, got: any) => {
  // if there is a path, add it to the message
  const message = param.name
    + (error.path.length > 0 ? "." + error.path.join('.') : "")
    + " " + error.message;

  return {
    code: -32602, // TODO: could be a different error code or not wrapped in json-rpc error, since this will also be wrapped in a -32602 invalid params error
    message,
    data: {
      param: param.name,
      path: error.path,
      schema: error.schema,
      got,
    }
  }
}

var v = new Validator();

const dereffedPromise = dereferenceDocument(MultiChainOpenRPCDocument as any, makeCustomResolver({}));
export const multichainMethodCallValidator = async (method: string, params: any) => {
  const dereffed = await dereffedPromise;
  const methodToCheck = dereffed.methods.find((m) => (m as unknown as ContentDescriptorObject).name === method);
  const errors: any = [];
  // check each param and aggregate errors
  (methodToCheck as unknown as MethodObject).params.forEach((param, i) => {
    let paramToCheck = params;
    const p = param as ContentDescriptorObject;
    if ((methodToCheck as MethodObject).paramStructure !== 'by-name' && Array.isArray(params)) {
      paramToCheck = params[i];
    }
    paramToCheck = params[p.name];
    const result = v.validate(paramToCheck, p.schema, {required: true});

    if (result.errors) {
      errors.push(...result.errors.map((e) => {
        return transformError(e, p, paramToCheck);
      }));
    }
  });
  if (errors.length > 0) {
    return errors;
  }
  // feels like this should return true to indicate that its valid but i'd rather check the falsy value since errors
  // would be an array and return true if it's empty
  return false;
}

export async function multichainMethodCallValidatorMiddleware(
  request: any,
  _response: any,
  next: any,
  end: any,
) {
  const errors = await multichainMethodCallValidator(request.method, request.params);

  if (errors) {
    return end(rpcErrors.invalidParams<any>({ data: errors }));
  }
  next();
}
