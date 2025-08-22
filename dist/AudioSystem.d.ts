/**
 * Web Audio API-based audio system for Tetris Is You
 * Handles both music and sound effects with MIDI-inspired synthesis
 */
import { MusicEventSubscriberConfig } from './audio/MusicEventSubscriber.js';
import { LayeredMusicFeatureFlags, LayeredMusicStats } from './audio/LayeredMusicManager.js';
import { MusicState } from './types/MusicTypes.js';
export interface AudioConfig {
    masterVolume: number;
    musicVolume: number;
    sfxVolume: number;
    enableMusic: boolean;
    enableSFX: boolean;
    enableTempoScaling: boolean;
    tempoScaling: {
        minBPM: number;
        maxBPM: number;
        transitionDuration: number;
        scalingCurve: 'linear' | 'exponential' | 'logarithmic';
        responsiveness: number;
    };
    enableAdaptiveMusic: boolean;
    adaptiveMusic: {
        enableLayeredMusic: boolean;
        enableRuleThemes: boolean;
        enableStingers: boolean;
        enableMusicEvents: boolean;
        featureFlags: LayeredMusicFeatureFlags;
        musicEventConfig: MusicEventSubscriberConfig;
    };
}
export interface SoundEffect {
    name: string;
    frequency: number;
    duration: number;
    type: OscillatorType;
    envelope?: {
        attack: number;
        decay: number;
        sustain: number;
        release: number;
    };
}
export declare class AudioSystem {
    private audioContext;
    private masterGain;
    private musicGain;
    private sfxGain;
    private config;
    private currentMusic;
    private tempoController;
    private speedChangeListener;
    private layeredMusicManager;
    private musicEventSubscriber;
    private performanceMonitor;
    private isUsingAdaptiveMusic;
    private fallbackMode;
    private lastMusicState;
    private lastIntensity;
    private soundEffects;
    constructor(config?: AudioConfig);
    private initialize;
    private updateVolumes;
    /**
     * Play a sound effect using Web Audio synthesis
     */
    playSoundEffect(effectName: string): Promise<void>;
    /**
     * Create a satisfying "wet plop" sound for piece drops
     */
    private createPlopSound;
    /**
     * Play the main soundtrack - uses layered system if available, falls back to static music
     */
    playMusic(): Promise<void>;
    /**
     * Stop currently playing music - handles both adaptive and static music
     */
    stopMusic(): Promise<void>;
    /**
     * Generate and play an ominous wizard-themed soundtrack
     */
    private playOminousWizardTheme;
    /**
     * Update audio configuration
     */
    updateConfig(newConfig: Partial<AudioConfig>): void;
    /**
     * Resume audio context if suspended (required for user interaction)
     */
    resumeContext(): Promise<void>;
    /**
     * Get current audio configuration
     */
    getConfig(): AudioConfig;
    /**
     * Get available sound effects
     */
    getSoundEffects(): string[];
    /**
     * Subscribe to EventEmitter events for reactive audio (fallback/legacy support)
     * This maintains compatibility with existing sound effect system
     */
    subscribeToGameEvents(ruleEngine: any, gameLogic: any): void;
    /**
     * Initialize TempoController with current audio configuration
     */
    private initializeTempoController;
    /**
     * Setup event listener for speed change events from DifficultyScaler
     */
    private setupSpeedChangeListener;
    /**
     * Handle speed change events from DifficultyScaler
     * Maps speedMultiplier (1.0-5.0) to BPM range using TempoController
     */
    private handleSpeedChange;
    /**
     * Get current tempo information from TempoController
     */
    getTempoInfo(): {
        bpm: number;
        speedMultiplier: number;
        isTransitioning: boolean;
    } | null;
    /**
     * Handle tempo configuration changes
     */
    private handleTempoConfigChange;
    /**
     * Initialize adaptive music system with layered composition and event handling
     */
    private initializeAdaptiveMusic;
    /**
     * Setup callbacks for music events to control adaptive music
     */
    private setupMusicEventCallbacks;
    /**
     * Handle music events and update adaptive music accordingly
     */
    private handleMusicEvent;
    /**
     * Connect adaptive music to game event systems
     */
    connectToGameSystems(ruleEngine: any, gameLogic: any): void;
    /**
     * Transition to a specific music state
     */
    transitionToMusicState(state: MusicState, intensity?: number): Promise<void>;
    /**
     * Set music intensity level
     */
    setMusicIntensity(intensity: number): Promise<void>;
    /**
     * Handle performance adjustments from the adaptive music system
     */
    private handlePerformanceAdjustment;
    /**
     * Handle adaptive music configuration changes
     */
    private handleAdaptiveMusicConfigChange;
    /**
     * Dispose adaptive music components
     */
    private disposeAdaptiveMusic;
    /**
     * Get adaptive music statistics and status
     */
    getAdaptiveMusicStats(): LayeredMusicStats | null;
    /**
     * Check if adaptive music is active
     */
    isAdaptiveMusicActive(): boolean;
    /**
     * Force fallback to static music (for testing or emergencies)
     */
    forceFallbackMode(enable?: boolean): void;
    /**
     * Cleanup method to dispose resources and remove event listeners
     */
    dispose(): void;
}
