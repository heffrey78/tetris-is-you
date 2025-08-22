/**
 * Web Audio API-based audio system for Tetris Is You
 * Handles both music and sound effects with MIDI-inspired synthesis
 */

import { TempoController, TempoConfig } from './audio/TempoController.js';
import { SpeedChangeEventDetail } from './GameConfig.js';
import { MusicEventSubscriber, MusicEventSubscriberConfig, DEFAULT_MUSIC_EVENT_CONFIG, MusicEventCallback } from './audio/MusicEventSubscriber.js';
import { LayeredMusicManager, LayeredMusicFeatureFlags, DEFAULT_FEATURE_FLAGS, LayeredMusicStats } from './audio/LayeredMusicManager.js';
import { LayeredMusicConfig, DEFAULT_LAYERED_MUSIC_CONFIG, MusicState } from './types/MusicTypes.js';
import { PerformanceMonitor, PerformanceMetrics } from './utils/PerformanceMonitor.js';

export interface AudioConfig {
    masterVolume: number;
    musicVolume: number;
    sfxVolume: number;
    enableMusic: boolean;
    enableSFX: boolean;
    // Tempo responsiveness settings
    enableTempoScaling: boolean;
    tempoScaling: {
        minBPM: number;
        maxBPM: number;
        transitionDuration: number;
        scalingCurve: 'linear' | 'exponential' | 'logarithmic';
        responsiveness: number;
    };
    // Adaptive music settings
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

export class AudioSystem {
    private audioContext: AudioContext | null = null;
    private masterGain: GainNode | null = null;
    private musicGain: GainNode | null = null;
    private sfxGain: GainNode | null = null;
    private config: AudioConfig;
    private currentMusic: AudioBufferSourceNode | null = null;
    private tempoController: TempoController | null = null;
    private speedChangeListener: ((event: Event) => void) | null = null;
    
    // Adaptive music components
    private layeredMusicManager: LayeredMusicManager | null = null;
    private musicEventSubscriber: MusicEventSubscriber | null = null;
    private performanceMonitor: PerformanceMonitor | null = null;
    private isUsingAdaptiveMusic: boolean = false;
    private fallbackMode: boolean = false;
    private lastMusicState: MusicState = MusicState.IDLE;
    private lastIntensity: number = 0.0;
    
    // Sound effect definitions based on MIDI-style synthesis
    private soundEffects: { [key: string]: SoundEffect } = {
        pieceDrop: {
            name: 'Piece Drop',
            frequency: 180, // Lower, softer frequency
            duration: 0.3,
            type: 'sine', // Softer waveform for wet plop effect
            envelope: { attack: 0.02, decay: 0.15, sustain: 0.1, release: 0.13 }
        },
        pieceRotate: {
            name: 'Piece Rotate',
            frequency: 440, // A4
            duration: 0.1,
            type: 'triangle',
            envelope: { attack: 0.005, decay: 0.05, sustain: 0.2, release: 0.045 }
        },
        lineClear: {
            name: 'Line Clear',
            frequency: 523, // C5
            duration: 1.0,
            type: 'sine',
            envelope: { attack: 0.02, decay: 0.3, sustain: 0.5, release: 0.68 }
        },
        bombExplosion: {
            name: 'BOMB Explosion',
            frequency: 80, // Low rumble
            duration: 1.5,
            type: 'sawtooth',
            envelope: { attack: 0.01, decay: 0.5, sustain: 0.3, release: 0.99 }
        },
        lightning: {
            name: 'LIGHTNING Strike',
            frequency: 1200, // High crackle
            duration: 0.8,
            type: 'square',
            envelope: { attack: 0.001, decay: 0.1, sustain: 0.2, release: 0.69 }
        },
        acid: {
            name: 'ACID Dissolve',
            frequency: 200, // Bubbling sound
            duration: 1.2,
            type: 'sawtooth',
            envelope: { attack: 0.05, decay: 0.4, sustain: 0.6, release: 0.75 }
        },
        heal: {
            name: 'HEAL Restoration',
            frequency: 523, // C5 - peaceful
            duration: 0.6,
            type: 'sine',
            envelope: { attack: 0.03, decay: 0.2, sustain: 0.8, release: 0.37 }
        },
        teleport: {
            name: 'TELEPORT Warp',
            frequency: 880, // A5 - rising
            duration: 0.4,
            type: 'triangle',
            envelope: { attack: 0.02, decay: 0.1, sustain: 0.1, release: 0.28 }
        },
        multiply: {
            name: 'MULTIPLY Clone',
            frequency: 392, // G4 - doubling
            duration: 0.5,
            type: 'square',
            envelope: { attack: 0.01, decay: 0.15, sustain: 0.4, release: 0.34 }
        },
        magnet: {
            name: 'MAGNET Pull',
            frequency: 110, // Low magnetic hum
            duration: 0.8,
            type: 'triangle',
            envelope: { attack: 0.1, decay: 0.2, sustain: 0.7, release: 0.5 }
        },
        transform: {
            name: 'TRANSFORM Morph',
            frequency: 659, // E5 - changing
            duration: 0.7,
            type: 'triangle',
            envelope: { attack: 0.05, decay: 0.3, sustain: 0.4, release: 0.35 }
        },
        sink: {
            name: 'SINK Falling',
            frequency: 294, // D4 - descending
            duration: 0.9,
            type: 'sine',
            envelope: { attack: 0.02, decay: 0.3, sustain: 0.5, release: 0.58 }
        },
        float: {
            name: 'FLOAT Rising',
            frequency: 784, // G5 - ascending
            duration: 0.8,
            type: 'sine',
            envelope: { attack: 0.02, decay: 0.2, sustain: 0.6, release: 0.58 }
        },
        ruleFormation: {
            name: 'Rule Formation',
            frequency: 659, // E5
            duration: 0.5,
            type: 'sine',
            envelope: { attack: 0.02, decay: 0.2, sustain: 0.6, release: 0.28 }
        },
        blockTransformation: {
            name: 'Block Transformation',
            frequency: 784, // G5
            duration: 0.8,
            type: 'triangle',
            envelope: { attack: 0.05, decay: 0.3, sustain: 0.4, release: 0.45 }
        },
        menuClick: {
            name: 'Menu Click',
            frequency: 330, // E4
            duration: 0.1,
            type: 'square',
            envelope: { attack: 0.01, decay: 0.04, sustain: 0.2, release: 0.05 }
        },
        error: {
            name: 'Error',
            frequency: 150, // Low tone
            duration: 0.3,
            type: 'sawtooth',
            envelope: { attack: 0.02, decay: 0.1, sustain: 0.5, release: 0.18 }
        },
        success: {
            name: 'Success',
            frequency: 880, // A5
            duration: 0.4,
            type: 'sine',
            envelope: { attack: 0.02, decay: 0.15, sustain: 0.7, release: 0.23 }
        }
    };
    
    constructor(config: AudioConfig = {
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
            musicEventConfig: DEFAULT_MUSIC_EVENT_CONFIG
        }
    }) {
        this.config = config;
        // Don't initialize immediately - wait for user interaction
    }
    
    private async initialize(): Promise<void> {
        if (this.audioContext) return; // Already initialized
        
        try {
            // Create AudioContext - will be allowed after user interaction
            this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
            
            // Create gain nodes for volume control
            this.masterGain = this.audioContext.createGain();
            this.musicGain = this.audioContext.createGain();
            this.sfxGain = this.audioContext.createGain();
            
            // Connect gain nodes
            this.musicGain.connect(this.masterGain);
            this.sfxGain.connect(this.masterGain);
            this.masterGain.connect(this.audioContext.destination);
            
            // Set initial volumes
            this.updateVolumes();
            
            // Initialize TempoController if tempo scaling is enabled
            if (this.config.enableTempoScaling) {
                this.initializeTempoController();
            }
            
            // Setup speed change event listener
            this.setupSpeedChangeListener();
            
            // Initialize adaptive music system if enabled
            if (this.config.enableAdaptiveMusic) {
                await this.initializeAdaptiveMusic();
            }
            
            console.log('🎵 Audio system initialized successfully');
        } catch (error) {
            console.error('Failed to initialize audio system:', error);
        }
    }
    
    private updateVolumes(): void {
        if (!this.masterGain || !this.musicGain || !this.sfxGain) return;
        
        this.masterGain.gain.value = this.config.masterVolume;
        this.musicGain.gain.value = this.config.musicVolume;
        this.sfxGain.gain.value = this.config.sfxVolume;
    }
    
    /**
     * Play a sound effect using Web Audio synthesis
     */
    public async playSoundEffect(effectName: string): Promise<void> {
        if (!this.config.enableSFX) return;
        
        // Initialize audio system if needed (requires user interaction)
        await this.initialize();
        
        if (!this.audioContext || !this.sfxGain) return;
        
        const effect = this.soundEffects[effectName];
        if (!effect) {
            console.warn(`Sound effect '${effectName}' not found`);
            return;
        }
        
        try {
            // Special handling for piece drop to create a "wet plop" effect
            if (effectName === 'pieceDrop') {
                this.createPlopSound();
                return;
            }
            
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            // Configure oscillator
            oscillator.type = effect.type;
            oscillator.frequency.setValueAtTime(effect.frequency, this.audioContext.currentTime);
            
            // Configure envelope if present
            if (effect.envelope) {
                const env = effect.envelope;
                const now = this.audioContext.currentTime;
                const attackEnd = now + env.attack;
                const decayEnd = attackEnd + env.decay;
                const releaseStart = now + effect.duration - env.release;
                
                gainNode.gain.setValueAtTime(0, now);
                gainNode.gain.linearRampToValueAtTime(1, attackEnd);
                gainNode.gain.linearRampToValueAtTime(env.sustain, decayEnd);
                gainNode.gain.setValueAtTime(env.sustain, releaseStart);
                gainNode.gain.linearRampToValueAtTime(0, now + effect.duration);
            } else {
                // Simple fade in/out
                const now = this.audioContext.currentTime;
                gainNode.gain.setValueAtTime(0, now);
                gainNode.gain.linearRampToValueAtTime(0.8, now + 0.01);
                gainNode.gain.linearRampToValueAtTime(0, now + effect.duration);
            }
            
            // Connect and start
            oscillator.connect(gainNode);
            if (this.sfxGain) {
                gainNode.connect(this.sfxGain);
            }
            
            oscillator.start(this.audioContext.currentTime);
            oscillator.stop(this.audioContext.currentTime + effect.duration);
            
        } catch (error) {
            console.error(`Failed to play sound effect '${effectName}':`, error);
        }
    }
    
    /**
     * Create a satisfying "wet plop" sound for piece drops
     */
    private createPlopSound(): void {
        if (!this.audioContext || !this.sfxGain) return;
        
        try {
            const now = this.audioContext.currentTime;
            const duration = 0.25;
            
            // Create the main "plop" oscillator with frequency sweep
            const mainOsc = this.audioContext.createOscillator();
            const mainGain = this.audioContext.createGain();
            
            mainOsc.type = 'sine';
            // Start higher and drop down for that "plop" effect
            mainOsc.frequency.setValueAtTime(300, now);
            mainOsc.frequency.exponentialRampToValueAtTime(120, now + 0.08);
            mainOsc.frequency.setValueAtTime(120, now + duration);
            
            // Gentle attack and quick decay for plop
            mainGain.gain.setValueAtTime(0, now);
            mainGain.gain.linearRampToValueAtTime(0.4, now + 0.01);
            mainGain.gain.exponentialRampToValueAtTime(0.1, now + 0.1);
            mainGain.gain.linearRampToValueAtTime(0.001, now + duration);
            
            // Add a subtle low-frequency component for "wetness"
            const subOsc = this.audioContext.createOscillator();
            const subGain = this.audioContext.createGain();
            
            subOsc.type = 'triangle';
            subOsc.frequency.setValueAtTime(80, now);
            subOsc.frequency.exponentialRampToValueAtTime(60, now + 0.05);
            
            subGain.gain.setValueAtTime(0, now);
            subGain.gain.linearRampToValueAtTime(0.15, now + 0.005);
            subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
            
            // Connect everything
            mainOsc.connect(mainGain);
            subOsc.connect(subGain);
            
            if (this.sfxGain) {
                mainGain.connect(this.sfxGain);
                subGain.connect(this.sfxGain);
            }
            
            // Start and stop
            mainOsc.start(now);
            subOsc.start(now);
            mainOsc.stop(now + duration);
            subOsc.stop(now + 0.08);
            
        } catch (error) {
            console.error('Failed to create plop sound:', error);
        }
    }
    
    /**
     * Play the main soundtrack - uses layered system if available, falls back to static music
     */
    public async playMusic(): Promise<void> {
        if (!this.config.enableMusic) return;
        
        // Initialize audio system if needed (requires user interaction)
        await this.initialize();
        
        if (!this.audioContext || !this.musicGain) return;
        
        this.stopMusic();
        
        try {
            // Try adaptive music first if enabled and available
            if (this.config.enableAdaptiveMusic && this.layeredMusicManager && !this.fallbackMode) {
                console.log('🎵 Starting adaptive layered music system');
                this.isUsingAdaptiveMusic = true;
                await this.layeredMusicManager.play();
                return;
            }
        } catch (error) {
            console.error('Failed to start adaptive music, falling back to static music:', error);
            this.fallbackMode = true;
            this.isUsingAdaptiveMusic = false;
        }
        
        // Fallback to static wizard theme
        console.log('🎵 Using static wizard theme music');
        this.playOminousWizardTheme();
    }
    
    /**
     * Stop currently playing music - handles both adaptive and static music
     */
    public async stopMusic(): Promise<void> {
        try {
            // Stop adaptive music if active
            if (this.isUsingAdaptiveMusic && this.layeredMusicManager) {
                await this.layeredMusicManager.stop();
                this.isUsingAdaptiveMusic = false;
            }
            
            // Stop static music if active
            if (this.currentMusic) {
                try {
                    this.currentMusic.stop();
                } catch (error) {
                    // Already stopped
                }
                this.currentMusic = null;
            }
        } catch (error) {
            console.error('Error stopping music:', error);
        }
    }
    
    /**
     * Generate and play an ominous wizard-themed soundtrack
     */
    private playOminousWizardTheme(): void {
        if (!this.audioContext || !this.musicGain) return;
        
        try {
            // Create a simple ominous melody using multiple oscillators
            const melodyNotes = [
                { freq: 220, start: 0, duration: 2 },     // A3 - dark root
                { freq: 246.94, start: 2, duration: 1 },  // B3 - tension
                { freq: 261.63, start: 3, duration: 1 },  // C4 - minor resolution
                { freq: 293.66, start: 4, duration: 2 },  // D4 - building
                { freq: 277.18, start: 6, duration: 1 },  // C#4 - dissonance
                { freq: 220, start: 7, duration: 3 },     // A3 - return to dark
                
                // Second phrase - higher and more urgent
                { freq: 440, start: 10, duration: 1.5 },  // A4 - higher tension
                { freq: 493.88, start: 11.5, duration: 1 }, // B4
                { freq: 523.25, start: 12.5, duration: 1 }, // C5 - peak
                { freq: 466.16, start: 13.5, duration: 2 }, // A#4 - falling
                { freq: 415.30, start: 15.5, duration: 1 }, // G#4
                { freq: 369.99, start: 16.5, duration: 2.5 }, // F#4 - resolution
            ];
            
            // Bass line for ominous foundation
            const bassNotes = [
                { freq: 110, start: 0, duration: 4 },     // A2 - deep foundation
                { freq: 116.54, start: 4, duration: 2 },  // A#2 - half step up
                { freq: 110, start: 6, duration: 4 },     // A2 - return
                { freq: 103.83, start: 10, duration: 2 }, // G#2 - darker
                { freq: 98, start: 12, duration: 3 },     // G2 - deeper
                { freq: 110, start: 15, duration: 4 },    // A2 - final resolution
            ];
            
            const now = this.audioContext.currentTime;
            
            // Play melody with triangle wave for mystical quality
            melodyNotes.forEach(note => {
                const oscillator = this.audioContext!.createOscillator();
                const gainNode = this.audioContext!.createGain();
                
                oscillator.type = 'triangle';
                oscillator.frequency.setValueAtTime(note.freq, now + note.start);
                
                // Soft attack and release for atmospheric effect
                gainNode.gain.setValueAtTime(0, now + note.start);
                gainNode.gain.linearRampToValueAtTime(0.3, now + note.start + 0.1);
                gainNode.gain.setValueAtTime(0.3, now + note.start + note.duration - 0.2);
                gainNode.gain.linearRampToValueAtTime(0, now + note.start + note.duration);
                
                oscillator.connect(gainNode);
                if (this.musicGain) {
                    gainNode.connect(this.musicGain);
                }
                
                oscillator.start(now + note.start);
                oscillator.stop(now + note.start + note.duration);
            });
            
            // Play bass with sawtooth for dark undertone
            bassNotes.forEach(note => {
                const oscillator = this.audioContext!.createOscillator();
                const gainNode = this.audioContext!.createGain();
                
                oscillator.type = 'sawtooth';
                oscillator.frequency.setValueAtTime(note.freq, now + note.start);
                
                // Lower volume for bass, longer envelope
                gainNode.gain.setValueAtTime(0, now + note.start);
                gainNode.gain.linearRampToValueAtTime(0.15, now + note.start + 0.2);
                gainNode.gain.setValueAtTime(0.15, now + note.start + note.duration - 0.3);
                gainNode.gain.linearRampToValueAtTime(0, now + note.start + note.duration);
                
                oscillator.connect(gainNode);
                if (this.musicGain) {
                    gainNode.connect(this.musicGain);
                }
                
                oscillator.start(now + note.start);
                oscillator.stop(now + note.start + note.duration);
            });
            
            // Schedule next loop (19 seconds total)
            setTimeout(() => {
                if (this.config.enableMusic) {
                    this.playOminousWizardTheme();
                }
            }, 19000);
            
        } catch (error) {
            console.error('Failed to play wizard theme:', error);
        }
    }
    
    /**
     * Update audio configuration
     */
    public updateConfig(newConfig: Partial<AudioConfig>): void {
        const oldConfig = { ...this.config };
        this.config = { ...this.config, ...newConfig };
        this.updateVolumes();
        
        // Handle music enable/disable changes
        if (!this.config.enableMusic) {
            this.stopMusic();
        } else if (!this.isUsingAdaptiveMusic && !this.currentMusic) {
            this.playMusic();
        }
        
        // Handle tempo scaling configuration changes
        if (newConfig.enableTempoScaling !== undefined || newConfig.tempoScaling) {
            this.handleTempoConfigChange(oldConfig, this.config);
        }
        
        // Handle adaptive music configuration changes
        if (newConfig.enableAdaptiveMusic !== undefined || newConfig.adaptiveMusic) {
            this.handleAdaptiveMusicConfigChange(oldConfig, this.config);
        }
    }
    
    /**
     * Resume audio context if suspended (required for user interaction)
     */
    public async resumeContext(): Promise<void> {
        if (this.audioContext && this.audioContext.state === 'suspended') {
            await this.audioContext.resume();
            console.log('🎵 Audio context resumed');
        }
    }
    
    /**
     * Get current audio configuration
     */
    public getConfig(): AudioConfig {
        return { ...this.config };
    }
    
    /**
     * Get available sound effects
     */
    public getSoundEffects(): string[] {
        return Object.keys(this.soundEffects);
    }
    
    /**
     * Subscribe to EventEmitter events for reactive audio (fallback/legacy support)
     * This maintains compatibility with existing sound effect system
     */
    public subscribeToGameEvents(ruleEngine: any, gameLogic: any): void {
        if (!ruleEngine?.getEventEmitter || !gameLogic?.getEventEmitter) {
            console.warn('AudioSystem: EventEmitter not available on RuleEngine or GameLogic');
            return;
        }
        
        // Subscribe to rule events
        ruleEngine.on('rule:created', (event: any) => {
            console.log(`🎵 Audio responding to rule creation: [${event.rule.noun}] IS [${event.rule.property}]`);
            this.playSoundEffect('ruleFormation');
        });
        
        ruleEngine.on('rule:conflict', (event: any) => {
            console.log(`🎵 Audio responding to rule conflict: ${event.conflict.resolution}`);
            this.playSoundEffect('ruleTweak'); // Play conflict resolution sound
        });
        
        // Subscribe to gameplay events
        gameLogic.on('game:lineClear', (event: any) => {
            console.log(`🎵 Audio responding to line clear: ${event.linesCleared} lines`);
            // Play different sounds based on line count
            if (event.linesCleared >= 4) {
                this.playSoundEffect('tetris'); // Special tetris sound
            } else {
                this.playSoundEffect('lineClear');
            }
        });
        
        gameLogic.on('game:spellEffect', (event: any) => {
            console.log(`🎵 Audio responding to spell effect: ${event.spellName} at intensity ${event.intensity}`);
            // Play spell-specific sounds
            const spellSounds: { [key: string]: string } = {
                'BOMB': 'bombExplosion',
                'LIGHTNING': 'lightning',
                'ACID': 'acid',
                'MULTIPLY': 'multiply',
                'TELEPORT': 'teleport',
                'MAGNET': 'magnet',
                'TRANSFORM': 'transform',
                'HEAL': 'heal',
                'SINK': 'sink',
                'FLOAT': 'float'
            };
            
            const soundEffect = spellSounds[event.spellName] || 'spellCast';
            this.playSoundEffect(soundEffect);
            
            // Play combo sound for combo effects
            if (event.isComboEffect) {
                setTimeout(() => this.playSoundEffect('comboEffect'), 200);
            }
        });
        
        gameLogic.on('game:blockTransformation', (event: any) => {
            console.log(`🎵 Audio responding to block transformation: ${event.transformationType}`);
            // Play transformation sounds based on type
            switch (event.transformationType) {
                case 'destruction':
                    this.playSoundEffect('blockDestroy');
                    break;
                case 'creation':
                    this.playSoundEffect('blockCreate');
                    break;
                case 'type':
                case 'color':
                    this.playSoundEffect('blockTransform');
                    break;
            }
        });
        
        gameLogic.on('game:pieceMovement', (event: any) => {
            // Only play sounds for significant movements (not every drop)
            if (event.movement === 'place') {
                this.playSoundEffect('pieceDrop');
            } else if (event.movement === 'rotate') {
                this.playSoundEffect('pieceRotate');
            }
            // Suppress left/right/drop movement sounds to avoid spam
        });
        
        gameLogic.on('game:stateChange', (event: any) => {
            console.log(`🎵 Audio responding to game state change: ${event.changeType}`);
            switch (event.changeType) {
                case 'level':
                    this.playSoundEffect('levelUp');
                    break;
                case 'gameOver':
                    if (event.newValue) {
                        this.playSoundEffect('gameOver');
                        this.stopMusic(); // Stop background music on game over
                    }
                    break;
                case 'pause':
                    // Could pause/resume music based on pause state
                    break;
            }
        });
        
        console.log('🎵 AudioSystem successfully subscribed to EventEmitter events (legacy mode)');
    }
    
    /**
     * Initialize TempoController with current audio configuration
     */
    private initializeTempoController(): void {
        try {
            this.tempoController = new TempoController(
                this.audioContext,
                this.config.tempoScaling
            );
            
            console.log('🎵 TempoController initialized successfully');
        } catch (error) {
            console.error('Failed to initialize TempoController:', error);
        }
    }
    
    /**
     * Setup event listener for speed change events from DifficultyScaler
     */
    private setupSpeedChangeListener(): void {
        try {
            // Create event listener function
            this.speedChangeListener = (event: Event) => {
                const customEvent = event as CustomEvent<SpeedChangeEventDetail>;
                this.handleSpeedChange(customEvent.detail);
            };
            
            // Add event listener to window for 'speedChange' events
            window.addEventListener('speedChange', this.speedChangeListener);
            
            console.log('🎵 Speed change event listener setup successfully');
        } catch (error) {
            console.error('Failed to setup speed change listener:', error);
        }
    }
    
    /**
     * Handle speed change events from DifficultyScaler
     * Maps speedMultiplier (1.0-5.0) to BPM range using TempoController
     */
    private handleSpeedChange(eventDetail: SpeedChangeEventDetail): void {
        if (!this.config.enableTempoScaling || !this.tempoController) {
            console.log('🎵 Tempo scaling disabled or TempoController not available');
            return;
        }
        
        try {
            const { newSpeed, oldSpeed, level, difficultyName } = eventDetail;
            
            // Validate speed multiplier range
            if (newSpeed < 1.0 || newSpeed > 5.0) {
                console.warn(`🎵 Invalid speed multiplier: ${newSpeed}. Expected range 1.0-5.0`);
                return;
            }
            
            // Call TempoController.setTempo() with speed multiplier
            this.tempoController.setTempo(newSpeed);
            
            console.log(`🎵 Audio tempo updated: ${oldSpeed.toFixed(2)}x → ${newSpeed.toFixed(2)}x (Level ${level}, ${difficultyName})`);
            
        } catch (error) {
            console.error('Failed to handle speed change:', error);
        }
    }
    
    /**
     * Get current tempo information from TempoController
     */
    public getTempoInfo(): { bpm: number; speedMultiplier: number; isTransitioning: boolean } | null {
        if (!this.tempoController) {
            return null;
        }
        
        const state = this.tempoController.getState();
        return {
            bpm: state.currentBPM,
            speedMultiplier: state.speedMultiplier,
            isTransitioning: state.isTransitioning
        };
    }
    
    /**
     * Handle tempo configuration changes
     */
    private handleTempoConfigChange(oldConfig: AudioConfig, newConfig: AudioConfig): void {
        try {
            // Check if tempo scaling was enabled/disabled
            if (oldConfig.enableTempoScaling !== newConfig.enableTempoScaling) {
                if (newConfig.enableTempoScaling) {
                    // Enable tempo scaling - initialize TempoController if not already done
                    if (!this.tempoController) {
                        this.initializeTempoController();
                    }
                    console.log('🎵 Tempo scaling enabled');
                } else {
                    // Disable tempo scaling - dispose TempoController
                    if (this.tempoController) {
                        this.tempoController.dispose();
                        this.tempoController = null;
                    }
                    console.log('🎵 Tempo scaling disabled');
                }
            }
            
            // Update TempoController configuration if it exists and tempo scaling settings changed
            if (this.tempoController && newConfig.tempoScaling && newConfig.enableTempoScaling) {
                this.tempoController.updateConfig(newConfig.tempoScaling);
                console.log('🎵 TempoController configuration updated');
            }
            
        } catch (error) {
            console.error('Failed to handle tempo config change:', error);
        }
    }
    
    /**
     * Initialize adaptive music system with layered composition and event handling
     */
    private async initializeAdaptiveMusic(): Promise<void> {
        try {
            console.log('🎵 Initializing adaptive music system...');
            
            // Initialize performance monitor
            this.performanceMonitor = new PerformanceMonitor();
            
            // Initialize MusicEventSubscriber
            if (this.config.adaptiveMusic.enableMusicEvents) {
                this.musicEventSubscriber = new MusicEventSubscriber(this.config.adaptiveMusic.musicEventConfig);
                this.setupMusicEventCallbacks();
                console.log('🎵 MusicEventSubscriber initialized');
            }
            
            // Initialize LayeredMusicManager
            if (this.config.adaptiveMusic.enableLayeredMusic) {
                const layeredConfig: LayeredMusicConfig = {
                    ...DEFAULT_LAYERED_MUSIC_CONFIG,
                    masterVolume: this.config.masterVolume,
                    musicVolume: this.config.musicVolume,
                    enableMusic: this.config.enableMusic
                };
                
                this.layeredMusicManager = new LayeredMusicManager(
                    this.audioContext!,
                    this.musicGain!,
                    {
                        audioConfig: this.config,
                        musicConfig: layeredConfig,
                        initializeDefaultLayers: true,
                        autoStart: false,
                        initialState: MusicState.IDLE,
                        initialIntensity: 0.0
                    }
                );
                
                // Set up performance adjustment callback
                this.layeredMusicManager.setPerformanceAdjustmentCallback((qualityLevel: number) => {
                    this.handlePerformanceAdjustment(qualityLevel);
                });
                
                console.log('🎵 LayeredMusicManager initialized');
            }
            
            console.log('🎵 Adaptive music system initialized successfully');
            
        } catch (error) {
            console.error('Failed to initialize adaptive music system:', error);
            this.fallbackMode = true;
        }
    }
    
    /**
     * Setup callbacks for music events to control adaptive music
     */
    private setupMusicEventCallbacks(): void {
        if (!this.musicEventSubscriber) return;
        
        const musicEventCallback: MusicEventCallback = (eventType, eventData, musicAction) => {
            this.handleMusicEvent(eventType, eventData, musicAction);
        };
        
        this.musicEventSubscriber.registerCallback(musicEventCallback);
    }
    
    /**
     * Handle music events and update adaptive music accordingly
     */
    private handleMusicEvent(eventType: any, eventData: any, musicAction: any): void {
        if (!this.layeredMusicManager || this.fallbackMode) return;
        
        try {
            switch (musicAction.type) {
                case 'state_transition':
                    if (musicAction.data?.newState) {
                        this.transitionToMusicState(musicAction.data.newState, musicAction.data.intensity || 0.5);
                    }
                    break;
                    
                case 'intensity_change':
                    if (musicAction.data?.intensity !== undefined) {
                        this.setMusicIntensity(musicAction.data.intensity);
                    }
                    break;
                    
                case 'stinger':
                    // Sound effects are handled by the existing system
                    if (musicAction.data?.soundEffect) {
                        this.playSoundEffect(musicAction.data.soundEffect);
                    }
                    break;
            }
        } catch (error) {
            console.error('Error handling music event:', error);
        }
    }
    
    /**
     * Connect adaptive music to game event systems
     */
    public connectToGameSystems(ruleEngine: any, gameLogic: any): void {
        try {
            // Connect MusicEventSubscriber to game systems
            if (this.musicEventSubscriber && ruleEngine && gameLogic) {
                this.musicEventSubscriber.subscribe(ruleEngine, gameLogic);
                console.log('🎵 Adaptive music connected to game systems');
            }
            
            // Also maintain legacy event subscription for sound effects
            this.subscribeToGameEvents(ruleEngine, gameLogic);
            
        } catch (error) {
            console.error('Failed to connect adaptive music to game systems:', error);
            this.fallbackMode = true;
        }
    }
    
    /**
     * Transition to a specific music state
     */
    public async transitionToMusicState(state: MusicState, intensity: number = 0.5): Promise<void> {
        if (!this.layeredMusicManager || this.fallbackMode || !this.config.enableMusic) return;
        
        try {
            this.lastMusicState = state;
            this.lastIntensity = intensity;
            await this.layeredMusicManager.transitionToState(state, intensity);
            console.log(`🎵 Music state transition: ${state} (intensity: ${intensity.toFixed(2)})`);
        } catch (error) {
            console.error('Failed to transition music state:', error);
        }
    }
    
    /**
     * Set music intensity level
     */
    public async setMusicIntensity(intensity: number): Promise<void> {
        if (!this.layeredMusicManager || this.fallbackMode || !this.config.enableMusic) return;
        
        try {
            this.lastIntensity = intensity;
            await this.layeredMusicManager.setIntensity(intensity);
        } catch (error) {
            console.error('Failed to set music intensity:', error);
        }
    }
    
    /**
     * Handle performance adjustments from the adaptive music system
     */
    private handlePerformanceAdjustment(qualityLevel: number): void {
        console.log(`🎯 Audio system performance adjustment: Quality level ${qualityLevel}`);
        
        // Could adjust sound effect quality, reduce polyphony, etc.
        // For now, just log the adjustment
    }
    
    /**
     * Handle adaptive music configuration changes
     */
    private async handleAdaptiveMusicConfigChange(oldConfig: AudioConfig, newConfig: AudioConfig): Promise<void> {
        try {
            // Check if adaptive music was enabled/disabled
            if (oldConfig.enableAdaptiveMusic !== newConfig.enableAdaptiveMusic) {
                if (newConfig.enableAdaptiveMusic) {
                    // Enable adaptive music
                    await this.initializeAdaptiveMusic();
                    console.log('🎵 Adaptive music enabled');
                } else {
                    // Disable adaptive music
                    this.disposeAdaptiveMusic();
                    console.log('🎵 Adaptive music disabled');
                }
            }
            
            // Update configurations if components exist
            if (this.musicEventSubscriber && newConfig.adaptiveMusic.musicEventConfig) {
                this.musicEventSubscriber.updateConfig(newConfig.adaptiveMusic.musicEventConfig);
            }
            
            if (this.layeredMusicManager && newConfig.adaptiveMusic.featureFlags) {
                this.layeredMusicManager.updateFeatureFlags(newConfig.adaptiveMusic.featureFlags);
            }
            
        } catch (error) {
            console.error('Failed to handle adaptive music config change:', error);
        }
    }
    
    /**
     * Dispose adaptive music components
     */
    private disposeAdaptiveMusic(): void {
        try {
            if (this.musicEventSubscriber) {
                this.musicEventSubscriber.dispose();
                this.musicEventSubscriber = null;
            }
            
            if (this.layeredMusicManager) {
                this.layeredMusicManager.dispose();
                this.layeredMusicManager = null;
            }
            
            if (this.performanceMonitor) {
                this.performanceMonitor = null;
            }
            
            this.isUsingAdaptiveMusic = false;
            this.fallbackMode = false;
            
        } catch (error) {
            console.error('Error disposing adaptive music:', error);
        }
    }
    
    /**
     * Get adaptive music statistics and status
     */
    public getAdaptiveMusicStats(): LayeredMusicStats | null {
        return this.layeredMusicManager ? this.layeredMusicManager.getStats() : null;
    }
    
    /**
     * Check if adaptive music is active
     */
    public isAdaptiveMusicActive(): boolean {
        return this.isUsingAdaptiveMusic && !this.fallbackMode;
    }
    
    /**
     * Force fallback to static music (for testing or emergencies)
     */
    public forceFallbackMode(enable: boolean = true): void {
        this.fallbackMode = enable;
        if (enable && this.isUsingAdaptiveMusic) {
            console.log('🎵 Forcing fallback to static music');
            this.stopMusic().then(() => this.playMusic());
        }
    }
    
    /**
     * Cleanup method to dispose resources and remove event listeners
     */
    public dispose(): void {
        try {
            // Remove speed change event listener
            if (this.speedChangeListener) {
                window.removeEventListener('speedChange', this.speedChangeListener);
                this.speedChangeListener = null;
            }
            
            // Dispose TempoController
            if (this.tempoController) {
                this.tempoController.dispose();
                this.tempoController = null;
            }
            
            // Dispose adaptive music components
            this.disposeAdaptiveMusic();
            
            // Stop current music
            this.stopMusic();
            
            // Close audio context
            if (this.audioContext && this.audioContext.state !== 'closed') {
                this.audioContext.close();
                this.audioContext = null;
            }
            
            console.log('🎵 AudioSystem disposed successfully');
        } catch (error) {
            console.error('Failed to dispose AudioSystem:', error);
        }
    }
}