import * as tests from '../../tests/signature-request.spec';
import { installTestKeyringSnap } from './helper';

tests.signatureTests('Snap Simple Keyring', installTestKeyringSnap);
