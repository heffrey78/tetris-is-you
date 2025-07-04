/**
 * Web Audio API-based audio system for Tetris Is You
 * Handles both music and sound effects with MIDI-inspired synthesis
 */
export interface AudioConfig {
    masterVolume: number;
    musicVolume: number;
    sfxVolume: number;
    enableMusic: boolean;
    enableSFX: boolean;
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
    private soundEffects;
    constructor(config?: AudioConfig);
    private initialize;
    private updateVolumes;
    /**
     * Play a sound effect using Web Audio synthesis
     */
    playSoundEffect(effectName: string): void;
    /**
     * Create a satisfying "wet plop" sound for piece drops
     */
    private createPlopSound;
    /**
     * Play the main MIDI-style soundtrack
     */
    playMusic(): void;
    /**
     * Stop currently playing music
     */
    stopMusic(): void;
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
}
