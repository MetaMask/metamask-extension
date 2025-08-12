/* ANSI-C code produced by gperf version 3.1 */
/* Command-line: gperf -C -t -N lookup_bip39_word -K name bip39.gperf  */
/* Computed positions: -k'1-4' */

#if !((' ' == 32) && ('!' == 33) && ('"' == 34) && ('#' == 35) \
      && ('%' == 37) && ('&' == 38) && ('\'' == 39) && ('(' == 40) \
      && (')' == 41) && ('*' == 42) && ('+' == 43) && (',' == 44) \
      && ('-' == 45) && ('.' == 46) && ('/' == 47) && ('0' == 48) \
      && ('1' == 49) && ('2' == 50) && ('3' == 51) && ('4' == 52) \
      && ('5' == 53) && ('6' == 54) && ('7' == 55) && ('8' == 56) \
      && ('9' == 57) && (':' == 58) && (';' == 59) && ('<' == 60) \
      && ('=' == 61) && ('>' == 62) && ('?' == 63) && ('A' == 65) \
      && ('B' == 66) && ('C' == 67) && ('D' == 68) && ('E' == 69) \
      && ('F' == 70) && ('G' == 71) && ('H' == 72) && ('I' == 73) \
      && ('J' == 74) && ('K' == 75) && ('L' == 76) && ('M' == 77) \
      && ('N' == 78) && ('O' == 79) && ('P' == 80) && ('Q' == 81) \
      && ('R' == 82) && ('S' == 83) && ('T' == 84) && ('U' == 85) \
      && ('V' == 86) && ('W' == 87) && ('X' == 88) && ('Y' == 89) \
      && ('Z' == 90) && ('[' == 91) && ('\\' == 92) && (']' == 93) \
      && ('^' == 94) && ('_' == 95) && ('a' == 97) && ('b' == 98) \
      && ('c' == 99) && ('d' == 100) && ('e' == 101) && ('f' == 102) \
      && ('g' == 103) && ('h' == 104) && ('i' == 105) && ('j' == 106) \
      && ('k' == 107) && ('l' == 108) && ('m' == 109) && ('n' == 110) \
      && ('o' == 111) && ('p' == 112) && ('q' == 113) && ('r' == 114) \
      && ('s' == 115) && ('t' == 116) && ('u' == 117) && ('v' == 118) \
      && ('w' == 119) && ('x' == 120) && ('y' == 121) && ('z' == 122) \
      && ('{' == 123) && ('|' == 124) && ('}' == 125) && ('~' == 126))
/* The character set is not based on ISO-646.  */
#error "gperf generated tables don't work with this execution character set. Please report a bug to <bug-gperf@gnu.org>."
#endif

#line 1 "bip39.gperf"

#include <string.h>
#line 4 "bip39.gperf"
struct bip39_word { const char *name; int index; };

#define TOTAL_KEYWORDS 2048
#define MIN_WORD_LENGTH 3
#define MAX_WORD_LENGTH 8
#define MIN_HASH_VALUE 8
#define MAX_HASH_VALUE 16426
/* maximum key range = 16419, duplicates = 0 */

#ifdef __GNUC__
__inline
#else
#ifdef __cplusplus
inline
#endif
#endif
static unsigned int
hash (register const char *str, register size_t len)
{
  static const unsigned short asso_values[] =
    {
      16427, 16427, 16427, 16427, 16427, 16427, 16427, 16427, 16427, 16427,
      16427, 16427, 16427, 16427, 16427, 16427, 16427, 16427, 16427, 16427,
      16427, 16427, 16427, 16427, 16427, 16427, 16427, 16427, 16427, 16427,
      16427, 16427, 16427, 16427, 16427, 16427, 16427, 16427, 16427, 16427,
      16427, 16427, 16427, 16427, 16427, 16427, 16427, 16427, 16427, 16427,
      16427, 16427, 16427, 16427, 16427, 16427, 16427, 16427, 16427, 16427,
      16427, 16427, 16427, 16427, 16427, 16427, 16427, 16427, 16427, 16427,
      16427, 16427, 16427, 16427, 16427, 16427, 16427, 16427, 16427, 16427,
      16427, 16427, 16427, 16427, 16427, 16427, 16427, 16427, 16427, 16427,
      16427, 16427, 16427, 16427, 16427, 16427, 16427, 16427, 16427,    35,
        590,  1435,   315,    70,    35,  2240,  2875,     5,  5341,   255,
       3510,  6191,  3277,     0,  2949,  5876,  1020,  4026,  1330,   430,
       1165,  1315,    40,    25,    15,   365,  3538,  3680,  2120,  1055,
       4436,   460,    80,  2805,  5021,   130,   750,   610,   805,  3410,
       1810,  2620,     0,  3549,  4921,    25,   175,   260,   535,  1981,
       1349,    85,    20,  1410,    75, 16427, 16427, 16427, 16427, 16427,
      16427, 16427, 16427, 16427, 16427, 16427, 16427, 16427, 16427, 16427,
      16427, 16427, 16427, 16427, 16427, 16427, 16427, 16427, 16427, 16427,
      16427, 16427, 16427, 16427, 16427, 16427, 16427, 16427, 16427, 16427,
      16427, 16427, 16427, 16427, 16427, 16427, 16427, 16427, 16427, 16427,
      16427, 16427, 16427, 16427, 16427, 16427, 16427, 16427, 16427, 16427,
      16427, 16427, 16427, 16427, 16427, 16427, 16427, 16427, 16427, 16427,
      16427, 16427, 16427, 16427, 16427, 16427, 16427, 16427, 16427, 16427,
      16427, 16427, 16427, 16427, 16427, 16427, 16427, 16427, 16427, 16427,
      16427, 16427, 16427, 16427, 16427, 16427, 16427, 16427, 16427, 16427,
      16427, 16427, 16427, 16427, 16427, 16427, 16427, 16427, 16427, 16427,
      16427, 16427, 16427, 16427, 16427, 16427, 16427, 16427, 16427, 16427,
      16427, 16427, 16427, 16427, 16427, 16427, 16427, 16427, 16427, 16427,
      16427, 16427, 16427, 16427, 16427, 16427, 16427, 16427
    };
  register unsigned int hval = len;

  switch (hval)
    {
      default:
        hval += asso_values[(unsigned char)str[3]+8];
      /*FALLTHROUGH*/
      case 3:
        hval += asso_values[(unsigned char)str[2]+32];
      /*FALLTHROUGH*/
      case 2:
        hval += asso_values[(unsigned char)str[1]+2];
      /*FALLTHROUGH*/
      case 1:
        hval += asso_values[(unsigned char)str[0]+23];
        break;
    }
  return hval;
}

const struct bip39_word *
lookup_bip39_word (register const char *str, register size_t len)
{
  static const struct bip39_word wordlist[] =
    {
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
#line 2016 "bip39.gperf"
      {"win", 2010},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
#line 2022 "bip39.gperf"
      {"winter", 2016},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""},
#line 379 "bip39.gperf"
      {"concert", 373},
      {""},
#line 1981 "bip39.gperf"
      {"want", 1975},
      {""}, {""}, {""}, {""}, {""}, {""}, {""},
#line 385 "bip39.gperf"
      {"control", 379},
      {""}, {""}, {""}, {""}, {""}, {""}, {""},
#line 448 "bip39.gperf"
      {"dance", 442},
      {""}, {""},
#line 384 "bip39.gperf"
      {"consider", 378},
      {""}, {""}, {""}, {""},
#line 269 "bip39.gperf"
      {"can", 263},
      {""}, {""}, {""}, {""}, {""}, {""}, {""},
#line 271 "bip39.gperf"
      {"cancel", 265},
#line 1150 "bip39.gperf"
      {"monitor", 1144},
      {""}, {""}, {""}, {""},
#line 1134 "bip39.gperf"
      {"minimum", 1128},
      {""}, {""}, {""}, {""}, {""}, {""}, {""},
#line 1153 "bip39.gperf"
      {"month", 1147},
#line 473 "bip39.gperf"
      {"denial", 467},
      {""}, {""}, {""},
#line 2012 "bip39.gperf"
      {"width", 2006},
      {""}, {""},
#line 1142 "bip39.gperf"
      {"mix", 1136},
      {""}, {""}, {""},
#line 1152 "bip39.gperf"
      {"monster", 1146},
      {""}, {""}, {""}, {""},
#line 474 "bip39.gperf"
      {"dentist", 468},
#line 1084 "bip39.gperf"
      {"man", 1078},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
#line 1144 "bip39.gperf"
      {"mixture", 1138},
      {""}, {""}, {""}, {""},
#line 305 "bip39.gperf"
      {"century", 299},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
#line 304 "bip39.gperf"
      {"census", 298},
#line 1105 "bip39.gperf"
      {"maximum", 1099},
#line 445 "bip39.gperf"
      {"dad", 439},
      {""}, {""}, {""},
#line 1088 "bip39.gperf"
      {"mansion", 1082},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""},
#line 522 "bip39.gperf"
      {"dog", 516},
      {""}, {""}, {""}, {""}, {""}, {""}, {""},
#line 1147 "bip39.gperf"
      {"modify", 1141},
#line 501 "bip39.gperf"
      {"digital", 495},
      {""}, {""},
#line 1283 "bip39.gperf"
      {"panic", 1277},
      {""},
#line 1118 "bip39.gperf"
      {"mention", 1112},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""},
#line 1284 "bip39.gperf"
      {"panther", 1278},
      {""}, {""}, {""}, {""}, {""}, {""}, {""},
#line 2037 "bip39.gperf"
      {"worth", 2031},
      {""}, {""},
#line 1075 "bip39.gperf"
      {"mad", 1069},
      {""}, {""}, {""}, {""},
#line 1305 "bip39.gperf"
      {"pen", 1299},
      {""}, {""}, {""}, {""}, {""}, {""}, {""},
#line 1307 "bip39.gperf"
      {"pencil", 1301},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
#line 2036 "bip39.gperf"
      {"worry", 2030},
      {""}, {""}, {""},
#line 507 "bip39.gperf"
      {"dirt", 501},
      {""}, {""}, {""}, {""}, {""}, {""},
#line 335 "bip39.gperf"
      {"circle", 329},
      {""}, {""}, {""},
#line 1113 "bip39.gperf"
      {"media", 1107},
      {""}, {""}, {""}, {""}, {""},
#line 450 "bip39.gperf"
      {"daring", 444},
      {""}, {""}, {""},
#line 561 "bip39.gperf"
      {"earth", 555},
      {""}, {""}, {""}, {""},
#line 1076 "bip39.gperf"
      {"magic", 1070},
      {""}, {""},
#line 280 "bip39.gperf"
      {"car", 274},
      {""}, {""}, {""},
#line 1984 "bip39.gperf"
      {"warrior", 1978},
      {""}, {""}, {""}, {""},
#line 394 "bip39.gperf"
      {"correct", 388},
      {""},
#line 2018 "bip39.gperf"
      {"wine", 2012},
      {""}, {""}, {""},
#line 1322 "bip39.gperf"
      {"pig", 1316},
#line 286 "bip39.gperf"
      {"cart", 280},
      {""},
#line 468 "bip39.gperf"
      {"degree", 462},
      {""}, {""}, {""}, {""},
#line 481 "bip39.gperf"
      {"derive", 475},
      {""}, {""}, {""}, {""}, {""}, {""}, {""},
#line 2052 "bip39.gperf"
      {"zone", 2046},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""},
#line 285 "bip39.gperf"
      {"carry", 279},
#line 1094 "bip39.gperf"
      {"marine", 1088},
      {""}, {""}, {""},
#line 1092 "bip39.gperf"
      {"march", 1086},
      {""}, {""},
#line 509 "bip39.gperf"
      {"discover", 503},
      {""}, {""},
#line 1138 "bip39.gperf"
      {"mirror", 1132},
#line 307 "bip39.gperf"
      {"certain", 301},
      {""}, {""}, {""}, {""}, {""},
#line 515 "bip39.gperf"
      {"distance", 509},
      {""},
#line 1987 "bip39.gperf"
      {"waste", 1981},
#line 562 "bip39.gperf"
      {"easily", 556},
      {""}, {""},
#line 395 "bip39.gperf"
      {"cost", 389},
      {""}, {""}, {""}, {""}, {""}, {""}, {""},
#line 1352 "bip39.gperf"
      {"portion", 1346},
      {""},
#line 563 "bip39.gperf"
      {"east", 557},
#line 1122 "bip39.gperf"
      {"merit", 1116},
      {""}, {""}, {""}, {""},
#line 1120 "bip39.gperf"
      {"mercy", 1114},
      {""}, {""},
#line 1096 "bip39.gperf"
      {"marriage", 1090},
      {""}, {""},
#line 289 "bip39.gperf"
      {"casino", 283},
      {""}, {""},
#line 2011 "bip39.gperf"
      {"wide", 2005},
      {""}, {""}, {""}, {""},
#line 2001 "bip39.gperf"
      {"west", 1995},
      {""}, {""}, {""}, {""}, {""}, {""},
#line 290 "bip39.gperf"
      {"castle", 284},
      {""}, {""}, {""},
#line 1290 "bip39.gperf"
      {"party", 1284},
#line 484 "bip39.gperf"
      {"design", 478},
      {""}, {""}, {""},
#line 1143 "bip39.gperf"
      {"mixed", 1137},
      {""},
#line 1141 "bip39.gperf"
      {"mistake", 1135},
#line 482 "bip39.gperf"
      {"describe", 476},
      {""},
#line 1123 "bip39.gperf"
      {"merry", 1117},
      {""}, {""}, {""},
#line 1140 "bip39.gperf"
      {"miss", 1134},
      {""},
#line 702 "bip39.gperf"
      {"finish", 696},
#line 487 "bip39.gperf"
      {"destroy", 481},
      {""},
#line 366 "bip39.gperf"
      {"code", 360},
      {""}, {""}, {""}, {""}, {""}, {""},
#line 1289 "bip39.gperf"
      {"parrot", 1283},
#line 1177 "bip39.gperf"
      {"mystery", 1171},
#line 744 "bip39.gperf"
      {"fox", 738},
      {""}, {""}, {""}, {""},
#line 710 "bip39.gperf"
      {"fix", 704},
      {""}, {""},
#line 1099 "bip39.gperf"
      {"master", 1093},
      {""},
#line 1353 "bip39.gperf"
      {"position", 1347},
      {""}, {""}, {""}, {""},
#line 668 "bip39.gperf"
      {"fan", 662},
#line 1098 "bip39.gperf"
      {"mass", 1092},
      {""},
#line 1312 "bip39.gperf"
      {"person", 1306},
      {""}, {""},
#line 1355 "bip39.gperf"
      {"post", 1349},
#line 669 "bip39.gperf"
      {"fancy", 663},
      {""}, {""}, {""}, {""}, {""},
#line 1329 "bip39.gperf"
      {"pistol", 1323},
      {""}, {""}, {""},
#line 1146 "bip39.gperf"
      {"model", 1140},
      {""},
#line 670 "bip39.gperf"
      {"fantasy", 664},
#line 1354 "bip39.gperf"
      {"possible", 1348},
#line 1975 "bip39.gperf"
      {"wage", 1969},
#line 1282 "bip39.gperf"
      {"panel", 1276},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""},
#line 2023 "bip39.gperf"
      {"wire", 2017},
#line 557 "bip39.gperf"
      {"eager", 551},
      {""},
#line 1125 "bip39.gperf"
      {"message", 1119},
      {""}, {""},
#line 686 "bip39.gperf"
      {"fence", 680},
      {""}, {""}, {""},
#line 1106 "bip39.gperf"
      {"maze", 1100},
      {""}, {""}, {""}, {""},
#line 1291 "bip39.gperf"
      {"pass", 1285},
      {""},
#line 1136 "bip39.gperf"
      {"minute", 1130},
      {""}, {""}, {""},
#line 528 "bip39.gperf"
      {"donor", 522},
      {""}, {""}, {""},
#line 263 "bip39.gperf"
      {"cage", 257},
      {""},
#line 506 "bip39.gperf"
      {"direct", 500},
      {""},
#line 505 "bip39.gperf"
      {"dinosaur", 499},
      {""}, {""}, {""}, {""}, {""},
#line 392 "bip39.gperf"
      {"core", 386},
#line 1360 "bip39.gperf"
      {"power", 1354},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""},
#line 1089 "bip39.gperf"
      {"manual", 1083},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""},
#line 728 "bip39.gperf"
      {"fog", 722},
      {""}, {""}, {""}, {""}, {""}, {""}, {""},
#line 520 "bip39.gperf"
      {"doctor", 514},
      {""}, {""}, {""},
#line 274 "bip39.gperf"
      {"canoe", 268},
      {""}, {""}, {""},
#line 1156 "bip39.gperf"
      {"more", 1150},
      {""}, {""}, {""}, {""},
#line 1119 "bip39.gperf"
      {"menu", 1113},
#line 1135 "bip39.gperf"
      {"minor", 1129},
#line 636 "bip39.gperf"
      {"excite", 630},
      {""},
#line 690 "bip39.gperf"
      {"few", 684},
#line 2025 "bip39.gperf"
      {"wise", 2019},
      {""},
#line 1323 "bip39.gperf"
      {"pigeon", 1317},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
#line 530 "bip39.gperf"
      {"dose", 524},
      {""},
#line 306 "bip39.gperf"
      {"cereal", 300},
      {""}, {""}, {""},
#line 734 "bip39.gperf"
      {"force", 728},
      {""},
#line 510 "bip39.gperf"
      {"disease", 504},
      {""},
#line 1277 "bip39.gperf"
      {"page", 1271},
      {""},
#line 262 "bip39.gperf"
      {"cactus", 256},
      {""}, {""},
#line 1031 "bip39.gperf"
      {"lens", 1025},
      {""},
#line 460 "bip39.gperf"
      {"decide", 454},
#line 738 "bip39.gperf"
      {"fortune", 732},
      {""}, {""}, {""}, {""}, {""}, {""}, {""},
#line 1396 "bip39.gperf"
      {"punch", 1390},
      {""}, {""}, {""}, {""},
#line 705 "bip39.gperf"
      {"first", 699},
      {""}, {""}, {""}, {""}, {""}, {""}, {""},
#line 1013 "bip39.gperf"
      {"law", 1007},
      {""}, {""}, {""},
#line 336 "bip39.gperf"
      {"citizen", 330},
      {""}, {""}, {""}, {""}, {""}, {""},
#line 287 "bip39.gperf"
      {"case", 281},
#line 1058 "bip39.gperf"
      {"logic", 1052},
#line 396 "bip39.gperf"
      {"cotton", 390},
      {""}, {""}, {""},
#line 1976 "bip39.gperf"
      {"wagon", 1970},
#line 1287 "bip39.gperf"
      {"parent", 1281},
      {""},
#line 463 "bip39.gperf"
      {"decrease", 457},
      {""}, {""},
#line 1139 "bip39.gperf"
      {"misery", 1133},
      {""},
#line 2002 "bip39.gperf"
      {"wet", 1996},
      {""}, {""}, {""},
#line 1015 "bip39.gperf"
      {"lawsuit", 1009},
#line 292 "bip39.gperf"
      {"cat", 286},
      {""}, {""},
#line 483 "bip39.gperf"
      {"desert", 477},
#line 1320 "bip39.gperf"
      {"picture", 1314},
      {""}, {""},
#line 294 "bip39.gperf"
      {"catch", 288},
#line 1160 "bip39.gperf"
      {"motion", 1154},
      {""}, {""}, {""}, {""},
#line 1176 "bip39.gperf"
      {"myself", 1170},
      {""}, {""},
#line 700 "bip39.gperf"
      {"fine", 694},
      {""},
#line 296 "bip39.gperf"
      {"cattle", 290},
      {""}, {""}, {""},
#line 654 "bip39.gperf"
      {"extra", 648},
#line 551 "bip39.gperf"
      {"during", 545},
      {""}, {""}, {""}, {""},
#line 706 "bip39.gperf"
      {"fiscal", 700},
      {""}, {""},
#line 1275 "bip39.gperf"
      {"pact", 1269},
      {""},
#line 742 "bip39.gperf"
      {"foster", 736},
      {""}, {""}, {""}, {""}, {""},
#line 437 "bip39.gperf"
      {"curious", 431},
      {""}, {""},
#line 1426 "bip39.gperf"
      {"ranch", 1420},
#line 741 "bip39.gperf"
      {"fossil", 735},
      {""}, {""}, {""},
#line 1100 "bip39.gperf"
      {"match", 1094},
      {""}, {""},
#line 1024 "bip39.gperf"
      {"leg", 1018},
#line 1977 "bip39.gperf"
      {"wait", 1971},
      {""},
#line 1073 "bip39.gperf"
      {"lyrics", 1067},
#line 439 "bip39.gperf"
      {"curtain", 433},
      {""}, {""}, {""},
#line 1104 "bip39.gperf"
      {"matter", 1098},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
#line 1330 "bip39.gperf"
      {"pitch", 1324},
      {""}, {""}, {""},
#line 645 "bip39.gperf"
      {"exit", 639},
      {""}, {""},
#line 1357 "bip39.gperf"
      {"pottery", 1351},
      {""}, {""}, {""}, {""},
#line 438 "bip39.gperf"
      {"current", 432},
      {""}, {""},
#line 644 "bip39.gperf"
      {"exist", 638},
#line 1103 "bip39.gperf"
      {"matrix", 1097},
      {""}, {""},
#line 1464 "bip39.gperf"
      {"rent", 1458},
      {""}, {""}, {""}, {""},
#line 2051 "bip39.gperf"
      {"zero", 2045},
      {""},
#line 291 "bip39.gperf"
      {"casual", 285},
#line 1294 "bip39.gperf"
      {"patient", 1288},
      {""}, {""},
#line 1292 "bip39.gperf"
      {"patch", 1286},
      {""}, {""}, {""},
#line 550 "bip39.gperf"
      {"dune", 544},
      {""}, {""}, {""},
#line 687 "bip39.gperf"
      {"festival", 681},
#line 568 "bip39.gperf"
      {"edge", 562},
      {""},
#line 1059 "bip39.gperf"
      {"lonely", 1053},
#line 1296 "bip39.gperf"
      {"pattern", 1290},
      {""}, {""},
#line 1999 "bip39.gperf"
      {"weird", 1993},
      {""}, {""},
#line 513 "bip39.gperf"
      {"disorder", 507},
      {""},
#line 1420 "bip39.gperf"
      {"radio", 1414},
      {""}, {""},
#line 1434 "bip39.gperf"
      {"raw", 1428},
#line 552 "bip39.gperf"
      {"dust", 546},
      {""}, {""}, {""},
#line 1313 "bip39.gperf"
      {"pet", 1307},
#line 660 "bip39.gperf"
      {"fade", 654},
      {""},
#line 1400 "bip39.gperf"
      {"purity", 1394},
      {""}, {""},
#line 1049 "bip39.gperf"
      {"list", 1043},
      {""},
#line 1295 "bip39.gperf"
      {"patrol", 1289},
      {""},
#line 1399 "bip39.gperf"
      {"purchase", 1393},
#line 497 "bip39.gperf"
      {"dice", 491},
#line 1493 "bip39.gperf"
      {"rigid", 1487},
#line 442 "bip39.gperf"
      {"custom", 436},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""},
#line 1402 "bip39.gperf"
      {"purse", 1396},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
#line 1173 "bip39.gperf"
      {"music", 1167},
#line 634 "bip39.gperf"
      {"excess", 628},
#line 681 "bip39.gperf"
      {"federal", 675},
      {""}, {""}, {""},
#line 1170 "bip39.gperf"
      {"muscle", 1164},
      {""}, {""}, {""}, {""}, {""}, {""}, {""},
#line 1174 "bip39.gperf"
      {"must", 1168},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
#line 758 "bip39.gperf"
      {"fun", 752},
      {""}, {""},
#line 735 "bip39.gperf"
      {"forest", 729},
      {""}, {""},
#line 703 "bip39.gperf"
      {"fire", 697},
      {""}, {""}, {""}, {""}, {""}, {""}, {""},
#line 642 "bip39.gperf"
      {"exhibit", 636},
      {""}, {""}, {""},
#line 1450 "bip39.gperf"
      {"region", 1444},
      {""},
#line 459 "bip39.gperf"
      {"december", 453},
#line 1278 "bip39.gperf"
      {"pair", 1272},
#line 1615 "bip39.gperf"
      {"since", 1609},
#line 1033 "bip39.gperf"
      {"lesson", 1027},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
#line 1988 "bip39.gperf"
      {"water", 1982},
      {""}, {""},
#line 1620 "bip39.gperf"
      {"six", 1614},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
#line 653 "bip39.gperf"
      {"extend", 647},
#line 692 "bip39.gperf"
      {"fiction", 686},
      {""}, {""}, {""},
#line 1451 "bip39.gperf"
      {"regret", 1445},
      {""},
#line 521 "bip39.gperf"
      {"document", 515},
      {""}, {""},
#line 1048 "bip39.gperf"
      {"liquid", 1042},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
#line 694 "bip39.gperf"
      {"figure", 688},
      {""},
#line 295 "bip39.gperf"
      {"category", 289},
      {""}, {""}, {""}, {""}, {""}, {""}, {""},
#line 1571 "bip39.gperf"
      {"senior", 1565},
      {""}, {""}, {""}, {""},
#line 638 "bip39.gperf"
      {"excuse", 632},
      {""}, {""}, {""}, {""},
#line 489 "bip39.gperf"
      {"detect", 483},
      {""}, {""}, {""}, {""}, {""}, {""},
#line 1573 "bip39.gperf"
      {"sentence", 1567},
      {""},
#line 1071 "bip39.gperf"
      {"lunch", 1065},
      {""}, {""}, {""}, {""},
#line 1572 "bip39.gperf"
      {"sense", 1566},
      {""}, {""},
#line 708 "bip39.gperf"
      {"fit", 702},
      {""},
#line 739 "bip39.gperf"
      {"forum", 733},
      {""}, {""},
#line 1101 "bip39.gperf"
      {"material", 1095},
      {""}, {""}, {""}, {""}, {""}, {""}, {""},
#line 1026 "bip39.gperf"
      {"legend", 1020},
      {""},
#line 1523 "bip39.gperf"
      {"sad", 1517},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""},
#line 365 "bip39.gperf"
      {"coconut", 359},
#line 673 "bip39.gperf"
      {"fat", 667},
      {""},
#line 1463 "bip39.gperf"
      {"renew", 1457},
      {""},
#line 676 "bip39.gperf"
      {"fatigue", 670},
      {""}, {""}, {""},
#line 1473 "bip39.gperf"
      {"resist", 1467},
      {""}, {""}, {""}, {""},
#line 1471 "bip39.gperf"
      {"rescue", 1465},
      {""}, {""},
#line 1489 "bip39.gperf"
      {"ride", 1483},
      {""}, {""}, {""}, {""},
#line 569 "bip39.gperf"
      {"edit", 563},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""},
#line 688 "bip39.gperf"
      {"fetch", 682},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""},
#line 462 "bip39.gperf"
      {"decorate", 456},
      {""}, {""}, {""}, {""}, {""},
#line 1666 "bip39.gperf"
      {"sort", 1660},
#line 553 "bip39.gperf"
      {"dutch", 547},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""},
#line 1022 "bip39.gperf"
      {"lecture", 1016},
      {""}, {""}, {""}, {""},
#line 1062 "bip39.gperf"
      {"lottery", 1056},
      {""}, {""}, {""},
#line 1050 "bip39.gperf"
      {"little", 1044},
      {""}, {""}, {""},
#line 1665 "bip39.gperf"
      {"sorry", 1659},
      {""}, {""}, {""}, {""},
#line 662 "bip39.gperf"
      {"faith", 656},
#line 1171 "bip39.gperf"
      {"museum", 1165},
      {""}, {""}, {""},
#line 1009 "bip39.gperf"
      {"latin", 1003},
      {""}, {""}, {""}, {""}, {""}, {""}, {""},
#line 1520 "bip39.gperf"
      {"run", 1514},
      {""}, {""}, {""}, {""}, {""}, {""},
#line 1161 "bip39.gperf"
      {"motor", 1155},
      {""}, {""}, {""}, {""}, {""},
#line 1574 "bip39.gperf"
      {"series", 1568},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""},
#line 1470 "bip39.gperf"
      {"require", 1464},
      {""},
#line 1430 "bip39.gperf"
      {"rare", 1424},
      {""}, {""}, {""}, {""}, {""}, {""},
#line 1034 "bip39.gperf"
      {"letter", 1028},
      {""}, {""}, {""}, {""},
#line 1618 "bip39.gperf"
      {"sister", 1612},
      {""}, {""}, {""}, {""}, {""}, {""},
#line 1404 "bip39.gperf"
      {"put", 1398},
      {""}, {""}, {""}, {""}, {""}, {""},
#line 363 "bip39.gperf"
      {"coach", 357},
      {""}, {""}, {""}, {""}, {""},
#line 1772 "bip39.gperf"
      {"system", 1766},
      {""}, {""}, {""}, {""}, {""},
#line 1416 "bip39.gperf"
      {"raccoon", 1410},
      {""},
#line 658 "bip39.gperf"
      {"face", 652},
#line 632 "bip39.gperf"
      {"exact", 626},
      {""}, {""}, {""}, {""},
#line 364 "bip39.gperf"
      {"coast", 358},
      {""}, {""}, {""},
#line 1510 "bip39.gperf"
      {"rose", 1504},
#line 496 "bip39.gperf"
      {"diary", 490},
#line 1446 "bip39.gperf"
      {"reduce", 1440},
      {""}, {""}, {""}, {""},
#line 276 "bip39.gperf"
      {"canyon", 270},
      {""}, {""}, {""}, {""}, {""}, {""}, {""},
#line 1621 "bip39.gperf"
      {"size", 1615},
      {""},
#line 1443 "bip39.gperf"
      {"recipe", 1437},
#line 1995 "bip39.gperf"
      {"weather", 1989},
      {""},
#line 1605 "bip39.gperf"
      {"side", 1599},
      {""}, {""}, {""}, {""},
#line 475 "bip39.gperf"
      {"deny", 469},
#line 1435 "bip39.gperf"
      {"razor", 1429},
#line 1994 "bip39.gperf"
      {"weasel", 1988},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""},
#line 1576 "bip39.gperf"
      {"session", 1570},
      {""},
#line 1993 "bip39.gperf"
      {"wear", 1987},
      {""}, {""},
#line 1027 "bip39.gperf"
      {"leisure", 1021},
#line 1518 "bip39.gperf"
      {"rug", 1512},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
#line 1452 "bip39.gperf"
      {"regular", 1446},
      {""}, {""}, {""}, {""},
#line 1039 "bip39.gperf"
      {"license", 1033},
      {""},
#line 1349 "bip39.gperf"
      {"pony", 1343},
      {""}, {""}, {""}, {""}, {""},
#line 727 "bip39.gperf"
      {"focus", 721},
      {""}, {""}, {""}, {""},
#line 2035 "bip39.gperf"
      {"world", 2029},
      {""}, {""},
#line 1472 "bip39.gperf"
      {"resemble", 1466},
      {""},
#line 558 "bip39.gperf"
      {"eagle", 552},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""},
#line 1477 "bip39.gperf"
      {"retire", 1471},
      {""}, {""},
#line 1110 "bip39.gperf"
      {"meat", 1104},
      {""}, {""}, {""}, {""}, {""}, {""}, {""},
#line 659 "bip39.gperf"
      {"faculty", 653},
      {""}, {""}, {""}, {""},
#line 1109 "bip39.gperf"
      {"measure", 1103},
#line 1744 "bip39.gperf"
      {"sun", 1738},
      {""}, {""}, {""}, {""}, {""}, {""},
#line 1617 "bip39.gperf"
      {"siren", 1611},
      {""}, {""}, {""}, {""},
#line 559 "bip39.gperf"
      {"early", 553},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""},
#line 1478 "bip39.gperf"
      {"retreat", 1472},
      {""},
#line 443 "bip39.gperf"
      {"cute", 437},
#line 1300 "bip39.gperf"
      {"peace", 1294},
#line 1746 "bip39.gperf"
      {"sunset", 1740},
      {""},
#line 960 "bip39.gperf"
      {"jar", 954},
      {""}, {""},
#line 1653 "bip39.gperf"
      {"social", 1647},
      {""}, {""}, {""}, {""},
#line 1652 "bip39.gperf"
      {"soccer", 1646},
      {""}, {""}, {""}, {""},
#line 1072 "bip39.gperf"
      {"luxury", 1066},
      {""}, {""}, {""},
#line 1423 "bip39.gperf"
      {"raise", 1417},
      {""},
#line 1303 "bip39.gperf"
      {"peasant", 1297},
      {""}, {""},
#line 1008 "bip39.gperf"
      {"later", 1002},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
#line 1302 "bip39.gperf"
      {"pear", 1296},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""},
#line 1476 "bip39.gperf"
      {"result", 1470},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""},
#line 1487 "bip39.gperf"
      {"rice", 1481},
      {""}, {""}, {""},
#line 218 "bip39.gperf"
      {"box", 212},
      {""}, {""},
#line 2021 "bip39.gperf"
      {"winner", 2015},
      {""}, {""}, {""}, {""}, {""}, {""},
#line 49 "bip39.gperf"
      {"air", 43},
      {""}, {""}, {""}, {""}, {""}, {""},
#line 1081 "bip39.gperf"
      {"major", 1075},
      {""},
#line 1563 "bip39.gperf"
      {"section", 1557},
      {""}, {""}, {""}, {""}, {""}, {""},
#line 1417 "bip39.gperf"
      {"race", 1411},
      {""},
#line 504 "bip39.gperf"
      {"dinner", 498},
      {""}, {""},
#line 564 "bip39.gperf"
      {"easy", 558},
      {""}, {""}, {""}, {""}, {""},
#line 1771 "bip39.gperf"
      {"syrup", 1765},
      {""},
#line 383 "bip39.gperf"
      {"connect", 377},
#line 1474 "bip39.gperf"
      {"resource", 1468},
#line 1517 "bip39.gperf"
      {"rude", 1511},
      {""},
#line 1562 "bip39.gperf"
      {"secret", 1556},
#line 1536 "bip39.gperf"
      {"satisfy", 1530},
#line 334 "bip39.gperf"
      {"cinnamon", 328},
      {""},
#line 517 "bip39.gperf"
      {"divide", 511},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
#line 174 "bip39.gperf"
      {"bench", 168},
      {""}, {""}, {""},
#line 338 "bip39.gperf"
      {"civil", 332},
      {""}, {""},
#line 1442 "bip39.gperf"
      {"receive", 1436},
#line 182 "bip39.gperf"
      {"bid", 176},
      {""}, {""}, {""}, {""}, {""}, {""}, {""},
#line 273 "bip39.gperf"
      {"cannon", 267},
      {""}, {""}, {""}, {""},
#line 1175 "bip39.gperf"
      {"mutual", 1169},
      {""}, {""}, {""}, {""},
#line 284 "bip39.gperf"
      {"carpet", 278},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
#line 1577 "bip39.gperf"
      {"settle", 1571},
      {""}, {""},
#line 1165 "bip39.gperf"
      {"movie", 1159},
      {""}, {""}, {""}, {""},
#line 1431 "bip39.gperf"
      {"rate", 1425},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
#line 1990 "bip39.gperf"
      {"way", 1984},
      {""},
#line 491 "bip39.gperf"
      {"device", 485},
      {""}, {""}, {""}, {""}, {""}, {""}, {""},
#line 1754 "bip39.gperf"
      {"surround", 1748},
      {""}, {""}, {""},
#line 514 "bip39.gperf"
      {"display", 508},
      {""},
#line 1986 "bip39.gperf"
      {"wasp", 1980},
      {""}, {""}, {""}, {""}, {""},
#line 965 "bip39.gperf"
      {"jewel", 959},
      {""}, {""},
#line 454 "bip39.gperf"
      {"day", 448},
      {""}, {""}, {""}, {""}, {""},
#line 453 "bip39.gperf"
      {"dawn", 447},
      {""}, {""}, {""},
#line 146 "bip39.gperf"
      {"bag", 140},
      {""}, {""}, {""}, {""}, {""}, {""}, {""},
#line 975 "bip39.gperf"
      {"junior", 969},
      {""}, {""}, {""}, {""},
#line 213 "bip39.gperf"
      {"boring", 207},
#line 502 "bip39.gperf"
      {"dignity", 496},
      {""}, {""}, {""}, {""}, {""},
#line 1129 "bip39.gperf"
      {"midnight", 1123},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
#line 679 "bip39.gperf"
      {"feature", 673},
      {""}, {""},
#line 187 "bip39.gperf"
      {"birth", 181},
      {""},
#line 1757 "bip39.gperf"
      {"sustain", 1751},
      {""}, {""},
#line 168 "bip39.gperf"
      {"begin", 162},
#line 1498 "bip39.gperf"
      {"ritual", 1492},
      {""}, {""}, {""}, {""}, {""},
#line 486 "bip39.gperf"
      {"despair", 480},
#line 153 "bip39.gperf"
      {"bar", 147},
      {""}, {""}, {""}, {""}, {""}, {""}, {""},
#line 214 "bip39.gperf"
      {"borrow", 208},
      {""}, {""}, {""}, {""}, {""},
#line 637 "bip39.gperf"
      {"exclude", 631},
      {""}, {""}, {""}, {""}, {""}, {""},
#line 393 "bip39.gperf"
      {"corn", 387},
#line 444 "bip39.gperf"
      {"cycle", 438},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
#line 560 "bip39.gperf"
      {"earn", 554},
      {""}, {""}, {""},
#line 31 "bip39.gperf"
      {"add", 25},
#line 1036 "bip39.gperf"
      {"liar", 1030},
      {""},
#line 32 "bip39.gperf"
      {"addict", 26},
      {""}, {""}, {""}, {""},
#line 156 "bip39.gperf"
      {"barrel", 150},
      {""}, {""},
#line 208 "bip39.gperf"
      {"bone", 202},
      {""},
#line 1444 "bip39.gperf"
      {"record", 1438},
      {""}, {""}, {""}, {""},
#line 1077 "bip39.gperf"
      {"magnet", 1071},
#line 461 "bip39.gperf"
      {"decline", 455},
      {""}, {""}, {""},
#line 1479 "bip39.gperf"
      {"return", 1473},
      {""}, {""}, {""}, {""},
#line 959 "bip39.gperf"
      {"jaguar", 953},
#line 1157 "bip39.gperf"
      {"morning", 1151},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""},
#line 215 "bip39.gperf"
      {"boss", 209},
      {""}, {""},
#line 33 "bip39.gperf"
      {"address", 27},
      {""}, {""}, {""}, {""}, {""}, {""},
#line 128 "bip39.gperf"
      {"aunt", 122},
#line 158 "bip39.gperf"
      {"basic", 152},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""},
#line 1017 "bip39.gperf"
      {"lazy", 1011},
#line 1020 "bip39.gperf"
      {"learn", 1014},
      {""}, {""},
#line 532 "bip39.gperf"
      {"dove", 526},
#line 1002 "bip39.gperf"
      {"lady", 996},
      {""}, {""}, {""}, {""},
#line 337 "bip39.gperf"
      {"city", 331},
#line 516 "bip39.gperf"
      {"divert", 510},
      {""}, {""},
#line 1989 "bip39.gperf"
      {"wave", 1983},
      {""},
#line 620 "bip39.gperf"
      {"error", 614},
      {""},
#line 175 "bip39.gperf"
      {"benefit", 169},
      {""},
#line 402 "bip39.gperf"
      {"cover", 396},
#line 2042 "bip39.gperf"
      {"write", 2036},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
#line 2041 "bip39.gperf"
      {"wrist", 2035},
      {""}, {""},
#line 1158 "bip39.gperf"
      {"mosquito", 1152},
#line 176 "bip39.gperf"
      {"best", 170},
      {""}, {""}, {""}, {""},
#line 1750 "bip39.gperf"
      {"sure", 1744},
      {""}, {""}, {""},
#line 1624 "bip39.gperf"
      {"ski", 1618},
#line 368 "bip39.gperf"
      {"coil", 362},
      {""}, {""}, {""}, {""}, {""},
#line 126 "bip39.gperf"
      {"audit", 120},
      {""},
#line 417 "bip39.gperf"
      {"cricket", 411},
#line 300 "bip39.gperf"
      {"cave", 294},
      {""},
#line 209 "bip39.gperf"
      {"bonus", 203},
      {""}, {""},
#line 1164 "bip39.gperf"
      {"move", 1158},
      {""},
#line 643 "bip39.gperf"
      {"exile", 637},
#line 420 "bip39.gperf"
      {"critic", 414},
      {""}, {""}, {""},
#line 1502 "bip39.gperf"
      {"roast", 1496},
      {""}, {""}, {""}, {""},
#line 419 "bip39.gperf"
      {"crisp", 413},
#line 762 "bip39.gperf"
      {"future", 756},
      {""}, {""}, {""}, {""},
#line 490 "bip39.gperf"
      {"develop", 484},
#line 1736 "bip39.gperf"
      {"success", 1730},
#line 1564 "bip39.gperf"
      {"security", 1558},
      {""}, {""}, {""}, {""}, {""}, {""},
#line 1627 "bip39.gperf"
      {"skirt", 1621},
      {""},
#line 1619 "bip39.gperf"
      {"situate", 1613},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""},
#line 1358 "bip39.gperf"
      {"poverty", 1352},
      {""}, {""}, {""}, {""},
#line 1453 "bip39.gperf"
      {"reject", 1447},
#line 301 "bip39.gperf"
      {"ceiling", 295},
      {""},
#line 1079 "bip39.gperf"
      {"mail", 1073},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""},
#line 977 "bip39.gperf"
      {"just", 971},
      {""},
#line 1438 "bip39.gperf"
      {"reason", 1432},
      {""}, {""}, {""},
#line 1369 "bip39.gperf"
      {"price", 1363},
#line 1561 "bip39.gperf"
      {"second", 1555},
      {""},
#line 1298 "bip39.gperf"
      {"pave", 1292},
      {""}, {""}, {""}, {""}, {""}, {""},
#line 1578 "bip39.gperf"
      {"setup", 1572},
      {""}, {""}, {""}, {""}, {""},
#line 154 "bip39.gperf"
      {"barely", 148},
      {""}, {""}, {""}, {""},
#line 1374 "bip39.gperf"
      {"prison", 1368},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
#line 1411 "bip39.gperf"
      {"quick", 1405},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
#line 1412 "bip39.gperf"
      {"quit", 1406},
      {""}, {""},
#line 1537 "bip39.gperf"
      {"satoshi", 1531},
      {""}, {""}, {""},
#line 518 "bip39.gperf"
      {"divorce", 512},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
#line 141 "bip39.gperf"
      {"axis", 135},
      {""}, {""},
#line 39 "bip39.gperf"
      {"aerobic", 33},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""},
#line 1742 "bip39.gperf"
      {"suit", 1736},
      {""}, {""}, {""}, {""},
#line 157 "bip39.gperf"
      {"base", 151},
      {""},
#line 216 "bip39.gperf"
      {"bottom", 210},
      {""}, {""}, {""}, {""},
#line 188 "bip39.gperf"
      {"bitter", 182},
#line 2027 "bip39.gperf"
      {"witness", 2021},
      {""}, {""},
#line 492 "bip39.gperf"
      {"devote", 486},
      {""}, {""}, {""}, {""}, {""},
#line 403 "bip39.gperf"
      {"coyote", 397},
      {""}, {""}, {""}, {""}, {""},
#line 2000 "bip39.gperf"
      {"welcome", 1994},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""},
#line 160 "bip39.gperf"
      {"battle", 154},
#line 1401 "bip39.gperf"
      {"purpose", 1395},
      {""}, {""}, {""}, {""},
#line 470 "bip39.gperf"
      {"deliver", 464},
      {""},
#line 1014 "bip39.gperf"
      {"lawn", 1008},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""},
#line 1319 "bip39.gperf"
      {"picnic", 1313},
      {""},
#line 1557 "bip39.gperf"
      {"sea", 1551},
      {""}, {""}, {""}, {""}, {""}, {""}, {""},
#line 178 "bip39.gperf"
      {"better", 172},
      {""}, {""}, {""}, {""},
#line 1347 "bip39.gperf"
      {"police", 1341},
      {""}, {""},
#line 1560 "bip39.gperf"
      {"seat", 1554},
#line 252 "bip39.gperf"
      {"burst", 246},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""},
#line 1559 "bip39.gperf"
      {"season", 1553},
      {""}, {""}, {""}, {""},
#line 177 "bip39.gperf"
      {"betray", 171},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
#line 1558 "bip39.gperf"
      {"search", 1552},
      {""}, {""},
#line 1115 "bip39.gperf"
      {"melt", 1109},
      {""}, {""}, {""}, {""},
#line 369 "bip39.gperf"
      {"coin", 363},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""},
#line 729 "bip39.gperf"
      {"foil", 723},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
#line 253 "bip39.gperf"
      {"bus", 247},
      {""}, {""}, {""}, {""},
#line 254 "bip39.gperf"
      {"business", 248},
      {""}, {""}, {""},
#line 1304 "bip39.gperf"
      {"pelican", 1298},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""},
#line 761 "bip39.gperf"
      {"fury", 755},
      {""},
#line 397 "bip39.gperf"
      {"couch", 391},
      {""}, {""}, {""},
#line 1482 "bip39.gperf"
      {"review", 1476},
      {""}, {""},
#line 13 "bip39.gperf"
      {"abstract", 7},
      {""}, {""}, {""}, {""}, {""},
#line 689 "bip39.gperf"
      {"fever", 683},
      {""}, {""}, {""}, {""},
#line 554 "bip39.gperf"
      {"duty", 548},
      {""}, {""},
#line 401 "bip39.gperf"
      {"cousin", 395},
      {""}, {""}, {""}, {""}, {""}, {""},
#line 1080 "bip39.gperf"
      {"main", 1074},
      {""}, {""}, {""}, {""}, {""}, {""}, {""},
#line 400 "bip39.gperf"
      {"course", 394},
#line 1065 "bip39.gperf"
      {"love", 1059},
      {""}, {""}, {""}, {""},
#line 1051 "bip39.gperf"
      {"live", 1045},
      {""},
#line 1344 "bip39.gperf"
      {"point", 1338},
      {""},
#line 125 "bip39.gperf"
      {"auction", 119},
#line 299 "bip39.gperf"
      {"caution", 293},
      {""}, {""}, {""}, {""}, {""}, {""}, {""},
#line 298 "bip39.gperf"
      {"cause", 292},
      {""}, {""}, {""}, {""},
#line 1163 "bip39.gperf"
      {"mouse", 1157},
      {""},
#line 616 "bip39.gperf"
      {"era", 610},
      {""}, {""},
#line 127 "bip39.gperf"
      {"august", 121},
      {""}, {""}, {""}, {""},
#line 627 "bip39.gperf"
      {"ethics", 621},
#line 503 "bip39.gperf"
      {"dilemma", 497},
      {""}, {""},
#line 972 "bip39.gperf"
      {"juice", 966},
      {""}, {""}, {""},
#line 494 "bip39.gperf"
      {"dial", 488},
      {""}, {""}, {""},
#line 1475 "bip39.gperf"
      {"response", 1469},
      {""}, {""}, {""}, {""}, {""}, {""},
#line 617 "bip39.gperf"
      {"erase", 611},
      {""}, {""}, {""}, {""},
#line 404 "bip39.gperf"
      {"crack", 398},
      {""}, {""}, {""}, {""},
#line 759 "bip39.gperf"
      {"funny", 753},
      {""},
#line 536 "bip39.gperf"
      {"drastic", 530},
      {""}, {""},
#line 1622 "bip39.gperf"
      {"skate", 1616},
#line 410 "bip39.gperf"
      {"crater", 404},
      {""}, {""},
#line 1035 "bip39.gperf"
      {"level", 1029},
      {""},
#line 170 "bip39.gperf"
      {"behind", 164},
      {""}, {""}, {""},
#line 409 "bip39.gperf"
      {"crash", 403},
      {""}, {""}, {""}, {""}, {""},
#line 1991 "bip39.gperf"
      {"wealth", 1985},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""},
#line 1016 "bip39.gperf"
      {"layer", 1010},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
#line 455 "bip39.gperf"
      {"deal", 449},
      {""},
#line 1297 "bip39.gperf"
      {"pause", 1291},
      {""}, {""}, {""}, {""},
#line 302 "bip39.gperf"
      {"celery", 296},
      {""}, {""}, {""}, {""}, {""},
#line 678 "bip39.gperf"
      {"favorite", 672},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""},
#line 1373 "bip39.gperf"
      {"priority", 1367},
#line 1346 "bip39.gperf"
      {"pole", 1340},
      {""},
#line 697 "bip39.gperf"
      {"filter", 691},
#line 1445 "bip39.gperf"
      {"recycle", 1439},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
#line 1362 "bip39.gperf"
      {"praise", 1356},
      {""}, {""}, {""}, {""}, {""}, {""},
#line 1361 "bip39.gperf"
      {"practice", 1355},
      {""}, {""},
#line 372 "bip39.gperf"
      {"column", 366},
      {""}, {""},
#line 1500 "bip39.gperf"
      {"river", 1494},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""},
#line 664 "bip39.gperf"
      {"false", 658},
      {""},
#line 709 "bip39.gperf"
      {"fitness", 703},
      {""}, {""},
#line 144 "bip39.gperf"
      {"bacon", 138},
      {""}, {""}, {""}, {""}, {""}, {""}, {""},
#line 1541 "bip39.gperf"
      {"say", 1535},
#line 1433 "bip39.gperf"
      {"raven", 1427},
      {""},
#line 749 "bip39.gperf"
      {"friend", 743},
#line 1525 "bip39.gperf"
      {"sadness", 1519},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""},
#line 526 "bip39.gperf"
      {"donate", 520},
      {""}, {""},
#line 1608 "bip39.gperf"
      {"sign", 1602},
      {""},
#line 11 "bip39.gperf"
      {"absent", 5},
      {""}, {""},
#line 1421 "bip39.gperf"
      {"rail", 1415},
      {""},
#line 165 "bip39.gperf"
      {"become", 159},
#line 1409 "bip39.gperf"
      {"quarter", 1403},
      {""}, {""},
#line 371 "bip39.gperf"
      {"color", 365},
      {""}, {""}, {""}, {""},
#line 1481 "bip39.gperf"
      {"reveal", 1475},
      {""}, {""}, {""}, {""}, {""},
#line 1992 "bip39.gperf"
      {"weapon", 1986},
#line 556 "bip39.gperf"
      {"dynamic", 550},
      {""}, {""}, {""},
#line 256 "bip39.gperf"
      {"butter", 250},
#line 434 "bip39.gperf"
      {"culture", 428},
      {""}, {""}, {""}, {""},
#line 760 "bip39.gperf"
      {"furnace", 754},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
#line 1726 "bip39.gperf"
      {"strike", 1720},
      {""}, {""}, {""},
#line 270 "bip39.gperf"
      {"canal", 264},
      {""}, {""},
#line 570 "bip39.gperf"
      {"educate", 564},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""},
#line 1169 "bip39.gperf"
      {"multiply", 1163},
      {""},
#line 661 "bip39.gperf"
      {"faint", 655},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""},
#line 1085 "bip39.gperf"
      {"manage", 1079},
      {""}, {""}, {""}, {""},
#line 106 "bip39.gperf"
      {"arrive", 100},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""},
#line 1325 "bip39.gperf"
      {"pilot", 1319},
      {""}, {""}, {""}, {""}, {""},
#line 14 "bip39.gperf"
      {"absurd", 8},
      {""},
#line 572 "bip39.gperf"
      {"egg", 566},
#line 204 "bip39.gperf"
      {"boat", 198},
      {""}, {""}, {""}, {""}, {""}, {""},
#line 1114 "bip39.gperf"
      {"melody", 1108},
      {""}, {""}, {""},
#line 1394 "bip39.gperf"
      {"pulse", 1388},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""},
#line 203 "bip39.gperf"
      {"board", 197},
      {""}, {""}, {""}, {""},
#line 333 "bip39.gperf"
      {"cigar", 327},
#line 1555 "bip39.gperf"
      {"script", 1549},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
#line 695 "bip39.gperf"
      {"file", 689},
#line 555 "bip39.gperf"
      {"dwarf", 549},
      {""}, {""}, {""}, {""}, {""}, {""},
#line 1306 "bip39.gperf"
      {"penalty", 1300},
#line 1540 "bip39.gperf"
      {"save", 1534},
      {""},
#line 161 "bip39.gperf"
      {"beach", 155},
#line 12 "bip39.gperf"
      {"absorb", 6},
      {""}, {""},
#line 205 "bip39.gperf"
      {"body", 199},
#line 51 "bip39.gperf"
      {"aisle", 45},
      {""}, {""},
#line 547 "bip39.gperf"
      {"dry", 541},
      {""},
#line 391 "bip39.gperf"
      {"coral", 385},
      {""}, {""}, {""}, {""}, {""}, {""}, {""},
#line 970 "bip39.gperf"
      {"joy", 964},
      {""}, {""}, {""}, {""},
#line 431 "bip39.gperf"
      {"cry", 425},
#line 1527 "bip39.gperf"
      {"sail", 1521},
#line 1112 "bip39.gperf"
      {"medal", 1106},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
#line 1579 "bip39.gperf"
      {"seven", 1573},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""},
#line 1456 "bip39.gperf"
      {"relief", 1450},
      {""}, {""}, {""},
#line 1155 "bip39.gperf"
      {"moral", 1149},
#line 131 "bip39.gperf"
      {"autumn", 125},
#line 432 "bip39.gperf"
      {"crystal", 426},
      {""}, {""}, {""}, {""},
#line 1137 "bip39.gperf"
      {"miracle", 1131},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
#line 50 "bip39.gperf"
      {"airport", 44},
      {""}, {""}, {""}, {""}, {""}, {""}, {""},
#line 1318 "bip39.gperf"
      {"piano", 1312},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""},
#line 508 "bip39.gperf"
      {"disagree", 502},
#line 1108 "bip39.gperf"
      {"mean", 1102},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""},
#line 130 "bip39.gperf"
      {"auto", 124},
      {""}, {""}, {""}, {""}, {""},
#line 1745 "bip39.gperf"
      {"sunny", 1739},
#line 1725 "bip39.gperf"
      {"street", 1719},
      {""}, {""}, {""}, {""}, {""},
#line 1406 "bip39.gperf"
      {"pyramid", 1400},
      {""},
#line 1168 "bip39.gperf"
      {"mule", 1162},
      {""}, {""}, {""},
#line 1753 "bip39.gperf"
      {"surprise", 1747},
      {""}, {""},
#line 1286 "bip39.gperf"
      {"parade", 1280},
      {""}, {""},
#line 1422 "bip39.gperf"
      {"rain", 1416},
      {""},
#line 1301 "bip39.gperf"
      {"peanut", 1295},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""},
#line 1514 "bip39.gperf"
      {"route", 1508},
      {""}, {""}, {""},
#line 698 "bip39.gperf"
      {"final", 692},
      {""}, {""}, {""}, {""},
#line 1659 "bip39.gperf"
      {"solid", 1653},
#line 105 "bip39.gperf"
      {"arrest", 99},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""},
#line 565 "bip39.gperf"
      {"echo", 559},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""},
#line 1959 "bip39.gperf"
      {"vintage", 1953},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
#line 34 "bip39.gperf"
      {"adjust", 28},
      {""},
#line 1935 "bip39.gperf"
      {"van", 1929},
      {""}, {""},
#line 1936 "bip39.gperf"
      {"vanish", 1930},
      {""}, {""}, {""},
#line 376 "bip39.gperf"
      {"comic", 370},
#line 95 "bip39.gperf"
      {"arctic", 89},
#line 1756 "bip39.gperf"
      {"suspect", 1750},
      {""},
#line 1531 "bip39.gperf"
      {"salt", 1525},
      {""}, {""}, {""}, {""}, {""}, {""},
#line 1554 "bip39.gperf"
      {"screen", 1548},
      {""}, {""}, {""},
#line 541 "bip39.gperf"
      {"drill", 535},
      {""}, {""},
#line 1728 "bip39.gperf"
      {"struggle", 1722},
      {""},
#line 98 "bip39.gperf"
      {"argue", 92},
#line 152 "bip39.gperf"
      {"banner", 146},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
#line 1625 "bip39.gperf"
      {"skill", 1619},
      {""}, {""}, {""}, {""}, {""}, {""}, {""},
#line 1148 "bip39.gperf"
      {"mom", 1142},
      {""}, {""}, {""}, {""}, {""}, {""},
#line 1132 "bip39.gperf"
      {"mimic", 1126},
      {""},
#line 1944 "bip39.gperf"
      {"venture", 1938},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
#line 472 "bip39.gperf"
      {"demise", 466},
      {""},
#line 108 "bip39.gperf"
      {"art", 102},
      {""}, {""},
#line 110 "bip39.gperf"
      {"artist", 104},
      {""},
#line 219 "bip39.gperf"
      {"boy", 213},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
#line 1727 "bip39.gperf"
      {"strong", 1721},
      {""}, {""}, {""}, {""},
#line 1767 "bip39.gperf"
      {"switch", 1761},
#line 1455 "bip39.gperf"
      {"release", 1449},
      {""}, {""},
#line 1715 "bip39.gperf"
      {"stick", 1709},
      {""}, {""}, {""},
#line 1437 "bip39.gperf"
      {"real", 1431},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""},
#line 1556 "bip39.gperf"
      {"scrub", 1550},
#line 1052 "bip39.gperf"
      {"lizard", 1046},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
#line 107 "bip39.gperf"
      {"arrow", 101},
      {""}, {""}, {""}, {""}, {""},
#line 458 "bip39.gperf"
      {"decade", 452},
      {""}, {""}, {""}, {""},
#line 1671 "bip39.gperf"
      {"south", 1665},
      {""}, {""}, {""}, {""},
#line 163 "bip39.gperf"
      {"beauty", 157},
      {""}, {""},
#line 629 "bip39.gperf"
      {"evil", 623},
      {""}, {""}, {""}, {""}, {""}, {""}, {""},
#line 1961 "bip39.gperf"
      {"virtual", 1955},
      {""},
#line 543 "bip39.gperf"
      {"drip", 537},
      {""}, {""}, {""}, {""}, {""}, {""},
#line 1538 "bip39.gperf"
      {"sauce", 1532},
#line 1670 "bip39.gperf"
      {"source", 1664},
      {""}, {""},
#line 38 "bip39.gperf"
      {"advice", 32},
      {""},
#line 1938 "bip39.gperf"
      {"various", 1932},
      {""},
#line 2015 "bip39.gperf"
      {"will", 2009},
      {""}, {""},
#line 181 "bip39.gperf"
      {"bicycle", 175},
      {""}, {""}, {""}, {""}, {""},
#line 655 "bip39.gperf"
      {"eye", 649},
#line 1054 "bip39.gperf"
      {"loan", 1048},
      {""}, {""}, {""},
#line 1539 "bip39.gperf"
      {"sausage", 1533},
#line 499 "bip39.gperf"
      {"diet", 493},
      {""}, {""},
#line 293 "bip39.gperf"
      {"catalog", 287},
      {""},
#line 523 "bip39.gperf"
      {"doll", 517},
      {""}, {""}, {""}, {""}, {""}, {""},
#line 498 "bip39.gperf"
      {"diesel", 492},
      {""}, {""},
#line 1979 "bip39.gperf"
      {"wall", 1973},
      {""},
#line 1947 "bip39.gperf"
      {"verify", 1941},
#line 639 "bip39.gperf"
      {"execute", 633},
      {""}, {""}, {""},
#line 488 "bip39.gperf"
      {"detail", 482},
#line 370 "bip39.gperf"
      {"collect", 364},
      {""}, {""}, {""},
#line 1609 "bip39.gperf"
      {"silent", 1603},
      {""},
#line 1550 "bip39.gperf"
      {"scissors", 1544},
      {""}, {""}, {""}, {""}, {""}, {""},
#line 1964 "bip39.gperf"
      {"visit", 1958},
      {""}, {""},
#line 1215 "bip39.gperf"
      {"now", 1209},
      {""}, {""}, {""},
#line 1948 "bip39.gperf"
      {"version", 1942},
      {""}, {""}, {""}, {""}, {""}, {""}, {""},
#line 1025 "bip39.gperf"
      {"legal", 1019},
      {""}, {""},
#line 640 "bip39.gperf"
      {"exercise", 634},
#line 265 "bip39.gperf"
      {"call", 259},
      {""},
#line 1356 "bip39.gperf"
      {"potato", 1350},
      {""}, {""},
#line 1200 "bip39.gperf"
      {"next", 1194},
      {""}, {""}, {""}, {""},
#line 374 "bip39.gperf"
      {"come", 368},
      {""}, {""},
#line 1131 "bip39.gperf"
      {"million", 1125},
      {""}, {""}, {""}, {""}, {""}, {""}, {""},
#line 1126 "bip39.gperf"
      {"metal", 1120},
      {""}, {""}, {""},
#line 1939 "bip39.gperf"
      {"vast", 1933},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
#line 464 "bip39.gperf"
      {"deer", 458},
      {""},
#line 1568 "bip39.gperf"
      {"select", 1562},
      {""}, {""},
#line 206 "bip39.gperf"
      {"boil", 200},
#line 1321 "bip39.gperf"
      {"piece", 1315},
      {""}, {""}, {""},
#line 1343 "bip39.gperf"
      {"poet", 1337},
#line 227 "bip39.gperf"
      {"brick", 221},
#line 267 "bip39.gperf"
      {"camera", 261},
      {""}, {""}, {""}, {""},
#line 1149 "bip39.gperf"
      {"moment", 1143},
      {""}, {""}, {""},
#line 1956 "bip39.gperf"
      {"video", 1950},
      {""}, {""}, {""},
#line 1324 "bip39.gperf"
      {"pill", 1318},
#line 1419 "bip39.gperf"
      {"radar", 1413},
      {""}, {""}, {""}, {""},
#line 232 "bip39.gperf"
      {"brisk", 226},
      {""}, {""}, {""}, {""}, {""},
#line 1950 "bip39.gperf"
      {"vessel", 1944},
      {""},
#line 109 "bip39.gperf"
      {"artefact", 103},
      {""}, {""}, {""}, {""},
#line 1660 "bip39.gperf"
      {"solution", 1654},
#line 1199 "bip39.gperf"
      {"news", 1193},
#line 542 "bip39.gperf"
      {"drink", 536},
#line 303 "bip39.gperf"
      {"cement", 297},
      {""}, {""}, {""}, {""}, {""},
#line 23 "bip39.gperf"
      {"acquire", 17},
      {""},
#line 967 "bip39.gperf"
      {"join", 961},
#line 1208 "bip39.gperf"
      {"north", 1202},
      {""}, {""}, {""},
#line 1626 "bip39.gperf"
      {"skin", 1620},
      {""}, {""},
#line 524 "bip39.gperf"
      {"dolphin", 518},
      {""}, {""}, {""},
#line 1483 "bip39.gperf"
      {"reward", 1477},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
#line 1532 "bip39.gperf"
      {"salute", 1526},
      {""}, {""}, {""}, {""},
#line 666 "bip39.gperf"
      {"family", 660},
      {""}, {""},
#line 1651 "bip39.gperf"
      {"soap", 1645},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
#line 123 "bip39.gperf"
      {"attitude", 117},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
#line 427 "bip39.gperf"
      {"cruise", 421},
      {""}, {""}, {""}, {""},
#line 641 "bip39.gperf"
      {"exhaust", 635},
#line 425 "bip39.gperf"
      {"crucial", 419},
      {""}, {""}, {""}, {""}, {""}, {""},
#line 1945 "bip39.gperf"
      {"venue", 1939},
#line 1182 "bip39.gperf"
      {"narrow", 1176},
      {""}, {""},
#line 255 "bip39.gperf"
      {"busy", 249},
      {""}, {""}, {""},
#line 17 "bip39.gperf"
      {"accident", 11},
      {""}, {""},
#line 430 "bip39.gperf"
      {"crush", 424},
      {""}, {""}, {""}, {""}, {""},
#line 124 "bip39.gperf"
      {"attract", 118},
      {""}, {""}, {""}, {""}, {""},
#line 969 "bip39.gperf"
      {"journey", 963},
      {""},
#line 1530 "bip39.gperf"
      {"salon", 1524},
      {""}, {""}, {""}, {""},
#line 1045 "bip39.gperf"
      {"limit", 1039},
      {""},
#line 1954 "bip39.gperf"
      {"vicious", 1948},
      {""}, {""},
#line 1372 "bip39.gperf"
      {"print", 1366},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""},
#line 1955 "bip39.gperf"
      {"victory", 1949},
      {""},
#line 1519 "bip39.gperf"
      {"rule", 1513},
      {""}, {""},
#line 1549 "bip39.gperf"
      {"science", 1543},
      {""}, {""}, {""}, {""}, {""}, {""}, {""},
#line 1183 "bip39.gperf"
      {"nasty", 1177},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
#line 1655 "bip39.gperf"
      {"soda", 1649},
      {""},
#line 281 "bip39.gperf"
      {"carbon", 275},
      {""}, {""}, {""},
#line 1070 "bip39.gperf"
      {"lunar", 1064},
      {""}, {""},
#line 25 "bip39.gperf"
      {"act", 19},
      {""}, {""},
#line 26 "bip39.gperf"
      {"action", 20},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""},
#line 1194 "bip39.gperf"
      {"nest", 1188},
#line 1931 "bip39.gperf"
      {"vague", 1925},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
#line 1056 "bip39.gperf"
      {"local", 1050},
      {""}, {""}, {""}, {""},
#line 1962 "bip39.gperf"
      {"virus", 1956},
#line 1091 "bip39.gperf"
      {"marble", 1085},
#line 148 "bip39.gperf"
      {"balcony", 142},
      {""}, {""}, {""}, {""}, {""}, {""}, {""},
#line 674 "bip39.gperf"
      {"fatal", 668},
#line 1980 "bip39.gperf"
      {"walnut", 1974},
#line 28 "bip39.gperf"
      {"actress", 22},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
#line 399 "bip39.gperf"
      {"couple", 393},
      {""}, {""}, {""},
#line 1704 "bip39.gperf"
      {"stairs", 1698},
      {""}, {""}, {""}, {""},
#line 731 "bip39.gperf"
      {"follow", 725},
#line 171 "bip39.gperf"
      {"believe", 165},
      {""}, {""},
#line 229 "bip39.gperf"
      {"brief", 223},
#line 1117 "bip39.gperf"
      {"memory", 1111},
#line 962 "bip39.gperf"
      {"jealous", 956},
      {""}, {""},
#line 1708 "bip39.gperf"
      {"state", 1702},
#line 24 "bip39.gperf"
      {"across", 18},
      {""}, {""},
#line 173 "bip39.gperf"
      {"belt", 167},
      {""}, {""}, {""}, {""},
#line 1921 "bip39.gperf"
      {"urge", 1915},
#line 1761 "bip39.gperf"
      {"swarm", 1755},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""},
#line 180 "bip39.gperf"
      {"beyond", 174},
      {""}, {""},
#line 663 "bip39.gperf"
      {"fall", 657},
#line 1707 "bip39.gperf"
      {"start", 1701},
      {""}, {""}, {""}, {""},
#line 1969 "bip39.gperf"
      {"voice", 1963},
      {""}, {""},
#line 682 "bip39.gperf"
      {"fee", 676},
#line 2038 "bip39.gperf"
      {"wrap", 2032},
      {""}, {""}, {""}, {""}, {""}, {""},
#line 1547 "bip39.gperf"
      {"scheme", 1541},
      {""}, {""}, {""}, {""},
#line 1965 "bip39.gperf"
      {"visual", 1959},
      {""}, {""}, {""}, {""}, {""},
#line 1407 "bip39.gperf"
      {"quality", 1401},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""},
#line 665 "bip39.gperf"
      {"fame", 659},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""},
#line 122 "bip39.gperf"
      {"attend", 116},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
#line 426 "bip39.gperf"
      {"cruel", 420},
      {""}, {""}, {""}, {""},
#line 1460 "bip39.gperf"
      {"remind", 1454},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""},
#line 1545 "bip39.gperf"
      {"scatter", 1539},
      {""}, {""}, {""},
#line 16 "bip39.gperf"
      {"access", 10},
      {""}, {""},
#line 1209 "bip39.gperf"
      {"nose", 1203},
      {""}, {""}, {""}, {""}, {""}, {""},
#line 750 "bip39.gperf"
      {"fringe", 744},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
#line 1544 "bip39.gperf"
      {"scare", 1538},
      {""}, {""}, {""}, {""}, {""},
#line 1213 "bip39.gperf"
      {"notice", 1207},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""},
#line 20 "bip39.gperf"
      {"achieve", 14},
#line 398 "bip39.gperf"
      {"country", 392},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""},
#line 756 "bip39.gperf"
      {"fruit", 750},
      {""}, {""}, {""},
#line 594 "bip39.gperf"
      {"end", 588},
      {""}, {""}, {""}, {""},
#line 244 "bip39.gperf"
      {"build", 238},
#line 1184 "bip39.gperf"
      {"nation", 1178},
      {""}, {""}, {""}, {""},
#line 1441 "bip39.gperf"
      {"recall", 1435},
      {""}, {""}, {""}, {""},
#line 1511 "bip39.gperf"
      {"rotate", 1505},
#line 7 "bip39.gperf"
      {"ability", 1},
      {""},
#line 1392 "bip39.gperf"
      {"pull", 1386},
#line 221 "bip39.gperf"
      {"brain", 215},
      {""}, {""}, {""},
#line 1162 "bip39.gperf"
      {"mountain", 1156},
      {""}, {""},
#line 220 "bip39.gperf"
      {"bracket", 214},
      {""}, {""}, {""},
#line 677 "bip39.gperf"
      {"fault", 671},
      {""}, {""}, {""}, {""}, {""}, {""},
#line 1195 "bip39.gperf"
      {"net", 1189},
#line 1973 "bip39.gperf"
      {"vote", 1967},
#line 257 "bip39.gperf"
      {"buyer", 251},
      {""},
#line 1834 "bip39.gperf"
      {"tonight", 1828},
      {""}, {""},
#line 223 "bip39.gperf"
      {"brass", 217},
      {""}, {""}, {""}, {""}, {""},
#line 1548 "bip39.gperf"
      {"school", 1542},
      {""},
#line 601 "bip39.gperf"
      {"engine", 595},
      {""}, {""},
#line 19 "bip39.gperf"
      {"accuse", 13},
#line 573 "bip39.gperf"
      {"eight", 567},
      {""}, {""}, {""}, {""},
#line 1613 "bip39.gperf"
      {"similar", 1607},
      {""}, {""},
#line 1218 "bip39.gperf"
      {"nurse", 1212},
      {""}, {""}, {""}, {""},
#line 1204 "bip39.gperf"
      {"noise", 1198},
      {""},
#line 1941 "bip39.gperf"
      {"vehicle", 1935},
      {""}, {""},
#line 408 "bip39.gperf"
      {"crane", 402},
      {""}, {""}, {""}, {""}, {""},
#line 667 "bip39.gperf"
      {"famous", 661},
      {""}, {""}, {""},
#line 1522 "bip39.gperf"
      {"rural", 1516},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
#line 1785 "bip39.gperf"
      {"taxi", 1779},
      {""}, {""}, {""},
#line 606 "bip39.gperf"
      {"enrich", 600},
      {""}, {""}, {""}, {""}, {""}, {""},
#line 1424 "bip39.gperf"
      {"rally", 1418},
      {""}, {""},
#line 1789 "bip39.gperf"
      {"ten", 1783},
      {""}, {""},
#line 1930 "bip39.gperf"
      {"vacuum", 1924},
#line 1951 "bip39.gperf"
      {"veteran", 1945},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
#line 18 "bip39.gperf"
      {"account", 12},
      {""},
#line 1792 "bip39.gperf"
      {"tent", 1786},
      {""}, {""},
#line 1570 "bip39.gperf"
      {"seminar", 1564},
      {""}, {""}, {""},
#line 29 "bip39.gperf"
      {"actual", 23},
#line 1191 "bip39.gperf"
      {"neither", 1185},
      {""}, {""}, {""}, {""}, {""}, {""}, {""},
#line 963 "bip39.gperf"
      {"jeans", 957},
      {""},
#line 2010 "bip39.gperf"
      {"whisper", 2004},
      {""},
#line 1795 "bip39.gperf"
      {"text", 1789},
      {""}, {""}, {""}, {""}, {""}, {""}, {""},
#line 329 "bip39.gperf"
      {"chronic", 323},
      {""},
#line 1201 "bip39.gperf"
      {"nice", 1195},
      {""}, {""}, {""}, {""}, {""}, {""}, {""},
#line 323 "bip39.gperf"
      {"chicken", 317},
      {""},
#line 1393 "bip39.gperf"
      {"pulp", 1387},
      {""}, {""}, {""}, {""}, {""}, {""},
#line 2026 "bip39.gperf"
      {"wish", 2020},
      {""}, {""},
#line 1457 "bip39.gperf"
      {"rely", 1451},
      {""}, {""}, {""}, {""}, {""}, {""}, {""},
#line 381 "bip39.gperf"
      {"confirm", 375},
      {""}, {""}, {""}, {""}, {""},
#line 1459 "bip39.gperf"
      {"remember", 1453},
      {""}, {""}, {""}, {""}, {""}, {""},
#line 27 "bip39.gperf"
      {"actor", 21},
#line 511 "bip39.gperf"
      {"dish", 505},
#line 1408 "bip39.gperf"
      {"quantum", 1402},
      {""}, {""}, {""},
#line 1985 "bip39.gperf"
      {"wash", 1979},
#line 2053 "bip39.gperf"
      {"zoo", 2047},
#line 1775 "bip39.gperf"
      {"tag", 1769},
      {""},
#line 136 "bip39.gperf"
      {"aware", 130},
      {""}, {""}, {""}, {""},
#line 1028 "bip39.gperf"
      {"lemon", 1022},
#line 386 "bip39.gperf"
      {"convince", 380},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
#line 1840 "bip39.gperf"
      {"torch", 1834},
#line 151 "bip39.gperf"
      {"banana", 145},
      {""}, {""},
#line 1211 "bip39.gperf"
      {"note", 1205},
      {""},
#line 451 "bip39.gperf"
      {"dash", 445},
      {""}, {""}, {""}, {""},
#line 613 "bip39.gperf"
      {"episode", 607},
      {""},
#line 1842 "bip39.gperf"
      {"tortoise", 1836},
      {""},
#line 1740 "bip39.gperf"
      {"sugar", 1734},
      {""}, {""}, {""},
#line 781 "bip39.gperf"
      {"genius", 775},
      {""},
#line 288 "bip39.gperf"
      {"cash", 282},
      {""},
#line 529 "bip39.gperf"
      {"door", 523},
#line 275 "bip39.gperf"
      {"canvas", 269},
      {""},
#line 42 "bip39.gperf"
      {"afraid", 36},
      {""}, {""}, {""},
#line 646 "bip39.gperf"
      {"exotic", 640},
      {""}, {""}, {""},
#line 783 "bip39.gperf"
      {"gentle", 777},
#line 172 "bip39.gperf"
      {"below", 166},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""},
#line 1611 "bip39.gperf"
      {"silly", 1605},
      {""}, {""}, {""}, {""}, {""}, {""}, {""},
#line 782 "bip39.gperf"
      {"genre", 776},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""},
#line 1832 "bip39.gperf"
      {"tone", 1826},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""},
#line 743 "bip39.gperf"
      {"found", 737},
      {""}, {""}, {""}, {""}, {""},
#line 1662 "bip39.gperf"
      {"someone", 1656},
      {""}, {""}, {""},
#line 1124 "bip39.gperf"
      {"mesh", 1118},
      {""}, {""}, {""}, {""}, {""}, {""}, {""},
#line 1843 "bip39.gperf"
      {"toss", 1837},
      {""}, {""}, {""}, {""},
#line 868 "bip39.gperf"
      {"hint", 862},
#line 30 "bip39.gperf"
      {"adapt", 24},
#line 1820 "bip39.gperf"
      {"tissue", 1814},
      {""}, {""},
#line 1569 "bip39.gperf"
      {"sell", 1563},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
#line 1533 "bip39.gperf"
      {"same", 1527},
#line 811 "bip39.gperf"
      {"gorilla", 805},
      {""}, {""}, {""}, {""},
#line 1783 "bip39.gperf"
      {"taste", 1777},
      {""},
#line 1982 "bip39.gperf"
      {"warfare", 1976},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
#line 1461 "bip39.gperf"
      {"remove", 1455},
      {""}, {""}, {""}, {""}, {""}, {""}, {""},
#line 264 "bip39.gperf"
      {"cake", 258},
      {""},
#line 1185 "bip39.gperf"
      {"nature", 1179},
      {""}, {""}, {""}, {""}, {""}, {""},
#line 863 "bip39.gperf"
      {"hen", 857},
#line 1812 "bip39.gperf"
      {"tide", 1806},
#line 1847 "bip39.gperf"
      {"tower", 1841},
      {""}, {""}, {""},
#line 1794 "bip39.gperf"
      {"test", 1788},
      {""}, {""}, {""}, {""}, {""}, {""},
#line 15 "bip39.gperf"
      {"abuse", 9},
      {""}, {""}, {""},
#line 1716 "bip39.gperf"
      {"still", 1710},
      {""}, {""},
#line 1219 "bip39.gperf"
      {"nut", 1213},
#line 162 "bip39.gperf"
      {"bean", 156},
      {""}, {""},
#line 1064 "bip39.gperf"
      {"lounge", 1058},
      {""}, {""}, {""}, {""}, {""}, {""},
#line 1082 "bip39.gperf"
      {"make", 1076},
#line 324 "bip39.gperf"
      {"chief", 318},
      {""}, {""}, {""}, {""}, {""}, {""}, {""},
#line 48 "bip39.gperf"
      {"aim", 42},
      {""}, {""}, {""}, {""}, {""}, {""},
#line 635 "bip39.gperf"
      {"exchange", 629},
      {""}, {""},
#line 1827 "bip39.gperf"
      {"together", 1821},
      {""},
#line 1813 "bip39.gperf"
      {"tiger", 1807},
      {""}, {""}, {""},
#line 596 "bip39.gperf"
      {"endorse", 590},
#line 1667 "bip39.gperf"
      {"soul", 1661},
      {""}, {""},
#line 1011 "bip39.gperf"
      {"laundry", 1005},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""},
#line 8 "bip39.gperf"
      {"able", 2},
      {""}, {""}, {""}, {""},
#line 813 "bip39.gperf"
      {"gossip", 807},
      {""}, {""},
#line 378 "bip39.gperf"
      {"company", 372},
#line 610 "bip39.gperf"
      {"entire", 604},
      {""},
#line 2039 "bip39.gperf"
      {"wreck", 2033},
#line 774 "bip39.gperf"
      {"gas", 768},
      {""},
#line 574 "bip39.gperf"
      {"either", 568},
      {""},
#line 46 "bip39.gperf"
      {"agree", 40},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
#line 447 "bip39.gperf"
      {"damp", 441},
#line 1819 "bip39.gperf"
      {"tired", 1813},
      {""}, {""}, {""}, {""}, {""}, {""},
#line 2040 "bip39.gperf"
      {"wrestle", 2034},
      {""},
#line 1074 "bip39.gperf"
      {"machine", 1068},
      {""},
#line 1599 "bip39.gperf"
      {"shrimp", 1593},
      {""}, {""},
#line 268 "bip39.gperf"
      {"camp", 262},
#line 576 "bip39.gperf"
      {"elder", 570},
      {""}, {""}, {""}, {""},
#line 780 "bip39.gperf"
      {"general", 774},
      {""},
#line 611 "bip39.gperf"
      {"entry", 605},
      {""}, {""}, {""}, {""},
#line 1042 "bip39.gperf"
      {"light", 1036},
      {""}, {""},
#line 539 "bip39.gperf"
      {"dress", 533},
      {""}, {""}, {""}, {""},
#line 884 "bip39.gperf"
      {"horse", 878},
#line 1623 "bip39.gperf"
      {"sketch", 1617},
      {""}, {""}, {""},
#line 785 "bip39.gperf"
      {"gesture", 779},
      {""},
#line 1310 "bip39.gperf"
      {"perfect", 1304},
      {""}, {""},
#line 1111 "bip39.gperf"
      {"mechanic", 1105},
      {""}, {""},
#line 1159 "bip39.gperf"
      {"mother", 1153},
      {""}, {""},
#line 883 "bip39.gperf"
      {"horror", 877},
      {""},
#line 607 "bip39.gperf"
      {"enroll", 601},
      {""}, {""}, {""},
#line 779 "bip39.gperf"
      {"gaze", 773},
      {""}, {""}, {""},
#line 707 "bip39.gperf"
      {"fish", 701},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
#line 848 "bip39.gperf"
      {"harsh", 842},
#line 1178 "bip39.gperf"
      {"myth", 1172},
      {""},
#line 608 "bip39.gperf"
      {"ensure", 602},
#line 1949 "bip39.gperf"
      {"very", 1943},
      {""},
#line 1513 "bip39.gperf"
      {"round", 1507},
      {""}, {""}, {""}, {""},
#line 1102 "bip39.gperf"
      {"math", 1096},
      {""},
#line 733 "bip39.gperf"
      {"foot", 727},
      {""},
#line 1695 "bip39.gperf"
      {"spring", 1689},
      {""}, {""}, {""}, {""},
#line 879 "bip39.gperf"
      {"honey", 873},
      {""}, {""}, {""},
#line 672 "bip39.gperf"
      {"fashion", 666},
      {""}, {""}, {""}, {""},
#line 2004 "bip39.gperf"
      {"what", 1998},
      {""}, {""}, {""}, {""}, {""},
#line 1669 "bip39.gperf"
      {"soup", 1663},
      {""}, {""}, {""},
#line 886 "bip39.gperf"
      {"host", 880},
#line 964 "bip39.gperf"
      {"jelly", 958},
      {""}, {""}, {""}, {""}, {""}, {""},
#line 871 "bip39.gperf"
      {"history", 865},
#line 1127 "bip39.gperf"
      {"method", 1121},
      {""}, {""},
#line 837 "bip39.gperf"
      {"gun", 831},
      {""}, {""},
#line 1186 "bip39.gperf"
      {"near", 1180},
#line 308 "bip39.gperf"
      {"chair", 302},
#line 1367 "bip39.gperf"
      {"pretty", 1361},
      {""}, {""},
#line 1967 "bip39.gperf"
      {"vivid", 1961},
#line 784 "bip39.gperf"
      {"genuine", 778},
#line 1293 "bip39.gperf"
      {"path", 1287},
      {""}, {""}, {""}, {""}, {""},
#line 1366 "bip39.gperf"
      {"present", 1360},
      {""},
#line 316 "bip39.gperf"
      {"chat", 310},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
#line 1480 "bip39.gperf"
      {"reunion", 1474},
      {""},
#line 315 "bip39.gperf"
      {"chase", 309},
#line 1784 "bip39.gperf"
      {"tattoo", 1778},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""},
#line 441 "bip39.gperf"
      {"cushion", 435},
      {""},
#line 314 "bip39.gperf"
      {"charge", 308},
      {""},
#line 1410 "bip39.gperf"
      {"question", 1404},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
#line 1492 "bip39.gperf"
      {"right", 1486},
      {""}, {""}, {""}, {""},
#line 1190 "bip39.gperf"
      {"neglect", 1184},
      {""}, {""}, {""},
#line 1885 "bip39.gperf"
      {"turtle", 1879},
      {""}, {""}, {""}, {""}, {""}, {""}, {""},
#line 583 "bip39.gperf"
      {"else", 577},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""},
#line 1172 "bip39.gperf"
      {"mushroom", 1166},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
#line 1766 "bip39.gperf"
      {"swing", 1760},
#line 1628 "bip39.gperf"
      {"skull", 1622},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""},
#line 1717 "bip39.gperf"
      {"sting", 1711},
      {""}, {""}, {""}, {""}, {""}, {""},
#line 609 "bip39.gperf"
      {"enter", 603},
#line 1012 "bip39.gperf"
      {"lava", 1006},
      {""}, {""}, {""},
#line 164 "bip39.gperf"
      {"because", 158},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
#line 1403 "bip39.gperf"
      {"push", 1397},
      {""}, {""}, {""},
#line 35 "bip39.gperf"
      {"admit", 29},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
#line 1066 "bip39.gperf"
      {"loyal", 1060},
      {""}, {""}, {""},
#line 870 "bip39.gperf"
      {"hire", 864},
      {""},
#line 1668 "bip39.gperf"
      {"sound", 1662},
      {""}, {""}, {""},
#line 415 "bip39.gperf"
      {"creek", 409},
      {""}, {""}, {""},
#line 897 "bip39.gperf"
      {"hunt", 891},
      {""}, {""}, {""}, {""},
#line 1043 "bip39.gperf"
      {"like", 1037},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""},
#line 6 "bip39.gperf"
      {"abandon", 0},
      {""}, {""},
#line 469 "bip39.gperf"
      {"delay", 463},
      {""}, {""}, {""}, {""},
#line 582 "bip39.gperf"
      {"elite", 576},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
#line 1003 "bip39.gperf"
      {"lake", 997},
      {""}, {""}, {""}, {""}, {""},
#line 347 "bip39.gperf"
      {"click", 341},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""},
#line 1495 "bip39.gperf"
      {"riot", 1489},
#line 149 "bip39.gperf"
      {"ball", 143},
#line 1345 "bip39.gperf"
      {"polar", 1339},
#line 621 "bip39.gperf"
      {"erupt", 615},
      {""},
#line 440 "bip39.gperf"
      {"curve", 434},
      {""},
#line 1694 "bip39.gperf"
      {"spread", 1688},
      {""}, {""}, {""}, {""}, {""}, {""},
#line 626 "bip39.gperf"
      {"eternal", 620},
      {""}, {""},
#line 693 "bip39.gperf"
      {"field", 687},
      {""},
#line 1758 "bip39.gperf"
      {"swallow", 1752},
      {""}, {""}, {""}, {""}, {""}, {""},
#line 1499 "bip39.gperf"
      {"rival", 1493},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
#line 675 "bip39.gperf"
      {"father", 669},
      {""},
#line 748 "bip39.gperf"
      {"fresh", 742},
#line 1279 "bip39.gperf"
      {"palace", 1273},
#line 1607 "bip39.gperf"
      {"sight", 1601},
      {""}, {""},
#line 1600 "bip39.gperf"
      {"shrug", 1594},
      {""},
#line 740 "bip39.gperf"
      {"forward", 734},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""},
#line 1983 "bip39.gperf"
      {"warm", 1977},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
#line 1709 "bip39.gperf"
      {"stay", 1703},
      {""},
#line 1166 "bip39.gperf"
      {"much", 1160},
      {""},
#line 850 "bip39.gperf"
      {"hat", 844},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""},
#line 684 "bip39.gperf"
      {"feel", 678},
#line 1515 "bip39.gperf"
      {"royal", 1509},
      {""}, {""}, {""}, {""}, {""}, {""},
#line 119 "bip39.gperf"
      {"athlete", 113},
      {""}, {""}, {""}, {""}, {""}, {""}, {""},
#line 231 "bip39.gperf"
      {"bring", 225},
      {""}, {""}, {""},
#line 1004 "bip39.gperf"
      {"lamp", 998},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
#line 93 "bip39.gperf"
      {"april", 87},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
#line 900 "bip39.gperf"
      {"hurt", 894},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""},
#line 1542 "bip39.gperf"
      {"scale", 1536},
      {""}, {""},
#line 512 "bip39.gperf"
      {"dismiss", 506},
      {""}, {""}, {""}, {""}, {""}, {""},
#line 899 "bip39.gperf"
      {"hurry", 893},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""},
#line 1760 "bip39.gperf"
      {"swap", 1754},
      {""},
#line 239 "bip39.gperf"
      {"brush", 233},
      {""}, {""}, {""}, {""}, {""},
#line 1395 "bip39.gperf"
      {"pumpkin", 1389},
      {""}, {""}, {""},
#line 1488 "bip39.gperf"
      {"rich", 1482},
#line 593 "bip39.gperf"
      {"enact", 587},
      {""},
#line 864 "bip39.gperf"
      {"hero", 858},
      {""}, {""}, {""}, {""}, {""}, {""}, {""},
#line 776 "bip39.gperf"
      {"gate", 770},
      {""},
#line 840 "bip39.gperf"
      {"hair", 834},
      {""}, {""}, {""}, {""},
#line 1682 "bip39.gperf"
      {"spice", 1676},
      {""}, {""},
#line 429 "bip39.gperf"
      {"crunch", 423},
      {""}, {""}, {""},
#line 169 "bip39.gperf"
      {"behave", 163},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
#line 595 "bip39.gperf"
      {"endless", 589},
      {""}, {""}, {""}, {""}, {""},
#line 312 "bip39.gperf"
      {"chaos", 306},
      {""},
#line 1311 "bip39.gperf"
      {"permit", 1305},
      {""}, {""},
#line 1686 "bip39.gperf"
      {"spirit", 1680},
      {""}, {""}, {""},
#line 1214 "bip39.gperf"
      {"novel", 1208},
      {""}, {""}, {""}, {""}, {""}, {""},
#line 348 "bip39.gperf"
      {"client", 342},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""},
#line 1425 "bip39.gperf"
      {"ramp", 1419},
      {""}, {""}, {""}, {""}, {""}, {""}, {""},
#line 1971 "bip39.gperf"
      {"volcano", 1965},
      {""}, {""}, {""}, {""}, {""},
#line 1317 "bip39.gperf"
      {"physical", 1311},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""},
#line 1432 "bip39.gperf"
      {"rather", 1426},
      {""},
#line 43 "bip39.gperf"
      {"again", 37},
      {""}, {""}, {""},
#line 86 "bip39.gperf"
      {"anxiety", 80},
#line 1932 "bip39.gperf"
      {"valid", 1926},
      {""},
#line 1879 "bip39.gperf"
      {"tuition", 1873},
      {""},
#line 1817 "bip39.gperf"
      {"tiny", 1811},
#line 887 "bip39.gperf"
      {"hotel", 881},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
#line 1198 "bip39.gperf"
      {"never", 1192},
      {""},
#line 36 "bip39.gperf"
      {"adult", 30},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
#line 1822 "bip39.gperf"
      {"toast", 1816},
      {""}, {""}, {""},
#line 891 "bip39.gperf"
      {"huge", 885},
      {""}, {""}, {""}, {""},
#line 907 "bip39.gperf"
      {"idle", 901},
      {""}, {""}, {""}, {""},
#line 1996 "bip39.gperf"
      {"web", 1990},
      {""}, {""}, {""}, {""}, {""}, {""},
#line 260 "bip39.gperf"
      {"cabin", 254},
      {""}, {""}, {""}, {""}, {""},
#line 1145 "bip39.gperf"
      {"mobile", 1139},
      {""},
#line 984 "bip39.gperf"
      {"kid", 978},
#line 1706 "bip39.gperf"
      {"stand", 1700},
      {""}, {""}, {""}, {""},
#line 993 "bip39.gperf"
      {"kiwi", 987},
      {""},
#line 603 "bip39.gperf"
      {"enjoy", 597},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""},
#line 1786 "bip39.gperf"
      {"teach", 1780},
#line 519 "bip39.gperf"
      {"dizzy", 513},
      {""}, {""}, {""},
#line 325 "bip39.gperf"
      {"child", 319},
#line 1587 "bip39.gperf"
      {"shield", 1581},
      {""}, {""}, {""}, {""}, {""}, {""},
#line 1724 "bip39.gperf"
      {"strategy", 1718},
      {""}, {""}, {""}, {""},
#line 624 "bip39.gperf"
      {"essence", 618},
      {""}, {""}, {""}, {""}, {""}, {""},
#line 1732 "bip39.gperf"
      {"style", 1726},
      {""}, {""},
#line 2032 "bip39.gperf"
      {"wool", 2026},
      {""},
#line 704 "bip39.gperf"
      {"firm", 698},
#line 2050 "bip39.gperf"
      {"zebra", 2044},
#line 457 "bip39.gperf"
      {"debris", 451},
      {""}, {""}, {""},
#line 247 "bip39.gperf"
      {"bullet", 241},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""},
#line 137 "bip39.gperf"
      {"away", 131},
#line 1575 "bip39.gperf"
      {"service", 1569},
      {""}, {""}, {""},
#line 836 "bip39.gperf"
      {"guitar", 830},
      {""},
#line 1614 "bip39.gperf"
      {"simple", 1608},
      {""}, {""}, {""},
#line 671 "bip39.gperf"
      {"farm", 665},
      {""},
#line 104 "bip39.gperf"
      {"arrange", 98},
      {""}, {""},
#line 339 "bip39.gperf"
      {"claim", 333},
      {""},
#line 806 "bip39.gperf"
      {"goat", 800},
#line 388 "bip39.gperf"
      {"cool", 382},
      {""}, {""},
#line 619 "bip39.gperf"
      {"erosion", 613},
#line 77 "bip39.gperf"
      {"angry", 71},
      {""}, {""}, {""}, {""},
#line 1770 "bip39.gperf"
      {"symptom", 1764},
      {""},
#line 757 "bip39.gperf"
      {"fuel", 751},
      {""}, {""}, {""}, {""},
#line 1543 "bip39.gperf"
      {"scan", 1537},
      {""},
#line 1534 "bip39.gperf"
      {"sample", 1528},
#line 217 "bip39.gperf"
      {"bounce", 211},
      {""}, {""}, {""}, {""}, {""}, {""},
#line 422 "bip39.gperf"
      {"cross", 416},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""},
#line 1331 "bip39.gperf"
      {"pizza", 1325},
#line 341 "bip39.gperf"
      {"clarify", 335},
      {""},
#line 2009 "bip39.gperf"
      {"whip", 2003},
      {""}, {""}, {""}, {""}, {""},
#line 1553 "bip39.gperf"
      {"scrap", 1547},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""},
#line 1350 "bip39.gperf"
      {"pool", 1344},
      {""},
#line 1332 "bip39.gperf"
      {"place", 1326},
      {""}, {""}, {""}, {""}, {""},
#line 1378 "bip39.gperf"
      {"process", 1372},
      {""}, {""}, {""},
#line 1335 "bip39.gperf"
      {"plate", 1329},
      {""}, {""}, {""}, {""}, {""},
#line 1387 "bip39.gperf"
      {"protect", 1381},
#line 1216 "bip39.gperf"
      {"nuclear", 1210},
      {""},
#line 968 "bip39.gperf"
      {"joke", 962},
#line 222 "bip39.gperf"
      {"brand", 216},
#line 1521 "bip39.gperf"
      {"runway", 1515},
#line 1334 "bip39.gperf"
      {"plastic", 1328},
      {""}, {""},
#line 988 "bip39.gperf"
      {"kiss", 982},
#line 1386 "bip39.gperf"
      {"prosper", 1380},
      {""}, {""}, {""},
#line 1454 "bip39.gperf"
      {"relax", 1448},
      {""}, {""}, {""}, {""}, {""}, {""},
#line 792 "bip39.gperf"
      {"girl", 786},
      {""}, {""}, {""}, {""}, {""}, {""},
#line 1414 "bip39.gperf"
      {"quote", 1408},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""},
#line 1681 "bip39.gperf"
      {"sphere", 1675},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
#line 772 "bip39.gperf"
      {"garlic", 766},
      {""}, {""},
#line 1928 "bip39.gperf"
      {"utility", 1922},
      {""}, {""},
#line 1583 "bip39.gperf"
      {"share", 1577},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""},
#line 908 "bip39.gperf"
      {"ignore", 902},
      {""}, {""}, {""}, {""},
#line 1972 "bip39.gperf"
      {"volume", 1966},
      {""}, {""}, {""}, {""}, {""}, {""},
#line 99 "bip39.gperf"
      {"arm", 93},
      {""}, {""}, {""}, {""},
#line 81 "bip39.gperf"
      {"annual", 75},
      {""}, {""},
#line 1791 "bip39.gperf"
      {"tennis", 1785},
      {""}, {""},
#line 1672 "bip39.gperf"
      {"space", 1666},
      {""}, {""}, {""},
#line 1849 "bip39.gperf"
      {"toy", 1843},
      {""}, {""}, {""}, {""}, {""},
#line 1848 "bip39.gperf"
      {"town", 1842},
      {""},
#line 1674 "bip39.gperf"
      {"spatial", 1668},
#line 75 "bip39.gperf"
      {"anger", 69},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
#line 856 "bip39.gperf"
      {"heart", 850},
      {""}, {""}, {""},
#line 1673 "bip39.gperf"
      {"spare", 1667},
      {""}, {""}, {""}, {""}, {""},
#line 1657 "bip39.gperf"
      {"solar", 1651},
      {""}, {""}, {""}, {""},
#line 2029 "bip39.gperf"
      {"woman", 2023},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""},
#line 1197 "bip39.gperf"
      {"neutral", 1191},
      {""},
#line 80 "bip39.gperf"
      {"announce", 74},
      {""},
#line 657 "bip39.gperf"
      {"fabric", 651},
      {""}, {""}, {""}, {""},
#line 531 "bip39.gperf"
      {"double", 525},
      {""}, {""}, {""},
#line 525 "bip39.gperf"
      {"domain", 519},
      {""}, {""},
#line 211 "bip39.gperf"
      {"boost", 205},
#line 1528 "bip39.gperf"
      {"salad", 1522},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
#line 612 "bip39.gperf"
      {"envelope", 606},
      {""}, {""}, {""},
#line 330 "bip39.gperf"
      {"chuckle", 324},
#line 74 "bip39.gperf"
      {"ancient", 68},
      {""}, {""}, {""}, {""}, {""}, {""},
#line 1484 "bip39.gperf"
      {"rhythm", 1478},
      {""}, {""},
#line 680 "bip39.gperf"
      {"february", 674},
#line 1308 "bip39.gperf"
      {"people", 1302},
      {""},
#line 1841 "bip39.gperf"
      {"tornado", 1835},
      {""}, {""}, {""},
#line 446 "bip39.gperf"
      {"damage", 440},
#line 1751 "bip39.gperf"
      {"surface", 1745},
#line 1055 "bip39.gperf"
      {"lobster", 1049},
      {""}, {""}, {""}, {""}, {""},
#line 998 "bip39.gperf"
      {"lab", 992},
#line 1633 "bip39.gperf"
      {"slice", 1627},
#line 1915 "bip39.gperf"
      {"upgrade", 1909},
      {""}, {""}, {""}, {""},
#line 332 "bip39.gperf"
      {"churn", 326},
      {""}, {""}, {""}, {""}, {""}, {""},
#line 1038 "bip39.gperf"
      {"library", 1032},
#line 714 "bip39.gperf"
      {"flat", 708},
      {""}, {""}, {""}, {""},
#line 1755 "bip39.gperf"
      {"survey", 1749},
#line 2003 "bip39.gperf"
      {"whale", 1997},
      {""},
#line 815 "bip39.gperf"
      {"gown", 809},
      {""}, {""},
#line 713 "bip39.gperf"
      {"flash", 707},
#line 471 "bip39.gperf"
      {"demand", 465},
      {""},
#line 1154 "bip39.gperf"
      {"moon", 1148},
#line 753 "bip39.gperf"
      {"frost", 747},
      {""}, {""}, {""}, {""},
#line 812 "bip39.gperf"
      {"gospel", 806},
      {""}, {""}, {""}, {""}, {""},
#line 1821 "bip39.gperf"
      {"title", 1815},
#line 1737 "bip39.gperf"
      {"such", 1731},
      {""}, {""},
#line 989 "bip39.gperf"
      {"kit", 983},
#line 423 "bip39.gperf"
      {"crouch", 417},
      {""},
#line 649 "bip39.gperf"
      {"expire", 643},
      {""},
#line 85 "bip39.gperf"
      {"antique", 79},
      {""},
#line 1714 "bip39.gperf"
      {"stereo", 1708},
      {""},
#line 990 "bip39.gperf"
      {"kitchen", 984},
#line 183 "bip39.gperf"
      {"bike", 177},
      {""}, {""}, {""}, {""}, {""},
#line 309 "bip39.gperf"
      {"chalk", 303},
      {""},
#line 992 "bip39.gperf"
      {"kitten", 986},
      {""}, {""}, {""}, {""},
#line 775 "bip39.gperf"
      {"gasp", 769},
#line 278 "bip39.gperf"
      {"capital", 272},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""},
#line 279 "bip39.gperf"
      {"captain", 273},
      {""}, {""},
#line 1327 "bip39.gperf"
      {"pioneer", 1321},
      {""},
#line 652 "bip39.gperf"
      {"express", 646},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""},
#line 479 "bip39.gperf"
      {"depth", 473},
      {""},
#line 1567 "bip39.gperf"
      {"segment", 1561},
      {""}, {""}, {""}, {""}, {""}, {""}, {""},
#line 1828 "bip39.gperf"
      {"toilet", 1822},
      {""}, {""}, {""},
#line 1865 "bip39.gperf"
      {"trick", 1859},
      {""}, {""},
#line 981 "bip39.gperf"
      {"ketchup", 975},
#line 1485 "bip39.gperf"
      {"rib", 1479},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""},
#line 100 "bip39.gperf"
      {"armed", 94},
#line 691 "bip39.gperf"
      {"fiber", 685},
      {""},
#line 832 "bip39.gperf"
      {"guard", 826},
#line 1388 "bip39.gperf"
      {"proud", 1382},
      {""}, {""}, {""}, {""}, {""}, {""},
#line 37 "bip39.gperf"
      {"advance", 31},
#line 1405 "bip39.gperf"
      {"puzzle", 1399},
      {""},
#line 1776 "bip39.gperf"
      {"tail", 1770},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""},
#line 1602 "bip39.gperf"
      {"shy", 1596},
      {""},
#line 143 "bip39.gperf"
      {"bachelor", 137},
      {""}, {""}, {""},
#line 1019 "bip39.gperf"
      {"leaf", 1013},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
#line 604 "bip39.gperf"
      {"enlist", 598},
      {""}, {""}, {""},
#line 63 "bip39.gperf"
      {"already", 57},
#line 885 "bip39.gperf"
      {"hospital", 879},
      {""}, {""}, {""}, {""},
#line 495 "bip39.gperf"
      {"diamond", 489},
      {""}, {""}, {""},
#line 466 "bip39.gperf"
      {"define", 460},
      {""}, {""}, {""}, {""},
#line 1365 "bip39.gperf"
      {"prepare", 1359},
#line 1021 "bip39.gperf"
      {"leave", 1015},
#line 1963 "bip39.gperf"
      {"visa", 1957},
      {""}, {""}, {""}, {""},
#line 1384 "bip39.gperf"
      {"proof", 1378},
      {""}, {""}, {""}, {""}, {""}, {""}, {""},
#line 313 "bip39.gperf"
      {"chapter", 307},
#line 633 "bip39.gperf"
      {"example", 627},
      {""}, {""}, {""},
#line 1646 "bip39.gperf"
      {"snack", 1640},
#line 814 "bip39.gperf"
      {"govern", 808},
      {""}, {""},
#line 793 "bip39.gperf"
      {"give", 787},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""},
#line 1037 "bip39.gperf"
      {"liberty", 1031},
      {""},
#line 433 "bip39.gperf"
      {"cube", 427},
      {""},
#line 1696 "bip39.gperf"
      {"spy", 1690},
      {""}, {""},
#line 540 "bip39.gperf"
      {"drift", 534},
      {""}, {""}, {""}, {""}, {""},
#line 1882 "bip39.gperf"
      {"tunnel", 1876},
      {""},
#line 1061 "bip39.gperf"
      {"loop", 1055},
      {""}, {""}, {""},
#line 132 "bip39.gperf"
      {"average", 126},
      {""}, {""},
#line 1763 "bip39.gperf"
      {"sweet", 1757},
      {""},
#line 827 "bip39.gperf"
      {"grit", 821},
      {""},
#line 882 "bip39.gperf"
      {"horn", 876},
      {""},
#line 999 "bip39.gperf"
      {"label", 993},
      {""}, {""}, {""}, {""}, {""}, {""},
#line 544 "bip39.gperf"
      {"drive", 538},
      {""},
#line 1711 "bip39.gperf"
      {"steel", 1705},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""},
#line 88 "bip39.gperf"
      {"apart", 82},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""},
#line 991 "bip39.gperf"
      {"kite", 985},
      {""},
#line 648 "bip39.gperf"
      {"expect", 642},
      {""},
#line 84 "bip39.gperf"
      {"antenna", 78},
#line 101 "bip39.gperf"
      {"armor", 95},
      {""}, {""}, {""},
#line 1814 "bip39.gperf"
      {"tilt", 1808},
      {""}, {""}, {""}, {""}, {""}, {""},
#line 1032 "bip39.gperf"
      {"leopard", 1026},
      {""},
#line 1189 "bip39.gperf"
      {"negative", 1183},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""},
#line 973 "bip39.gperf"
      {"jump", 967},
      {""},
#line 121 "bip39.gperf"
      {"attack", 115},
#line 477 "bip39.gperf"
      {"depend", 471},
      {""},
#line 1919 "bip39.gperf"
      {"upset", 1913},
      {""}, {""}, {""}, {""}, {""},
#line 2013 "bip39.gperf"
      {"wife", 2007},
      {""}, {""},
#line 725 "bip39.gperf"
      {"fly", 719},
#line 889 "bip39.gperf"
      {"hover", 883},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""},
#line 685 "bip39.gperf"
      {"female", 679},
      {""}, {""}, {""},
#line 1375 "bip39.gperf"
      {"private", 1369},
#line 311 "bip39.gperf"
      {"change", 305},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
#line 1328 "bip39.gperf"
      {"pipe", 1322},
      {""},
#line 138 "bip39.gperf"
      {"awesome", 132},
      {""}, {""}, {""}, {""}, {""},
#line 851 "bip39.gperf"
      {"have", 845},
#line 2028 "bip39.gperf"
      {"wolf", 2022},
#line 1968 "bip39.gperf"
      {"vocal", 1962},
      {""},
#line 1273 "bip39.gperf"
      {"oyster", 1267},
      {""},
#line 352 "bip39.gperf"
      {"clip", 346},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""},
#line 1888 "bip39.gperf"
      {"twice", 1882},
#line 1285 "bip39.gperf"
      {"paper", 1279},
#line 2030 "bip39.gperf"
      {"wonder", 2024},
#line 1047 "bip39.gperf"
      {"lion", 1041},
#line 1884 "bip39.gperf"
      {"turn", 1878},
      {""}, {""},
#line 2017 "bip39.gperf"
      {"window", 2011},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
#line 1929 "bip39.gperf"
      {"vacant", 1923},
      {""}, {""}, {""},
#line 1890 "bip39.gperf"
      {"twist", 1884},
#line 1000 "bip39.gperf"
      {"labor", 994},
      {""}, {""},
#line 64 "bip39.gperf"
      {"also", 58},
      {""}, {""}, {""}, {""}, {""}, {""},
#line 1439 "bip39.gperf"
      {"rebel", 1433},
      {""},
#line 465 "bip39.gperf"
      {"defense", 459},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
#line 480 "bip39.gperf"
      {"deputy", 474},
#line 380 "bip39.gperf"
      {"conduct", 374},
      {""}, {""}, {""}, {""}, {""},
#line 435 "bip39.gperf"
      {"cup", 429},
      {""}, {""}, {""}, {""}, {""},
#line 1465 "bip39.gperf"
      {"reopen", 1459},
#line 226 "bip39.gperf"
      {"breeze", 220},
      {""}, {""}, {""},
#line 1966 "bip39.gperf"
      {"vital", 1960},
      {""},
#line 147 "bip39.gperf"
      {"balance", 141},
      {""}, {""}, {""}, {""},
#line 651 "bip39.gperf"
      {"expose", 645},
#line 129 "bip39.gperf"
      {"author", 123},
      {""}, {""}, {""},
#line 1504 "bip39.gperf"
      {"robust", 1498},
      {""}, {""}, {""},
#line 272 "bip39.gperf"
      {"candy", 266},
      {""},
#line 1351 "bip39.gperf"
      {"popular", 1345},
      {""}, {""},
#line 1316 "bip39.gperf"
      {"phrase", 1310},
#line 1900 "bip39.gperf"
      {"under", 1894},
#line 826 "bip39.gperf"
      {"grief", 820},
      {""},
#line 1133 "bip39.gperf"
      {"mind", 1127},
      {""},
#line 1205 "bip39.gperf"
      {"nominee", 1199},
      {""}, {""}, {""}, {""},
#line 1006 "bip39.gperf"
      {"laptop", 1000},
#line 1845 "bip39.gperf"
      {"tourist", 1839},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""},
#line 726 "bip39.gperf"
      {"foam", 720},
      {""}, {""},
#line 478 "bip39.gperf"
      {"deposit", 472},
      {""}, {""}, {""},
#line 116 "bip39.gperf"
      {"assist", 110},
      {""},
#line 1590 "bip39.gperf"
      {"ship", 1584},
      {""}, {""},
#line 1958 "bip39.gperf"
      {"village", 1952},
#line 1086 "bip39.gperf"
      {"mandate", 1080},
      {""}, {""}, {""}, {""}, {""}, {""},
#line 65 "bip39.gperf"
      {"alter", 59},
      {""}, {""}, {""}, {""},
#line 1348 "bip39.gperf"
      {"pond", 1342},
      {""},
#line 1506 "bip39.gperf"
      {"romance", 1500},
      {""}, {""}, {""},
#line 1503 "bip39.gperf"
      {"robot", 1497},
      {""}, {""}, {""},
#line 925 "bip39.gperf"
      {"indicate", 919},
#line 1397 "bip39.gperf"
      {"pupil", 1391},
      {""},
#line 1440 "bip39.gperf"
      {"rebuild", 1434},
      {""},
#line 1854 "bip39.gperf"
      {"train", 1848},
#line 1933 "bip39.gperf"
      {"valley", 1927},
      {""}, {""},
#line 966 "bip39.gperf"
      {"job", 960},
#line 1850 "bip39.gperf"
      {"track", 1844},
#line 351 "bip39.gperf"
      {"clinic", 345},
#line 876 "bip39.gperf"
      {"holiday", 870},
#line 1997 "bip39.gperf"
      {"wedding", 1991},
      {""}, {""}, {""}, {""}, {""}, {""},
#line 1041 "bip39.gperf"
      {"lift", 1035},
      {""},
#line 571 "bip39.gperf"
      {"effort", 565},
      {""}, {""}, {""},
#line 1281 "bip39.gperf"
      {"panda", 1275},
#line 1128 "bip39.gperf"
      {"middle", 1122},
#line 747 "bip39.gperf"
      {"frequent", 741},
      {""},
#line 1857 "bip39.gperf"
      {"trash", 1851},
#line 1777 "bip39.gperf"
      {"talent", 1771},
#line 764 "bip39.gperf"
      {"gain", 758},
      {""}, {""},
#line 2033 "bip39.gperf"
      {"word", 2027},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""},
#line 261 "bip39.gperf"
      {"cable", 255},
      {""}, {""}, {""}, {""}, {""},
#line 373 "bip39.gperf"
      {"combine", 367},
      {""}, {""},
#line 56 "bip39.gperf"
      {"alien", 50},
#line 1458 "bip39.gperf"
      {"remain", 1452},
      {""}, {""}, {""}, {""}, {""},
#line 362 "bip39.gperf"
      {"clutch", 356},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
#line 1359 "bip39.gperf"
      {"powder", 1353},
#line 361 "bip39.gperf"
      {"cluster", 355},
      {""}, {""}, {""}, {""}, {""},
#line 1687 "bip39.gperf"
      {"split", 1681},
#line 1023 "bip39.gperf"
      {"left", 1017},
#line 1429 "bip39.gperf"
      {"rapid", 1423},
#line 54 "bip39.gperf"
      {"alcohol", 48},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""},
#line 1210 "bip39.gperf"
      {"notable", 1204},
      {""}, {""}, {""}, {""},
#line 1276 "bip39.gperf"
      {"paddle", 1270},
      {""}, {""},
#line 282 "bip39.gperf"
      {"card", 276},
      {""},
#line 76 "bip39.gperf"
      {"angle", 70},
      {""}, {""}, {""},
#line 1901 "bip39.gperf"
      {"undo", 1895},
      {""},
#line 835 "bip39.gperf"
      {"guilt", 829},
      {""},
#line 961 "bip39.gperf"
      {"jazz", 955},
      {""},
#line 179 "bip39.gperf"
      {"between", 173},
#line 1299 "bip39.gperf"
      {"payment", 1293},
      {""}, {""}, {""},
#line 2024 "bip39.gperf"
      {"wisdom", 2018},
      {""}, {""},
#line 533 "bip39.gperf"
      {"draft", 527},
      {""}, {""},
#line 818 "bip39.gperf"
      {"grain", 812},
      {""}, {""}, {""}, {""},
#line 817 "bip39.gperf"
      {"grace", 811},
      {""},
#line 1589 "bip39.gperf"
      {"shine", 1583},
      {""},
#line 1911 "bip39.gperf"
      {"until", 1905},
      {""}, {""},
#line 406 "bip39.gperf"
      {"craft", 400},
#line 1339 "bip39.gperf"
      {"pluck", 1333},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""},
#line 821 "bip39.gperf"
      {"grass", 815},
      {""}, {""}, {""}, {""}, {""}, {""}, {""},
#line 1116 "bip39.gperf"
      {"member", 1110},
      {""}, {""},
#line 718 "bip39.gperf"
      {"flip", 712},
      {""}, {""},
#line 937 "bip39.gperf"
      {"inner", 931},
      {""}, {""}, {""},
#line 1940 "bip39.gperf"
      {"vault", 1934},
      {""},
#line 943 "bip39.gperf"
      {"inside", 937},
#line 343 "bip39.gperf"
      {"clay", 337},
      {""}, {""}, {""},
#line 600 "bip39.gperf"
      {"engage", 594},
      {""}, {""}, {""}, {""}, {""},
#line 9 "bip39.gperf"
      {"about", 3},
      {""}, {""}, {""}, {""},
#line 945 "bip39.gperf"
      {"install", 939},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
#line 1664 "bip39.gperf"
      {"soon", 1658},
      {""}, {""}, {""}, {""}, {""},
#line 1718 "bip39.gperf"
      {"stock", 1712},
      {""}, {""}, {""},
#line 1685 "bip39.gperf"
      {"spin", 1679},
      {""}, {""},
#line 418 "bip39.gperf"
      {"crime", 412},
      {""}, {""}, {""},
#line 888 "bip39.gperf"
      {"hour", 882},
      {""}, {""}, {""}, {""}, {""},
#line 115 "bip39.gperf"
      {"asset", 109},
      {""}, {""},
#line 1768 "bip39.gperf"
      {"sword", 1762},
#line 699 "bip39.gperf"
      {"find", 693},
#line 1907 "bip39.gperf"
      {"unit", 1901},
      {""}, {""},
#line 1180 "bip39.gperf"
      {"name", 1174},
      {""}, {""}, {""}, {""}, {""},
#line 2008 "bip39.gperf"
      {"where", 2002},
#line 1790 "bip39.gperf"
      {"tenant", 1784},
#line 656 "bip39.gperf"
      {"eyebrow", 650},
      {""},
#line 1722 "bip39.gperf"
      {"story", 1716},
#line 318 "bip39.gperf"
      {"check", 312},
      {""}, {""}, {""}, {""},
#line 1824 "bip39.gperf"
      {"today", 1818},
      {""},
#line 924 "bip39.gperf"
      {"index", 918},
      {""}, {""}, {""},
#line 1846 "bip39.gperf"
      {"toward", 1840},
      {""}, {""},
#line 1946 "bip39.gperf"
      {"verb", 1940},
#line 1040 "bip39.gperf"
      {"life", 1034},
      {""}, {""}, {""},
#line 875 "bip39.gperf"
      {"hole", 869},
#line 322 "bip39.gperf"
      {"chest", 316},
      {""}, {""}, {""},
#line 1336 "bip39.gperf"
      {"play", 1330},
#line 631 "bip39.gperf"
      {"evolve", 625},
      {""}, {""}, {""}, {""}, {""}, {""},
#line 1582 "bip39.gperf"
      {"shallow", 1576},
#line 545 "bip39.gperf"
      {"drop", 539},
      {""}, {""},
#line 321 "bip39.gperf"
      {"cherry", 315},
      {""}, {""}, {""}, {""}, {""}, {""}, {""},
#line 340 "bip39.gperf"
      {"clap", 334},
#line 52 "bip39.gperf"
      {"alarm", 46},
      {""}, {""},
#line 421 "bip39.gperf"
      {"crop", 415},
      {""}, {""}, {""}, {""}, {""},
#line 537 "bip39.gperf"
      {"draw", 531},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
#line 1371 "bip39.gperf"
      {"primary", 1365},
#line 940 "bip39.gperf"
      {"inquiry", 934},
      {""}, {""}, {""}, {""}, {""},
#line 411 "bip39.gperf"
      {"crawl", 405},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""},
#line 117 "bip39.gperf"
      {"assume", 111},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
#line 855 "bip39.gperf"
      {"health", 849},
      {""}, {""}, {""},
#line 938 "bip39.gperf"
      {"innocent", 932},
      {""},
#line 1551 "bip39.gperf"
      {"scorpion", 1545},
      {""}, {""}, {""}, {""}, {""},
#line 1877 "bip39.gperf"
      {"try", 1871},
      {""},
#line 1656 "bip39.gperf"
      {"soft", 1650},
      {""}, {""}, {""}, {""},
#line 927 "bip39.gperf"
      {"industry", 921},
#line 1235 "bip39.gperf"
      {"often", 1229},
      {""}, {""}, {""},
#line 87 "bip39.gperf"
      {"any", 81},
      {""},
#line 985 "bip39.gperf"
      {"kidney", 979},
      {""}, {""}, {""},
#line 723 "bip39.gperf"
      {"fluid", 717},
#line 1467 "bip39.gperf"
      {"repeat", 1461},
      {""},
#line 102 "bip39.gperf"
      {"army", 96},
      {""}, {""}, {""}, {""}, {""}, {""}, {""},
#line 1385 "bip39.gperf"
      {"property", 1379},
      {""}, {""},
#line 1029 "bip39.gperf"
      {"lend", 1023},
      {""}, {""}, {""}, {""}, {""}, {""}, {""},
#line 1224 "bip39.gperf"
      {"obscure", 1218},
#line 134 "bip39.gperf"
      {"avoid", 128},
#line 2020 "bip39.gperf"
      {"wink", 2014},
#line 724 "bip39.gperf"
      {"flush", 718},
      {""}, {""}, {""},
#line 189 "bip39.gperf"
      {"black", 183},
#line 133 "bip39.gperf"
      {"avocado", 127},
      {""}, {""}, {""}, {""},
#line 185 "bip39.gperf"
      {"biology", 179},
#line 233 "bip39.gperf"
      {"broccoli", 227},
      {""}, {""}, {""}, {""}, {""}, {""},
#line 2043 "bip39.gperf"
      {"wrong", 2037},
#line 923 "bip39.gperf"
      {"increase", 917},
#line 237 "bip39.gperf"
      {"brother", 231},
#line 527 "bip39.gperf"
      {"donkey", 521},
      {""}, {""},
#line 193 "bip39.gperf"
      {"blast", 187},
      {""}, {""},
#line 926 "bip39.gperf"
      {"indoor", 920},
      {""},
#line 266 "bip39.gperf"
      {"calm", 260},
      {""}, {""},
#line 942 "bip39.gperf"
      {"insect", 936},
#line 982 "bip39.gperf"
      {"key", 976},
      {""}, {""},
#line 1001 "bip39.gperf"
      {"ladder", 995},
      {""}, {""}, {""},
#line 94 "bip39.gperf"
      {"arch", 88},
      {""}, {""}, {""}, {""}, {""}, {""},
#line 787 "bip39.gperf"
      {"giant", 781},
      {""}, {""}, {""}, {""}, {""}, {""},
#line 2006 "bip39.gperf"
      {"wheel", 2000},
      {""}, {""}, {""}, {""},
#line 1916 "bip39.gperf"
      {"uphold", 1910},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
#line 549 "bip39.gperf"
      {"dumb", 543},
      {""}, {""}, {""}, {""}, {""}, {""}, {""},
#line 1151 "bip39.gperf"
      {"monkey", 1145},
      {""},
#line 1044 "bip39.gperf"
      {"limb", 1038},
#line 791 "bip39.gperf"
      {"giraffe", 785},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""},
#line 319 "bip39.gperf"
      {"cheese", 313},
      {""}, {""},
#line 1899 "bip39.gperf"
      {"uncover", 1893},
      {""}, {""}, {""},
#line 1391 "bip39.gperf"
      {"pudding", 1385},
      {""}, {""}, {""},
#line 1427 "bip39.gperf"
      {"random", 1421},
      {""},
#line 769 "bip39.gperf"
      {"garage", 763},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
#line 650 "bip39.gperf"
      {"explain", 644},
      {""},
#line 1280 "bip39.gperf"
      {"palm", 1274},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
#line 1326 "bip39.gperf"
      {"pink", 1320},
      {""}, {""},
#line 1266 "bip39.gperf"
      {"outside", 1260},
      {""},
#line 390 "bip39.gperf"
      {"copy", 384},
      {""},
#line 1390 "bip39.gperf"
      {"public", 1384},
      {""}, {""}, {""},
#line 566 "bip39.gperf"
      {"ecology", 560},
#line 1462 "bip39.gperf"
      {"render", 1456},
      {""},
#line 933 "bip39.gperf"
      {"initial", 927},
      {""},
#line 1333 "bip39.gperf"
      {"planet", 1327},
      {""}, {""}, {""}, {""},
#line 853 "bip39.gperf"
      {"hazard", 847},
#line 1469 "bip39.gperf"
      {"report", 1463},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
#line 2034 "bip39.gperf"
      {"work", 2028},
      {""}, {""}, {""}, {""}, {""},
#line 1090 "bip39.gperf"
      {"maple", 1084},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
#line 1078 "bip39.gperf"
      {"maid", 1072},
#line 1700 "bip39.gperf"
      {"stable", 1694},
#line 1449 "bip39.gperf"
      {"refuse", 1443},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""},
#line 1881 "bip39.gperf"
      {"tuna", 1875},
      {""}, {""}, {""}, {""}, {""},
#line 2045 "bip39.gperf"
      {"year", 2039},
      {""}, {""}, {""}, {""},
#line 538 "bip39.gperf"
      {"dream", 532},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
#line 103 "bip39.gperf"
      {"around", 97},
      {""}, {""}, {""},
#line 1713 "bip39.gperf"
      {"step", 1707},
#line 413 "bip39.gperf"
      {"cream", 407},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
#line 1721 "bip39.gperf"
      {"stool", 1715},
#line 1526 "bip39.gperf"
      {"safe", 1520},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
#line 1256 "bip39.gperf"
      {"ordinary", 1250},
      {""},
#line 535 "bip39.gperf"
      {"drama", 529},
#line 389 "bip39.gperf"
      {"copper", 383},
#line 1225 "bip39.gperf"
      {"observe", 1219},
      {""}, {""}, {""},
#line 1448 "bip39.gperf"
      {"reform", 1442},
      {""}, {""}, {""}, {""}, {""},
#line 598 "bip39.gperf"
      {"energy", 592},
      {""},
#line 407 "bip39.gperf"
      {"cram", 401},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""},
#line 1661 "bip39.gperf"
      {"solve", 1655},
#line 1552 "bip39.gperf"
      {"scout", 1546},
      {""}, {""}, {""}, {""},
#line 1612 "bip39.gperf"
      {"silver", 1606},
      {""}, {""}, {""}, {""}, {""}, {""}, {""},
#line 1095 "bip39.gperf"
      {"market", 1089},
      {""},
#line 1693 "bip39.gperf"
      {"spray", 1687},
#line 467 "bip39.gperf"
      {"defy", 461},
      {""},
#line 375 "bip39.gperf"
      {"comfort", 369},
      {""}, {""}, {""}, {""}, {""}, {""}, {""},
#line 1535 "bip39.gperf"
      {"sand", 1529},
#line 838 "bip39.gperf"
      {"gym", 832},
      {""}, {""}, {""},
#line 1844 "bip39.gperf"
      {"total", 1838},
      {""}, {""}, {""}, {""},
#line 947 "bip39.gperf"
      {"interest", 941},
      {""}, {""}, {""}, {""},
#line 2019 "bip39.gperf"
      {"wing", 2013},
#line 1376 "bip39.gperf"
      {"prize", 1370},
      {""},
#line 1749 "bip39.gperf"
      {"supreme", 1743},
      {""}, {""}, {""}, {""}, {""},
#line 1868 "bip39.gperf"
      {"trip", 1862},
#line 696 "bip39.gperf"
      {"film", 690},
      {""}, {""},
#line 44 "bip39.gperf"
      {"age", 38},
      {""}, {""}, {""}, {""},
#line 1826 "bip39.gperf"
      {"toe", 1820},
      {""},
#line 1288 "bip39.gperf"
      {"park", 1282},
      {""},
#line 1202 "bip39.gperf"
      {"night", 1196},
      {""}, {""}, {""}, {""}, {""}, {""}, {""},
#line 1413 "bip39.gperf"
      {"quiz", 1407},
#line 331 "bip39.gperf"
      {"chunk", 325},
      {""}, {""}, {""},
#line 485 "bip39.gperf"
      {"desk", 479},
      {""}, {""}, {""},
#line 382 "bip39.gperf"
      {"congress", 376},
      {""}, {""}, {""}, {""}, {""},
#line 1764 "bip39.gperf"
      {"swift", 1758},
#line 1264 "bip39.gperf"
      {"outer", 1258},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
#line 1097 "bip39.gperf"
      {"mask", 1091},
      {""},
#line 449 "bip39.gperf"
      {"danger", 443},
      {""}, {""},
#line 258 "bip39.gperf"
      {"buzz", 252},
      {""}, {""}, {""}, {""}, {""}, {""},
#line 1524 "bip39.gperf"
      {"saddle", 1518},
      {""},
#line 752 "bip39.gperf"
      {"front", 746},
      {""}, {""}, {""},
#line 1603 "bip39.gperf"
      {"sibling", 1597},
      {""}, {""},
#line 1974 "bip39.gperf"
      {"voyage", 1968},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""},
#line 602 "bip39.gperf"
      {"enhance", 596},
      {""}, {""},
#line 1309 "bip39.gperf"
      {"pepper", 1303},
#line 922 "bip39.gperf"
      {"income", 916},
#line 1816 "bip39.gperf"
      {"time", 1810},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""},
#line 1648 "bip39.gperf"
      {"snap", 1642},
      {""}, {""}, {""}, {""},
#line 1087 "bip39.gperf"
      {"mango", 1081},
      {""}, {""},
#line 1788 "bip39.gperf"
      {"tell", 1782},
      {""}, {""}, {""}, {""},
#line 236 "bip39.gperf"
      {"broom", 230},
      {""}, {""}, {""}, {""}, {""},
#line 97 "bip39.gperf"
      {"arena", 91},
#line 1640 "bip39.gperf"
      {"slush", 1634},
      {""}, {""}, {""}, {""},
#line 1769 "bip39.gperf"
      {"symbol", 1763},
      {""}, {""}, {""}, {""},
#line 567 "bip39.gperf"
      {"economy", 561},
      {""}, {""},
#line 1270 "bip39.gperf"
      {"own", 1264},
      {""}, {""}, {""},
#line 577 "bip39.gperf"
      {"electric", 571},
      {""},
#line 1046 "bip39.gperf"
      {"link", 1040},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
#line 903 "bip39.gperf"
      {"ice", 897},
      {""}, {""},
#line 948 "bip39.gperf"
      {"into", 942},
#line 843 "bip39.gperf"
      {"hamster", 837},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""},
#line 1546 "bip39.gperf"
      {"scene", 1540},
#line 1255 "bip39.gperf"
      {"order", 1249},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
#line 1069 "bip39.gperf"
      {"lumber", 1063},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
#line 345 "bip39.gperf"
      {"clerk", 339},
      {""}, {""}, {""}, {""}, {""}, {""},
#line 111 "bip39.gperf"
      {"artwork", 105},
      {""},
#line 932 "bip39.gperf"
      {"inherit", 926},
#line 766 "bip39.gperf"
      {"gallery", 760},
      {""}, {""}, {""}, {""}, {""},
#line 1747 "bip39.gperf"
      {"super", 1741},
      {""}, {""}, {""},
#line 737 "bip39.gperf"
      {"fork", 731},
#line 1871 "bip39.gperf"
      {"truck", 1865},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
#line 1876 "bip39.gperf"
      {"truth", 1870},
      {""}, {""},
#line 245 "bip39.gperf"
      {"bulb", 239},
      {""}, {""}, {""}, {""}, {""}, {""},
#line 1875 "bip39.gperf"
      {"trust", 1869},
      {""}, {""}, {""}, {""},
#line 283 "bip39.gperf"
      {"cargo", 277},
      {""}, {""}, {""}, {""}, {""},
#line 767 "bip39.gperf"
      {"game", 761},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""},
#line 934 "bip39.gperf"
      {"inject", 928},
      {""}, {""},
#line 1807 "bip39.gperf"
      {"thrive", 1801},
      {""},
#line 1831 "bip39.gperf"
      {"tomorrow", 1825},
      {""},
#line 327 "bip39.gperf"
      {"choice", 321},
#line 746 "bip39.gperf"
      {"frame", 740},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""},
#line 1093 "bip39.gperf"
      {"margin", 1087},
#line 57 "bip39.gperf"
      {"all", 51},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
#line 877 "bip39.gperf"
      {"hollow", 871},
      {""}, {""},
#line 867 "bip39.gperf"
      {"hill", 861},
      {""},
#line 1121 "bip39.gperf"
      {"merge", 1115},
#line 22 "bip39.gperf"
      {"acoustic", 16},
      {""},
#line 72 "bip39.gperf"
      {"analyst", 66},
      {""}, {""}, {""}, {""}, {""}, {""}, {""},
#line 1586 "bip39.gperf"
      {"sheriff", 1580},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""},
#line 1859 "bip39.gperf"
      {"tray", 1853},
      {""},
#line 623 "bip39.gperf"
      {"essay", 617},
      {""}, {""}, {""}, {""}, {""},
#line 1107 "bip39.gperf"
      {"meadow", 1101},
      {""}, {""}, {""},
#line 412 "bip39.gperf"
      {"crazy", 406},
      {""}, {""},
#line 878 "bip39.gperf"
      {"home", 872},
      {""},
#line 1952 "bip39.gperf"
      {"viable", 1946},
      {""}, {""}, {""}, {""}, {""},
#line 701 "bip39.gperf"
      {"finger", 695},
      {""}, {""}, {""},
#line 1677 "bip39.gperf"
      {"special", 1671},
#line 1898 "bip39.gperf"
      {"uncle", 1892},
#line 935 "bip39.gperf"
      {"injury", 929},
#line 1315 "bip39.gperf"
      {"photo", 1309},
      {""}, {""}, {""},
#line 906 "bip39.gperf"
      {"identify", 900},
      {""}, {""}, {""}, {""}, {""}, {""},
#line 860 "bip39.gperf"
      {"hello", 854},
      {""}, {""}, {""}, {""}, {""}, {""}, {""},
#line 1193 "bip39.gperf"
      {"nerve", 1187},
      {""}, {""},
#line 1271 "bip39.gperf"
      {"owner", 1265},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
#line 1212 "bip39.gperf"
      {"nothing", 1206},
      {""}, {""}, {""},
#line 1468 "bip39.gperf"
      {"replace", 1462},
      {""},
#line 770 "bip39.gperf"
      {"garbage", 764},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""},
#line 1398 "bip39.gperf"
      {"puppy", 1392},
      {""}, {""},
#line 1856 "bip39.gperf"
      {"trap", 1850},
#line 1060 "bip39.gperf"
      {"long", 1054},
      {""},
#line 41 "bip39.gperf"
      {"afford", 35},
      {""}, {""}, {""},
#line 1491 "bip39.gperf"
      {"rifle", 1485},
#line 1738 "bip39.gperf"
      {"sudden", 1732},
      {""}, {""},
#line 184 "bip39.gperf"
      {"bind", 178},
      {""}, {""}, {""},
#line 1889 "bip39.gperf"
      {"twin", 1883},
#line 1872 "bip39.gperf"
      {"true", 1866},
      {""}, {""}, {""}, {""}, {""}, {""},
#line 1222 "bip39.gperf"
      {"object", 1216},
      {""}, {""}, {""}, {""},
#line 1529 "bip39.gperf"
      {"salmon", 1523},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
#line 377 "bip39.gperf"
      {"common", 371},
      {""},
#line 1005 "bip39.gperf"
      {"language", 999},
      {""}, {""},
#line 1913 "bip39.gperf"
      {"unveil", 1907},
      {""}, {""}, {""}, {""}, {""}, {""}, {""},
#line 1702 "bip39.gperf"
      {"staff", 1696},
      {""},
#line 1496 "bip39.gperf"
      {"ripple", 1490},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""},
#line 1806 "bip39.gperf"
      {"three", 1800},
      {""}, {""}, {""}, {""}, {""}, {""},
#line 1030 "bip39.gperf"
      {"length", 1024},
#line 1447 "bip39.gperf"
      {"reflect", 1441},
#line 862 "bip39.gperf"
      {"help", 856},
      {""}, {""}, {""}, {""}, {""}, {""}, {""},
#line 736 "bip39.gperf"
      {"forget", 730},
      {""}, {""}, {""}, {""}, {""}, {""}, {""},
#line 58 "bip39.gperf"
      {"alley", 52},
      {""},
#line 622 "bip39.gperf"
      {"escape", 616},
      {""}, {""}, {""}, {""},
#line 950 "bip39.gperf"
      {"invite", 944},
      {""}, {""},
#line 1497 "bip39.gperf"
      {"risk", 1491},
      {""}, {""}, {""}, {""},
#line 1765 "bip39.gperf"
      {"swim", 1759},
      {""}, {""}, {""}, {""}, {""}, {""},
#line 1083 "bip39.gperf"
      {"mammal", 1077},
      {""}, {""},
#line 196 "bip39.gperf"
      {"blind", 190},
#line 846 "bip39.gperf"
      {"harbor", 840},
      {""}, {""}, {""}, {""},
#line 955 "bip39.gperf"
      {"issue", 949},
#line 456 "bip39.gperf"
      {"debate", 450},
      {""}, {""}, {""}, {""}, {""},
#line 820 "bip39.gperf"
      {"grape", 814},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""},
#line 548 "bip39.gperf"
      {"duck", 542},
      {""}, {""}, {""}, {""},
#line 1057 "bip39.gperf"
      {"lock", 1051},
      {""}, {""},
#line 833 "bip39.gperf"
      {"guess", 827},
      {""}, {""}, {""}, {""}, {""}, {""},
#line 1494 "bip39.gperf"
      {"ring", 1488},
      {""}, {""}, {""},
#line 207 "bip39.gperf"
      {"bomb", 201},
      {""}, {""}, {""}, {""},
#line 1678 "bip39.gperf"
      {"speed", 1672},
      {""}, {""},
#line 625 "bip39.gperf"
      {"estate", 619},
#line 1855 "bip39.gperf"
      {"transfer", 1849},
      {""}, {""}, {""}, {""}, {""},
#line 944 "bip39.gperf"
      {"inspire", 938},
      {""}, {""}, {""}, {""}, {""}, {""},
#line 202 "bip39.gperf"
      {"blush", 196},
#line 212 "bip39.gperf"
      {"border", 206},
      {""},
#line 1236 "bip39.gperf"
      {"oil", 1230},
#line 186 "bip39.gperf"
      {"bird", 180},
#line 1428 "bip39.gperf"
      {"range", 1422},
#line 167 "bip39.gperf"
      {"before", 161},
      {""}, {""},
#line 142 "bip39.gperf"
      {"baby", 136},
      {""}, {""}, {""}, {""},
#line 201 "bip39.gperf"
      {"blur", 195},
#line 150 "bip39.gperf"
      {"bamboo", 144},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
#line 1053 "bip39.gperf"
      {"load", 1047},
      {""}, {""}, {""}, {""}, {""},
#line 1007 "bip39.gperf"
      {"large", 1001},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""},
#line 957 "bip39.gperf"
      {"ivory", 951},
      {""}, {""}, {""}, {""},
#line 921 "bip39.gperf"
      {"include", 915},
      {""}, {""}, {""}, {""}, {""}, {""},
#line 1490 "bip39.gperf"
      {"ridge", 1484},
      {""}, {""}, {""},
#line 1808 "bip39.gperf"
      {"throw", 1802},
      {""}, {""}, {""}, {""},
#line 328 "bip39.gperf"
      {"choose", 322},
      {""}, {""}, {""}, {""},
#line 2047 "bip39.gperf"
      {"you", 2041},
      {""}, {""}, {""}, {""}, {""}, {""},
#line 1258 "bip39.gperf"
      {"orient", 1252},
      {""}, {""}, {""}, {""}, {""}, {""},
#line 1894 "bip39.gperf"
      {"ugly", 1888},
#line 59 "bip39.gperf"
      {"allow", 53},
      {""},
#line 2049 "bip39.gperf"
      {"youth", 2043},
      {""},
#line 1804 "bip39.gperf"
      {"this", 1798},
      {""}, {""}, {""}, {""}, {""}, {""}, {""},
#line 1018 "bip39.gperf"
      {"leader", 1012},
#line 224 "bip39.gperf"
      {"brave", 218},
      {""}, {""}, {""}, {""}, {""},
#line 716 "bip39.gperf"
      {"flee", 710},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
#line 819 "bip39.gperf"
      {"grant", 813},
      {""}, {""}, {""},
#line 1505 "bip39.gperf"
      {"rocket", 1499},
      {""}, {""}, {""}, {""},
#line 1341 "bip39.gperf"
      {"plunge", 1335},
      {""}, {""}, {""}, {""}, {""}, {""}, {""},
#line 1342 "bip39.gperf"
      {"poem", 1336},
      {""},
#line 1227 "bip39.gperf"
      {"obvious", 1221},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""},
#line 1836 "bip39.gperf"
      {"tooth", 1830},
      {""}, {""}, {""}, {""}, {""},
#line 1418 "bip39.gperf"
      {"rack", 1412},
      {""}, {""}, {""}, {""}, {""}, {""}, {""},
#line 1179 "bip39.gperf"
      {"naive", 1173},
      {""}, {""}, {""}, {""}, {""}, {""},
#line 1663 "bip39.gperf"
      {"song", 1657},
      {""}, {""}, {""}, {""},
#line 1616 "bip39.gperf"
      {"sing", 1610},
#line 66 "bip39.gperf"
      {"always", 60},
#line 949 "bip39.gperf"
      {"invest", 943},
      {""}, {""},
#line 1501 "bip39.gperf"
      {"road", 1495},
      {""},
#line 1207 "bip39.gperf"
      {"normal", 1201},
      {""},
#line 2007 "bip39.gperf"
      {"when", 2001},
      {""}, {""}, {""},
#line 1906 "bip39.gperf"
      {"unique", 1900},
#line 1720 "bip39.gperf"
      {"stone", 1714},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
#line 546 "bip39.gperf"
      {"drum", 540},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
#line 200 "bip39.gperf"
      {"blue", 194},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
#line 428 "bip39.gperf"
      {"crumble", 422},
      {""}, {""}, {""}, {""}, {""},
#line 1829 "bip39.gperf"
      {"token", 1823},
#line 1436 "bip39.gperf"
      {"ready", 1430},
      {""}, {""}, {""},
#line 1914 "bip39.gperf"
      {"update", 1908},
      {""}, {""}, {""}, {""}, {""}, {""},
#line 248 "bip39.gperf"
      {"bundle", 242},
      {""}, {""}, {""},
#line 866 "bip39.gperf"
      {"high", 860},
#line 1196 "bip39.gperf"
      {"network", 1190},
      {""}, {""},
#line 1912 "bip39.gperf"
      {"unusual", 1906},
      {""}, {""}, {""}, {""}, {""},
#line 1370 "bip39.gperf"
      {"pride", 1364},
      {""},
#line 1953 "bip39.gperf"
      {"vibrant", 1947},
#line 353 "bip39.gperf"
      {"clock", 347},
      {""}, {""}, {""}, {""}, {""}, {""}, {""},
#line 810 "bip39.gperf"
      {"goose", 804},
      {""},
#line 356 "bip39.gperf"
      {"cloth", 350},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
#line 355 "bip39.gperf"
      {"close", 349},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
#line 628 "bip39.gperf"
      {"evidence", 622},
      {""}, {""}, {""}, {""}, {""},
#line 1654 "bip39.gperf"
      {"sock", 1648},
      {""}, {""}, {""}, {""},
#line 1604 "bip39.gperf"
      {"sick", 1598},
      {""}, {""}, {""}, {""}, {""}, {""},
#line 1265 "bip39.gperf"
      {"output", 1259},
      {""}, {""},
#line 2014 "bip39.gperf"
      {"wild", 2008},
      {""}, {""}, {""}, {""},
#line 894 "bip39.gperf"
      {"humor", 888},
      {""}, {""}, {""}, {""},
#line 1762 "bip39.gperf"
      {"swear", 1756},
#line 241 "bip39.gperf"
      {"buddy", 235},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""},
#line 951 "bip39.gperf"
      {"involve", 945},
      {""},
#line 1710 "bip39.gperf"
      {"steak", 1704},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""},
#line 1960 "bip39.gperf"
      {"violin", 1954},
      {""}, {""}, {""}, {""}, {""},
#line 1759 "bip39.gperf"
      {"swamp", 1753},
      {""}, {""}, {""}, {""}, {""},
#line 605 "bip39.gperf"
      {"enough", 599},
      {""}, {""}, {""}, {""},
#line 192 "bip39.gperf"
      {"blanket", 186},
#line 1068 "bip39.gperf"
      {"luggage", 1062},
      {""},
#line 235 "bip39.gperf"
      {"bronze", 229},
#line 1705 "bip39.gperf"
      {"stamp", 1699},
#line 647 "bip39.gperf"
      {"expand", 641},
      {""}, {""}, {""}, {""}, {""},
#line 592 "bip39.gperf"
      {"enable", 586},
      {""}, {""},
#line 1067 "bip39.gperf"
      {"lucky", 1061},
      {""}, {""},
#line 96 "bip39.gperf"
      {"area", 90},
      {""}, {""}, {""}, {""},
#line 1592 "bip39.gperf"
      {"shock", 1586},
      {""}, {""}, {""},
#line 277 "bip39.gperf"
      {"capable", 271},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
#line 901 "bip39.gperf"
      {"husband", 895},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
#line 476 "bip39.gperf"
      {"depart", 470},
      {""}, {""}, {""}, {""},
#line 250 "bip39.gperf"
      {"burden", 244},
      {""}, {""}, {""}, {""}, {""}, {""},
#line 1596 "bip39.gperf"
      {"short", 1590},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
#line 493 "bip39.gperf"
      {"diagram", 487},
      {""},
#line 1863 "bip39.gperf"
      {"trial", 1857},
#line 1228 "bip39.gperf"
      {"occur", 1222},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""},
#line 1688 "bip39.gperf"
      {"spoil", 1682},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""},
#line 1692 "bip39.gperf"
      {"spot", 1686},
      {""}, {""}, {""}, {""},
#line 1748 "bip39.gperf"
      {"supply", 1742},
      {""}, {""}, {""}, {""}, {""},
#line 1910 "bip39.gperf"
      {"unlock", 1904},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""},
#line 1691 "bip39.gperf"
      {"sport", 1685},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""},
#line 1797 "bip39.gperf"
      {"that", 1791},
      {""},
#line 1262 "bip39.gperf"
      {"other", 1256},
      {""}, {""}, {""},
#line 976 "bip39.gperf"
      {"junk", 970},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""},
#line 1631 "bip39.gperf"
      {"sleep", 1625},
      {""}, {""}, {""}, {""},
#line 225 "bip39.gperf"
      {"bread", 219},
      {""}, {""}, {""}, {""},
#line 1237 "bip39.gperf"
      {"okay", 1231},
#line 777 "bip39.gperf"
      {"gather", 771},
      {""},
#line 259 "bip39.gperf"
      {"cabbage", 253},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""},
#line 1223 "bip39.gperf"
      {"oblige", 1217},
#line 1230 "bip39.gperf"
      {"october", 1224},
      {""}, {""}, {""},
#line 958 "bip39.gperf"
      {"jacket", 952},
      {""},
#line 720 "bip39.gperf"
      {"flock", 714},
#line 849 "bip39.gperf"
      {"harvest", 843},
#line 1873 "bip39.gperf"
      {"truly", 1867},
      {""}, {""}, {""}, {""}, {""}, {""},
#line 909 "bip39.gperf"
      {"ill", 903},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
#line 405 "bip39.gperf"
      {"cradle", 399},
      {""}, {""}, {""}, {""}, {""}, {""},
#line 357 "bip39.gperf"
      {"cloud", 351},
      {""},
#line 1364 "bip39.gperf"
      {"prefer", 1358},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""},
#line 905 "bip39.gperf"
      {"idea", 899},
      {""}, {""}, {""},
#line 1593 "bip39.gperf"
      {"shoe", 1587},
      {""}, {""}, {""},
#line 159 "bip39.gperf"
      {"basket", 153},
      {""},
#line 1861 "bip39.gperf"
      {"tree", 1855},
      {""}, {""}, {""}, {""}, {""},
#line 1368 "bip39.gperf"
      {"prevent", 1362},
      {""}, {""},
#line 580 "bip39.gperf"
      {"elephant", 574},
      {""}, {""}, {""}, {""}, {""}, {""},
#line 1585 "bip39.gperf"
      {"shell", 1579},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
#line 730 "bip39.gperf"
      {"fold", 724},
      {""}, {""}, {""}, {""},
#line 55 "bip39.gperf"
      {"alert", 49},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""},
#line 45 "bip39.gperf"
      {"agent", 39},
      {""}, {""}, {""},
#line 416 "bip39.gperf"
      {"crew", 410},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
#line 326 "bip39.gperf"
      {"chimney", 320},
      {""}, {""}, {""}, {""},
#line 1741 "bip39.gperf"
      {"suggest", 1735},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
#line 1377 "bip39.gperf"
      {"problem", 1371},
      {""}, {""},
#line 1679 "bip39.gperf"
      {"spell", 1673},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
#line 1597 "bip39.gperf"
      {"shoulder", 1591},
      {""}, {""}, {""},
#line 1752 "bip39.gperf"
      {"surge", 1746},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""},
#line 824 "bip39.gperf"
      {"green", 818},
      {""}, {""},
#line 145 "bip39.gperf"
      {"badge", 139},
#line 249 "bip39.gperf"
      {"bunker", 243},
      {""},
#line 765 "bip39.gperf"
      {"galaxy", 759},
      {""},
#line 1730 "bip39.gperf"
      {"stuff", 1724},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""},
#line 1382 "bip39.gperf"
      {"project", 1376},
      {""}, {""}, {""}, {""},
#line 195 "bip39.gperf"
      {"bless", 189},
      {""}, {""}, {""},
#line 1594 "bip39.gperf"
      {"shoot", 1588},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
#line 1507 "bip39.gperf"
      {"roof", 1501},
      {""},
#line 349 "bip39.gperf"
      {"cliff", 343},
      {""}, {""}, {""}, {""}, {""}, {""},
#line 974 "bip39.gperf"
      {"jungle", 968},
      {""}, {""},
#line 1793 "bip39.gperf"
      {"term", 1787},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""},
#line 114 "bip39.gperf"
      {"assault", 108},
      {""}, {""}, {""},
#line 910 "bip39.gperf"
      {"illegal", 904},
      {""},
#line 166 "bip39.gperf"
      {"beef", 160},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
#line 155 "bip39.gperf"
      {"bargain", 149},
      {""},
#line 1978 "bip39.gperf"
      {"walk", 1972},
      {""}, {""}, {""}, {""}, {""},
#line 60 "bip39.gperf"
      {"almost", 54},
      {""}, {""}, {""}, {""}, {""}, {""},
#line 1690 "bip39.gperf"
      {"spoon", 1684},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""},
#line 971 "bip39.gperf"
      {"judge", 965},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""},
#line 1130 "bip39.gperf"
      {"milk", 1124},
      {""}, {""}, {""}, {""}, {""},
#line 773 "bip39.gperf"
      {"garment", 767},
      {""}, {""}, {""}, {""},
#line 1063 "bip39.gperf"
      {"loud", 1057},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
#line 1588 "bip39.gperf"
      {"shift", 1582},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""},
#line 2046 "bip39.gperf"
      {"yellow", 2040},
      {""}, {""}, {""}, {""}, {""}, {""},
#line 1591 "bip39.gperf"
      {"shiver", 1585},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""},
#line 1466 "bip39.gperf"
      {"repair", 1460},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""},
#line 721 "bip39.gperf"
      {"floor", 715},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""},
#line 139 "bip39.gperf"
      {"awful", 133},
      {""}, {""},
#line 831 "bip39.gperf"
      {"grunt", 825},
      {""}, {""},
#line 615 "bip39.gperf"
      {"equip", 609},
      {""}, {""}, {""}, {""}, {""},
#line 1638 "bip39.gperf"
      {"slot", 1632},
      {""}, {""}, {""},
#line 1743 "bip39.gperf"
      {"summer", 1737},
      {""},
#line 1314 "bip39.gperf"
      {"phone", 1308},
      {""}, {""}, {""}, {""},
#line 1680 "bip39.gperf"
      {"spend", 1674},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
#line 941 "bip39.gperf"
      {"insane", 935},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""},
#line 1864 "bip39.gperf"
      {"tribe", 1858},
      {""}, {""}, {""}, {""},
#line 2005 "bip39.gperf"
      {"wheat", 1999},
      {""}, {""}, {""}, {""}, {""}, {""},
#line 1486 "bip39.gperf"
      {"ribbon", 1480},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""},
#line 1415 "bip39.gperf"
      {"rabbit", 1409},
#line 1658 "bip39.gperf"
      {"soldier", 1652},
      {""},
#line 317 "bip39.gperf"
      {"cheap", 311},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
#line 1835 "bip39.gperf"
      {"tool", 1829},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""},
#line 310 "bip39.gperf"
      {"champion", 304},
      {""}, {""}, {""},
#line 1934 "bip39.gperf"
      {"valve", 1928},
      {""}, {""},
#line 1937 "bip39.gperf"
      {"vapor", 1931},
      {""},
#line 82 "bip39.gperf"
      {"another", 76},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
#line 242 "bip39.gperf"
      {"budget", 236},
#line 952 "bip39.gperf"
      {"iron", 946},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""},
#line 1943 "bip39.gperf"
      {"vendor", 1937},
      {""}, {""}, {""}, {""}, {""}, {""},
#line 1942 "bip39.gperf"
      {"velvet", 1936},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""},
#line 1904 "bip39.gperf"
      {"unhappy", 1898},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""},
#line 1642 "bip39.gperf"
      {"smart", 1636},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""},
#line 251 "bip39.gperf"
      {"burger", 245},
      {""},
#line 828 "bip39.gperf"
      {"grocery", 822},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""},
#line 797 "bip39.gperf"
      {"glass", 791},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""},
#line 796 "bip39.gperf"
      {"glare", 790},
#line 1731 "bip39.gperf"
      {"stumble", 1725},
      {""}, {""}, {""}, {""}, {""}, {""},
#line 839 "bip39.gperf"
      {"habit", 833},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""},
#line 946 "bip39.gperf"
      {"intact", 940},
      {""}, {""}, {""}, {""}, {""}, {""},
#line 73 "bip39.gperf"
      {"anchor", 67},
      {""},
#line 902 "bip39.gperf"
      {"hybrid", 896},
      {""},
#line 1509 "bip39.gperf"
      {"room", 1503},
      {""},
#line 350 "bip39.gperf"
      {"climb", 344},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""},
#line 1649 "bip39.gperf"
      {"sniff", 1643},
      {""}, {""}, {""}, {""}, {""}, {""}, {""},
#line 1380 "bip39.gperf"
      {"profit", 1374},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""},
#line 1803 "bip39.gperf"
      {"thing", 1797},
      {""}, {""}, {""}, {""}, {""}, {""},
#line 2048 "bip39.gperf"
      {"young", 2042},
      {""}, {""},
#line 452 "bip39.gperf"
      {"daughter", 446},
      {""}, {""}, {""},
#line 1389 "bip39.gperf"
      {"provide", 1383},
      {""}, {""}, {""}, {""},
#line 1629 "bip39.gperf"
      {"slab", 1623},
#line 1581 "bip39.gperf"
      {"shaft", 1575},
      {""}, {""},
#line 297 "bip39.gperf"
      {"caught", 291},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""},
#line 1267 "bip39.gperf"
      {"oval", 1261},
#line 1203 "bip39.gperf"
      {"noble", 1197},
      {""}, {""}, {""}, {""}, {""}, {""}, {""},
#line 436 "bip39.gperf"
      {"cupboard", 430},
      {""},
#line 1830 "bip39.gperf"
      {"tomato", 1824},
#line 1891 "bip39.gperf"
      {"two", 1885},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""},
#line 342 "bip39.gperf"
      {"claw", 336},
      {""}, {""},
#line 228 "bip39.gperf"
      {"bridge", 222},
      {""},
#line 424 "bip39.gperf"
      {"crowd", 418},
      {""}, {""},
#line 534 "bip39.gperf"
      {"dragon", 528},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
#line 1837 "bip39.gperf"
      {"top", 1831},
      {""},
#line 1838 "bip39.gperf"
      {"topic", 1832},
      {""}, {""},
#line 1818 "bip39.gperf"
      {"tip", 1812},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
#line 857 "bip39.gperf"
      {"heavy", 851},
      {""}, {""},
#line 1870 "bip39.gperf"
      {"trouble", 1864},
      {""}, {""}, {""}, {""}, {""},
#line 1516 "bip39.gperf"
      {"rubber", 1510},
      {""}, {""}, {""}, {""}, {""},
#line 1893 "bip39.gperf"
      {"typical", 1887},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""},
#line 83 "bip39.gperf"
      {"answer", 77},
      {""}, {""}, {""},
#line 1226 "bip39.gperf"
      {"obtain", 1220},
#line 931 "bip39.gperf"
      {"inhale", 925},
      {""}, {""},
#line 575 "bip39.gperf"
      {"elbow", 569},
      {""},
#line 1595 "bip39.gperf"
      {"shop", 1589},
      {""}, {""}, {""}, {""}, {""}, {""}, {""},
#line 198 "bip39.gperf"
      {"blossom", 192},
      {""}, {""}, {""},
#line 359 "bip39.gperf"
      {"club", 353},
      {""}, {""}, {""}, {""}, {""},
#line 1257 "bip39.gperf"
      {"organ", 1251},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""},
#line 1252 "bip39.gperf"
      {"orange", 1246},
#line 67 "bip39.gperf"
      {"amateur", 61},
      {""}, {""}, {""}, {""},
#line 904 "bip39.gperf"
      {"icon", 898},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
#line 1632 "bip39.gperf"
      {"slender", 1626},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
#line 40 "bip39.gperf"
      {"affair", 34},
      {""},
#line 1220 "bip39.gperf"
      {"oak", 1214},
      {""}, {""}, {""}, {""},
#line 715 "bip39.gperf"
      {"flavor", 709},
      {""}, {""},
#line 829 "bip39.gperf"
      {"group", 823},
      {""}, {""},
#line 980 "bip39.gperf"
      {"keep", 974},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""},
#line 816 "bip39.gperf"
      {"grab", 810},
      {""},
#line 1675 "bip39.gperf"
      {"spawn", 1669},
      {""}, {""},
#line 768 "bip39.gperf"
      {"gap", 762},
      {""}, {""},
#line 1610 "bip39.gperf"
      {"silk", 1604},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""},
#line 1251 "bip39.gperf"
      {"option", 1245},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""},
#line 1878 "bip39.gperf"
      {"tube", 1872},
      {""}, {""},
#line 1701 "bip39.gperf"
      {"stadium", 1695},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""},
#line 890 "bip39.gperf"
      {"hub", 884},
      {""}, {""}, {""}, {""}, {""},
#line 21 "bip39.gperf"
      {"acid", 15},
#line 1886 "bip39.gperf"
      {"twelve", 1880},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
#line 1787 "bip39.gperf"
      {"team", 1781},
      {""},
#line 500 "bip39.gperf"
      {"differ", 494},
      {""}, {""},
#line 1862 "bip39.gperf"
      {"trend", 1856},
      {""}, {""}, {""}, {""},
#line 1970 "bip39.gperf"
      {"void", 1964},
      {""},
#line 367 "bip39.gperf"
      {"coffee", 361},
      {""}, {""}, {""}, {""}, {""},
#line 788 "bip39.gperf"
      {"gift", 782},
      {""},
#line 683 "bip39.gperf"
      {"feed", 677},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""},
#line 344 "bip39.gperf"
      {"clean", 338},
      {""}, {""}, {""},
#line 112 "bip39.gperf"
      {"ask", 106},
      {""}, {""}, {""}, {""},
#line 869 "bip39.gperf"
      {"hip", 863},
      {""}, {""}, {""}, {""},
#line 1238 "bip39.gperf"
      {"old", 1232},
#line 1892 "bip39.gperf"
      {"type", 1886},
      {""}, {""}, {""},
#line 754 "bip39.gperf"
      {"frown", 748},
      {""}, {""}, {""}, {""}, {""},
#line 1780 "bip39.gperf"
      {"tape", 1774},
      {""},
#line 1733 "bip39.gperf"
      {"subject", 1727},
      {""}, {""}, {""},
#line 1643 "bip39.gperf"
      {"smile", 1637},
      {""}, {""}, {""}, {""}, {""}, {""},
#line 745 "bip39.gperf"
      {"fragile", 739},
      {""},
#line 1689 "bip39.gperf"
      {"sponsor", 1683},
      {""}, {""}, {""},
#line 1923 "bip39.gperf"
      {"use", 1917},
#line 979 "bip39.gperf"
      {"keen", 973},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""},
#line 1699 "bip39.gperf"
      {"squirrel", 1693},
      {""},
#line 1010 "bip39.gperf"
      {"laugh", 1004},
      {""}, {""},
#line 1796 "bip39.gperf"
      {"thank", 1790},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""},
#line 89 "bip39.gperf"
      {"apology", 83},
#line 1337 "bip39.gperf"
      {"please", 1331},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""},
#line 1383 "bip39.gperf"
      {"promote", 1377},
      {""}, {""}, {""},
#line 1217 "bip39.gperf"
      {"number", 1211},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
#line 199 "bip39.gperf"
      {"blouse", 193},
      {""}, {""}, {""}, {""},
#line 599 "bip39.gperf"
      {"enforce", 593},
      {""}, {""}, {""}, {""}, {""}, {""}, {""},
#line 1998 "bip39.gperf"
      {"weekend", 1992},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
#line 911 "bip39.gperf"
      {"illness", 905},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
#line 1512 "bip39.gperf"
      {"rough", 1506},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""},
#line 1676 "bip39.gperf"
      {"speak", 1670},
      {""}, {""}, {""}, {""},
#line 197 "bip39.gperf"
      {"blood", 191},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""},
#line 1825 "bip39.gperf"
      {"toddler", 1819},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
#line 10 "bip39.gperf"
      {"above", 4},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""},
#line 881 "bip39.gperf"
      {"hope", 875},
      {""}, {""}, {""}, {""}, {""},
#line 1887 "bip39.gperf"
      {"twenty", 1881},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""},
#line 79 "bip39.gperf"
      {"ankle", 73},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""},
#line 2031 "bip39.gperf"
      {"wood", 2025},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""},
#line 1773 "bip39.gperf"
      {"table", 1767},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
#line 1815 "bip39.gperf"
      {"timber", 1809},
      {""}, {""}, {""}, {""}, {""}, {""}, {""},
#line 1698 "bip39.gperf"
      {"squeeze", 1692},
      {""}, {""}, {""}, {""},
#line 1231 "bip39.gperf"
      {"odor", 1225},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""},
#line 913 "bip39.gperf"
      {"imitate", 907},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""},
#line 1636 "bip39.gperf"
      {"slim", 1630},
      {""}, {""}, {""}, {""}, {""},
#line 712 "bip39.gperf"
      {"flame", 706},
      {""}, {""}, {""}, {""},
#line 807 "bip39.gperf"
      {"goddess", 801},
      {""}, {""}, {""},
#line 1712 "bip39.gperf"
      {"stem", 1706},
      {""}, {""}, {""}, {""},
#line 892 "bip39.gperf"
      {"human", 886},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
#line 1852 "bip39.gperf"
      {"traffic", 1846},
      {""}, {""}, {""}, {""}, {""}, {""},
#line 118 "bip39.gperf"
      {"asthma", 112},
      {""}, {""}, {""}, {""}, {""}, {""}, {""},
#line 1242 "bip39.gperf"
      {"once", 1236},
      {""}, {""}, {""}, {""}, {""},
#line 1896 "bip39.gperf"
      {"unable", 1890},
      {""},
#line 1565 "bip39.gperf"
      {"seed", 1559},
      {""}, {""}, {""},
#line 1858 "bip39.gperf"
      {"travel", 1852},
      {""}, {""}, {""}, {""}, {""},
#line 1269 "bip39.gperf"
      {"over", 1263},
      {""}, {""}, {""},
#line 841 "bip39.gperf"
      {"half", 835},
      {""}, {""}, {""}, {""}, {""}, {""}, {""},
#line 1167 "bip39.gperf"
      {"muffin", 1161},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
#line 587 "bip39.gperf"
      {"emerge", 581},
      {""}, {""},
#line 844 "bip39.gperf"
      {"hand", 838},
      {""},
#line 240 "bip39.gperf"
      {"bubble", 234},
      {""}, {""}, {""}, {""}, {""}, {""}, {""},
#line 1867 "bip39.gperf"
      {"trim", 1861},
      {""}, {""}, {""}, {""}, {""},
#line 1641 "bip39.gperf"
      {"small", 1635},
      {""}, {""}, {""}, {""}, {""},
#line 92 "bip39.gperf"
      {"approve", 86},
      {""},
#line 78 "bip39.gperf"
      {"animal", 72},
      {""}, {""}, {""}, {""}, {""},
#line 47 "bip39.gperf"
      {"ahead", 41},
      {""}, {""}, {""}, {""},
#line 771 "bip39.gperf"
      {"garden", 765},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""},
#line 865 "bip39.gperf"
      {"hidden", 859},
      {""},
#line 1957 "bip39.gperf"
      {"view", 1951},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""},
#line 1801 "bip39.gperf"
      {"there", 1795},
      {""}, {""},
#line 920 "bip39.gperf"
      {"inch", 914},
      {""}, {""}, {""},
#line 230 "bip39.gperf"
      {"bright", 224},
      {""}, {""}, {""}, {""}, {""}, {""}, {""},
#line 1869 "bip39.gperf"
      {"trophy", 1863},
      {""}, {""}, {""}, {""}, {""}, {""}, {""},
#line 822 "bip39.gperf"
      {"gravity", 816},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""},
#line 1601 "bip39.gperf"
      {"shuffle", 1595},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""},
#line 414 "bip39.gperf"
      {"credit", 408},
      {""},
#line 1905 "bip39.gperf"
      {"uniform", 1899},
#line 1187 "bip39.gperf"
      {"neck", 1181},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""},
#line 1723 "bip39.gperf"
      {"stove", 1717},
      {""}, {""}, {""}, {""}, {""}, {""},
#line 320 "bip39.gperf"
      {"chef", 314},
#line 847 "bip39.gperf"
      {"hard", 841},
      {""}, {""}, {""}, {""}, {""}, {""}, {""},
#line 1908 "bip39.gperf"
      {"universe", 1902},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""},
#line 732 "bip39.gperf"
      {"food", 726},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""},
#line 805 "bip39.gperf"
      {"glue", 799},
      {""}, {""}, {""}, {""}, {""}, {""}, {""},
#line 90 "bip39.gperf"
      {"appear", 84},
      {""}, {""}, {""}, {""}, {""}, {""},
#line 1363 "bip39.gperf"
      {"predict", 1357},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""},
#line 1779 "bip39.gperf"
      {"tank", 1773},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""},
#line 1880 "bip39.gperf"
      {"tumble", 1874},
      {""},
#line 1244 "bip39.gperf"
      {"onion", 1238},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""},
#line 1735 "bip39.gperf"
      {"subway", 1729},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""},
#line 71 "bip39.gperf"
      {"amused", 65},
      {""}, {""}, {""}, {""}, {""}, {""}, {""},
#line 755 "bip39.gperf"
      {"frozen", 749},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
#line 1703 "bip39.gperf"
      {"stage", 1697},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""},
#line 1630 "bip39.gperf"
      {"slam", 1624},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""},
#line 135 "bip39.gperf"
      {"awake", 129},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
#line 246 "bip39.gperf"
      {"bulk", 240},
      {""}, {""}, {""},
#line 795 "bip39.gperf"
      {"glance", 789},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
#line 895 "bip39.gperf"
      {"hundred", 889},
      {""}, {""}, {""}, {""}, {""},
#line 1729 "bip39.gperf"
      {"student", 1723},
      {""}, {""}, {""}, {""},
#line 387 "bip39.gperf"
      {"cook", 381},
      {""}, {""}, {""}, {""}, {""},
#line 1221 "bip39.gperf"
      {"obey", 1215},
      {""}, {""}, {""}, {""},
#line 1860 "bip39.gperf"
      {"treat", 1854},
#line 53 "bip39.gperf"
      {"album", 47},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""},
#line 1839 "bip39.gperf"
      {"topple", 1833},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
#line 1920 "bip39.gperf"
      {"urban", 1914},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""},
#line 1800 "bip39.gperf"
      {"theory", 1794},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""},
#line 61 "bip39.gperf"
      {"alone", 55},
#line 1566 "bip39.gperf"
      {"seek", 1560},
      {""},
#line 360 "bip39.gperf"
      {"clump", 354},
      {""}, {""}, {""}, {""}, {""}, {""},
#line 238 "bip39.gperf"
      {"brown", 232},
      {""}, {""}, {""}, {""}, {""}, {""}, {""},
#line 140 "bip39.gperf"
      {"awkward", 134},
      {""}, {""}, {""}, {""}, {""}, {""}, {""},
#line 1782 "bip39.gperf"
      {"task", 1776},
      {""}, {""}, {""}, {""}, {""}, {""},
#line 861 "bip39.gperf"
      {"helmet", 855},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""},
#line 1810 "bip39.gperf"
      {"thunder", 1804},
      {""}, {""}, {""},
#line 1833 "bip39.gperf"
      {"tongue", 1827},
#line 823 "bip39.gperf"
      {"great", 817},
      {""}, {""},
#line 893 "bip39.gperf"
      {"humble", 887},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
#line 1261 "bip39.gperf"
      {"ostrich", 1255},
      {""}, {""},
#line 898 "bip39.gperf"
      {"hurdle", 892},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
#line 1917 "bip39.gperf"
      {"upon", 1911},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""},
#line 1926 "bip39.gperf"
      {"useless", 1920},
#line 719 "bip39.gperf"
      {"float", 713},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""},
#line 852 "bip39.gperf"
      {"hawk", 846},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""},
#line 1734 "bip39.gperf"
      {"submit", 1728},
      {""}, {""}, {""}, {""}, {""}, {""}, {""},
#line 1683 "bip39.gperf"
      {"spider", 1677},
      {""}, {""}, {""}, {""}, {""},
#line 1719 "bip39.gperf"
      {"stomach", 1713},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""},
#line 790 "bip39.gperf"
      {"ginger", 784},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""},
#line 1811 "bip39.gperf"
      {"ticket", 1805},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""},
#line 1739 "bip39.gperf"
      {"suffer", 1733},
      {""}, {""}, {""}, {""},
#line 588 "bip39.gperf"
      {"emotion", 582},
      {""}, {""}, {""}, {""}, {""}, {""}, {""},
#line 1254 "bip39.gperf"
      {"orchard", 1248},
#line 986 "bip39.gperf"
      {"kind", 980},
#line 1774 "bip39.gperf"
      {"tackle", 1768},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
#line 845 "bip39.gperf"
      {"happy", 839},
      {""}, {""}, {""}, {""},
#line 1606 "bip39.gperf"
      {"siege", 1600},
      {""}, {""}, {""}, {""}, {""},
#line 1781 "bip39.gperf"
      {"target", 1775},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""},
#line 1897 "bip39.gperf"
      {"unaware", 1891},
      {""}, {""}, {""}, {""},
#line 1909 "bip39.gperf"
      {"unknown", 1903},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""},
#line 763 "bip39.gperf"
      {"gadget", 757},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""},
#line 789 "bip39.gperf"
      {"giggle", 783},
      {""}, {""}, {""}, {""},
#line 194 "bip39.gperf"
      {"bleak", 188},
#line 581 "bip39.gperf"
      {"elevator", 575},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""},
#line 1883 "bip39.gperf"
      {"turkey", 1877},
      {""},
#line 346 "bip39.gperf"
      {"clever", 340},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""},
#line 191 "bip39.gperf"
      {"blame", 185},
      {""}, {""}, {""}, {""}, {""},
#line 1249 "bip39.gperf"
      {"opinion", 1243},
      {""}, {""},
#line 1274 "bip39.gperf"
      {"ozone", 1268},
      {""}, {""}, {""},
#line 834 "bip39.gperf"
      {"guide", 828},
      {""}, {""}, {""}, {""}, {""},
#line 618 "bip39.gperf"
      {"erode", 612},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
#line 1918 "bip39.gperf"
      {"upper", 1912},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""},
#line 786 "bip39.gperf"
      {"ghost", 780},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""},
#line 873 "bip39.gperf"
      {"hockey", 867},
      {""}, {""}, {""}, {""}, {""}, {""},
#line 858 "bip39.gperf"
      {"hedgehog", 852},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""},
#line 1508 "bip39.gperf"
      {"rookie", 1502},
      {""}, {""}, {""}, {""}, {""},
#line 1379 "bip39.gperf"
      {"produce", 1373},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""},
#line 91 "bip39.gperf"
      {"apple", 85},
      {""},
#line 1927 "bip39.gperf"
      {"usual", 1921},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""},
#line 120 "bip39.gperf"
      {"atom", 114},
      {""}, {""}, {""}, {""}, {""},
#line 1232 "bip39.gperf"
      {"off", 1226},
      {""},
#line 1580 "bip39.gperf"
      {"shadow", 1574},
#line 1234 "bip39.gperf"
      {"office", 1228},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
#line 1823 "bip39.gperf"
      {"tobacco", 1817},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""},
#line 1245 "bip39.gperf"
      {"online", 1239},
      {""}, {""},
#line 614 "bip39.gperf"
      {"equal", 608},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""},
#line 597 "bip39.gperf"
      {"enemy", 591},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""},
#line 1802 "bip39.gperf"
      {"they", 1796},
#line 854 "bip39.gperf"
      {"head", 848},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""},
#line 953 "bip39.gperf"
      {"island", 947},
      {""}, {""}, {""},
#line 1805 "bip39.gperf"
      {"thought", 1799},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""},
#line 1684 "bip39.gperf"
      {"spike", 1678},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
#line 936 "bip39.gperf"
      {"inmate", 930},
      {""}, {""}, {""}, {""}, {""}, {""}, {""},
#line 1634 "bip39.gperf"
      {"slide", 1628},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""},
#line 243 "bip39.gperf"
      {"buffalo", 237},
      {""},
#line 956 "bip39.gperf"
      {"item", 950},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""},
#line 896 "bip39.gperf"
      {"hungry", 890},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
#line 1268 "bip39.gperf"
      {"oven", 1262},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""},
#line 1233 "bip39.gperf"
      {"offer", 1227},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""},
#line 579 "bip39.gperf"
      {"element", 573},
      {""}, {""}, {""},
#line 842 "bip39.gperf"
      {"hammer", 836},
      {""}, {""}, {""}, {""}, {""},
#line 113 "bip39.gperf"
      {"aspect", 107},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""},
#line 1799 "bip39.gperf"
      {"then", 1793},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""},
#line 1874 "bip39.gperf"
      {"trumpet", 1868},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""},
#line 2044 "bip39.gperf"
      {"yard", 2038},
      {""}, {""}, {""}, {""}, {""},
#line 1253 "bip39.gperf"
      {"orbit", 1247},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""},
#line 825 "bip39.gperf"
      {"grid", 819},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""},
#line 1903 "bip39.gperf"
      {"unfold", 1897},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""},
#line 859 "bip39.gperf"
      {"height", 853},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""},
#line 630 "bip39.gperf"
      {"evoke", 624},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""},
#line 987 "bip39.gperf"
      {"kingdom", 981},
      {""}, {""},
#line 802 "bip39.gperf"
      {"glory", 796},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
#line 978 "bip39.gperf"
      {"kangaroo", 972},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""},
#line 717 "bip39.gperf"
      {"flight", 711},
      {""}, {""}, {""}, {""}, {""},
#line 939 "bip39.gperf"
      {"input", 933},
#line 586 "bip39.gperf"
      {"embrace", 580},
      {""}, {""}, {""},
#line 808 "bip39.gperf"
      {"gold", 802},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""},
#line 954 "bip39.gperf"
      {"isolate", 948},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""},
#line 210 "bip39.gperf"
      {"book", 204},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
#line 1598 "bip39.gperf"
      {"shove", 1592},
      {""}, {""}, {""}, {""},
#line 994 "bip39.gperf"
      {"knee", 988},
      {""}, {""}, {""},
#line 983 "bip39.gperf"
      {"kick", 977},
      {""}, {""},
#line 358 "bip39.gperf"
      {"clown", 352},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
#line 1248 "bip39.gperf"
      {"opera", 1242},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""},
#line 1851 "bip39.gperf"
      {"trade", 1845},
      {""}, {""}, {""},
#line 874 "bip39.gperf"
      {"hold", 868},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
#line 930 "bip39.gperf"
      {"inform", 924},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""},
#line 1381 "bip39.gperf"
      {"program", 1375},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""},
#line 1697 "bip39.gperf"
      {"square", 1691},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
#line 1645 "bip39.gperf"
      {"smooth", 1639},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""},
#line 872 "bip39.gperf"
      {"hobby", 866},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""},
#line 1647 "bip39.gperf"
      {"snake", 1641},
      {""}, {""}, {""}, {""}, {""}, {""},
#line 1188 "bip39.gperf"
      {"need", 1182},
      {""}, {""}, {""}, {""}, {""}, {""},
#line 801 "bip39.gperf"
      {"gloom", 795},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
#line 585 "bip39.gperf"
      {"embody", 579},
#line 1192 "bip39.gperf"
      {"nephew", 1186},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
#line 1243 "bip39.gperf"
      {"one", 1237},
      {""}, {""}, {""},
#line 722 "bip39.gperf"
      {"flower", 716},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""},
#line 1635 "bip39.gperf"
      {"slight", 1629},
      {""}, {""},
#line 711 "bip39.gperf"
      {"flag", 705},
      {""}, {""}, {""},
#line 751 "bip39.gperf"
      {"frog", 745},
      {""}, {""}, {""}, {""}, {""},
#line 1778 "bip39.gperf"
      {"talk", 1772},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""},
#line 591 "bip39.gperf"
      {"empty", 585},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""},
#line 1246 "bip39.gperf"
      {"only", 1240},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""},
#line 914 "bip39.gperf"
      {"immense", 908},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""},
#line 190 "bip39.gperf"
      {"blade", 184},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""},
#line 1866 "bip39.gperf"
      {"trigger", 1860},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""},
#line 996 "bip39.gperf"
      {"knock", 990},
      {""}, {""}, {""},
#line 70 "bip39.gperf"
      {"amount", 64},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""},
#line 915 "bip39.gperf"
      {"immune", 909},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""},
#line 1650 "bip39.gperf"
      {"snow", 1644},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
#line 1263 "bip39.gperf"
      {"outdoor", 1257},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""},
#line 929 "bip39.gperf"
      {"inflict", 923},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""},
#line 1229 "bip39.gperf"
      {"ocean", 1223},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""},
#line 1639 "bip39.gperf"
      {"slow", 1633},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""},
#line 590 "bip39.gperf"
      {"empower", 584},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
#line 1853 "bip39.gperf"
      {"tragic", 1847},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
#line 799 "bip39.gperf"
      {"glimpse", 793},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
#line 1206 "bip39.gperf"
      {"noodle", 1200},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""},
#line 778 "bip39.gperf"
      {"gauge", 772},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""},
#line 234 "bip39.gperf"
      {"broken", 228},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""},
#line 830 "bip39.gperf"
      {"grow", 824},
#line 1338 "bip39.gperf"
      {"pledge", 1332},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""},
#line 1340 "bip39.gperf"
      {"plug", 1334},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""},
#line 1584 "bip39.gperf"
      {"shed", 1578},
      {""}, {""}, {""}, {""}, {""}, {""}, {""},
#line 995 "bip39.gperf"
      {"knife", 989},
      {""}, {""},
#line 1241 "bip39.gperf"
      {"omit", 1235},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""},
#line 1247 "bip39.gperf"
      {"open", 1241},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""},
#line 589 "bip39.gperf"
      {"employ", 583},
      {""}, {""}, {""},
#line 1925 "bip39.gperf"
      {"useful", 1919},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""},
#line 69 "bip39.gperf"
      {"among", 63},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""},
#line 1809 "bip39.gperf"
      {"thumb", 1803},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""},
#line 1902 "bip39.gperf"
      {"unfair", 1896},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""},
#line 809 "bip39.gperf"
      {"good", 803},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""},
#line 1895 "bip39.gperf"
      {"umbrella", 1889},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""},
#line 578 "bip39.gperf"
      {"elegant", 572},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
#line 880 "bip39.gperf"
      {"hood", 874},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
#line 928 "bip39.gperf"
      {"infant", 922},
      {""}, {""}, {""},
#line 1272 "bip39.gperf"
      {"oxygen", 1266},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""},
#line 1239 "bip39.gperf"
      {"olive", 1233},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""},
#line 1259 "bip39.gperf"
      {"original", 1253},
      {""}, {""}, {""},
#line 68 "bip39.gperf"
      {"amazing", 62},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""},
#line 62 "bip39.gperf"
      {"alpha", 56},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
#line 584 "bip39.gperf"
      {"embark", 578},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""},
#line 798 "bip39.gperf"
      {"glide", 792},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""},
#line 1922 "bip39.gperf"
      {"usage", 1916},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""},
#line 1798 "bip39.gperf"
      {"theme", 1792},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""},
#line 918 "bip39.gperf"
      {"improve", 912},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""},
#line 354 "bip39.gperf"
      {"clog", 348},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""},
#line 1250 "bip39.gperf"
      {"oppose", 1244},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""},
#line 794 "bip39.gperf"
      {"glad", 788},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""},
#line 800 "bip39.gperf"
      {"globe", 794},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
#line 919 "bip39.gperf"
      {"impulse", 913},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""},
#line 1181 "bip39.gperf"
      {"napkin", 1175},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""},
#line 917 "bip39.gperf"
      {"impose", 911},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
#line 1240 "bip39.gperf"
      {"olympic", 1234},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""},
#line 1924 "bip39.gperf"
      {"used", 1918},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""},
#line 1637 "bip39.gperf"
      {"slogan", 1631},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""},
#line 803 "bip39.gperf"
      {"glove", 797},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""},
#line 1260 "bip39.gperf"
      {"orphan", 1254},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
#line 804 "bip39.gperf"
      {"glow", 798},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""},
#line 997 "bip39.gperf"
      {"know", 991},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
#line 916 "bip39.gperf"
      {"impact", 910},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""},
#line 912 "bip39.gperf"
      {"image", 906},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
#line 1644 "bip39.gperf"
      {"smoke", 1638}
    };

  if (len <= MAX_WORD_LENGTH && len >= MIN_WORD_LENGTH)
    {
      register unsigned int key = hash (str, len);

      if (key <= MAX_HASH_VALUE)
        {
          register const char *s = wordlist[key].name;

          if (*str == *s && !strcmp (str + 1, s + 1))
            return &wordlist[key];
        }
    }
  return 0;
}
