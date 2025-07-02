# Tetris-is-You: Words, Effects, and Combos Guide

## Overview

Tetris-is-You combines traditional Tetris gameplay with a dynamic rule system inspired by "Baba Is You". The game uses words and properties to modify gameplay in real-time, creating emergent and strategic gameplay possibilities.

## How Rules Work

### Rule Format
All rules follow the pattern: `[NOUN] IS [PROPERTY]`

Examples:
- `[BLOCK] IS [SOLID]` - Blocks behave as solid objects
- `[WALL] IS [STOP]` - Walls stop movement
- `[TELEPORT] IS [HOT]` - Teleport blocks have heat effects

### Rule Creation System

Rules are created through line clears, with different effects based on lines cleared:

| Lines Cleared | Effect | Description |
|---------------|--------|-------------|
| 1-Line | Property Change | Changes the property of the primary rule |
| 2-Line | Noun Change | Changes the noun (subject) of the primary rule |
| 3-Line | New Rule | Creates an entirely new rule |
| 4-Line | Fusion Rule | Combines 3 words into a complex fusion rule |

## Word Categories

### Nouns (Subjects)
These define what object the rule applies to:

| Noun | Description | Usage |
|------|-------------|-------|
| `BLOCK` | Generic game blocks | Most common subject for rules |
| `WALL` | Boundary walls | Controls boundary behavior |
| `LINE` | Complete horizontal lines | Line clearing effects |
| `PIECE` | Current falling piece | Active piece modifications |

### Properties (Effects)

#### Destruction Spells
| Property | Effect | Visual | Trigger |
|----------|--------|--------|---------|
| `BOMB` | Explodes when line cleared, destroying 3x3 area | Pulsing glow | Line clear |
| `LIGHTNING` | Shoots lightning bolt across row when placed | Sparking effect | Block placement |
| `ACID` | Dissolves blocks below over time | Dissolving animation | Time-based |

#### Protection Spells
| Property | Effect | Visual | Trigger |
|----------|--------|--------|---------|
| `SHIELD` | Creates indestructible barrier blocking all effects | Barrier glow | Continuous |
| `FREEZE` | Stops time - all pieces pause for 3 seconds | Ice crystal effect | Block appearance |

#### Movement Spells
| Property | Effect | Visual | Trigger |
|----------|--------|--------|---------|
| `MAGNET` | Pulls all nearby blocks toward it | Magnetic field | Block placement |
| `TELEPORT` | Randomly swaps positions with another block | Portal effect | Line clear |

#### Creation Spells
| Property | Effect | Visual | Trigger |
|----------|--------|--------|---------|
| `MULTIPLY` | Creates copy in random empty spot | Duplication effect | Line clear |
| `SPAWN` | Creates new random blocks above every 5 seconds | Birth animation | Time-based |

#### Transformation Spells
| Property | Effect | Visual | Trigger |
|----------|--------|--------|---------|
| `TRANSFORM` | Changes adjacent blocks to match its type | Morphing effect | Block placement |
| `HEAL` | Repairs damaged blocks in 5x5 area | Healing glow | Continuous |

#### Utility Spells
| Property | Effect | Visual | Trigger |
|----------|--------|--------|---------|
| `REVEAL` | Shows ghost preview of next 3 pieces | Insight glow | Continuous |
| `SLOW` | Reduces falling speed of all pieces by 50% | Time distortion | While active |

#### Basic Properties
| Property | Effect | Visual | Description |
|----------|--------|--------|-------------|
| `SOLID` | Blocks are solid and block movement | Normal opacity | Default block behavior |
| `GHOST` | Blocks are transparent and passable | 30% opacity | Phase through blocks |

#### Color Properties
| Property | Effect | Visual | Usage |
|----------|--------|--------|-------|
| `BLUE` | Changes blocks to blue color | Blue coloring | Visual/rule targeting |
| `RED` | Changes blocks to red color | Red coloring | Visual/rule targeting |
| `GREEN` | Changes blocks to green color | Green coloring | Visual/rule targeting |

#### Special Conditions
| Property | Effect | Visual | Trigger |
|----------|--------|--------|---------|
| `WIN` | Touching this block wins the game | Victory glow | Contact |
| `LOSE` | Touching this block ends the game | Danger animation | Contact |
| `MELT` | Blocks disappear after short time | Dissolving | Time-based |

## Advanced Combos

### Strategic Combinations

#### Defensive Combos
- `[BLOCK] IS [SHIELD]` + `[WALL] IS [HEAL]` = Unbreakable defense with healing
- `[PIECE] IS [GHOST]` + `[BLOCK] IS [SOLID]` = Phase through your own blocks
- `[LINE] IS [FREEZE]` = Pause game when lines clear for strategy time

#### Offensive Combos
- `[BLOCK] IS [BOMB]` + `[LINE] IS [LIGHTNING]` = Explosive line clears with chain reactions
- `[PIECE] IS [ACID]` + `[BLOCK] IS [MELT]` = Dissolve obstacles and temporary blocks
- `[WALL] IS [MULTIPLY]` = Create more destruction points

#### Utility Combos  
- `[BLOCK] IS [REVEAL]` + `[PIECE] IS [SLOW]` = Enhanced preview with time to plan
- `[LINE] IS [TELEPORT]` + `[BLOCK] IS [MAGNET]` = Reorganize field on line clears
- `[PIECE] IS [TRANSFORM]` + `[BLOCK] IS [SPAWN]` = Convert and generate new blocks

### Fusion Rules (4-Line Clears)

Fusion rules combine 3 words from the word queue into complex effects:
- Often create win conditions: `[WORD2] IS [WIN]`
- Can create unique hybrid effects not available through single properties
- Strategic timing of 4-line clears (Tetris) becomes crucial

## Word Queue System

### Queue Mechanics
- 10 words maintained in queue at all times
- Words consumed based on lines cleared (1-3 words per clear)
- Queue automatically refills with balanced noun/property mix
- Word types color-coded for quick identification

### Queue Strategy
- Monitor queue contents before making clears
- Plan line clears based on desired rule changes
- Save powerful words for critical moments
- Balance offense, defense, and utility words

## Rule Matrix Preview

The Rule Matrix shows potential effects:
- **1-Line**: Property change preview
- **2-Line**: Noun change preview  
- **3-Line**: New rule preview
- **4-Line**: Fusion combination preview

Use this to plan your strategy and understand what each line clear will accomplish.

## Victory Conditions

### Dynamic Win States
- Default: Survive and clear lines (traditional Tetris)
- Rule-Based: Any `[NOUN] IS [WIN]` creates new win condition
- Fusion Wins: 4-line fusion rules often create unique victory paths

### Game Over Conditions
- Traditional: Pieces reach the top
- Rule-Based: Any `[NOUN] IS [LOSE]` contact
- Strategic: Avoid creating lose conditions inadvertently

## Strategic Tips

### Early Game
- Focus on understanding your starting rules
- Build toward 2-3 line clears for controlled rule changes
- Avoid 4-line clears until you understand fusion effects

### Mid Game  
- Create beneficial synergies between multiple rules
- Use defensive properties to survive complex interactions
- Plan word queue consumption 2-3 moves ahead

### Late Game
- Master fusion rules for powerful combinations
- Create win conditions while avoiding lose conditions
- Use utility effects to control game pace and difficulty

### Risk Management
- Always check for potential `LOSE` conditions before rule changes
- Keep defensive options available (SHIELD, FREEZE, HEAL)
- Don't rely too heavily on time-based effects (SPAWN, MELT)

## Technical Implementation

### Property Effect Interface
Each property implements specific hooks:
- `applyToBlock()`: Direct block modifications
- `applyToPhysics()`: Movement and destruction logic  
- `visualEffect()`: Rendering and animation effects
- `applyToMovement()`: Movement modifications

### Rule Processing Order
1. Line clear detected
2. Word queue consulted based on clear type
3. Rule engine applies changes
4. Property effects recalculated
5. Visual effects and animations updated
6. Win/lose conditions checked

This system creates a rich, emergent gameplay experience where every line clear can fundamentally change how the game behaves, requiring players to constantly adapt their strategy.