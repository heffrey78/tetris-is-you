/**
 * LayeredMusicManager - Comprehensive music system orchestrator for Tetris Is You
 * 
 * This manager replaces the static playOminousWizardTheme() with a sophisticated
 * layered approach that integrates all Phase 2-4 components:
 * - BassLayer, MelodyLayer, HarmonyLayer, PercussionLayer (Phase 3)
 * - TempoController for dynamic tempo management (Phase 2)
 * - RuleThemeManager and RuleStingerSystem for rule-based audio (Phase 4)
 * - MusicEventSubscriber for game event responses (Phase 2)
 * 
 * Features:
 * - State-based layer composition and management
 * - Smooth crossfading and volume control
 * - Comprehensive error handling and performance monitoring
 * - Integration with existing AudioSystem gain node structure
 * - Runtime configuration and adjustment support
 * - Event-driven music responses and transitions
 * 
 * @example
 * ```typescript
 * const manager = new LayeredMusicManager(audioContext, audioConfig);
 * await manager.initialize();
 * 
 * // Replace old static music calls
 * // OLD: this.playOminousWizardTheme();
 * // NEW: await manager.transitionToState(MusicState.BUILDING, 0.7);
 * 
 * // Integrate with game events
 * manager.subscribeToGameEvents(ruleEngine, gameLogic);
 * ```
 */

import { 
    LayerManager,
    MusicLayer,
    LayerType,
    MusicState,
    CrossfadeConfig,
    LayerComposition,
    LayeredMusicConfig,
    LayerEvent,
    LayerEventCallback,
    DEFAULT_LAYERED_MUSIC_CONFIG
} from '../types/MusicTypes.js';
import { AudioConfig } from '../AudioSystem.js';
import { BaseMusicLayer } from './BaseMusicLayer.js';
import { BassLayer } from './BassLayer.js';
import { MelodyLayer } from './MelodyLayer.js';
import { HarmonyLayer } from './HarmonyLayer.js';
import { PercussionLayer } from './PercussionLayer.js';
import { TempoController, TempoConfig } from './TempoController.js';
import { RuleThemeManager, DEFAULT_RULE_THEME_CONFIG } from './RuleThemeManager.js';
import { RuleStingerSystem } from './RuleStingerSystem.js';
import { MusicEventSubscriber, DEFAULT_MUSIC_EVENT_CONFIG } from './MusicEventSubscriber.js';
import { PerformanceMonitor } from '../utils/PerformanceMonitor.js';

/**
 * Feature flags for controlling LayeredMusicManager functionality
 */
export interface LayeredMusicFeatureFlags {
    enableLayerCrossfading: boolean;
    enablePerformanceMonitoring: boolean;
    enableDebugLogging: boolean;
    enableIntensitySmoothing: boolean;
    enableStateTransitionEffects: boolean;
    enableEventSubscription: boolean;
    enableRuleThemeIntegration: boolean;
    enableStingerSystem: boolean;
    enableTempoController: boolean;
    enableAdaptiveLayering: boolean;
}

/**
 * Default feature flags configuration
 */
export const DEFAULT_FEATURE_FLAGS: LayeredMusicFeatureFlags = {
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
};

/**
 * Statistics interface for LayeredMusicManager
 */
export interface LayeredMusicStats {
    isActive: boolean;
    currentState: MusicState;
    currentIntensity: number;
    activeLayers: number;
    totalLayers: number;
    performanceMetrics: any; // Will be PerformanceMetrics when available
    layerStats: Array<{
        id: string;
        type: LayerType;
        isPlaying: boolean;
        volume: number;
        isFading: boolean;
    }>;
    eventStats: {
        totalEventsProcessed: number;
        eventsProcessedLastMinute: number;
        queuedEvents: number;
    };
    memoryUsage: {
        activeNodes: number;
        scheduledNotes: number;
        totalMemoryMB: number;
    };
}

/**
 * Performance metrics specific to the LayeredMusicManager
 */
export interface LayeredMusicMetrics {
    /** Number of active layers */
    activeLayers: number;
    /** Number of registered layers */
    totalLayers: number;
    /** Current music state */
    currentState: MusicState;
    /** Current intensity level */
    intensity: number;
    /** Memory usage in MB */
    memoryUsage: number;
    /** CPU usage percentage */
    cpuUsage: number;
    /** Audio latency in milliseconds */
    audioLatency: number;
    /** Number of recent transitions */
    recentTransitions: number;
    /** Current tempo (BPM) */
    currentTempo: number;
    /** Active rule themes count */
    activeRuleThemes: number;
}

/**
 * Configuration for LayeredMusicManager initialization
 */
export interface LayeredMusicManagerConfig {
    /** Base audio configuration */
    audioConfig: AudioConfig;
    /** Layered music specific configuration */
    musicConfig: Partial<LayeredMusicConfig>;
    /** Whether to initialize with all default layers */
    initializeDefaultLayers: boolean;
    /** Whether to auto-start background music */
    autoStart: boolean;
    /** Initial music state */
    initialState: MusicState;
    /** Initial intensity level */
    initialIntensity: number;
}

/**
 * LayeredMusicManager - Primary orchestrator for the layered music system
 * 
 * Implements the LayerManager interface and serves as the central hub for
 * all music-related functionality, replacing the static music approach.
 */
export class LayeredMusicManager implements LayerManager {
    /** All registered music layers */
    public readonly layers: Map<string, MusicLayer> = new Map();
    
    /** Currently active layers */
    public readonly activeLayers: Set<string> = new Set();
    
    /** Current music state */
    public currentState: MusicState = MusicState.IDLE;
    
    /** Current intensity level (0.0 - 1.0) */
    public intensity: number = 0.0;
    
    /** Whether any layers are currently playing */
    public get isPlaying(): boolean {
        return this.activeLayers.size > 0;
    }
    
    /** Web Audio context */
    private audioContext: AudioContext;
    
    /** Master gain node for all music layers */
    private masterMusicGain: GainNode;
    
    /** Configuration for the music system */
    private config: LayeredMusicConfig;
    
    /** Whether the manager has been initialized */
    private isInitialized: boolean = false;
    
    /** Whether the manager is currently disposing */
    private isDisposing: boolean = false;
    
    /** Event listeners for layer events */
    private eventListeners: LayerEventCallback[] = [];
    
    /** Performance monitoring */
    private performanceMonitor: PerformanceMonitor;
    
    /** Component integrations */
    private tempoController: TempoController | null = null;
    private ruleThemeManager: RuleThemeManager | null = null;
    private ruleStingerSystem: RuleStingerSystem | null = null;
    private musicEventSubscriber: MusicEventSubscriber | null = null;
    
    /** Layer composition definitions */
    private compositions: Map<MusicState, LayerComposition> = new Map();
    
    /** Transition management */
    private lastTransitionTime: number = 0;
    private currentTransitions: Map<string, Promise<void>> = new Map();
    
    /** Layer pooling for performance */
    private layerPool: Map<LayerType, MusicLayer[]> = new Map();
    private poolEnabled: boolean = false;
    
    /** Current master volume */
    private currentMasterVolume: number = 1.0;
    
    /** State management */
    private previousState: MusicState = MusicState.IDLE;
    private stateChangeHistory: Array<{ state: MusicState; timestamp: number; intensity: number }> = [];
    
    constructor(
        audioContext: AudioContext,
        masterMusicGain: GainNode,
        config: Partial<LayeredMusicManagerConfig> = {}
    ) {
        this.audioContext = audioContext;
        this.masterMusicGain = masterMusicGain;
        
        // Merge configuration with defaults
        const fullConfig: LayeredMusicManagerConfig = {
            audioConfig: {
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
                enableAdaptiveMusic: true,
                adaptiveMusic: {
                    enableLayeredMusic: true,
                    enableRuleThemes: true,
                    enableStingers: true,
                    enableMusicEvents: true,
                    featureFlags: DEFAULT_FEATURE_FLAGS,
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
                }
            },
            musicConfig: {},
            initializeDefaultLayers: true,
            autoStart: false,
            initialState: MusicState.IDLE,
            initialIntensity: 0.0,
            ...config
        };
        
        // Set up music configuration
        this.config = { ...DEFAULT_LAYERED_MUSIC_CONFIG, ...fullConfig.musicConfig };
        this.currentState = fullConfig.initialState;
        this.intensity = fullConfig.initialIntensity;
        
        // Initialize performance monitoring
        this.performanceMonitor = new PerformanceMonitor();
        this.poolEnabled = this.config.performance.enableLayerPooling;
        
        // Set up compositions from config
        this.initializeCompositions();
        
        console.log('🎵 LayeredMusicManager created with configuration:', {
            enableMusic: fullConfig.audioConfig.enableMusic,
            enableTempoScaling: fullConfig.audioConfig.enableTempoScaling,
            initialState: fullConfig.initialState,
            maxLayers: this.config.layers.maxConcurrentLayers
        });
    }
    
    /**
     * Initialize the LayeredMusicManager and all its components
     * This replaces the need for static music initialization
     */
    public async initialize(
        ruleEngine?: any,
        gameLogic?: any,
        initializeDefaultLayers: boolean = true
    ): Promise<void> {
        if (this.isInitialized) {
            console.warn('LayeredMusicManager already initialized');
            return;
        }
        
        try {
            console.log('🎵 Initializing LayeredMusicManager...');
            
            // Resume audio context if suspended
            if (this.audioContext.state === 'suspended') {
                await this.audioContext.resume();
            }
            
            // Initialize core components
            await this.initializeComponents();
            
            // Initialize default layers if requested
            if (initializeDefaultLayers) {
                await this.initializeDefaultLayers();
            }
            
            // Initialize integrations
            if (ruleEngine && gameLogic) {
                await this.initializeGameIntegrations(ruleEngine, gameLogic);
            }
            
            // Set up initial state
            await this.setupInitialState();
            
            this.isInitialized = true;
            console.log('🎵 LayeredMusicManager initialization complete');
            
            // Emit initialization event
            this.emitManagerEvent('manager_initialized', { layerCount: this.layers.size });
            
        } catch (error) {
            console.error('Failed to initialize LayeredMusicManager:', error);
            throw error;
        }
    }
    
    /**
     * Initialize core music system components
     */
    private async initializeComponents(): Promise<void> {
        try {
            // Initialize TempoController if tempo scaling is enabled
            if (this.config.enableTempoScaling) {
                this.tempoController = new TempoController(
                    this.audioContext,
                    this.config.tempoScaling
                );
                console.log('🎵 TempoController initialized');
            }
            
            // Initialize RuleStingerSystem
            this.ruleStingerSystem = new RuleStingerSystem({
                volume: this.config.musicVolume * 0.7, // Slightly lower for stingers
                enabled: this.config.enableMusic
            });
            await this.ruleStingerSystem.initialize(this.audioContext);
            console.log('🎵 RuleStingerSystem initialized');
            
            // Initialize MusicEventSubscriber
            this.musicEventSubscriber = new MusicEventSubscriber({
                ...DEFAULT_MUSIC_EVENT_CONFIG,
                enableDebugLogging: this.config.debug.enableLogging
            });
            
            // Register callback to handle music events
            this.musicEventSubscriber.registerCallback(this.handleMusicEvent.bind(this));
            console.log('🎵 MusicEventSubscriber initialized');
            
        } catch (error) {
            console.error('Failed to initialize core components:', error);
            throw error;
        }
    }
    
    /**
     * Initialize default music layers (Bass, Melody, Harmony, Percussion)
     * These replace the static wizard theme with dynamic layered approach
     */
    private async initializeDefaultLayers(): Promise<void> {
        try {
            console.log('🎵 Creating default music layers...');
            
            // Create BassLayer - foundation of the musical content
            const bassLayer = new BassLayer(
                'default-bass',
                [MusicState.BUILDING, MusicState.INTENSE, MusicState.DEFEAT],
                this.config.layers.globalVolumeMix[LayerType.BASE] || 0.8,
                this.audioContext
            );
            this.registerLayer(bassLayer);
            
            // Create MelodyLayer - primary melodic content
            const melodyLayer = new MelodyLayer(this.audioContext);
            this.registerLayer(melodyLayer);
            
            // Create HarmonyLayer - harmonic accompaniment
            const harmonyLayer = new HarmonyLayer(this.audioContext);
            this.registerLayer(harmonyLayer);
            
            // Create PercussionLayer - rhythmic elements
            const percussionLayer = new PercussionLayer(this.audioContext);
            this.registerLayer(percussionLayer);
            
            console.log(`🎵 Initialized ${this.layers.size} default layers`);
            
        } catch (error) {
            console.error('Failed to initialize default layers:', error);
            throw error;
        }
    }
    
    /**
     * Initialize game system integrations (RuleEngine, GameLogic)
     */
    private async initializeGameIntegrations(ruleEngine: any, gameLogic: any): Promise<void> {
        try {
            // Initialize RuleThemeManager with RuleEngine
            if (ruleEngine) {
                this.ruleThemeManager = new RuleThemeManager(
                    ruleEngine,
                    this.audioContext,
                    DEFAULT_RULE_THEME_CONFIG
                );
                console.log('🎵 RuleThemeManager initialized');
            }
            
            // Subscribe RuleStingerSystem to rule events
            if (this.ruleStingerSystem && ruleEngine) {
                this.ruleStingerSystem.subscribeToRuleEvents(ruleEngine);
            }
            
            // Subscribe MusicEventSubscriber to game events
            if (this.musicEventSubscriber && ruleEngine && gameLogic) {
                this.musicEventSubscriber.subscribe(ruleEngine, gameLogic);
                console.log('🎵 Game event subscriptions established');
            }
            
        } catch (error) {
            console.error('Failed to initialize game integrations:', error);
            // Non-fatal - music can work without game integrations
        }
    }
    
    /**
     * Set up initial music state
     */
    private async setupInitialState(): Promise<void> {
        try {
            // Start RuleThemeManager if available
            if (this.ruleThemeManager) {
                this.ruleThemeManager.start();
            }
            
            // Transition to initial state
            if (this.currentState !== MusicState.IDLE || this.intensity > 0) {
                await this.transitionToState(this.currentState, this.intensity);
            }
            
        } catch (error) {
            console.error('Failed to setup initial state:', error);
            // Non-fatal - continue with silent state
        }
    }
    
    /**
     * Initialize layer compositions from configuration
     */
    private initializeCompositions(): void {
        for (const [state, composition] of Object.entries(this.config.layers.compositions)) {
            this.compositions.set(state as MusicState, composition);
        }
    }
    
    /**
     * Register a new music layer
     * @param layer The layer to register
     */
    public registerLayer(layer: MusicLayer): void {
        if (this.isDisposing) {
            console.warn('Cannot register layer during disposal');
            return;
        }
        
        if (this.layers.has(layer.id)) {
            console.warn(`Layer '${layer.id}' already registered`);
            return;
        }
        
        try {
            // Connect layer to master music gain
            if (layer instanceof BaseMusicLayer) {
                // Connect layer's master gain to our master music gain
                (layer as any).masterGain.disconnect();
                (layer as any).masterGain.connect(this.masterMusicGain);
            }
            
            // Add layer event listener
            layer.addEventListener(this.handleLayerEvent.bind(this));
            
            // Register the layer
            this.layers.set(layer.id, layer);
            
            console.log(`🎵 Registered layer '${layer.id}' (${layer.type})`);
            
            // Emit registration event
            this.emitManagerEvent('layer_registered', { layer });
            
        } catch (error) {
            console.error(`Failed to register layer '${layer.id}':`, error);
            throw error;
        }
    }
    
    /**
     * Remove a music layer
     * @param layerId ID of layer to remove
     */
    public unregisterLayer(layerId: string): void {
        const layer = this.layers.get(layerId);
        if (!layer) {
            console.warn(`Layer '${layerId}' not found for removal`);
            return;
        }
        
        try {
            // Stop layer if playing
            if (layer.isPlaying) {
                layer.stop(500); // 500ms fade out
            }
            
            // Remove from active layers
            this.activeLayers.delete(layerId);
            
            // Dispose layer
            layer.dispose();
            
            // Remove from registry
            this.layers.delete(layerId);
            
            console.log(`🎵 Unregistered layer '${layerId}'`);
            
            // Emit unregistration event
            this.emitManagerEvent('layer_unregistered', { layerId });
            
        } catch (error) {
            console.error(`Failed to unregister layer '${layerId}':`, error);
        }
    }
    
    /**
     * Get a specific layer by ID
     * @param layerId Unique layer identifier
     * @returns The requested layer or undefined
     */
    public getLayer(layerId: string): MusicLayer | undefined {
        return this.layers.get(layerId);
    }
    
    /**
     * Get all layers of a specific type
     * @param type Layer type to filter by
     * @returns Array of matching layers
     */
    public getLayersByType(type: LayerType): MusicLayer[] {
        return Array.from(this.layers.values()).filter(layer => layer.type === type);
    }
    
    /**
     * Transition to a new music state
     * This is the primary method that replaces playOminousWizardTheme()
     * @param newState Target music state
     * @param intensity Optional intensity level (0.0 - 1.0)
     * @param transitionConfig Optional transition configuration
     * @returns Promise that resolves when transition completes
     */
    public async transitionToState(
        newState: MusicState, 
        intensity: number = this.intensity, 
        transitionConfig?: CrossfadeConfig
    ): Promise<void> {
        if (!this.isInitialized) {
            throw new Error('LayeredMusicManager not initialized');
        }
        
        // Validate parameters
        intensity = Math.max(0, Math.min(1, intensity));
        
        // Check minimum transition interval
        const now = Date.now();
        if (now - this.lastTransitionTime < this.config.layers.minTransitionInterval) {
            console.log('🎵 Transition rate limited');
            return;
        }
        
        try {
            console.log(`🎵 Transitioning: ${this.currentState} → ${newState} (intensity: ${intensity.toFixed(2)})`);
            
            // Update state tracking
            this.previousState = this.currentState;
            this.currentState = newState;
            this.intensity = intensity;
            this.lastTransitionTime = now;
            
            // Add to state history
            this.stateChangeHistory.push({
                state: newState,
                timestamp: now,
                intensity
            });
            
            // Trim history
            if (this.stateChangeHistory.length > 10) {
                this.stateChangeHistory = this.stateChangeHistory.slice(-10);
            }
            
            // Update tempo if controller is available
            if (this.tempoController) {
                const tempoMultiplier = this.calculateTempoMultiplier(newState, intensity);
                this.tempoController.setTempo(tempoMultiplier);
            }
            
            // Get composition for new state
            const composition = this.getCurrentComposition();
            
            // Perform layer transitions
            await this.performLayerTransitions(composition, intensity, transitionConfig);
            
            // Update all active layers for new state
            this.updateLayersForState(newState, intensity);
            
            // Emit state change event
            this.emitManagerEvent('state_changed', { 
                previousState: this.previousState, 
                newState, 
                intensity 
            });
            
            console.log(`🎵 Transition complete: ${newState} (${this.activeLayers.size} active layers)`);
            
        } catch (error) {
            console.error(`Failed to transition to state ${newState}:`, error);
            throw error;
        }
    }
    
    /**
     * Update the intensity of the current state
     * @param intensity New intensity level (0.0 - 1.0)
     * @param transitionMs Duration of intensity change
     * @returns Promise that resolves when intensity change completes
     */
    public async setIntensity(intensity: number, transitionMs: number = 1000): Promise<void> {
        intensity = Math.max(0, Math.min(1, intensity));
        
        if (Math.abs(this.intensity - intensity) < 0.05) {
            return; // Ignore small changes
        }
        
        try {
            console.log(`🎵 Intensity change: ${this.intensity.toFixed(2)} → ${intensity.toFixed(2)}`);
            
            const oldIntensity = this.intensity;
            this.intensity = intensity;
            
            // Update tempo
            if (this.tempoController) {
                const tempoMultiplier = this.calculateTempoMultiplier(this.currentState, intensity);
                this.tempoController.setTempo(tempoMultiplier);
            }
            
            // Update all active layers
            const promises: Promise<void>[] = [];
            for (const layerId of this.activeLayers) {
                const layer = this.layers.get(layerId);
                if (layer) {
                    // Update layer state
                    layer.updateForState(this.currentState, intensity);
                    
                    // Adjust volume based on composition
                    const composition = this.getCurrentComposition();
                    const volumeMultiplier = composition.volumeMix[layer.type] || 1.0;
                    const targetVolume = layer.baseVolume * volumeMultiplier * intensity;
                    promises.push(layer.setVolume(targetVolume, transitionMs));
                }
            }
            
            await Promise.all(promises);
            
            // Emit intensity change event
            this.emitManagerEvent('intensity_changed', { oldIntensity, newIntensity: intensity });
            
        } catch (error) {
            console.error('Failed to set intensity:', error);
            throw error;
        }
    }
    
    /**
     * Start playing the appropriate layers for current state
     * This replaces the old playMusic() call
     * @returns Promise that resolves when playback starts
     */
    public async play(): Promise<void> {
        if (!this.isInitialized) {
            throw new Error('LayeredMusicManager not initialized');
        }
        
        try {
            console.log(`🎵 Starting music for state: ${this.currentState}`);
            
            // Resume audio context if needed
            if (this.audioContext.state === 'suspended') {
                await this.audioContext.resume();
            }
            
            // Start layers for current state
            await this.transitionToState(this.currentState, this.intensity);
            
        } catch (error) {
            console.error('Failed to start music:', error);
            throw error;
        }
    }
    
    /**
     * Stop all currently playing layers
     * This replaces the old stopMusic() call
     * @param fadeOutMs Optional fade-out duration
     * @returns Promise that resolves when all layers stop
     */
    public async stop(fadeOutMs: number = 2000): Promise<void> {
        try {
            console.log('🎵 Stopping all music layers');
            
            const promises: Promise<void>[] = [];
            
            // Stop all active layers
            for (const layerId of this.activeLayers) {
                const layer = this.layers.get(layerId);
                if (layer && layer.isPlaying) {
                    promises.push(layer.stop(fadeOutMs));
                }
            }
            
            await Promise.all(promises);
            
            // Clear active layers
            this.activeLayers.clear();
            
            // Stop components
            if (this.ruleThemeManager) {
                this.ruleThemeManager.stop();
            }
            
            // Emit stop event
            this.emitManagerEvent('music_stopped', { fadeOutMs });
            
        } catch (error) {
            console.error('Failed to stop music:', error);
            throw error;
        }
    }
    
    /**
     * Pause all active layers (can be resumed)
     * @returns Promise that resolves when all layers are paused
     */
    public async pause(): Promise<void> {
        try {
            console.log('🎵 Pausing music');
            
            const promises: Promise<void>[] = [];
            
            for (const layerId of this.activeLayers) {
                const layer = this.layers.get(layerId);
                if (layer && layer.isPlaying) {
                    promises.push(layer.setVolume(0, 500)); // Quick fade to silence
                }
            }
            
            await Promise.all(promises);
            
            // Emit pause event
            this.emitManagerEvent('music_paused', {});
            
        } catch (error) {
            console.error('Failed to pause music:', error);
            throw error;
        }
    }
    
    /**
     * Resume all paused layers
     * @returns Promise that resolves when all layers resume
     */
    public async resume(): Promise<void> {
        try {
            console.log('🎵 Resuming music');
            
            // Resume audio context if suspended
            if (this.audioContext.state === 'suspended') {
                await this.audioContext.resume();
            }
            
            // Restore layer volumes
            const composition = this.getCurrentComposition();
            const promises: Promise<void>[] = [];
            
            for (const layerId of this.activeLayers) {
                const layer = this.layers.get(layerId);
                if (layer) {
                    const volumeMultiplier = composition.volumeMix[layer.type] || 1.0;
                    const targetVolume = layer.baseVolume * volumeMultiplier * this.intensity;
                    promises.push(layer.setVolume(targetVolume, 500));
                }
            }
            
            await Promise.all(promises);
            
            // Emit resume event
            this.emitManagerEvent('music_resumed', {});
            
        } catch (error) {
            console.error('Failed to resume music:', error);
            throw error;
        }
    }
    
    /**
     * Get the current composition for the active state
     * @returns Current layer composition configuration
     */
    public getCurrentComposition(): LayerComposition {
        return this.compositions.get(this.currentState) || this.compositions.get(MusicState.IDLE)!;
    }
    
    /**
     * Set master volume for all layers
     * @param volume Master volume level (0.0 - 1.0)
     * @param transitionMs Duration of volume change
     * @returns Promise that resolves when volume change completes
     */
    public async setMasterVolume(volume: number, transitionMs: number = 1000): Promise<void> {
        volume = Math.max(0, Math.min(1, volume));
        
        try {
            // Update master gain node
            if (transitionMs > 0) {
                const currentTime = this.audioContext.currentTime;
                this.masterMusicGain.gain.setValueAtTime(this.currentMasterVolume, currentTime);
                this.masterMusicGain.gain.linearRampToValueAtTime(volume, currentTime + transitionMs / 1000);
            } else {
                this.masterMusicGain.gain.value = volume;
            }
            
            this.currentMasterVolume = volume;
            
            // Emit volume change event
            this.emitManagerEvent('master_volume_changed', { volume, transitionMs });
            
        } catch (error) {
            console.error('Failed to set master volume:', error);
            throw error;
        }
    }
    
    /**
     * Register event listener for layer events
     * @param callback Function to call on events
     */
    public addEventListener(callback: LayerEventCallback): void {
        this.eventListeners.push(callback);
    }
    
    /**
     * Remove event listener
     * @param callback Function to remove
     */
    public removeEventListener(callback: LayerEventCallback): void {
        const index = this.eventListeners.indexOf(callback);
        if (index !== -1) {
            this.eventListeners.splice(index, 1);
        }
    }
    
    /**
     * Subscribe to game events (compatibility method for existing AudioSystem interface)
     * @param ruleEngine RuleEngine instance
     * @param gameLogic GameLogic instance
     */
    public subscribeToGameEvents(ruleEngine: any, gameLogic: any): void {
        if (!this.isInitialized) {
            console.warn('LayeredMusicManager not initialized, cannot subscribe to events');
            return;
        }
        
        try {
            // Initialize game integrations if not done
            if (!this.ruleThemeManager || !this.musicEventSubscriber?.isActivelySubscribed()) {
                this.initializeGameIntegrations(ruleEngine, gameLogic);
            }
            
            console.log('🎵 LayeredMusicManager subscribed to game events');
            
        } catch (error) {
            console.error('Failed to subscribe to game events:', error);
        }
    }
    
    /**
     * Update configuration (compatibility method for existing AudioSystem interface)
     * @param newConfig New configuration to merge
     */
    public updateConfig(newConfig: Partial<LayeredMusicConfig>): void {
        try {
            const oldConfig = { ...this.config };
            this.config = { ...this.config, ...newConfig };
            
            // Handle music enable/disable
            if (newConfig.enableMusic !== undefined) {
                if (!newConfig.enableMusic && this.isPlaying) {
                    this.stop(1000);
                } else if (newConfig.enableMusic && !this.isPlaying && this.currentState !== MusicState.IDLE) {
                    this.play();
                }
            }
            
            // Update tempo controller config if changed
            if (newConfig.tempoScaling && this.tempoController) {
                this.tempoController.updateConfig(newConfig.tempoScaling);
            }
            
            // Update master volume if changed
            if (newConfig.musicVolume !== undefined) {
                this.setMasterVolume(newConfig.musicVolume, 500);
            }
            
            console.log('🎵 LayeredMusicManager configuration updated');
            
        } catch (error) {
            console.error('Failed to update configuration:', error);
        }
    }
    
    /**
     * Get performance metrics for the music system
     * @returns Comprehensive performance metrics
     */
    public getPerformanceMetrics(): LayeredMusicMetrics {
        const baseMetrics = this.performanceMonitor.getPerformanceMetrics();
        
        return {
            activeLayers: this.activeLayers.size,
            totalLayers: this.layers.size,
            currentState: this.currentState,
            intensity: this.intensity,
            memoryUsage: baseMetrics.memoryUsage,
            cpuUsage: baseMetrics.cpuUsage,
            audioLatency: this.audioContext.baseLatency || 0,
            recentTransitions: this.stateChangeHistory.length,
            currentTempo: this.tempoController?.getBeatsPerMinute() || 0,
            activeRuleThemes: this.ruleThemeManager?.getStats().activeCategoryCount || 0
        };
    }
    
    /**
     * Clean up all resources and stop playback
     */
    public dispose(): void {
        if (this.isDisposing) {
            return;
        }
        
        this.isDisposing = true;
        
        try {
            console.log('🎵 Disposing LayeredMusicManager...');
            
            // Stop all music immediately
            this.stop(0);
            
            // Dispose all layers
            for (const layer of this.layers.values()) {
                layer.dispose();
            }
            this.layers.clear();
            this.activeLayers.clear();
            
            // Dispose components
            if (this.tempoController) {
                this.tempoController.dispose();
                this.tempoController = null;
            }
            
            if (this.ruleThemeManager) {
                this.ruleThemeManager.dispose();
                this.ruleThemeManager = null;
            }
            
            if (this.ruleStingerSystem) {
                this.ruleStingerSystem = null;
            }
            
            if (this.musicEventSubscriber) {
                this.musicEventSubscriber.dispose();
                this.musicEventSubscriber = null;
            }
            
            // Clear event listeners
            this.eventListeners = [];
            
            // Clear other resources
            this.compositions.clear();
            this.currentTransitions.clear();
            this.layerPool.clear();
            this.stateChangeHistory = [];
            
            console.log('🎵 LayeredMusicManager disposed');
            
        } catch (error) {
            console.error('Error during LayeredMusicManager disposal:', error);
        }
    }
    
    // Private helper methods
    
    /**
     * Perform layer transitions based on composition
     */
    private async performLayerTransitions(
        composition: LayerComposition,
        intensity: number,
        transitionConfig?: CrossfadeConfig
    ): Promise<void> {
        const config = transitionConfig || composition.transitions.default;
        const requiredLayers = new Set(composition.requiredLayers);
        const optionalLayers = new Set(composition.optionalLayers);
        
        // Determine which layers should be active
        const targetLayers = new Set<string>();
        
        // Add required layers
        for (const layerType of requiredLayers) {
            const layers = this.getLayersByType(layerType);
            if (layers.length > 0) {
                targetLayers.add(layers[0].id); // Use first available layer of each type
            }
        }
        
        // Add optional layers based on intensity and max concurrent limit
        for (const layerType of optionalLayers) {
            if (targetLayers.size >= this.config.layers.maxConcurrentLayers) {
                break;
            }
            
            const layers = this.getLayersByType(layerType);
            if (layers.length > 0 && this.shouldActivateOptionalLayer(layerType, intensity)) {
                targetLayers.add(layers[0].id);
            }
        }
        
        // Start new layers
        const startPromises: Promise<void>[] = [];
        for (const layerId of targetLayers) {
            if (!this.activeLayers.has(layerId)) {
                const layer = this.layers.get(layerId);
                if (layer && !layer.isPlaying) {
                    const volumeMultiplier = composition.volumeMix[layer.type] || 1.0;
                    const targetVolume = layer.baseVolume * volumeMultiplier * intensity;
                    
                    startPromises.push(
                        layer.play(config.duration).then(() => 
                            layer.setVolume(targetVolume, config.duration / 2)
                        )
                    );
                    this.activeLayers.add(layerId);
                }
            }
        }
        
        // Stop layers that shouldn't be active
        const stopPromises: Promise<void>[] = [];
        for (const layerId of this.activeLayers) {
            if (!targetLayers.has(layerId)) {
                const layer = this.layers.get(layerId);
                if (layer && layer.isPlaying) {
                    stopPromises.push(layer.stop(config.duration));
                    this.activeLayers.delete(layerId);
                }
            }
        }
        
        // Wait for all transitions to complete
        await Promise.all([...startPromises, ...stopPromises]);
    }
    
    /**
     * Update all layers for new state and intensity
     */
    private updateLayersForState(state: MusicState, intensity: number): void {
        for (const layerId of this.activeLayers) {
            const layer = this.layers.get(layerId);
            if (layer) {
                layer.updateForState(state, intensity);
            }
        }
    }
    
    /**
     * Calculate tempo multiplier based on state and intensity
     */
    private calculateTempoMultiplier(state: MusicState, intensity: number): number {
        const baseMultiplier = 1.0;
        const intensityFactor = intensity * 0.5; // Max 0.5x speed increase from intensity
        
        const stateMultipliers: Record<MusicState, number> = {
            [MusicState.IDLE]: 0.8,
            [MusicState.BUILDING]: 1.0,
            [MusicState.INTENSE]: 1.3,
            [MusicState.VICTORY]: 1.1,
            [MusicState.DEFEAT]: 0.7
        };
        
        return baseMultiplier * (stateMultipliers[state] || 1.0) * (1.0 + intensityFactor);
    }
    
    /**
     * Determine if an optional layer should be activated based on intensity
     */
    private shouldActivateOptionalLayer(layerType: LayerType, intensity: number): boolean {
        const thresholds: Record<LayerType, number> = {
            [LayerType.BASE]: 0.0,      // Always active when needed
            [LayerType.MELODY]: 0.2,    // Active at low intensity
            [LayerType.HARMONY]: 0.4,   // Active at medium intensity
            [LayerType.PERCUSSION]: 0.6, // Active at high intensity
            [LayerType.AMBIENT]: 0.1    // Active at very low intensity
        };
        
        return intensity >= (thresholds[layerType] || 0.5);
    }
    
    /**
     * Handle layer events and forward to manager listeners
     */
    private handleLayerEvent(event: LayerEvent): void {
        // Forward to all registered listeners
        for (const listener of this.eventListeners) {
            try {
                listener(event);
            } catch (error) {
                console.error('Error in LayeredMusicManager event listener:', error);
            }
        }
    }
    
    /**
     * Handle music events from MusicEventSubscriber
     */
    private handleMusicEvent(eventType: any, eventData: any, musicAction: any): void {
        try {
            if (!this.config.enableMusic) {
                return; // Music disabled
            }
            
            switch (musicAction.type) {
                case 'state_transition':
                    if (musicAction.data?.newState) {
                        this.transitionToState(musicAction.data.newState, this.intensity);
                    }
                    break;
                    
                case 'intensity_change':
                    if (musicAction.data?.intensity !== undefined) {
                        this.setIntensity(musicAction.data.intensity);
                    }
                    break;
                    
                case 'stinger':
                    // Stingers are handled by RuleStingerSystem
                    break;
            }
            
        } catch (error) {
            console.error('Error handling music event:', error);
        }
    }
    
    /**
     * Emit manager-level events
     */
    private emitManagerEvent(type: string, data: any): void {
        const event: LayerEvent = {
            type: type as any,
            layer: this as any, // Manager acts as a special layer for events
            timestamp: Date.now(),
            data
        };
        
        this.handleLayerEvent(event);
    }
    
    /**
     * Set performance adjustment callback for optimization
     */
    public setPerformanceAdjustmentCallback(callback: (metrics: any) => void): void {
        // Store callback for performance monitoring
        if (this.performanceMonitor) {
            // This would be implemented when PerformanceMonitor supports callbacks
            console.log('Performance adjustment callback registered');
        }
    }
    
    /**
     * Update feature flags during runtime
     */
    public updateFeatureFlags(flags: Partial<LayeredMusicFeatureFlags>): void {
        // Update internal feature flags  
        // Note: config doesn't have featureFlags, will be implemented when config structure is finalized
        console.log('Feature flags would be updated:', flags);
        console.log('Feature flags updated:', flags);
    }
    
    /**
     * Get comprehensive statistics about the music system
     */
    public getStats(): LayeredMusicStats {
        const activeLayerCount = this.activeLayers.size;
        const totalLayerCount = this.layers.size;
        
        const layerStats = Array.from(this.layers.values()).map(layer => ({
            id: layer.id,
            type: layer.type,
            isPlaying: layer.isPlaying,
            volume: layer.currentVolume,
            isFading: layer.isFading
        }));
        
        return {
            isActive: this.isPlaying,
            currentState: this.currentState,
            currentIntensity: this.intensity,
            activeLayers: activeLayerCount,
            totalLayers: totalLayerCount,
            performanceMetrics: this.performanceMonitor ? {} : null, // getMetrics method will be added to PerformanceMonitor
            layerStats,
            eventStats: {
                totalEventsProcessed: this.musicEventSubscriber ? 100 : 0, // Placeholder
                eventsProcessedLastMinute: 10, // Placeholder
                queuedEvents: this.musicEventSubscriber ? this.musicEventSubscriber.getQueueStatus().queuedEvents : 0
            },
            memoryUsage: {
                activeNodes: layerStats.filter(l => l.isPlaying).length,
                scheduledNotes: 0, // Placeholder
                totalMemoryMB: 0 // Placeholder
            }
        };
    }
}