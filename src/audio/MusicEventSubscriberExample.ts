/**
 * Example usage of MusicEventSubscriber with AudioSystem integration
 * 
 * This example demonstrates how to integrate the MusicEventSubscriber
 * with the existing AudioSystem to create a reactive audio experience.
 */

import { AudioSystem, AudioConfig } from '../AudioSystem.js';
import { MusicEventSubscriber, MusicEventSubscriberConfig } from './MusicEventSubscriber.js';
import { RuleEngine } from '../RuleEngine.js';
import { GameLogic } from '../GameLogic.js';
import { MusicState } from '../types/MusicTypes.js';

/**
 * Enhanced AudioSystem with event-driven music responses
 */
export class ReactiveAudioSystem {
    private audioSystem: AudioSystem;
    private musicEventSubscriber: MusicEventSubscriber;
    private ruleEngine: RuleEngine | null = null;
    private gameLogic: GameLogic | null = null;
    
    constructor(
        audioConfig: AudioConfig,
        musicEventConfig?: Partial<MusicEventSubscriberConfig>
    ) {
        this.audioSystem = new AudioSystem(audioConfig);
        
        // Create music event subscriber with custom configuration
        const eventConfig: Partial<MusicEventSubscriberConfig> = {
            enableDebugLogging: true,
            debounceDelayMs: 300,
            eventFilters: {
                minSpellIntensity: 0.3,
                minLinesClearedForMusic: 1,
                enablePieceMovementEvents: true,
                enableBlockTransformationEvents: true,
                enabledEventTypes: new Set([
                    'rule:created',
                    'rule:modified',
                    'rule:conflict',
                    'game:lineClear',
                    'game:spellEffect',
                    'game:blockTransformation',
                    'game:pieceMovement',
                    'game:stateChange'
                ])
            },
            musicResponses: {
                enableAutoStateTransitions: true,
                enableStingers: true,
                enableLayerChanges: true,
                intensityScalingFactor: 1.0
            },
            ...musicEventConfig
        };
        
        this.musicEventSubscriber = new MusicEventSubscriber(eventConfig);
        
        // Register callback to handle music actions
        this.musicEventSubscriber.registerCallback(this.handleMusicAction.bind(this));
    }
    
    /**
     * Initialize and connect to game systems
     */
    public initialize(ruleEngine: RuleEngine, gameLogic: GameLogic): void {
        this.ruleEngine = ruleEngine;
        this.gameLogic = gameLogic;
        
        // Subscribe to events
        this.musicEventSubscriber.subscribe(ruleEngine, gameLogic);
        
        // Initialize base audio system
        this.audioSystem.resumeContext();
        this.audioSystem.playMusic();
        
        console.log('🎵 ReactiveAudioSystem initialized and subscribed to game events');
    }
    
    /**
     * Handle music actions from events
     */
    private handleMusicAction(
        eventType: string,
        eventData: any,
        musicAction: any
    ): void {
        console.log(`🎵 Handling music action: ${musicAction.type} for event: ${eventType}`);
        
        switch (musicAction.type) {
            case 'stinger':
                this.handleStingerAction(musicAction, eventData);
                break;
                
            case 'state_transition':
                this.handleStateTransition(musicAction, eventData);
                break;
                
            case 'intensity_change':
                this.handleIntensityChange(musicAction, eventData);
                break;
                
            case 'layer_change':
                this.handleLayerChange(musicAction, eventData);
                break;
                
            default:
                // No action needed
                break;
        }
    }
    
    /**
     * Handle stinger sound effects
     */
    private handleStingerAction(musicAction: any, eventData: any): void {
        const soundEffect = musicAction.data?.soundEffect;
        if (soundEffect) {
            console.log(`🎵 Playing stinger: ${soundEffect}`);
            this.audioSystem.playSoundEffect(soundEffect);
        }
    }
    
    /**
     * Handle music state transitions
     */
    private handleStateTransition(musicAction: any, eventData: any): void {
        const newState = musicAction.data?.newState;
        const soundEffect = musicAction.data?.soundEffect;
        
        console.log(`🎵 Music state transition to: ${newState}`);
        
        // Play transition sound effect if specified
        if (soundEffect) {
            this.audioSystem.playSoundEffect(soundEffect);
        }
        
        // Here you would implement actual music layer changes based on state
        // For now, we'll adjust the base music system
        this.adjustMusicForState(newState);
    }
    
    /**
     * Handle intensity changes
     */
    private handleIntensityChange(musicAction: any, eventData: any): void {
        const intensity = musicAction.data?.intensity || 0.5;
        console.log(`🎵 Music intensity change to: ${intensity.toFixed(2)}`);
        
        // Adjust volume and effects based on intensity
        const volumeMultiplier = 0.3 + (intensity * 0.7); // Scale between 0.3 and 1.0
        const currentConfig = this.audioSystem.getConfig();
        
        this.audioSystem.updateConfig({
            ...currentConfig,
            musicVolume: currentConfig.musicVolume * volumeMultiplier
        });
    }
    
    /**
     * Handle layer changes (placeholder for future layered music system)
     */
    private handleLayerChange(musicAction: any, eventData: any): void {
        const layerChanges = musicAction.data?.layerChanges || [];
        console.log(`🎵 Layer changes requested:`, layerChanges);
        
        // This would be implemented when we have a proper layered music system
        // For now, we'll log the intended changes
        layerChanges.forEach((change: any) => {
            console.log(`  Layer ${change.layerId}: ${change.action} ${change.value || ''}`);
        });
    }
    
    /**
     * Adjust music based on current state (basic implementation)
     */
    private adjustMusicForState(state: MusicState): void {
        const currentConfig = this.audioSystem.getConfig();
        
        switch (state) {
            case MusicState.IDLE:
                // Calm, lower volume
                this.audioSystem.updateConfig({
                    ...currentConfig,
                    musicVolume: 0.3
                });
                break;
                
            case MusicState.BUILDING:
                // Medium intensity
                this.audioSystem.updateConfig({
                    ...currentConfig,
                    musicVolume: 0.5
                });
                break;
                
            case MusicState.INTENSE:
                // High intensity
                this.audioSystem.updateConfig({
                    ...currentConfig,
                    musicVolume: 0.7
                });
                break;
                
            case MusicState.VICTORY:
                // Celebratory
                this.audioSystem.updateConfig({
                    ...currentConfig,
                    musicVolume: 0.8
                });
                // Could play a victory fanfare here
                this.audioSystem.playSoundEffect('success');
                break;
                
            case MusicState.DEFEAT:
                // Somber
                this.audioSystem.updateConfig({
                    ...currentConfig,
                    musicVolume: 0.2
                });
                this.audioSystem.stopMusic(); // Stop upbeat music
                break;
        }
    }
    
    /**
     * Get current music state from subscriber
     */
    public getCurrentMusicState(): MusicState {
        return this.musicEventSubscriber.getCurrentMusicState();
    }
    
    /**
     * Get current intensity from subscriber
     */
    public getCurrentIntensity(): number {
        return this.musicEventSubscriber.getCurrentIntensity();
    }
    
    /**
     * Update audio configuration
     */
    public updateAudioConfig(config: Partial<AudioConfig>): void {
        this.audioSystem.updateConfig(config);
    }
    
    /**
     * Update music event configuration
     */
    public updateMusicEventConfig(config: Partial<MusicEventSubscriberConfig>): void {
        this.musicEventSubscriber.updateConfig(config);
    }
    
    /**
     * Get event queue status for debugging
     */
    public getEventQueueStatus(): any {
        return this.musicEventSubscriber.getQueueStatus();
    }
    
    /**
     * Play a sound effect directly
     */
    public playSoundEffect(effectName: string): void {
        this.audioSystem.playSoundEffect(effectName);
    }
    
    /**
     * Resume audio context (required for user interaction)
     */
    public async resumeContext(): Promise<void> {
        await this.audioSystem.resumeContext();
    }
    
    /**
     * Dispose and clean up all resources
     */
    public dispose(): void {
        console.log('🎵 Disposing ReactiveAudioSystem');
        this.musicEventSubscriber.dispose();
        // AudioSystem doesn't have a dispose method, but we stop music
        this.audioSystem.stopMusic();
    }
}

/**
 * Factory function to create a ReactiveAudioSystem with sensible defaults
 */
export function createReactiveAudioSystem(
    audioConfig?: Partial<AudioConfig>,
    musicEventConfig?: Partial<MusicEventSubscriberConfig>
): ReactiveAudioSystem {
    const defaultAudioConfig: AudioConfig = {
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
        }
    };
    
    const defaultMusicEventConfig: Partial<MusicEventSubscriberConfig> = {
        enableDebugLogging: false, // Set to true for development
        debounceDelayMs: 300,
        eventFilters: {
            minSpellIntensity: 0.3,
            minLinesClearedForMusic: 1,
            enablePieceMovementEvents: true,
            enableBlockTransformationEvents: false, // Reduce noise in production
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
            enableLayerChanges: false, // Enable when layered music system is implemented
            intensityScalingFactor: 1.0
        }
    };
    
    return new ReactiveAudioSystem(
        { ...defaultAudioConfig, ...audioConfig },
        { ...defaultMusicEventConfig, ...musicEventConfig }
    );
}

/**
 * Example integration in main game initialization
 */
export function exampleIntegration(): void {
    // This would typically be in your main game initialization
    
    // Create the reactive audio system
    const reactiveAudio = createReactiveAudioSystem(
        { enableMusic: true, enableSFX: true },
        { enableDebugLogging: true }
    );
    
    // Initialize game systems (this would be your existing code)
    // Note: These would be initialized with proper parameters in real usage
    const ruleEngine = new RuleEngine();
    // const gameLogic = new GameLogic(gameState, ruleEngine, wordQueue, logger);
    // For this example, we'll just show the interface
    console.log('In real usage, initialize GameLogic with proper parameters');
    
    // Connect the reactive audio system
    // reactiveAudio.initialize(ruleEngine, gameLogic);
    
    // Enable audio on user interaction (required by browsers)
    document.addEventListener('click', async () => {
        await reactiveAudio.resumeContext();
    }, { once: true });
    
    console.log('🎵 Example reactive audio integration complete');
}