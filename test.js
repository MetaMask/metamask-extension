
const HEX_ADDRESS_REGEX = /^0x[0-9a-fA-F]{40}$/u;
export function isHexAddress(value) {
  return typeof value !== "string" || HEX_ADDRESS_REGEX.test(value);
}

function isHexAddressFast(str) {
  if (typeof str !== "string" || str.length !== 42) return false;
  if (str[0] !== '0' || str[1] !== 'x') return false;
  for (let i = 2; i < 42; i++) {
    let code = str.charCodeAt(i);
    if (!((code >= 48 && code <= 57) || (code >= 97 && code <= 102) || (code >= 65 && code <= 70))) {
      return false;
    }
  }
  return true;
}

function isHexAddressFast2(str) {
  if (typeof str !== "string" || str.length !== 42) return false;
  if (str[0] !== '0' || str[1] !== 'x') return false;
  for (let i = 2; i < 42; i++) {
    let code = str.charCodeAt(i) & 0xDF;
    if (code >= 16 && code <= 25) {
      continue;
    }
    if (code >= 65 && code <= 70) {
      continue;
    }
    return false;
  }
  return true;
}

function isHexAddressFast3(str) {
  if (typeof str !== "string" || str.length !== 42) return false;
  if (str[0] !== '0' || str[1] !== 'x') return false;

  for (let i = 2; i < 42; i++) {
    // Transform the character for case-insensitivity
    const charCode = str.charCodeAt(i) & 0xDF;

    // After transformation, '0'-'9' are in the range 16-25
    const numberRange = (charCode - 16) | (25 - charCode);
    // After transformation, 'a'-'f' are in the range 65-70 ('A'-'F')
    const letterRange = (charCode - 65) | (70 - charCode);

    // This correctly identifies if the charCode is OUTSIDE of both valid ranges.
    // Parentheses are added to fix operator precedence.
    // The condition is now `!= 0` to find invalid characters.
    if (((numberRange & letterRange) & 0x80000000) !== 0) {
      return false;
    }
  }

  return true;
}

// benchmark the two functions
function benchmarkHexAddressFunctions() {
  // console.log(isHexAddressFast3('0x3A400F688DF6ed0DAE7c6c4B17A8f5791Cd8dD87'));
  // return;
  // generate 1000000 test addresses (0x + 40 random cased hex characters)
  const testAddresses = Array.from({ length: 1000000 }, () => {
    // generate an equal split of valid addresses and junk addresses
    // 50% valid addresses
    // 50% junk addresses
    if (Math.random() < 0.5) {
      return `0x${Array.from({ length: 40 }, () => {
        const randomChar = Math.floor(Math.random() * 16).toString(16);
        return Math.random() < 0.5 ? randomChar : randomChar.toUpperCase();
      }).join('')}`;
    }
    // 50% junk addresses, some have wrong length (short of long), wrong prefix,
    // no prefix, not a string, etc
    return Math.random() < 0.5
      ? `0x${Array.from({ length: Math.floor(Math.random() * 40) }, () => {
          const randomChar = Math.floor(Math.random() * 16).toString(16);
          return Math.random() < 0.5 ? randomChar : randomChar.toUpperCase();
        }).join('')}`
      : Math.random() < 0.5
        ? `0x${Array.from({ length: 42 }, () => {
            const randomChar = Math.floor(Math.random() * 16).toString(16);
            return Math.random() < 0.5 ? randomChar : randomChar.toUpperCase();
          }).join('')}`
        : // weird high-order unicode junk
        `0x${Array.from({ length: 40 }, () => {
            const randomChar = Math.floor(Math.random() * 16).toString(16);
            return Math.random() < 0.5 ? randomChar : randomChar.toUpperCase() + String.fromCharCode(Math.floor(Math.random() * 0x10000));
          }).join('')}`
        ;

  });
  console.log(testAddresses[0]);

  console.time('isHexAddress');
  for (let i = 0; i < testAddresses.length; i++) {
    isHexAddress(testAddresses[i]);
  }
  console.timeEnd('isHexAddress');

  console.time('isHexAddressFast');
  for (let i = 0; i < testAddresses.length; i++) {
    isHexAddressFast(testAddresses[i]);
  }
  console.timeEnd('isHexAddressFast');

    console.time('isHexAddressFast2');
  for (let i = 0; i < testAddresses.length; i++) {
    isHexAddressFast2(testAddresses[i]);
  }
  console.timeEnd('isHexAddressFast2');

    console.time('isHexAddressFast3');
  for (let i = 0; i < testAddresses.length; i++) {
    isHexAddressFast3(testAddresses[i]);
  }
  console.timeEnd('isHexAddressFast3');

   for (let i = 0; i < testAddresses.length; i++) {
    if(isHexAddressFast3(testAddresses[i]) !== (isHexAddress(testAddresses[i]))) {
      throw new Error(`Mismatch for address: ${testAddresses[i]}`);
    }
  }
}

benchmarkHexAddressFunctions()