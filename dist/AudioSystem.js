/**
 * Web Audio API-based audio system for Tetris Is You
 * Handles both music and sound effects with MIDI-inspired synthesis
 */
export class AudioSystem {
    constructor(config = {
        masterVolume: 0.7,
        musicVolume: 0.5,
        sfxVolume: 0.8,
        enableMusic: true,
        enableSFX: true
    }) {
        this.audioContext = null;
        this.masterGain = null;
        this.musicGain = null;
        this.sfxGain = null;
        this.currentMusic = null;
        // Sound effect definitions based on MIDI-style synthesis
        this.soundEffects = {
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
        this.config = config;
        this.initialize();
    }
    async initialize() {
        try {
            // Create AudioContext
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
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
            console.log('🎵 Audio system initialized successfully');
        }
        catch (error) {
            console.error('Failed to initialize audio system:', error);
        }
    }
    updateVolumes() {
        if (!this.masterGain || !this.musicGain || !this.sfxGain)
            return;
        this.masterGain.gain.value = this.config.masterVolume;
        this.musicGain.gain.value = this.config.musicVolume;
        this.sfxGain.gain.value = this.config.sfxVolume;
    }
    /**
     * Play a sound effect using Web Audio synthesis
     */
    playSoundEffect(effectName) {
        if (!this.config.enableSFX || !this.audioContext || !this.sfxGain)
            return;
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
            }
            else {
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
        }
        catch (error) {
            console.error(`Failed to play sound effect '${effectName}':`, error);
        }
    }
    /**
     * Create a satisfying "wet plop" sound for piece drops
     */
    createPlopSound() {
        if (!this.audioContext || !this.sfxGain)
            return;
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
        }
        catch (error) {
            console.error('Failed to create plop sound:', error);
        }
    }
    /**
     * Play the main MIDI-style soundtrack
     */
    playMusic() {
        if (!this.config.enableMusic || !this.audioContext || !this.musicGain)
            return;
        this.stopMusic();
        this.playOminousWizardTheme();
    }
    /**
     * Stop currently playing music
     */
    stopMusic() {
        if (this.currentMusic) {
            try {
                this.currentMusic.stop();
            }
            catch (error) {
                // Already stopped
            }
            this.currentMusic = null;
        }
    }
    /**
     * Generate and play an ominous wizard-themed soundtrack
     */
    playOminousWizardTheme() {
        if (!this.audioContext || !this.musicGain)
            return;
        try {
            // Create a simple ominous melody using multiple oscillators
            const melodyNotes = [
                { freq: 220, start: 0, duration: 2 }, // A3 - dark root
                { freq: 246.94, start: 2, duration: 1 }, // B3 - tension
                { freq: 261.63, start: 3, duration: 1 }, // C4 - minor resolution
                { freq: 293.66, start: 4, duration: 2 }, // D4 - building
                { freq: 277.18, start: 6, duration: 1 }, // C#4 - dissonance
                { freq: 220, start: 7, duration: 3 }, // A3 - return to dark
                // Second phrase - higher and more urgent
                { freq: 440, start: 10, duration: 1.5 }, // A4 - higher tension
                { freq: 493.88, start: 11.5, duration: 1 }, // B4
                { freq: 523.25, start: 12.5, duration: 1 }, // C5 - peak
                { freq: 466.16, start: 13.5, duration: 2 }, // A#4 - falling
                { freq: 415.30, start: 15.5, duration: 1 }, // G#4
                { freq: 369.99, start: 16.5, duration: 2.5 }, // F#4 - resolution
            ];
            // Bass line for ominous foundation
            const bassNotes = [
                { freq: 110, start: 0, duration: 4 }, // A2 - deep foundation
                { freq: 116.54, start: 4, duration: 2 }, // A#2 - half step up
                { freq: 110, start: 6, duration: 4 }, // A2 - return
                { freq: 103.83, start: 10, duration: 2 }, // G#2 - darker
                { freq: 98, start: 12, duration: 3 }, // G2 - deeper
                { freq: 110, start: 15, duration: 4 }, // A2 - final resolution
            ];
            const now = this.audioContext.currentTime;
            // Play melody with triangle wave for mystical quality
            melodyNotes.forEach(note => {
                const oscillator = this.audioContext.createOscillator();
                const gainNode = this.audioContext.createGain();
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
                const oscillator = this.audioContext.createOscillator();
                const gainNode = this.audioContext.createGain();
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
        }
        catch (error) {
            console.error('Failed to play wizard theme:', error);
        }
    }
    /**
     * Update audio configuration
     */
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
        this.updateVolumes();
        if (!this.config.enableMusic) {
            this.stopMusic();
        }
        else if (!this.currentMusic) {
            this.playMusic();
        }
    }
    /**
     * Resume audio context if suspended (required for user interaction)
     */
    async resumeContext() {
        if (this.audioContext && this.audioContext.state === 'suspended') {
            await this.audioContext.resume();
            console.log('🎵 Audio context resumed');
        }
    }
    /**
     * Get current audio configuration
     */
    getConfig() {
        return { ...this.config };
    }
    /**
     * Get available sound effects
     */
    getSoundEffects() {
        return Object.keys(this.soundEffects);
    }
}
//# sourceMappingURL=AudioSystem.js.map