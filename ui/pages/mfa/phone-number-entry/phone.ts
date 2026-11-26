/**
 * Dependency-free phone number helpers for the phone entry screen: a small
 * country table, as-you-type formatting, pasted-number parsing and E.164
 * output. The table is deliberately partial; add a row to support a country.
 * Validation checks the national number's length (and the North American
 * numbering plan's area code and exchange rule), not whether a carrier has
 * issued the number.
 *
 * The country table and the logic match the mobile copy, which reuses the
 * Card and Ramp helpers for digits, templates and E.164 where this one is
 * self-contained; keep the two in sync.
 */

export type PhoneCountry = {
  /** ISO 3166-1 alpha-2 code. */
  iso: string;
  /** English name, matching the mobile table. */
  name: string;
  /** Calling code without the plus sign. */
  callingCode: string;
  /** Display template for the national number: `X` is a digit. */
  template: string;
  minDigits: number;
  maxDigits: number;
  /** Whether a leading 0 is a dial-out prefix to drop from the national number. */
  hasTrunkZero?: boolean;
  /**
   * North American territories share calling code `1`; these are the area
   * codes that belong to the country, and the national number includes one.
   */
  areaCodes?: readonly string[];
};

/** What `onSubmit` receives. */
export type PhoneNumberValue = {
  /** The full number in E.164 form, e.g. `+14155552671`. */
  e164: string;
  /** The ISO 3166-1 alpha-2 code of the selected country, e.g. `US`. */
  country: string;
  /** The national number's digits only, e.g. `4155552671`. */
  national: string;
};

const NANP_NUMBER = /^[2-9]\d{2}[2-9]\d{6}$/u;

const NANP_TEMPLATE = '(XXX) XXX-XXXX';

const DETAILED_COUNTRIES: readonly PhoneCountry[] = [
  {
    iso: 'US',
    name: 'United States of America',
    callingCode: '1',
    template: NANP_TEMPLATE,
    minDigits: 10,
    maxDigits: 10,
  },
  {
    iso: 'CA',
    name: 'Canada',
    callingCode: '1',
    template: NANP_TEMPLATE,
    minDigits: 10,
    maxDigits: 10,
  },
  {
    iso: 'GB',
    name: 'United Kingdom',
    callingCode: '44',
    template: 'XXXX XXXXXX',
    minDigits: 10,
    maxDigits: 10,
    hasTrunkZero: true,
  },
  {
    iso: 'IE',
    name: 'Ireland',
    callingCode: '353',
    template: 'XX XXX XXXX',
    minDigits: 7,
    maxDigits: 9,
    hasTrunkZero: true,
  },
  {
    iso: 'FR',
    name: 'France',
    callingCode: '33',
    template: 'X XX XX XX XX',
    minDigits: 9,
    maxDigits: 9,
    hasTrunkZero: true,
  },
  {
    iso: 'DE',
    name: 'Germany',
    callingCode: '49',
    template: 'XXX XXXXXXXX',
    minDigits: 10,
    maxDigits: 11,
    hasTrunkZero: true,
  },
  {
    iso: 'ES',
    name: 'Spain',
    callingCode: '34',
    template: 'XXX XX XX XX',
    minDigits: 9,
    maxDigits: 9,
  },
  {
    iso: 'IT',
    name: 'Italy',
    callingCode: '39',
    template: 'XXX XXX XXXX',
    minDigits: 9,
    maxDigits: 10,
  },
  {
    iso: 'PT',
    name: 'Portugal',
    callingCode: '351',
    template: 'XXX XXX XXX',
    minDigits: 9,
    maxDigits: 9,
  },
  {
    iso: 'NL',
    name: 'Netherlands',
    callingCode: '31',
    template: 'X XXXXXXXX',
    minDigits: 9,
    maxDigits: 9,
    hasTrunkZero: true,
  },
  {
    iso: 'BE',
    name: 'Belgium',
    callingCode: '32',
    template: 'XXX XX XX XX',
    minDigits: 8,
    maxDigits: 9,
    hasTrunkZero: true,
  },
  {
    iso: 'CH',
    name: 'Switzerland',
    callingCode: '41',
    template: 'XX XXX XX XX',
    minDigits: 9,
    maxDigits: 9,
    hasTrunkZero: true,
  },
  {
    iso: 'AT',
    name: 'Austria',
    callingCode: '43',
    template: 'XXX XXXXXXXXXX',
    minDigits: 10,
    maxDigits: 13,
    hasTrunkZero: true,
  },
  {
    iso: 'SE',
    name: 'Sweden',
    callingCode: '46',
    template: 'XX XXX XX XX',
    minDigits: 7,
    maxDigits: 9,
    hasTrunkZero: true,
  },
  {
    iso: 'NO',
    name: 'Norway',
    callingCode: '47',
    template: 'XXX XX XXX',
    minDigits: 8,
    maxDigits: 8,
  },
  {
    iso: 'DK',
    name: 'Denmark',
    callingCode: '45',
    template: 'XX XX XX XX',
    minDigits: 8,
    maxDigits: 8,
  },
  {
    iso: 'PL',
    name: 'Poland',
    callingCode: '48',
    template: 'XXX XXX XXX',
    minDigits: 9,
    maxDigits: 9,
  },
  {
    iso: 'TR',
    name: 'Türkiye',
    callingCode: '90',
    template: 'XXX XXX XX XX',
    minDigits: 10,
    maxDigits: 10,
    hasTrunkZero: true,
  },
  {
    iso: 'AE',
    name: 'United Arab Emirates',
    callingCode: '971',
    template: 'XX XXX XXXX',
    minDigits: 9,
    maxDigits: 9,
    hasTrunkZero: true,
  },
  {
    iso: 'IN',
    name: 'India',
    callingCode: '91',
    template: 'XXXXX XXXXX',
    minDigits: 10,
    maxDigits: 10,
    hasTrunkZero: true,
  },
  {
    iso: 'JP',
    name: 'Japan',
    callingCode: '81',
    template: 'XX XXXX XXXX',
    minDigits: 9,
    maxDigits: 10,
    hasTrunkZero: true,
  },
  {
    iso: 'KR',
    name: 'South Korea',
    callingCode: '82',
    template: 'XX XXXX XXXX',
    minDigits: 9,
    maxDigits: 10,
    hasTrunkZero: true,
  },
  {
    iso: 'SG',
    name: 'Singapore',
    callingCode: '65',
    template: 'XXXX XXXX',
    minDigits: 8,
    maxDigits: 8,
  },
  {
    iso: 'HK',
    name: 'Hong Kong',
    callingCode: '852',
    template: 'XXXX XXXX',
    minDigits: 8,
    maxDigits: 8,
  },
  {
    iso: 'PH',
    name: 'Philippines',
    callingCode: '63',
    template: 'XXX XXX XXXX',
    minDigits: 10,
    maxDigits: 10,
    hasTrunkZero: true,
  },
  {
    iso: 'AU',
    name: 'Australia',
    callingCode: '61',
    template: 'XXX XXX XXX',
    minDigits: 9,
    maxDigits: 9,
    hasTrunkZero: true,
  },
  {
    iso: 'NZ',
    name: 'New Zealand',
    callingCode: '64',
    template: 'XXX XXX XXXX',
    minDigits: 8,
    maxDigits: 10,
    hasTrunkZero: true,
  },
  {
    iso: 'ZA',
    name: 'South Africa',
    callingCode: '27',
    template: 'XX XXX XXXX',
    minDigits: 9,
    maxDigits: 9,
    hasTrunkZero: true,
  },
  {
    iso: 'NG',
    name: 'Nigeria',
    callingCode: '234',
    template: 'XXX XXX XXXX',
    minDigits: 10,
    maxDigits: 10,
    hasTrunkZero: true,
  },
  {
    iso: 'BR',
    name: 'Brazil',
    callingCode: '55',
    template: '(XX) XXXXX-XXXX',
    minDigits: 10,
    maxDigits: 11,
    hasTrunkZero: true,
  },
  {
    iso: 'MX',
    name: 'Mexico',
    callingCode: '52',
    template: 'XX XXXX XXXX',
    minDigits: 10,
    maxDigits: 10,
  },
  {
    iso: 'CO',
    name: 'Colombia',
    callingCode: '57',
    template: 'XXX XXX XXXX',
    minDigits: 10,
    maxDigits: 10,
  },
];

/**
 * The rest of the world: name and calling code, with a length check only.
 * North American territories (calling code `1` plus their area codes, comma
 * separated) are checked like the US; elsewhere the limit is E.164's 15 digits
 * in total.
 */
const OTHER_COUNTRIES: readonly (readonly [string, string, string])[] = [
  ['AF', 'Afghanistan', '93'],
  ['AL', 'Albania', '355'],
  ['DZ', 'Algeria', '213'],
  ['AS', 'American Samoa', '1684'],
  ['AD', 'Andorra', '376'],
  ['AO', 'Angola', '244'],
  ['AI', 'Anguilla', '1264'],
  ['AG', 'Antigua and Barbuda', '1268'],
  ['AR', 'Argentina', '54'],
  ['AM', 'Armenia', '374'],
  ['AW', 'Aruba', '297'],
  ['AZ', 'Azerbaijan', '994'],
  ['BS', 'Bahamas', '1242'],
  ['BH', 'Bahrain', '973'],
  ['BD', 'Bangladesh', '880'],
  ['BB', 'Barbados', '1246'],
  ['BY', 'Belarus', '375'],
  ['BZ', 'Belize', '501'],
  ['BJ', 'Benin', '229'],
  ['BM', 'Bermuda', '1441'],
  ['BT', 'Bhutan', '975'],
  ['BO', 'Bolivia', '591'],
  ['BA', 'Bosnia and Herzegovina', '387'],
  ['BW', 'Botswana', '267'],
  ['VG', 'British Virgin Islands', '1284'],
  ['BN', 'Brunei', '673'],
  ['BG', 'Bulgaria', '359'],
  ['BF', 'Burkina Faso', '226'],
  ['BI', 'Burundi', '257'],
  ['KH', 'Cambodia', '855'],
  ['CM', 'Cameroon', '237'],
  ['CV', 'Cape Verde', '238'],
  ['KY', 'Cayman Islands', '1345'],
  ['CF', 'Central African Republic', '236'],
  ['TD', 'Chad', '235'],
  ['CL', 'Chile', '56'],
  ['CN', 'China', '86'],
  ['KM', 'Comoros', '269'],
  ['CG', 'Congo', '242'],
  ['CD', 'Democratic Republic of the Congo', '243'],
  ['CK', 'Cook Islands', '682'],
  ['CR', 'Costa Rica', '506'],
  ['CI', 'Côte d’Ivoire', '225'],
  ['HR', 'Croatia', '385'],
  ['CU', 'Cuba', '53'],
  ['CW', 'Curaçao', '599'],
  ['CY', 'Cyprus', '357'],
  ['CZ', 'Czechia', '420'],
  ['DJ', 'Djibouti', '253'],
  ['DM', 'Dominica', '1767'],
  ['DO', 'Dominican Republic', '1809,1829,1849'],
  ['EC', 'Ecuador', '593'],
  ['EG', 'Egypt', '20'],
  ['SV', 'El Salvador', '503'],
  ['GQ', 'Equatorial Guinea', '240'],
  ['ER', 'Eritrea', '291'],
  ['EE', 'Estonia', '372'],
  ['SZ', 'Eswatini', '268'],
  ['ET', 'Ethiopia', '251'],
  ['FK', 'Falkland Islands', '500'],
  ['FO', 'Faroe Islands', '298'],
  ['FJ', 'Fiji', '679'],
  ['FI', 'Finland', '358'],
  ['GF', 'French Guiana', '594'],
  ['PF', 'French Polynesia', '689'],
  ['GA', 'Gabon', '241'],
  ['GM', 'Gambia', '220'],
  ['GE', 'Georgia', '995'],
  ['GH', 'Ghana', '233'],
  ['GI', 'Gibraltar', '350'],
  ['GR', 'Greece', '30'],
  ['GL', 'Greenland', '299'],
  ['GD', 'Grenada', '1473'],
  ['GP', 'Guadeloupe', '590'],
  ['GU', 'Guam', '1671'],
  ['GT', 'Guatemala', '502'],
  ['GN', 'Guinea', '224'],
  ['GW', 'Guinea-Bissau', '245'],
  ['GY', 'Guyana', '592'],
  ['HT', 'Haiti', '509'],
  ['HN', 'Honduras', '504'],
  ['HU', 'Hungary', '36'],
  ['IS', 'Iceland', '354'],
  ['ID', 'Indonesia', '62'],
  ['IQ', 'Iraq', '964'],
  ['IL', 'Israel', '972'],
  ['JM', 'Jamaica', '1876,1658'],
  ['JO', 'Jordan', '962'],
  ['RU', 'Russia', '7'],
  ['KZ', 'Kazakhstan', '7'],
  ['KE', 'Kenya', '254'],
  ['KI', 'Kiribati', '686'],
  ['XK', 'Kosovo', '383'],
  ['KW', 'Kuwait', '965'],
  ['KG', 'Kyrgyzstan', '996'],
  ['LA', 'Laos', '856'],
  ['LV', 'Latvia', '371'],
  ['LB', 'Lebanon', '961'],
  ['LS', 'Lesotho', '266'],
  ['LR', 'Liberia', '231'],
  ['LY', 'Libya', '218'],
  ['LI', 'Liechtenstein', '423'],
  ['LT', 'Lithuania', '370'],
  ['LU', 'Luxembourg', '352'],
  ['MO', 'Macao', '853'],
  ['MG', 'Madagascar', '261'],
  ['MW', 'Malawi', '265'],
  ['MY', 'Malaysia', '60'],
  ['MV', 'Maldives', '960'],
  ['ML', 'Mali', '223'],
  ['MT', 'Malta', '356'],
  ['MH', 'Marshall Islands', '692'],
  ['MQ', 'Martinique', '596'],
  ['MR', 'Mauritania', '222'],
  ['MU', 'Mauritius', '230'],
  ['RE', 'Réunion', '262'],
  ['YT', 'Mayotte', '262'],
  ['FM', 'Micronesia', '691'],
  ['MD', 'Moldova', '373'],
  ['MC', 'Monaco', '377'],
  ['MN', 'Mongolia', '976'],
  ['ME', 'Montenegro', '382'],
  ['MS', 'Montserrat', '1664'],
  ['MA', 'Morocco', '212'],
  ['MZ', 'Mozambique', '258'],
  ['MM', 'Myanmar', '95'],
  ['NA', 'Namibia', '264'],
  ['NR', 'Nauru', '674'],
  ['NP', 'Nepal', '977'],
  ['NC', 'New Caledonia', '687'],
  ['NI', 'Nicaragua', '505'],
  ['NE', 'Niger', '227'],
  ['NU', 'Niue', '683'],
  ['KP', 'North Korea', '850'],
  ['MK', 'North Macedonia', '389'],
  ['MP', 'Northern Mariana Islands', '1670'],
  ['OM', 'Oman', '968'],
  ['PK', 'Pakistan', '92'],
  ['PW', 'Palau', '680'],
  ['PS', 'Palestine', '970'],
  ['PA', 'Panama', '507'],
  ['PG', 'Papua New Guinea', '675'],
  ['PY', 'Paraguay', '595'],
  ['PE', 'Peru', '51'],
  ['PR', 'Puerto Rico', '1787,1939'],
  ['QA', 'Qatar', '974'],
  ['RO', 'Romania', '40'],
  ['RW', 'Rwanda', '250'],
  ['KN', 'Saint Kitts and Nevis', '1869'],
  ['LC', 'Saint Lucia', '1758'],
  ['VC', 'Saint Vincent and the Grenadines', '1784'],
  ['WS', 'Samoa', '685'],
  ['SM', 'San Marino', '378'],
  ['ST', 'São Tomé and Príncipe', '239'],
  ['SA', 'Saudi Arabia', '966'],
  ['SN', 'Senegal', '221'],
  ['RS', 'Serbia', '381'],
  ['SC', 'Seychelles', '248'],
  ['SL', 'Sierra Leone', '232'],
  ['SX', 'Sint Maarten', '1721'],
  ['SK', 'Slovakia', '421'],
  ['SI', 'Slovenia', '386'],
  ['SB', 'Solomon Islands', '677'],
  ['SO', 'Somalia', '252'],
  ['SS', 'South Sudan', '211'],
  ['LK', 'Sri Lanka', '94'],
  ['SR', 'Suriname', '597'],
  ['SY', 'Syria', '963'],
  ['TW', 'Taiwan', '886'],
  ['TJ', 'Tajikistan', '992'],
  ['TZ', 'Tanzania', '255'],
  ['TH', 'Thailand', '66'],
  ['TL', 'Timor-Leste', '670'],
  ['TG', 'Togo', '228'],
  ['TO', 'Tonga', '676'],
  ['TT', 'Trinidad and Tobago', '1868'],
  ['TN', 'Tunisia', '216'],
  ['TM', 'Turkmenistan', '993'],
  ['TC', 'Turks and Caicos Islands', '1649'],
  ['TV', 'Tuvalu', '688'],
  ['UG', 'Uganda', '256'],
  ['UA', 'Ukraine', '380'],
  ['VI', 'US Virgin Islands', '1340'],
  ['UY', 'Uruguay', '598'],
  ['UZ', 'Uzbekistan', '998'],
  ['VU', 'Vanuatu', '678'],
  ['VA', 'Vatican City', '379'],
  ['VE', 'Venezuela', '58'],
  ['VN', 'Vietnam', '84'],
  ['WF', 'Wallis and Futuna', '681'],
  ['YE', 'Yemen', '967'],
  ['ZM', 'Zambia', '260'],
  ['ZW', 'Zimbabwe', '263'],
];

const GENERIC_TEMPLATE = 'XXX XXX XXXX XXXX';

const toGenericCountry = ([iso, name, code]: readonly [
  string,
  string,
  string,
]): PhoneCountry =>
  code.length >= 4 && code.startsWith('1')
    ? {
        iso,
        name,
        callingCode: '1',
        template: NANP_TEMPLATE,
        minDigits: 10,
        maxDigits: 10,
        areaCodes: code.split(',').map((areaCode) => areaCode.slice(1)),
      }
    : {
        iso,
        name,
        callingCode: code,
        template: GENERIC_TEMPLATE,
        minDigits: 4,
        maxDigits: 15 - code.length,
      };

export const PHONE_COUNTRIES: readonly PhoneCountry[] = [
  ...DETAILED_COUNTRIES,
  ...OTHER_COUNTRIES.map(toGenericCountry),
];

export const DEFAULT_PHONE_COUNTRY_ISO = 'US';

export const getPhoneCountry = (iso?: string): PhoneCountry =>
  PHONE_COUNTRIES.find((country) => country.iso === iso?.toUpperCase()) ??
  PHONE_COUNTRIES[0];

/** The country's flag, from its code's regional indicator letters. */
export const getCountryFlag = (iso: string): string =>
  String.fromCodePoint(
    ...iso
      .toUpperCase()
      .split('')
      .map((letter) => 0x1f1a5 + (letter.codePointAt(0) ?? 0)),
  );

/** The country's English name, or its code for an unknown country. */
export const getCountryName = (iso: string): string =>
  PHONE_COUNTRIES.find((country) => country.iso === iso.toUpperCase())?.name ??
  iso;

const isNanp = (country: PhoneCountry) => country.callingCode === '1';

/**
 * Tidies a national number: digits only, without the dial-out zero or the
 * North American `1` that pasted numbers often carry, and within the longest
 * length the country allows.
 *
 * @param input - The text or digits to tidy.
 * @param country - The country the number belongs to.
 * @returns The national number's digits.
 */
export const normalizeNational = (
  input: string,
  country: PhoneCountry,
): string => {
  let digits = input.replace(/\D/gu, '');
  if (isNanp(country) && digits.length > 10 && digits.startsWith('1')) {
    digits = digits.slice(1);
  }
  if (country.hasTrunkZero && digits.startsWith('0')) {
    digits = digits.slice(1);
  }
  return digits.slice(0, country.maxDigits);
};

/**
 * Formats a national number with the country's template as the user types.
 * Separators appear only once a digit follows them, so deleting always removes
 * a digit.
 *
 * @param digits - The national number's digits.
 * @param country - The country whose template to apply.
 * @returns The number as displayed.
 */
export const formatNational = (
  digits: string,
  country: PhoneCountry,
): string => {
  let output = '';
  let used = 0;
  for (const char of country.template) {
    if (used >= digits.length) {
      break;
    }
    if (char === 'X') {
      output += digits[used];
      used += 1;
    } else {
      output += char;
    }
  }
  return output + digits.slice(used);
};

export const isValidNational = (
  digits: string,
  country: PhoneCountry,
): boolean => {
  if (!isNanp(country)) {
    return (
      digits.length >= country.minDigits && digits.length <= country.maxDigits
    );
  }
  return (
    NANP_NUMBER.test(digits) &&
    (country.areaCodes?.includes(digits.slice(0, 3)) ?? true)
  );
};

/**
 * The prefix to show beside a country: its calling code, with a North American
 * territory's area codes.
 *
 * @param country - The country.
 * @returns e.g. `+44`, or `+1 809, 829, 849`.
 */
export const getDialPrefix = (country: PhoneCountry): string =>
  country.areaCodes
    ? `+${country.callingCode} ${country.areaCodes.join(', ')}`
    : `+${country.callingCode}`;

export const toPhoneNumberValue = (
  digits: string,
  country: PhoneCountry,
): PhoneNumberValue => ({
  e164: `+${country.callingCode}${digits}`,
  country: country.iso,
  national: digits,
});

const INTERNATIONAL_PREFIX = /^\s*(?:tel:\s*)?\+/iu;

/**
 * Reads typed or pasted text. A leading plus (or a `tel:` link) marks a full
 * international number, which selects its country; anything else is the
 * national number of the current country.
 *
 * @param text - What the input now holds.
 * @param current - The currently selected country.
 * @returns The country and national digits the text stands for.
 */
export const parsePhoneInput = (
  text: string,
  current: PhoneCountry,
): { country: PhoneCountry; digits: string } => {
  if (!INTERNATIONAL_PREFIX.test(text)) {
    return { country: current, digits: normalizeNational(text, current) };
  }
  const all = text.replace(/\D/gu, '');
  // Longest calling code first. Among countries sharing one, a territory whose
  // area code the number starts with wins, then any country that takes the
  // number, the current one first, so +1 stays in Canada for a Canadian user
  // and a US number pasted over a territory moves to the US.
  const hasAreaCode = (country: PhoneCountry) =>
    country.areaCodes?.includes(
      all.slice(country.callingCode.length, country.callingCode.length + 3),
    ) ?? false;
  // A territory only takes numbers with one of its area codes.
  const accepts = (country: PhoneCountry) =>
    !country.areaCodes || hasAreaCode(country);
  const matches = PHONE_COUNTRIES.filter((country) =>
    all.startsWith(country.callingCode),
  ).sort(
    (first, second) =>
      second.callingCode.length - first.callingCode.length ||
      Number(hasAreaCode(second)) - Number(hasAreaCode(first)) ||
      Number(accepts(second)) - Number(accepts(first)) ||
      Number(second.iso === current.iso) - Number(first.iso === current.iso),
  );
  const country = matches[0];
  if (!country) {
    return { country: current, digits: normalizeNational(all, current) };
  }
  return {
    country,
    digits: normalizeNational(all.slice(country.callingCode.length), country),
  };
};

/**
 * Builds the starting country and digits from an initial value: an E.164
 * number, or a national number of the default country.
 *
 * @param value - The initial value, if any.
 * @param defaultIso - The country to assume for a national number.
 * @returns The country and digits to start with.
 */
export const getInitialPhone = (
  value: string | undefined,
  defaultIso: string = DEFAULT_PHONE_COUNTRY_ISO,
): { country: PhoneCountry; digits: string } =>
  parsePhoneInput(value ?? '', getPhoneCountry(defaultIso));
