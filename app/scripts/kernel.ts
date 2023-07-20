import { Far } from '@endo/far';
import { i } from '@storybook/preview-api/dist/hooks-55c56a89';

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
  request: (descriptors: { [key: string]: IMethodDescriptor } ) => Promise<any>;
  registerRestrictedObject: (object: IRestrictedObject) => void;
}

export function createKernel (options = {}) {

  const bootstrap: IBootstrap = {
    async request (descriptors) {
      const matchedObjects = Object.keys(descriptors)
      .map((descriptor: string) => {
        return getRestrictedObjectsForDescriptor(restrictedObjects, descriptor, descriptors[descriptor]);
      })

      const approved = confirm(`The site would like access to the following objects: `)
      if (!approved) {
        throw new Error('User rejected request');
      }
      return matchedObjects;
    },
    async registerRestrictedObject (restricted: IRestrictedObject) {
      const approved = confirm(`Would you like to add a method to your wallet?: ${JSON.stringify(restricted.description)}`);
      if (!approved) {
        throw new Error('User rejected request');
      }

      let petName;
      let promptText = 'What would you like to name it?'
      while (!petName) {
        const petName = prompt(promptText);
        if (!petName || petName === '') {
          throw new Error('Must provide a name.');
        }

        // Check if it exists already:
        const existing = namesToObjects.get(petName);
        if (existing) {
          promptText = `That name is already taken. Are you sure?`
          const sure = confirm(promptText);
          if (sure) {
            register(petName, restricted);
          }
          promptText = `What would you like to name it?`
        }

        register(petName, restricted);
      }
    },
  }

  return Far('metamask-bootstrap', bootstrap);
}

function register (petName: string, object: IRestrictedObject) {
  restrictedObjects.add(object);
  objectsToNames.set(object, petName);
  namesToObjects.set(petName, object);
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
