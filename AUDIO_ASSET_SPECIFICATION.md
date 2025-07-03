# Audio Asset Specification - Tetris Is You

## Audio Categories

### 1. Sound Effects (Priority: High)

#### Core Game Sounds
- **Piece Drop**: Satisfying "thunk" when piece lands
  - Format: WAV, 44.1kHz, mono, <1s duration
  - Style: Wooden block sound with subtle reverb
  
- **Piece Rotation**: Quick "swoosh" for rotations  
  - Format: WAV, 44.1kHz, mono, <0.5s duration
  - Style: Air/wind sound, light and fast

- **Line Clear**: Triumphant clearing sound
  - Format: WAV, 44.1kHz, stereo, 1-2s duration  
  - Style: Glass chime or bell sequence, ascending pitch

#### Spell Effect Sounds
- **BOMB Explosion**: Dramatic explosion
  - Format: WAV, 44.1kHz, stereo, 1-2s duration
  - Style: Cartoon explosion with rumble tail

- **Rule Formation**: Magical "ding" when rules form
  - Format: WAV, 44.1kHz, mono, 0.5s duration
  - Style: Crystalline chime, positive feedback

- **Block Transformation**: Magical transformation sound
  - Format: WAV, 44.1kHz, mono, 0.8s duration
  - Style: Sparkling/shimmer effect

#### UI Sounds  
- **Menu Navigation**: Subtle click/beep
- **Error**: Gentle negative feedback tone
- **Success**: Positive confirmation sound

### 2. Background Music (Priority: Medium)

#### Main Game Track
- **Style**: Upbeat, electronic/chiptune inspired
- **Tempo**: 120-140 BPM 
- **Duration**: 2-3 minute loop
- **Format**: MP3, 128kbps, stereo
- **Mood**: Energetic but not distracting

#### Alternative Tracks
- **Intense Mode**: Faster tempo for higher difficulty
- **Calm Mode**: Slower, more meditative for focused play

### 3. Audio System Features

#### Volume Controls
- Master volume slider
- SFX volume control  
- Music volume control
- Mute toggle for each category

#### Audio Mixing
- Sound effect layering (multiple sounds can play simultaneously)
- Dynamic volume adjustment based on game state
- Audio ducking (music lowers when important SFX play)

## Implementation Approach

### HTML5 Audio API
- Use Web Audio API for precise control
- AudioContext for mixing and effects
- Audio buffering for low-latency playback

### File Management
- Preload critical sound effects
- Lazy load background music
- Audio sprite sheets for related sounds

### Performance Optimization
- Compressed audio formats
- Audio pooling for frequently played sounds
- Fallback audio formats for compatibility

## Audio Asset Priority

### Phase 1 (Essential)
1. Piece drop sound
2. Line clear sound  
3. BOMB explosion
4. Basic UI feedback sounds

### Phase 2 (Enhanced)
1. Background music
2. All spell effect sounds
3. Volume controls
4. Audio mixing system

### Phase 3 (Polish)
1. Advanced sound effects
2. Multiple music tracks
3. Audio visualization
4. Accessibility features (visual sound indicators)

## Technical Requirements

- Total audio bundle < 5MB
- Low latency playback (<100ms)
- Cross-browser compatibility
- Mobile device support
- Accessible audio controls

This audio specification complements the visual assets to create a complete sensory experience for the game.