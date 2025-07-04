# Tetris Game Configuration Guide

This game supports extensive configuration through JSON files and the configuration system.

## Configuration Files

### Default Configurations

- **`config/game-config.json`** - Normal difficulty settings
- **`config/easy-config.json`** - Easier gameplay with longer spell durations and slower progression  
- **`config/hard-config.json`** - Challenging gameplay with more initial effects and faster progression

### Configuration Structure

```json
{
  "initialRules": [
    { "noun": "BLOCK", "property": "SOLID", "priority": 100 },
    { "noun": "T", "property": "BOMB", "priority": 100 }
  ],
  
  "spellDurations": {
    "explosion": 2000,
    "lightning": 1500,
    "acidBath": 2000
  },
  
  "progression": {
    "baseDropInterval": 1000,
    "speedIncreasePerLevel": 0.9,
    "linesPerLevel": 10
  },
  
  "visual": {
    "enableEnhancedEffects": true,
    "glowIntensity": 0.7,
    "animationSpeed": 1.0
  },
  
  "throttling": {
    "maxEffectsPerSecond": 10,
    "effectCooldownMs": 100
  }
}
```

## Configuration Options

### Initial Rules
Controls which tetris pieces start with special properties:

- **noun**: The piece type (`"BLOCK"`, `"I"`, `"O"`, `"T"`, `"L"`, `"J"`, `"S"`, `"Z"`) or `"WALL"`
- **property**: The effect (`"BOMB"`, `"LIGHTNING"`, `"GHOST"`, `"SHIELD"`, `"FREEZE"`, etc.)
- **priority**: Rule priority (higher numbers override lower ones)

### Spell Durations (milliseconds)
How long each effect animation lasts:

- **explosion**: BOMB explosions (default: 2000ms)
- **lightning**: LIGHTNING bolts (default: 1500ms) 
- **acidBath**: ACID dissolution (default: 2000ms)
- **shield**: SHIELD protection (default: 3000ms)
- **freeze**: FREEZE time stop (default: 2500ms)
- **magnet**: MAGNET attraction (default: 2000ms)
- **teleport**: TELEPORT swapping (default: 1000ms)
- **multiply**: MULTIPLY duplication (default: 1500ms)
- **heal**: HEAL restoration (default: 1000ms)
- **transform**: TRANSFORM changes (default: 2000ms)

### Progression Settings
Controls game difficulty scaling:

- **baseDropInterval**: Starting piece fall speed in milliseconds (default: 1000)
- **speedIncreasePerLevel**: Multiplier per level (0.9 = 10% faster, default: 0.9)
- **linesPerLevel**: Lines needed to advance each level (default: 10)

### Visual Settings
Controls visual effect appearance:

- **enableEnhancedEffects**: Enable/disable enhanced visual effects (default: true)
- **glowIntensity**: Brightness of glow effects 0.0-1.0 (default: 0.7)
- **animationSpeed**: Speed multiplier for animations (default: 1.0)

### Effect Throttling
Performance controls for spell effects:

- **maxEffectsPerSecond**: Maximum effects triggered per second (default: 10)
- **effectCooldownMs**: Minimum time between effects in milliseconds (default: 100)

## Using Custom Configurations

### Method 1: Replace Config Files
Replace the JSON files in the `config/` folder with your custom settings.

### Method 2: Programmatic Loading
```typescript
import { ConfigLoader } from './src/ConfigLoader.js';

// Load specific difficulty
const config = await ConfigLoader.getInstance().loadDifficultyConfig('hard');

// Load custom config file  
const customConfig = await ConfigLoader.getInstance().loadConfig('/path/to/custom-config.json');

// Save current settings
ConfigLoader.getInstance().saveConfigToStorage();

// Load saved settings
const savedConfig = ConfigLoader.getInstance().loadConfigFromStorage();
```

## Example Custom Configurations

### Chaos Mode
```json
{
  "initialRules": [
    { "noun": "BLOCK", "property": "SOLID", "priority": 100 },
    { "noun": "I", "property": "LIGHTNING", "priority": 100 },
    { "noun": "O", "property": "BOMB", "priority": 100 },
    { "noun": "T", "property": "MULTIPLY", "priority": 100 },
    { "noun": "L", "property": "TELEPORT", "priority": 100 },
    { "noun": "J", "property": "MAGNET", "priority": 100 },
    { "noun": "S", "property": "GHOST", "priority": 100 },
    { "noun": "Z", "property": "ACID", "priority": 100 }
  ],
  "spellDurations": {
    "explosion": 500,
    "lightning": 300,
    "acidBath": 800
  }
}
```

### Zen Mode
```json
{
  "initialRules": [
    { "noun": "BLOCK", "property": "SOLID", "priority": 100 }
  ],
  "progression": {
    "baseDropInterval": 2000,
    "speedIncreasePerLevel": 0.98,
    "linesPerLevel": 20
  },
  "visual": {
    "enableEnhancedEffects": false
  }
}
```

## Available Effects

### Destruction Effects
- **BOMB**: Explodes in 3x3 area when line cleared
- **LIGHTNING**: Destroys entire row when triggered  
- **ACID**: Dissolves blocks below, can spread horizontally

### Protection Effects  
- **SHIELD**: Protects from all destruction effects
- **FREEZE**: Stops piece falling temporarily

### Movement Effects
- **GHOST**: Pieces can pass through these blocks
- **MAGNET**: Pulls nearby blocks toward it
- **TELEPORT**: Randomly swaps positions with other blocks

### Creation Effects
- **MULTIPLY**: Creates copies when line cleared
- **SPAWN**: Creates new blocks above it every 5 seconds

### Utility Effects
- **HEAL**: Restores structural integrity nearby
- **REVEAL**: Shows enhanced next piece preview
- **SLOW**: Reduces all piece falling speed
- **FAST**: Increases all piece falling speed
- **MELT**: Blocks disappear after 10 seconds

### Special States
- **WIN**: Touching this block wins the game
- **LOSE**: Touching this block ends the game
- **SOLID**: Standard block behavior
- **BLUE/RED/GREEN**: Color-changing effects

## Tips for Custom Configurations

1. **Start Simple**: Begin with minimal effects and add complexity gradually
2. **Balance Performance**: High effect counts need higher throttling values  
3. **Test Progression**: Ensure difficulty scaling feels appropriate
4. **Visual Clarity**: Don't overwhelm players with too many simultaneous effects
5. **Save Favorites**: Use localStorage to persist preferred settings

## Troubleshooting

- **Config not loading**: Check file paths and JSON syntax
- **Game too slow**: Reduce `maxEffectsPerSecond` or increase `effectCooldownMs`
- **Effects not showing**: Verify `enableEnhancedEffects` is true
- **Game too easy/hard**: Adjust `progression` settings