import { Far } from '@endo/far';

interface IMethodDescriptor {
  methodName: string;
  [key: string]: any;
}

type ISpecifier = (reqDesc: any, methodDesc: any) => boolean;
type IRestrictedObject = {
  description: IMethodDescriptor,
  object: any,
}

const restrictedObjects = new Set();
const specifiers: Map<string, ISpecifier> = new Map();
specifiers.set('methodName', (reqDesc, methodDesc) => {
  if (typeof reqDesc !== 'string' || typeof methodDesc !== 'string') {
    throw new Error('specifier for method name must be a string.');
  }
  return !!reqDesc && reqDesc === methodDesc;
})

const namesToObjects: Map<string, any> = new Map();
const objectsToNames = new WeakMap();

const greeter = {
  description: {
    methodName: 'greeter',
  },
  object: async (name: string) => {
    return "Hello, " + name;
  }
};
namesToObjects.set('default-greeter', greeter);
objectsToNames.set(greeter, 'default-greeter');

interface IBootstrap {
  request: (descriptors: IMethodDescriptor[]) => Promise<any>;
  registerRestrictedObject: (descriptor: IMethodDescriptor, objectToRestrict: any) => void;
  proposeAdditionalDescriptor: (descriptorId: IMethodDescriptor, compareFn: (restrictedDescriptor: IMethodDescriptor, descriptorRequest: IMethodDescriptor) => boolean) => void;
}

export function createKernel (options = {}) {

  const bootstrap: IBootstrap = {
    async request (descriptors) {
      const matchedObjects = Object.keys(descriptors)
      .map((descriptor) => {
        return getRestrictedObjectsForDescriptor(restrictedObjects, descriptor, descriptors[descriptor]);
      })

      const approved = prompt(`The site would like access to the following objects: `)
      if (!approved) {
        throw new Error('User rejected request');
      }
      return matchedObjects;
    },
    // registerRestrictedObject,
    // proposeAdditionalDescriptor,
  }

  return Far(bootstrap);
}

function getRestrictedObjectsForDescriptor (
  restrictedObjects: Set<any>,
  descriptor: string,
  description: IMethodDescriptor
) {
  const specifier = specifiers.get(descriptor);
  if (!specifier) {
    throw new Error(`Unable to provide specificity for descriptor ${descriptor} with description ${JSON.stringify(description)}`);
  }

  let matchedObjects = [];

  for (let object of restrictedObjects.values()) {
    if (specifier(description, object[descriptor])) {
      matchedObjects.push(object);
    }
  }

  return matchedObjects;
}

