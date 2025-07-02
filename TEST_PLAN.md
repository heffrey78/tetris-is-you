# TETRIS-IS-YOU Enhanced Word Queue System Test Plan

## Test Objectives
Verify the complete line-clear → word-consumption → rule-change pipeline with enhanced logging and intelligent word balancing.

## Key Features to Test

### 1. Word Queue System
- [x] Enhanced word consumption with type-aware balancing
- [x] Intelligent word generation avoiding duplicates
- [x] Proper noun/property balance maintenance
- [x] Comprehensive logging of word queue operations

### 2. Rule Engine Integration  
- [x] Type-aware rule modification (1-line: property edit)
- [x] Enhanced noun modification (2-line: noun edit)
- [x] Intelligent new rule creation (3-line: noun + property)
- [x] Complex fusion rules (4-line: three-word fusion)

### 3. Logging and Metrics
- [x] Comprehensive game logger with interactivity scoring
- [x] Real-time rule change tracking
- [x] Effect throttling and conflict resolution logging
- [x] Downloadable audit reports

## Test Procedures

### Basic Word Queue Tests
1. Press number keys (1-4) to trigger line clear effects
2. Observe word consumption in console logs
3. Verify word queue refills with balanced types
4. Check rule modifications match consumed word types

### Advanced Rule System Tests
1. Press 'T' to add test blocks, then trigger line clears
2. Press 'B' for BOMB spell testing
3. Press 'G' for GHOST collision testing  
4. Press 'C' for rule conflict testing
5. Press 'H' for throttling testing

### Logging and Audit Tests
1. Press 'M' to view metrics and interactivity score
2. Press 'L' to download comprehensive game logs
3. Verify detailed tracking of all rule changes and effects

## Expected Outcomes

### Word Queue Behavior
- Balanced generation of noun/property words
- No duplicate words in recent queue
- Proper consumption and refill mechanics
- Type-aware rule modifications

### Rule Engine Behavior  
- 1-line clear: Property modification using consumed word
- 2-line clear: Noun modification using consumed word
- 3-line clear: New rule creation using 2 consumed words intelligently
- 4-line clear: Fusion rule using 3 consumed words

### Logging System
- Real-time console output for all operations
- Detailed localStorage persistence
- Comprehensive downloadable audit reports
- Interactivity scoring based on rule activity

## Console Commands for Testing
```
1-4: Test line clear effects (1-4 lines)
T: Add test blocks for line clearing
B: Add BOMB spell test setup
G: Add GHOST collision test setup  
C: Test rule conflicts
H: Test effect throttling
M: Show metrics and interactivity score
L: Download game logs
```

## Success Criteria
✅ All word consumption operations logged with types
✅ Rule modifications are type-aware and intelligent
✅ Word queue maintains proper noun/property balance
✅ Comprehensive logging captures all rule interactivity
✅ Conflict resolution and throttling work correctly
✅ Complete audit trail available for download