/**
 * TypeScript interfaces for LayeredMusicSystem components
 * Provides comprehensive type definitions for dynamic music layers,
 * state management, and configuration integration.
 */

import { AudioConfig } from '../AudioSystem';

/**
 * Enumeration of possible music states that drive layer composition
 */
export enum MusicState {
    /** Calm, minimal music for idle moments */
    IDLE = 'idle',
    /** Dynamic music as tension builds */
    BUILDING = 'building', 
    /** High-energy music during intense gameplay */
    INTENSE = 'intense',
    /** Celebratory music for successful completion */
    VICTORY = 'victory',
    /** Somber music for game over scenarios */
    DEFEAT = 'defeat'
}

/**
 * Types of musical layers that can be composed together
 */
export enum LayerType {
    /** Foundation rhythm and bass elements */
    BASE = 'base',
    /** Primary melodic content */
    MELODY = 'melody',
    /** Harmonic accompaniment and chords */
    HARMONY = 'harmony',
    /** Rhythmic elements and beats */
    PERCUSSION = 'percussion',
    /** Atmospheric sounds and textures */
    AMBIENT = 'ambient'
}

/**
 * Configuration for crossfade transitions between layers
 */
export interface CrossfadeConfig {
    /** Duration of crossfade in milliseconds */
    duration: number;
    /** Easing curve for volume transition ('linear' | 'exponential' | 'logarithmic') */
    curve: 'linear' | 'exponential' | 'logarithmic';
    /** Whether to allow overlapping during crossfade */
    allowOverlap: boolean;
}

/**
 * Individual music layer interface with playback and volume controls
 */
export interface MusicLayer {
    /** Unique identifier for this layer */
    readonly id: string;
    
    /** Type category of this musical layer */
    readonly type: LayerType;
    
    /** Music states where this layer should be active */
    readonly activeStates: MusicState[];
    
    /** Base volume level (0.0 - 1.0) */
    readonly baseVolume: number;
    
    /** Current playing state */
    readonly isPlaying: boolean;
    
    /** Current volume level (0.0 - 1.0) */
    readonly currentVolume: number;
    
    /** Whether this layer is currently fading */
    readonly isFading: boolean;
    
    /**
     * Start playing this layer
     * @param fadeInMs Optional fade-in duration in milliseconds
     * @returns Promise that resolves when playback starts
     */
    play(fadeInMs?: number): Promise<void>;
    
    /**
     * Stop playing this layer
     * @param fadeOutMs Optional fade-out duration in milliseconds
     * @returns Promise that resolves when playback stops
     */
    stop(fadeOutMs?: number): Promise<void>;
    
    /**
     * Set the volume level of this layer
     * @param volume Target volume (0.0 - 1.0)
     * @param transitionMs Duration of volume change in milliseconds
     * @returns Promise that resolves when volume change completes
     */
    setVolume(volume: number, transitionMs?: number): Promise<void>;
    
    /**
     * Perform a crossfade transition to another layer
     * @param targetLayer Layer to crossfade to
     * @param config Crossfade configuration
     * @returns Promise that resolves when crossfade completes
     */
    crossfadeTo(targetLayer: MusicLayer, config: CrossfadeConfig): Promise<void>;
    
    /**
     * Update layer state based on current music state
     * @param musicState Current music state
     * @param intensity Intensity level (0.0 - 1.0)
     */
    updateForState(musicState: MusicState, intensity: number): void;
    
    /**
     * Add event listener for layer events
     * @param callback Callback function for layer events
     */
    addEventListener(callback: LayerEventCallback): void;
    
    /**
     * Remove event listener
     * @param callback Callback function to remove
     */
    removeEventListener(callback: LayerEventCallback): void;
    
    /**
     * Clean up resources and stop playback
     */
    dispose(): void;
}

/**
 * Layer composition and transition configuration
 */
export interface LayerComposition {
    /** Required layers for this composition */
    requiredLayers: LayerType[];
    
    /** Optional layers that enhance the composition */
    optionalLayers: LayerType[];
    
    /** Volume mixing ratios for each layer type */
    volumeMix: Partial<Record<LayerType, number>>;
    
    /** Transition settings between states */
    transitions: {
        /** Default crossfade configuration */
        default: CrossfadeConfig;
        
        /** State-specific transition overrides */
        stateSpecific?: Partial<Record<MusicState, CrossfadeConfig>>;
    };
}

/**
 * Event data for music layer changes
 */
export interface LayerEvent {
    /** Type of event that occurred */
    type: 'layer_started' | 'layer_stopped' | 'layer_volume_changed' | 'crossfade_started' | 'crossfade_completed';
    
    /** Layer that triggered the event */
    layer: MusicLayer;
    
    /** Event timestamp */
    timestamp: number;
    
    /** Additional event-specific data */
    data?: any;
}

/**
 * Callback function for layer events
 */
export type LayerEventCallback = (event: LayerEvent) => void;

/**
 * Manager interface for orchestrating multiple music layers
 */
export interface LayerManager {
    /** All available music layers */
    readonly layers: ReadonlyMap<string, MusicLayer>;
    
    /** Currently active layers */
    readonly activeLayers: ReadonlySet<string>;
    
    /** Current music state */
    readonly currentState: MusicState;
    
    /** Current intensity level (0.0 - 1.0) */
    readonly intensity: number;
    
    /** Whether any layers are currently playing */
    readonly isPlaying: boolean;
    
    /**
     * Register a new music layer
     * @param layer The layer to register
     */
    registerLayer(layer: MusicLayer): void;
    
    /**
     * Remove a music layer
     * @param layerId ID of layer to remove
     */
    unregisterLayer(layerId: string): void;
    
    /**
     * Get a specific layer by ID
     * @param layerId Unique layer identifier
     * @returns The requested layer or undefined
     */
    getLayer(layerId: string): MusicLayer | undefined;
    
    /**
     * Get all layers of a specific type
     * @param type Layer type to filter by
     * @returns Array of matching layers
     */
    getLayersByType(type: LayerType): MusicLayer[];
    
    /**
     * Transition to a new music state
     * @param newState Target music state
     * @param intensity Optional intensity level (0.0 - 1.0)
     * @param transitionConfig Optional transition configuration
     * @returns Promise that resolves when transition completes
     */
    transitionToState(
        newState: MusicState, 
        intensity?: number, 
        transitionConfig?: CrossfadeConfig
    ): Promise<void>;
    
    /**
     * Update the intensity of the current state
     * @param intensity New intensity level (0.0 - 1.0)
     * @param transitionMs Duration of intensity change
     * @returns Promise that resolves when intensity change completes
     */
    setIntensity(intensity: number, transitionMs?: number): Promise<void>;
    
    /**
     * Start playing the appropriate layers for current state
     * @returns Promise that resolves when playback starts
     */
    play(): Promise<void>;
    
    /**
     * Stop all currently playing layers
     * @param fadeOutMs Optional fade-out duration
     * @returns Promise that resolves when all layers stop
     */
    stop(fadeOutMs?: number): Promise<void>;
    
    /**
     * Pause all active layers (can be resumed)
     * @returns Promise that resolves when all layers are paused
     */
    pause(): Promise<void>;
    
    /**
     * Resume all paused layers
     * @returns Promise that resolves when all layers resume
     */
    resume(): Promise<void>;
    
    /**
     * Get the current composition for the active state
     * @returns Current layer composition configuration
     */
    getCurrentComposition(): LayerComposition;
    
    /**
     * Set master volume for all layers
     * @param volume Master volume level (0.0 - 1.0)
     * @param transitionMs Duration of volume change
     * @returns Promise that resolves when volume change completes
     */
    setMasterVolume(volume: number, transitionMs?: number): Promise<void>;
    
    /**
     * Register event listener for layer events
     * @param callback Function to call on events
     */
    addEventListener(callback: LayerEventCallback): void;
    
    /**
     * Remove event listener
     * @param callback Function to remove
     */
    removeEventListener(callback: LayerEventCallback): void;
    
    /**
     * Clean up all resources and stop playback
     */
    dispose(): void;
}

/**
 * Configuration for the layered music system extending base AudioConfig
 */
export interface LayeredMusicConfig extends AudioConfig {
    /** Music layer-specific settings */
    layers: {
        /** Default layer compositions for each music state */
        compositions: Record<MusicState, LayerComposition>;
        
        /** Global layer volume mixing */
        globalVolumeMix: Partial<Record<LayerType, number>>;
        
        /** Maximum number of concurrent layers */
        maxConcurrentLayers: number;
        
        /** Enable automatic state transitions based on game events */
        enableAutoTransitions: boolean;
        
        /** Minimum time between state transitions (milliseconds) */
        minTransitionInterval: number;
    };
    
    /** Crossfade and transition settings */
    transitions: {
        /** Default transition duration (milliseconds) */
        defaultDuration: number;
        
        /** Default crossfade curve */
        defaultCurve: 'linear' | 'exponential' | 'logarithmic';
        
        /** Whether to enable smooth transitions */
        enableSmoothing: boolean;
        
        /** Preload time for seamless transitions (milliseconds) */
        preloadTime: number;
    };
    
    /** Performance optimization settings */
    performance: {
        /** Enable layer pooling for memory efficiency */
        enableLayerPooling: boolean;
        
        /** Maximum number of pooled layers */
        maxPoolSize: number;
        
        /** Enable audio context sharing between layers */
        shareAudioContext: boolean;
        
        /** Buffer size for audio processing */
        bufferSize: number;
    };
    
    /** Advanced audio processing options */
    processing: {
        /** Enable dynamic range compression */
        enableCompression: boolean;
        
        /** Enable reverb effects */
        enableReverb: boolean;
        
        /** Enable EQ processing */
        enableEQ: boolean;
        
        /** Master limiter settings */
        limiter: {
            enabled: boolean;
            threshold: number;
            ratio: number;
        };
    };
    
    /** Debug and monitoring features */
    debug: {
        /** Enable debug logging */
        enableLogging: boolean;
        
        /** Enable performance monitoring */
        enableMonitoring: boolean;
        
        /** Log level for music system */
        logLevel: 'error' | 'warn' | 'info' | 'debug';
    };
}

/**
 * Default configuration for the layered music system
 */
export const DEFAULT_LAYERED_MUSIC_CONFIG: LayeredMusicConfig = {
    // Base AudioConfig properties
    masterVolume: 0.7,
    musicVolume: 0.5,
    sfxVolume: 0.8,
    enableMusic: true,
    enableSFX: true,
    enableTempoScaling: true,
    tempoScaling: {
        minBPM: 60,
        maxBPM: 180,
        transitionDuration: 2.0,
        scalingCurve: 'linear',
        responsiveness: 0.8
    },
    
    // Adaptive music configuration
    enableAdaptiveMusic: true,
    adaptiveMusic: {
        enableLayeredMusic: true,
        enableRuleThemes: true,
        enableStingers: true,
        enableMusicEvents: true,
        featureFlags: {
            enableLayerCrossfading: true,
            enablePerformanceMonitoring: true,
            enableDebugLogging: false,
            enableIntensitySmoothing: true,
            enableStateTransitionEffects: true,
            enableEventSubscription: true,
            enableRuleThemeIntegration: true,
            enableStingerSystem: true,
            enableTempoController: true,
            enableAdaptiveLayering: true
        },
        musicEventConfig: {
            debounceDelayMs: 300,
            enableDebugLogging: false,
            maxQueuedEvents: 100,
            eventFilters: {
                minSpellIntensity: 0.3,
                minLinesClearedForMusic: 1,
                enablePieceMovementEvents: false,
                enableBlockTransformationEvents: true,
                enabledEventTypes: new Set(['rule-created', 'rule-modified', 'line-clear', 'spell-effect'])
            },
            musicResponses: {
                enableAutoStateTransitions: true,
                enableStingers: true,
                enableLayerChanges: true,
                intensityScalingFactor: 1.0
            }
        }
    },
    
    // Layered music specific configuration
    layers: {
        compositions: {
            [MusicState.IDLE]: {
                requiredLayers: [LayerType.BASE, LayerType.AMBIENT],
                optionalLayers: [LayerType.HARMONY],
                volumeMix: {
                    [LayerType.BASE]: 0.6,
                    [LayerType.AMBIENT]: 0.8,
                    [LayerType.HARMONY]: 0.3
                },
                transitions: {
                    default: {
                        duration: 2000,
                        curve: 'exponential',
                        allowOverlap: true
                    }
                }
            },
            [MusicState.BUILDING]: {
                requiredLayers: [LayerType.BASE, LayerType.MELODY],
                optionalLayers: [LayerType.HARMONY, LayerType.PERCUSSION],
                volumeMix: {
                    [LayerType.BASE]: 0.7,
                    [LayerType.MELODY]: 0.8,
                    [LayerType.HARMONY]: 0.5,
                    [LayerType.PERCUSSION]: 0.4
                },
                transitions: {
                    default: {
                        duration: 1500,
                        curve: 'linear',
                        allowOverlap: true
                    }
                }
            },
            [MusicState.INTENSE]: {
                requiredLayers: [LayerType.BASE, LayerType.MELODY, LayerType.PERCUSSION],
                optionalLayers: [LayerType.HARMONY, LayerType.AMBIENT],
                volumeMix: {
                    [LayerType.BASE]: 0.8,
                    [LayerType.MELODY]: 1.0,
                    [LayerType.PERCUSSION]: 0.9,
                    [LayerType.HARMONY]: 0.6,
                    [LayerType.AMBIENT]: 0.3
                },
                transitions: {
                    default: {
                        duration: 1000,
                        curve: 'exponential',
                        allowOverlap: false
                    }
                }
            },
            [MusicState.VICTORY]: {
                requiredLayers: [LayerType.MELODY, LayerType.HARMONY],
                optionalLayers: [LayerType.PERCUSSION, LayerType.AMBIENT],
                volumeMix: {
                    [LayerType.MELODY]: 1.0,
                    [LayerType.HARMONY]: 0.8,
                    [LayerType.PERCUSSION]: 0.5,
                    [LayerType.AMBIENT]: 0.4
                },
                transitions: {
                    default: {
                        duration: 2500,
                        curve: 'logarithmic',
                        allowOverlap: true
                    }
                }
            },
            [MusicState.DEFEAT]: {
                requiredLayers: [LayerType.BASE, LayerType.AMBIENT],
                optionalLayers: [LayerType.HARMONY],
                volumeMix: {
                    [LayerType.BASE]: 0.5,
                    [LayerType.AMBIENT]: 0.7,
                    [LayerType.HARMONY]: 0.3
                },
                transitions: {
                    default: {
                        duration: 3000,
                        curve: 'logarithmic',
                        allowOverlap: true
                    }
                }
            }
        },
        globalVolumeMix: {
            [LayerType.BASE]: 0.8,
            [LayerType.MELODY]: 0.9,
            [LayerType.HARMONY]: 0.6,
            [LayerType.PERCUSSION]: 0.7,
            [LayerType.AMBIENT]: 0.5
        },
        maxConcurrentLayers: 8,
        enableAutoTransitions: true,
        minTransitionInterval: 500
    },
    
    transitions: {
        defaultDuration: 1500,
        defaultCurve: 'exponential',
        enableSmoothing: true,
        preloadTime: 200
    },
    
    performance: {
        enableLayerPooling: true,
        maxPoolSize: 16,
        shareAudioContext: true,
        bufferSize: 256
    },
    
    processing: {
        enableCompression: true,
        enableReverb: false,
        enableEQ: false,
        limiter: {
            enabled: true,
            threshold: -6,
            ratio: 4
        }
    },
    
    debug: {
        enableLogging: false,
        enableMonitoring: false,
        logLevel: 'warn'
    }
};

/**
 * Utility type for creating custom layer compositions
 */
export type LayerCompositionBuilder = {
    [K in MusicState]?: Partial<LayerComposition>;
};

/**
 * Type guard to check if an object implements MusicLayer interface
 */
export function isMusicLayer(obj: any): obj is MusicLayer {
    return obj && 
           typeof obj.id === 'string' &&
           typeof obj.type === 'string' &&
           Array.isArray(obj.activeStates) &&
           typeof obj.baseVolume === 'number' &&
           typeof obj.play === 'function' &&
           typeof obj.stop === 'function' &&
           typeof obj.setVolume === 'function' &&
           typeof obj.crossfadeTo === 'function';
}

/**
 * Type guard to check if an object implements LayerManager interface
 */
export function isLayerManager(obj: any): obj is LayerManager {
    return obj &&
           obj.layers instanceof Map &&
           obj.activeLayers instanceof Set &&
           typeof obj.currentState === 'string' &&
           typeof obj.intensity === 'number' &&
           typeof obj.registerLayer === 'function' &&
           typeof obj.transitionToState === 'function' &&
           typeof obj.play === 'function' &&
           typeof obj.stop === 'function';
}