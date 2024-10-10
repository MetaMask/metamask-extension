import { MultiChainOpenRPCDocument } from '@metamask/api-specs';
import { rpcErrors } from '@metamask/rpc-errors';
import {
  JsonRpcError,
  JsonRpcParams,
  JsonRpcRequest,
  isObject,
} from '@metamask/utils';
import {
  ContentDescriptorObject,
  MethodObject,
  OpenrpcDocument,
} from '@open-rpc/meta-schema';
import dereferenceDocument from '@open-rpc/schema-utils-js/build/dereference-document';
import { makeCustomResolver } from '@open-rpc/schema-utils-js/build/parse-open-rpc-document';
import { Json, JsonRpcMiddleware } from 'json-rpc-engine';
import { Schema, ValidationError, Validator } from 'jsonschema';

const transformError = (
  error: ValidationError,
  param: ContentDescriptorObject,
  got: unknown,
) => {
  // if there is a path, add it to the message
  const message = `${
    param.name + (error.path.length > 0 ? `.${error.path.join('.')}` : '')
  } ${error.message}`;

  return {
    code: -32602, // TODO: could be a different error code or not wrapped in json-rpc error, since this will also be wrapped in a -32602 invalid params error
    message,
    data: {
      param: param.name,
      path: error.path,
      schema: error.schema,
      got,
    },
  };
};

const v = new Validator();

const dereffedPromise = dereferenceDocument(
  MultiChainOpenRPCDocument as unknown as OpenrpcDocument,
  makeCustomResolver({}),
);
export const multichainMethodCallValidator = async (
  method: string,
  params: JsonRpcParams | undefined,
) => {
  const dereffed = await dereffedPromise;
  const methodToCheck = dereffed.methods.find(
    (m) => (m as unknown as ContentDescriptorObject).name === method,
  );
  const errors: JsonRpcError[] = [];
  // check each param and aggregate errors
  (methodToCheck as unknown as MethodObject).params.forEach((param, i) => {
    let paramToCheck: Json | undefined;
    const p = param as ContentDescriptorObject;
    if (isObject(params)) {
      paramToCheck = params[p.name];
    } else if (params && Array.isArray(params)) {
      paramToCheck = params[i];
    } else {
      paramToCheck = undefined;
    }
    const result = v.validate(paramToCheck, p.schema as unknown as Schema, {
      required: p.required,
    });
    if (result.errors) {
      errors.push(
        ...result.errors.map((e) => {
          return transformError(e, p, paramToCheck) as JsonRpcError;
        }),
      );
    }
  });
  if (errors.length > 0) {
    return errors;
  }
  // feels like this should return true to indicate that its valid but i'd rather check the falsy value since errors
  // would be an array and return true if it's empty
  return false;
};

export const multichainMethodCallValidatorMiddleware: JsonRpcMiddleware<
  JsonRpcRequest,
  void
> = function (request, _response, next, end) {
  multichainMethodCallValidator(request.method, request.params).then(
    (errors) => {
      if (errors) {
        return end(rpcErrors.invalidParams<JsonRpcError[]>({ data: errors }));
      }
      return next();
    },
  );
};
