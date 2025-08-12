# JSON Benchmark Extension

This Chrome extension benchmarks three different ways to send large JSON data over the wire between extension components.

## What it measures

The extension compares three different approaches for sending JSON data:

1. **JSON.stringify approach**: The JSON object is stringified on the sender side and parsed on the receiver side
2. **Direct JSON approach**: The JSON object is sent directly through the Chrome extension messaging API
3. **Direct JSON + DFS approach**: Same as Direct JSON, but includes the time to traverse the JSON object using Depth-First Search (DFS) to count characters as if `JSON.stringify()` was called

## Features

- Generates complex, realistic JSON objects with nested structures
- Includes users, products, orders, and analytics data
- Configurable data size (target character count)
- Real-time performance comparison of all three methods
- Detailed throughput metrics
- DFS character counting validation against `JSON.stringify().length`

## How to use

1. Load the extension in Chrome developer mode
2. Click on the extension icon to open the popup
3. Enter the desired JSON data size in characters (default: 50,000)
4. Click "Run JSON Benchmark"
5. View the comparison results showing which method is fastest

## JSON Structure

The generated JSON objects include:

- **Users**: Personal information, preferences, addresses, coordinates
- **Products**: Specifications, inventory, pricing, categories
- **Orders**: Items, shipping details, payment info, timestamps
- **Analytics**: Daily/monthly metrics and statistics
- **Configuration**: Feature flags, limits, endpoints

## Benchmark Results

The extension displays:

- Individual timing for each approach with medal rankings (🥇🥈🥉)
- Winner determination with percentage difference
- Throughput metrics (KB/s) for all three methods
- DFS validation (character count comparison)
- Data size breakdown

## Technical Details

### DFS Character Counting

The third benchmark option includes a custom Depth-First Search function that manually traverses the JSON object to count the exact number of characters that would be produced by `JSON.stringify()`. This helps measure the overhead of manual object traversal vs the built-in stringification.

The DFS function handles:

- Proper quote escaping for strings
- Boolean and null value lengths
- Number to string conversion
- Array and object structure counting
- Circular reference detection
- Function and symbol omission

## Files

- `bench.js`: Core JSON object generation function
- `test-extension-mv3/popup.js`: Frontend benchmark logic with DFS counting
- `test-extension-mv3/background.js`: Backend message handling for all three types
- `test-extension-mv3/popup.html`: User interface
- `test-json.js`: Standalone JSON generation testing script
- `test-dfs.js`: DFS function validation script

## Example Output

```
📊 JSON Benchmark (92.6 KB data)
JSON.stringify: 45ms 🥇
Direct JSON: 52ms 🥈
Direct JSON + DFS: 67ms 🥉

JSON.stringify is fastest, slowest is 22ms slower (48.9%)
Throughput: Stringify=2.1KB/s, Direct=1.8KB/s, DFS=1.4KB/s
DFS counted 94804 chars vs JSON.stringify 94804 chars
```

## Technical Implementation

- Uses Chrome extension Manifest V3
- Implements port-based messaging for real-time communication
- Measures performance using `performance.now()` for high precision
- Handles string, object, and DFS-enhanced object message formats
- Includes error handling and progress indicators
- Validates DFS counting accuracy against native JSON.stringify
