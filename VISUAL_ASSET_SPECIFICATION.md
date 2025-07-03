# Visual Asset Specification - Tetris Is You

## Asset Categories

### 1. Block Type Assets (Priority: High)

#### Letter Blocks (A-Z) - 26 assets
- **Dimensions**: 32x32px base size (scalable)
- **Format**: SVG preferred, PNG fallback  
- **Style**: Clean, readable typography with subtle depth/shadow
- **Colors**: Each letter should have unique background color for quick identification
- **AI Prompt**: "Minimalist 3D letter block with soft shadows, clean typography, game-ready asset, [specific color] background, white text, subtle beveled edges"

#### Special Word Blocks - 6 assets
- **BOMB**: Explosive visual with warning indicators
  - **AI Prompt**: "Cartoon bomb block with lit fuse, danger symbols, red/orange color scheme, game asset style"
- **WALL**: Solid, unmovable appearance  
  - **AI Prompt**: "Stone/brick wall texture block, sturdy appearance, grey tones, medieval castle style"
- **BLOCK**: Generic solid block
  - **AI Prompt**: "Simple solid cube block, neutral colors, basic geometric shape"
- **SINK**: Downward motion visual cues
  - **AI Prompt**: "Block with downward arrows, sinking effect, blue/water colors, gravity theme"
- **FLOAT**: Upward motion visual cues
  - **AI Prompt**: "Block with upward arrows, floating effect, light blue/cloud colors, anti-gravity theme"
- **YOU**: Player control indicator
  - **AI Prompt**: "Glowing block with crown or star, golden colors, special/important appearance"

### 2. Animation Assets (Priority: High)

#### Spell Effect Animations
- **BOMB Explosion**: 
  - Particle system with debris
  - Flash effect
  - Smoke dissipation
  - **Implementation**: CSS keyframes + canvas particles
  
- **Line Clear Effect**:
  - Horizontal sweep animation
  - Sparkle/glitter particles
  - Block dissolution effect
  - **Implementation**: CSS transitions + opacity changes

- **Block Transformation**:
  - Morphing between different block types
  - Scaling and color transitions
  - **Implementation**: CSS transforms

- **Rule Formation Highlight**:
  - Glowing border effect around rule chains
  - Pulsing animation
  - **Implementation**: CSS box-shadow animation

#### Movement Animations
- **Block Drop**: Smooth falling motion with bounce
- **Block Rotation**: 90-degree rotation with easing
- **Block Placement**: Subtle scaling effect on placement

### 3. UI Elements (Priority: Medium)

#### Game HUD
- **Score Display Background**: Elegant panel design
- **Rule Display Panel**: Semi-transparent overlay for active rules
- **Difficulty Level Indicator**: Progress bar or level display
- **Pause/Menu Buttons**: Consistent with game aesthetic

#### Visual Feedback
- **Success Indicators**: Green checkmarks, positive feedback
- **Error Indicators**: Red X marks, negative feedback  
- **Preview Overlays**: Ghost pieces, rule predictions

### 4. Background Elements (Priority: Low)

#### Game Background
- **Main Play Area**: Subtle texture or gradient
- **Grid Lines**: Minimal, non-distracting guides
- **Ambient Effects**: Optional particle systems

## Implementation Strategy

### CSS-First Approach
- Use CSS transforms for basic animations
- CSS gradients for backgrounds and effects
- CSS filters for glow/shadow effects
- CSS grid for layout consistency

### Canvas Enhancement
- Particle systems for explosions/effects
- Complex animations requiring precise control
- Performance-critical visual elements

### Asset Integration
- CSS custom properties for easy theming
- Sprite sheets for related assets
- Progressive enhancement (fallbacks)

## Technical Specifications

### File Formats
- **Primary**: SVG (scalable, small file size)
- **Secondary**: PNG (with transparency)
- **Animations**: CSS keyframes + JSON data for complex sequences

### Performance Targets
- Total asset bundle < 2MB
- Individual assets < 50KB
- 60fps animation performance
- Mobile device compatibility

### Color Palette
- **Primary**: #2196F3 (Blue)
- **Secondary**: #FF9800 (Orange) 
- **Accent**: #4CAF50 (Green)
- **Warning**: #F44336 (Red)
- **Neutral**: #9E9E9E (Grey)

## Asset Priority List

### Phase 1 (Essential)
1. Letter blocks (A-Z) 
2. BOMB explosion animation
3. Line clear effects
4. Basic UI panels

### Phase 2 (Enhanced)
1. Special word blocks (WALL, SINK, FLOAT, etc.)
2. Rule formation highlights
3. Block transformation animations
4. Advanced particle effects

### Phase 3 (Polish)
1. Background elements
2. Ambient effects
3. Advanced UI animations
4. Theme variations

## AI Generation Prompts Summary

### General Style Guidelines
"Game asset in minimalist 3D style, clean edges, soft shadows, vibrant colors, optimized for web display at 32x32 base resolution"

### Specific Block Prompts
- **Letters**: "3D letter [X] block, [color] background, white text, game piece style, soft beveled edges"
- **Effects**: "[Effect name] themed block with visual indicators, appropriate color scheme, clear game iconography"
- **Special**: "Unique [type] block with distinctive appearance, thematic colors, recognizable game element"

This specification provides a complete roadmap for creating all visual assets needed to enhance the game's visual appeal and player feedback systems.