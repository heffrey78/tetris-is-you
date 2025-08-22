# MusicEventSubscriber Documentation

## Overview

The `MusicEventSubscriber` class provides event-driven music management for the Tetris Is You game. It subscribes to events from `RuleEngine` and `GameLogic`, applies debouncing to prevent audio spam, and maps game events to appropriate music responses including stingers and layer changes.

## Features

- **Event Subscription Management**: Automatically subscribes to RuleEngine and GameLogic events
- **Event Debouncing**: Prevents audio spam from rapid events (configurable, default 300ms)
- **Event Filtering**: Configurable filtering based on event type, intensity, and other criteria
- **Music Action Mapping**: Maps game events to specific music actions (stingers, state transitions, etc.)
- **Callback Registration**: Support for registering multiple callbacks for different event types
- **Comprehensive Logging**: Debug logging and monitoring capabilities
- **Resource Management**: Proper cleanup and unsubscription methods

## Installation and Setup

### Basic Usage

```typescript
import { MusicEventSubscriber } from './audio/MusicEventSubscriber.js';
import { RuleEngine } from './RuleEngine.js';
import { GameLogic } from './GameLogic.js';

// Create subscriber with default configuration
const subscriber = new MusicEventSubscriber();

// Initialize game systems
const ruleEngine = new RuleEngine();
const gameLogic = new GameLogic(gameState, ruleEngine, wordQueue);

// Subscribe to events
subscriber.subscribe(ruleEngine, gameLogic);

// Register callback to handle music actions
subscriber.registerCallback((eventType, eventData, musicAction) => {
    console.log(`Event: ${eventType}, Action: ${musicAction.type}`);
    
    // Handle different music action types
    switch (musicAction.type) {
        case 'stinger':
            audioSystem.playSoundEffect(musicAction.data.soundEffect);
            break;
        case 'state_transition':
            // Handle music state changes
            break;
        // ... other actions
    }
});
```

### Advanced Configuration

```typescript
import { MusicEventSubscriber, DEFAULT_MUSIC_EVENT_CONFIG } from './audio/MusicEventSubscriber.js';

const customConfig = {
    ...DEFAULT_MUSIC_EVENT_CONFIG,
    debounceDelayMs: 500, // Longer debounce for slower responses
    enableDebugLogging: true, // Enable debug output
    
    eventFilters: {
        minSpellIntensity: 0.5, // Only respond to intense spells
        minLinesClearedForMusic: 2, // Only multi-line clears
        enablePieceMovementEvents: false, // Disable piece movement sounds
        enableBlockTransformationEvents: true,
        enabledEventTypes: new Set([
            'rule:created',
            'rule:conflict',
            'game:lineClear',
            'game:spellEffect',
            'game:stateChange'
        ])
    },
    
    musicResponses: {
        enableAutoStateTransitions: true,
        enableStingers: true,
        enableLayerChanges: false, // Disable until layered music is implemented
        intensityScalingFactor: 1.2 // Increase intensity scaling
    }
};

const subscriber = new MusicEventSubscriber(customConfig);
```

## Configuration Options

### MusicEventSubscriberConfig

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `debounceDelayMs` | number | 300 | Debounce delay for rapid events in milliseconds |
| `enableDebugLogging` | boolean | false | Enable debug logging output |
| `maxQueuedEvents` | number | 50 | Maximum number of queued events before dropping |

### Event Filters

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `minSpellIntensity` | number | 0.3 | Minimum intensity threshold for spell effects |
| `minLinesClearedForMusic` | number | 1 | Minimum lines cleared to trigger music response |
| `enablePieceMovementEvents` | boolean | true | Whether to respond to piece movement events |
| `enableBlockTransformationEvents` | boolean | true | Whether to respond to block transformation events |
| `enabledEventTypes` | Set<string> | All types | Set of enabled event types |

### Music Responses

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `enableAutoStateTransitions` | boolean | true | Enable automatic state transitions |
| `enableStingers` | boolean | true | Enable stinger sounds for events |
| `enableLayerChanges` | boolean | true | Enable layer changes for events |
| `intensityScalingFactor` | number | 1.0 | Intensity scaling factor for events |

## Event Types and Mappings

### Rule Engine Events

- **`rule:created`**: New rule formation
  - Music Action: Stinger (`ruleFormation`)
  - State Change: IDLE → BUILDING

- **`rule:modified`**: Rule modification
  - Music Action: Stinger (`blockTransformation`)

- **`rule:conflict`**: Rule conflict resolution
  - Music Action: Stinger (`error`)
  - Intensity: Increases by 0.2

### Game Logic Events

- **`game:lineClear`**: Lines cleared
  - 1 line: Stinger (`lineClear`)
  - 2-3 lines: State transition to BUILDING
  - 4+ lines: State transition to INTENSE
  - Intensity: Increases by `linesCleared * 0.15`

- **`game:spellEffect`**: Spell effects
  - Music Action: Stinger (spell-specific sound)
  - State Change: Based on intensity (>0.7 → INTENSE, >0.4 → BUILDING)
  - Intensity: Increases by `spellIntensity * 0.3`

- **`game:blockTransformation`**: Block transformations
  - Music Action: Stinger (`blockTransformation`)

- **`game:pieceMovement`**: Piece movements
  - `place`: Stinger (`pieceDrop`)
  - `rotate`: Stinger (`pieceRotate`)

- **`game:stateChange`**: Game state changes
  - `gameOver`: State transition to DEFEAT
  - `level`: State transition to BUILDING

## Music Action Types

### Stinger
Immediate sound effect playback.

```typescript
{
    type: 'stinger',
    data: {
        soundEffect: 'bombExplosion'
    }
}
```

### State Transition
Music state change with optional sound effect.

```typescript
{
    type: 'state_transition',
    data: {
        newState: MusicState.INTENSE,
        soundEffect: 'success'
    }
}
```

### Intensity Change
Dynamic intensity adjustment.

```typescript
{
    type: 'intensity_change',
    data: {
        intensity: 0.8
    }
}
```

### Layer Change
Layer composition changes (for future layered music system).

```typescript
{
    type: 'layer_change',
    data: {
        layerChanges: [
            {
                layerId: 'percussion',
                action: 'start',
                value: 0.7
            }
        ]
    }
}
```

## Debouncing System

The debouncing system prevents audio spam from rapid events:

1. **Debounce Keys**: Events are grouped by type and relevant data
2. **Timer Management**: Each event type has its own debounce timer
3. **Event Updating**: Rapid events update the latest data but don't create new timers
4. **Queue Management**: Processed events are queued and callbacks are notified

### Debounce Key Examples

- Spell effects: `game:spellEffect:BOMB:5:10`
- Block transformations: `game:blockTransformation:destruction:3:15`
- Piece movements: `game:pieceMovement:rotate:T`

## API Reference

### Constructor
```typescript
constructor(config?: Partial<MusicEventSubscriberConfig>)
```

### Core Methods

#### subscribe(ruleEngine, gameLogic)
Subscribe to events from game systems.

```typescript
subscribe(
    ruleEngine: { getEventEmitter(): EventEmitter<EventMap> },
    gameLogic: { getEventEmitter(): EventEmitter<EventMap> }
): void
```

#### unsubscribe()
Unsubscribe from all events and clean up resources.

```typescript
unsubscribe(): void
```

#### registerCallback(callback)
Register a callback for music events.

```typescript
registerCallback(callback: MusicEventCallback): void
```

#### removeCallback(callback)
Remove a registered callback.

```typescript
removeCallback(callback: MusicEventCallback): void
```

### Configuration Methods

#### updateConfig(newConfig)
Update configuration at runtime.

```typescript
updateConfig(newConfig: Partial<MusicEventSubscriberConfig>): void
```

### State Methods

#### getCurrentMusicState()
Get the current music state.

```typescript
getCurrentMusicState(): MusicState
```

#### getCurrentIntensity()
Get the current intensity level.

```typescript
getCurrentIntensity(): number
```

#### isActivelySubscribed()
Check if actively subscribed to events.

```typescript
isActivelySubscribed(): boolean
```

### Debugging Methods

#### getQueueStatus()
Get event queue status for debugging.

```typescript
getQueueStatus(): {
    queuedEvents: number;
    debouncedEvents: number;
    activeTimers: number;
}
```

### Cleanup Methods

#### dispose()
Dispose of all resources and clean up.

```typescript
dispose(): void
```

## Integration with AudioSystem

### Basic Integration

```typescript
import { AudioSystem } from './AudioSystem.js';
import { MusicEventSubscriber } from './audio/MusicEventSubscriber.js';

const audioSystem = new AudioSystem();
const subscriber = new MusicEventSubscriber();

subscriber.registerCallback((eventType, eventData, musicAction) => {
    if (musicAction.type === 'stinger' && musicAction.data?.soundEffect) {
        audioSystem.playSoundEffect(musicAction.data.soundEffect);
    }
});
```

### Advanced Integration

See `MusicEventSubscriberExample.ts` for a complete reactive audio system implementation.

## Testing

Use the provided test file `test_music_event_subscriber.html` to verify functionality:

1. Open the test file in a web browser
2. Run the initialization test
3. Test event subscription
4. Test various event types
5. Verify debouncing behavior
6. Test configuration updates
7. Test cleanup functionality

## Debugging

Enable debug logging for detailed event processing information:

```typescript
const subscriber = new MusicEventSubscriber({
    enableDebugLogging: true
});
```

Debug output includes:
- Event subscription confirmations
- Event filtering decisions
- Debounce timing information
- Music action generation
- State transitions
- Queue status updates

## Performance Considerations

- **Event Debouncing**: Prevents audio system overload from rapid events
- **Event Filtering**: Reduces unnecessary processing
- **Queue Management**: Prevents memory leaks from accumulated events
- **Timer Cleanup**: Proper cleanup prevents timer accumulation
- **Callback Management**: Efficient callback registration/removal

## Future Enhancements

1. **Layered Music System Integration**: Full support for dynamic layer composition
2. **Advanced State Machines**: More sophisticated music state transitions
3. **Event Analytics**: Track and analyze event patterns for optimization
4. **Audio Ducking**: Automatic volume adjustment for voice/sound priority
5. **Adaptive Intensity**: Machine learning-based intensity adjustment
6. **Cross-fade Support**: Smooth transitions between different music pieces

## Error Handling

The system includes comprehensive error handling:

- **Subscription Errors**: Graceful fallback if EventEmitter unavailable
- **Callback Errors**: Individual callback errors don't affect others
- **Timer Errors**: Automatic cleanup of failed timers
- **Configuration Errors**: Validation and fallback to defaults
- **Memory Management**: Automatic cleanup to prevent leaks

## Browser Compatibility

- **Modern Browsers**: Full support for ES2020+ features
- **Audio Context**: Requires user interaction for audio initialization
- **Timer Support**: Uses standard setTimeout/clearTimeout
- **Map/Set Support**: Requires ES6+ Map and Set support