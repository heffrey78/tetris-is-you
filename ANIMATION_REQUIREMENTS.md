# Spell Animation Requirements

## Current Implementation ✅
- [x] Center-screen spell notifications with scaling/rotation
- [x] Color-coded spell effects (red bombs, blue lightning, purple combos)
- [x] JavaScript-based animation system with smooth transitions
- [x] Spell combination detection and ultra combo notifications
- [x] Basic visual feedback for spell triggers

## Phase 2: Targeted Spell Animations 🎯

### Lightning Effects
- **Lightning bolt visuals**: Animated white/blue zigzag lines across entire rows
- **Electrical arcs**: Branching lightning effects from source block to row edges
- **Block sparking**: Brief electrical particle effects on destroyed blocks
- **Chain lightning**: Visual trails connecting lightning strikes across rows
- **Screen flash**: Brief white flash effect for major lightning strikes

### Bomb Effects  
- **Explosion particles**: Radiating orange/red particles from bomb center
- **Shockwave rings**: Expanding circles showing blast radius (3x3 area)
- **Block fragmentation**: Destroyed blocks break into flying pieces
- **Screen shake**: Camera shake effect for large explosions
- **Fire trails**: Lingering flame effects at explosion sites

### Acid Effects
- **Dripping animation**: Green acid droplets falling from dissolved blocks
- **Bubbling**: Acid blocks have continuous bubbling/sizzling effects  
- **Corrosion spread**: Visual trails showing acid spreading horizontally
- **Dissolving blocks**: Blocks slowly fade/melt away rather than instant removal
- **Toxic pools**: Temporary green overlay where acid has spread

### Block-Specific Feedback
- **Destruction anticipation**: Blocks flash/shake before being destroyed
- **Type-based effects**: Different materials have unique destruction styles
- **Chain reaction trails**: Visual connections between triggering blocks
- **Status indicators**: Glowing outlines for blocks with active spell properties

### Advanced Effects
- **Particle systems**: Reusable particle engine for various spell effects
- **Canvas overlays**: Separate animation layer for non-block effects
- **Timing coordination**: Animations synchronized with game logic timing
- **Performance optimization**: Efficient rendering for multiple simultaneous effects

## Implementation Strategy
1. Create `AnimationEngine` class for managing visual effects
2. Add Canvas overlay system for particle effects  
3. Implement spell-specific animation methods
4. Add block state visual indicators
5. Create particle system for explosions/sparks
6. Add screen effects (shake, flash, etc.)

## Success Criteria
- Spell effects have clear visual representation on the game field
- Players can immediately see where and how spells are affecting blocks
- Animations enhance gameplay understanding without being distracting
- Performance remains smooth with multiple simultaneous spell effects
- Visual feedback makes spell combinations feel more impactful than current system