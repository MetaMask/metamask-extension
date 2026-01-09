# rules-decimals.md

## Definition of a Significant Digit

A significant digit is a digit in a number that contributes to its precision, excluding placeholders like leading zeros. In scientific measurements, it reflects uncertainty; in everyday math (e.g., crypto prices), numbers are often treated as exact, so all displayed digits matter for readability.

### Key Rules for Identifying Significant Digits

1. All non-zero digits (1-9) are always significant.

   - Example: 123.45 has 5 significant digits.

2. Zeros between non-zero digits are significant.

   - Example: 1002 has 4 significant digits.

3. Leading zeros are not significant.

   - Example: 0.00123 has 3 significant digits.

4. Trailing zeros are significant only with a decimal point (or scientific notation). Without, they are ambiguous in scientific contexts but often treated as exact in everyday math like prices.

   - Example: 1.230 has 4 significant digits; 1230 is ambiguous (could be 3 or 4)—use 1230. or 1.230 × 10³ for clarity in precision.

5. Exact numbers have unlimited significant digits.
   - Example: 12 in a dozen.

## General Formatting Rules

- Max 6 decimals (like Hyperliquid); never exceed.
- Hide trailing zeros (e.g., 1.230 → 1.23; 1.000 → 1).
- Apply sig digs, but cap decimals at 6.
- Use |v| for conditions.
- Sig digs by range:
  - > $100,000: 6 sig digs.
  - $100,000 > x > $0.01: 5 sig digs.
  - < $0.01: 4 sig digs.

## Decimal Display by Price Range (Based on FiatRangeConfig)

Integrates config with sig digs and max 6 decimals.

- |v| > 10,000 (threshold: 10,000): min 0, max 0 decimals; 5 sig digs, or 6 if >100k.

  - Ex: 12345.67 → 12346
  - Ex: 123456.78 → 123457

- |v| > 1,000 (threshold: 1,000): min 0, max 1 decimal; 5 sig digs.

  - Ex: 1234.56 → 1234.6

- |v| > 100 (threshold: 100): min 0, max 2 decimals; 5 sig digs.

  - Ex: 123.456 → 123.46

- |v| > 10 (threshold: 10): min 0, max 4 decimals; 5 sig digs.

  - Ex: 12.34567 → 12.346

- |v| ≤ 10 (threshold: 0.00000001): 5 sig digs, min 2, max 6 decimals; 4 sig digs if <0.01.
  - Ex: 1.3445555 → 1.3446
  - Ex: 0.333333 → 0.33333
  - Ex: 0.004236 → 0.004236
  - Ex: 0.0000006 → 0.000001
  - Ex: 0.0000004 → 0
