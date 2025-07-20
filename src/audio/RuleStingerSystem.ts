/**
 * RuleStingerSystem - Musical stingers for rule creation and property effects
 * 
 * Creates specific musical themes for different rule types:
 * - Rule types: YOU (heroic), WIN (triumphant), DEFEAT (ominous), BOMB (explosive)
 * - Properties: SLOW (descending), FAST (ascending), FREEZE (dissonant)
 * - Musical scales: Major for positive, Minor for negative, Chromatic for chaotic
 * - Fusion rules combine multiple themes
 * - Configurable volume and duration
 */

import { EventListener, RuleCreatedEvent, RuleModifiedEvent, RuleConflictEvent } from '../EventEmitter.js';

// Musical scales and intervals
interface MusicalScale {
    name: string;
    intervals: number[]; // Semitone intervals from root
    mood: 'positive' | 'negative' | 'neutral' | 'chaotic';
}

interface StingerNote {
    frequency: number;
    startTime: number;
    duration: number;
    volume: number;
    oscType: OscillatorType;
    envelope?: {
        attack: number;
        decay: number;
        sustain: number;
        release: number;
    };
}

interface StingerConfig {
    volume: number;
    duration: number;
    fadeInTime: number;
    fadeOutTime: number;
    layerDelay: number; // For fusion rules
    enabled: boolean;
}

interface RuleStinger {
    name: string;
    notes: StingerNote[];
    scale: MusicalScale;
    baseFrequency: number;
    description: string;
}

export class RuleStingerSystem {
    private audioContext: AudioContext | null = null;
    private gainNode: GainNode | null = null;
    private config: StingerConfig;
    private isInitialized: boolean = false;

    // Musical scales
    private readonly scales: { [key: string]: MusicalScale } = {
        majorPentatonic: {
            name: 'Major Pentatonic',
            intervals: [0, 2, 4, 7, 9], // C, D, E, G, A
            mood: 'positive'
        },
        minorPentatonic: {
            name: 'Minor Pentatonic', 
            intervals: [0, 3, 5, 7, 10], // C, Eb, F, G, Bb
            mood: 'negative'
        },
        harmonicMinor: {
            name: 'Harmonic Minor',
            intervals: [0, 2, 3, 5, 7, 8, 11], // C, D, Eb, F, G, Ab, B
            mood: 'negative'
        },
        chromatic: {
            name: 'Chromatic',
            intervals: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11], // All semitones
            mood: 'chaotic'
        },
        wholeTone: {
            name: 'Whole Tone',
            intervals: [0, 2, 4, 6, 8, 10], // C, D, E, F#, G#, A#
            mood: 'neutral'
        },
        diminished: {
            name: 'Diminished',
            intervals: [0, 2, 3, 5, 6, 8, 9, 11], // Alternating whole-half steps
            mood: 'chaotic'
        }
    };

    // Pre-defined stingers for specific rules
    private readonly ruleStingers: { [key: string]: RuleStinger } = {};

    constructor(config: Partial<StingerConfig> = {}) {
        this.config = {
            volume: 0.4,
            duration: 1.5,
            fadeInTime: 0.05,
            fadeOutTime: 0.3,
            layerDelay: 0.15,
            enabled: true,
            ...config
        };

        this.initializeStingers();
    }

    /**
     * Initialize audio context and gain node
     */
    public async initialize(audioContext?: AudioContext): Promise<void> {
        try {
            if (audioContext) {
                this.audioContext = audioContext;
            } else {
                this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
            }

            this.gainNode = this.audioContext.createGain();
            this.gainNode.connect(this.audioContext.destination);
            this.gainNode.gain.value = this.config.volume;

            this.isInitialized = true;
            console.log('🎵 RuleStingerSystem initialized successfully');
        } catch (error) {
            console.error('Failed to initialize RuleStingerSystem:', error);
        }
    }

    /**
     * Initialize all predefined stingers
     */
    private initializeStingers(): void {
        // Heroic stinger for YOU rules
        this.ruleStingers['YOU'] = {
            name: 'Heroic Theme',
            scale: this.scales.majorPentatonic,
            baseFrequency: 261.63, // C4
            description: 'Ascending major progression with heroic feel',
            notes: this.createHeroicStinger()
        };

        // Triumphant stinger for WIN rules
        this.ruleStingers['WIN'] = {
            name: 'Victory Fanfare',
            scale: this.scales.majorPentatonic,
            baseFrequency: 523.25, // C5
            description: 'Bright, triumphant major chord progression',
            notes: this.createTriumphantStinger()
        };

        // Ominous stinger for DEFEAT/LOSE rules
        this.ruleStingers['DEFEAT'] = this.ruleStingers['LOSE'] = {
            name: 'Ominous Theme',
            scale: this.scales.harmonicMinor,
            baseFrequency: 220, // A3
            description: 'Dark, descending minor progression',
            notes: this.createOminousStinger()
        };

        // Explosive stinger for BOMB rules
        this.ruleStingers['BOMB'] = {
            name: 'Explosive Burst',
            scale: this.scales.chromatic,
            baseFrequency: 130.81, // C3
            description: 'Chaotic explosion with noise elements',
            notes: this.createExplosiveStinger()
        };

        // Property-specific stingers
        this.ruleStingers['SLOW'] = {
            name: 'Descending Time',
            scale: this.scales.minorPentatonic,
            baseFrequency: 392, // G4
            description: 'Slowing, descending melody',
            notes: this.createSlowStinger()
        };

        this.ruleStingers['FAST'] = {
            name: 'Ascending Rush',
            scale: this.scales.majorPentatonic,
            baseFrequency: 293.66, // D4
            description: 'Quick, ascending melodic runs',
            notes: this.createFastStinger()
        };

        this.ruleStingers['FREEZE'] = {
            name: 'Crystalline Stop',
            scale: this.scales.wholeTone,
            baseFrequency: 440, // A4
            description: 'Dissonant, crystalline harmonies',
            notes: this.createFreezeStinger()
        };

        // Additional spell stingers
        this.ruleStingers['LIGHTNING'] = {
            name: 'Electric Crack',
            scale: this.scales.chromatic,
            baseFrequency: 1760, // A6
            description: 'Sharp, crackling high-frequency bursts',
            notes: this.createLightningStinger()
        };

        this.ruleStingers['HEAL'] = {
            name: 'Restorative Harmony',
            scale: this.scales.majorPentatonic,
            baseFrequency: 523.25, // C5
            description: 'Warm, healing chord progression',
            notes: this.createHealStinger()
        };

        this.ruleStingers['TELEPORT'] = {
            name: 'Dimensional Shift',
            scale: this.scales.wholeTone,
            baseFrequency: 880, // A5
            description: 'Ethereal, shifting tones',
            notes: this.createTeleportStinger()
        };

        this.ruleStingers['MULTIPLY'] = {
            name: 'Fractal Echo',
            scale: this.scales.majorPentatonic,
            baseFrequency: 659.25, // E5
            description: 'Multiplying echo effects',
            notes: this.createMultiplyStinger()
        };
    }

    /**
     * Play a stinger for a specific rule type or property
     */
    public async playStinger(ruleType: string, intensity: number = 1.0): Promise<void> {
        if (!this.config.enabled || !this.isInitialized || !this.audioContext || !this.gainNode) {
            return;
        }

        const stinger = this.ruleStingers[ruleType.toUpperCase()];
        if (!stinger) {
            console.warn(`No stinger found for rule type: ${ruleType}`);
            return;
        }

        try {
            console.log(`🎵 Playing ${stinger.name} stinger for ${ruleType}`);
            await this.playStingerNotes(stinger.notes, intensity);
        } catch (error) {
            console.error(`Failed to play stinger for ${ruleType}:`, error);
        }
    }

    /**
     * Play a fusion stinger combining multiple rule themes
     */
    public async playFusionStinger(ruleTypes: string[], intensity: number = 1.0): Promise<void> {
        if (!this.config.enabled || !this.isInitialized || !this.audioContext || !this.gainNode) {
            return;
        }

        if (ruleTypes.length === 0) return;

        try {
            console.log(`🎵 Playing fusion stinger for rules: ${ruleTypes.join(' + ')}`);

            if (ruleTypes.length === 1) {
                await this.playStinger(ruleTypes[0], intensity);
                return;
            }

            // Play each stinger with slight delay for layering effect
            const promises = ruleTypes.map(async (ruleType, index) => {
                const delay = index * this.config.layerDelay * 1000;
                if (delay > 0) {
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
                
                const stinger = this.ruleStingers[ruleType.toUpperCase()];
                if (stinger) {
                    const layerIntensity = intensity * (0.7 + (0.3 / ruleTypes.length)); // Slightly reduce volume for layers
                    await this.playStingerNotes(stinger.notes, layerIntensity);
                }
            });

            await Promise.all(promises);
        } catch (error) {
            console.error(`Failed to play fusion stinger:`, error);
        }
    }

    /**
     * Subscribe to rule engine events
     */
    public subscribeToRuleEvents(ruleEngine: any): void {
        if (!ruleEngine?.on) {
            console.warn('RuleStingerSystem: Rule engine does not support event subscription');
            return;
        }

        // Rule creation events
        ruleEngine.on('rule:created', (event: RuleCreatedEvent) => {
            const { rule } = event;
            console.log(`🎵 Rule created stinger: [${rule.noun}] IS [${rule.property}]`);
            
            // Play stingers for both noun and property if available
            const ruleThemes = [];
            
            if (this.ruleStingers[rule.noun.toUpperCase()]) {
                ruleThemes.push(rule.noun);
            }
            
            if (this.ruleStingers[rule.property.toUpperCase()]) {
                ruleThemes.push(rule.property);
            }

            // Special fusion handling
            if (rule.property.startsWith('FUSION_')) {
                const fusionParts = rule.property.replace('FUSION_', '').split('_');
                const availableParts = fusionParts.filter(part => this.ruleStingers[part.toUpperCase()]);
                if (availableParts.length > 0) {
                    this.playFusionStinger(availableParts, 0.8);
                    return;
                }
            }

            if (ruleThemes.length > 0) {
                if (ruleThemes.length === 1) {
                    this.playStinger(ruleThemes[0], 0.7);
                } else {
                    this.playFusionStinger(ruleThemes, 0.6);
                }
            }
        });

        // Rule modification events
        ruleEngine.on('rule:modified', (event: RuleModifiedEvent) => {
            console.log(`🎵 Rule modified stinger: ${event.changes.field} changed`);
            // Play a subtle modification stinger
            this.playModificationStinger(event.changes.newValue);
        });

        // Rule conflict events
        ruleEngine.on('rule:conflict', (event: RuleConflictEvent) => {
            console.log(`🎵 Rule conflict stinger: ${event.conflict.resolution}`);
            this.playConflictStinger(event.conflict.resolution);
        });

        console.log('🎵 RuleStingerSystem subscribed to rule events');
    }

    /**
     * Play actual stinger notes using Web Audio
     */
    private async playStingerNotes(notes: StingerNote[], intensity: number): Promise<void> {
        if (!this.audioContext || !this.gainNode) return;

        const now = this.audioContext.currentTime;
        const volumeMultiplier = intensity * this.config.volume;

        notes.forEach(note => {
            try {
                const oscillator = this.audioContext!.createOscillator();
                const noteGain = this.audioContext!.createGain();

                oscillator.type = note.oscType;
                oscillator.frequency.setValueAtTime(note.frequency, now + note.startTime);

                // Apply envelope
                const envelope = note.envelope || { attack: 0.01, decay: 0.1, sustain: 0.8, release: 0.2 };
                const noteVolume = note.volume * volumeMultiplier;
                const startTime = now + note.startTime;
                const attackEnd = startTime + envelope.attack;
                const decayEnd = attackEnd + envelope.decay;
                const releaseStart = startTime + note.duration - envelope.release;

                noteGain.gain.setValueAtTime(0, startTime);
                noteGain.gain.linearRampToValueAtTime(noteVolume, attackEnd);
                noteGain.gain.linearRampToValueAtTime(noteVolume * envelope.sustain, decayEnd);
                noteGain.gain.setValueAtTime(noteVolume * envelope.sustain, releaseStart);
                noteGain.gain.linearRampToValueAtTime(0, startTime + note.duration);

                oscillator.connect(noteGain);
                noteGain.connect(this.gainNode!);

                oscillator.start(startTime);
                oscillator.stop(startTime + note.duration);
            } catch (error) {
                console.error('Error playing stinger note:', error);
            }
        });
    }

    /**
     * Create heroic stinger (YOU rules)
     */
    private createHeroicStinger(): StingerNote[] {
        const scale = this.scales.majorPentatonic;
        const baseFreq = 261.63; // C4

        return [
            // Ascending heroic progression: C - E - G - C (octave)
            {
                frequency: this.getFrequencyFromScale(baseFreq, scale, 0), // C
                startTime: 0,
                duration: 0.4,
                volume: 0.8,
                oscType: 'triangle',
                envelope: { attack: 0.02, decay: 0.1, sustain: 0.7, release: 0.28 }
            },
            {
                frequency: this.getFrequencyFromScale(baseFreq, scale, 2), // E
                startTime: 0.2,
                duration: 0.4,
                volume: 0.9,
                oscType: 'triangle',
                envelope: { attack: 0.02, decay: 0.1, sustain: 0.8, release: 0.28 }
            },
            {
                frequency: this.getFrequencyFromScale(baseFreq, scale, 3), // G
                startTime: 0.4,
                duration: 0.6,
                volume: 1.0,
                oscType: 'triangle',
                envelope: { attack: 0.02, decay: 0.15, sustain: 0.8, release: 0.43 }
            },
            {
                frequency: this.getFrequencyFromScale(baseFreq, scale, 0) * 2, // C (octave)
                startTime: 0.8,
                duration: 0.7,
                volume: 1.0,
                oscType: 'sine',
                envelope: { attack: 0.02, decay: 0.2, sustain: 0.9, release: 0.48 }
            }
        ];
    }

    /**
     * Create triumphant stinger (WIN rules)
     */
    private createTriumphantStinger(): StingerNote[] {
        const scale = this.scales.majorPentatonic;
        const baseFreq = 523.25; // C5

        return [
            // Victory fanfare: C - E - G (major triad) with harmonic layers
            {
                frequency: this.getFrequencyFromScale(baseFreq, scale, 0), // C5
                startTime: 0,
                duration: 1.2,
                volume: 1.0,
                oscType: 'triangle',
                envelope: { attack: 0.05, decay: 0.3, sustain: 0.8, release: 0.85 }
            },
            {
                frequency: this.getFrequencyFromScale(baseFreq, scale, 2), // E5
                startTime: 0.1,
                duration: 1.1,
                volume: 0.8,
                oscType: 'triangle',
                envelope: { attack: 0.05, decay: 0.3, sustain: 0.7, release: 0.75 }
            },
            {
                frequency: this.getFrequencyFromScale(baseFreq, scale, 3), // G5
                startTime: 0.2,
                duration: 1.0,
                volume: 0.9,
                oscType: 'sine',
                envelope: { attack: 0.05, decay: 0.3, sustain: 0.8, release: 0.65 }
            },
            // Add octave for brightness
            {
                frequency: this.getFrequencyFromScale(baseFreq, scale, 0) * 2, // C6
                startTime: 0.5,
                duration: 0.7,
                volume: 0.6,
                oscType: 'sine',
                envelope: { attack: 0.02, decay: 0.2, sustain: 0.6, release: 0.48 }
            }
        ];
    }

    /**
     * Create ominous stinger (DEFEAT/LOSE rules)
     */
    private createOminousStinger(): StingerNote[] {
        const scale = this.scales.harmonicMinor;
        const baseFreq = 220; // A3

        return [
            // Dark, descending progression
            {
                frequency: this.getFrequencyFromScale(baseFreq, scale, 0), // A
                startTime: 0,
                duration: 0.8,
                volume: 1.0,
                oscType: 'sawtooth',
                envelope: { attack: 0.1, decay: 0.2, sustain: 0.6, release: 0.5 }
            },
            {
                frequency: this.getFrequencyFromScale(baseFreq, scale, 5), // F
                startTime: 0.4,
                duration: 0.8,
                volume: 0.9,
                oscType: 'sawtooth',
                envelope: { attack: 0.05, decay: 0.2, sustain: 0.7, release: 0.55 }
            },
            {
                frequency: this.getFrequencyFromScale(baseFreq, scale, 2), // C
                startTime: 0.8,
                duration: 0.7,
                volume: 0.8,
                oscType: 'triangle',
                envelope: { attack: 0.05, decay: 0.15, sustain: 0.8, release: 0.5 }
            },
            // Low rumble
            {
                frequency: baseFreq * 0.5, // A2
                startTime: 0,
                duration: 1.5,
                volume: 0.4,
                oscType: 'sawtooth',
                envelope: { attack: 0.2, decay: 0.3, sustain: 0.5, release: 1.0 }
            }
        ];
    }

    /**
     * Create explosive stinger (BOMB rules)
     */
    private createExplosiveStinger(): StingerNote[] {
        const baseFreq = 130.81; // C3
        
        return [
            // Initial explosion burst
            {
                frequency: baseFreq * 4, // C5
                startTime: 0,
                duration: 0.1,
                volume: 1.0,
                oscType: 'square',
                envelope: { attack: 0.001, decay: 0.05, sustain: 0.1, release: 0.049 }
            },
            // Noise burst (simulated with rapid frequency modulation)
            {
                frequency: baseFreq * 8,
                startTime: 0.02,
                duration: 0.15,
                volume: 0.8,
                oscType: 'sawtooth',
                envelope: { attack: 0.001, decay: 0.1, sustain: 0.1, release: 0.049 }
            },
            // Low rumble explosion
            {
                frequency: baseFreq,
                startTime: 0.05,
                duration: 1.0,
                volume: 0.7,
                oscType: 'sawtooth',
                envelope: { attack: 0.01, decay: 0.3, sustain: 0.2, release: 0.69 }
            },
            // Mid-range chaos
            {
                frequency: baseFreq * 2.5,
                startTime: 0.1,
                duration: 0.4,
                volume: 0.6,
                oscType: 'square',
                envelope: { attack: 0.02, decay: 0.15, sustain: 0.3, release: 0.23 }
            }
        ];
    }

    /**
     * Create slow stinger (SLOW property)
     */
    private createSlowStinger(): StingerNote[] {
        const scale = this.scales.minorPentatonic;
        const baseFreq = 392; // G4

        return [
            // Descending, slowing melody
            {
                frequency: this.getFrequencyFromScale(baseFreq, scale, 4), // High note
                startTime: 0,
                duration: 0.6,
                volume: 0.8,
                oscType: 'sine',
                envelope: { attack: 0.1, decay: 0.2, sustain: 0.7, release: 0.3 }
            },
            {
                frequency: this.getFrequencyFromScale(baseFreq, scale, 3),
                startTime: 0.3,
                duration: 0.8,
                volume: 0.7,
                oscType: 'sine',
                envelope: { attack: 0.15, decay: 0.25, sustain: 0.6, release: 0.4 }
            },
            {
                frequency: this.getFrequencyFromScale(baseFreq, scale, 1),
                startTime: 0.8,
                duration: 1.0,
                volume: 0.6,
                oscType: 'triangle',
                envelope: { attack: 0.2, decay: 0.3, sustain: 0.5, release: 0.5 }
            }
        ];
    }

    /**
     * Create fast stinger (FAST property)
     */
    private createFastStinger(): StingerNote[] {
        const scale = this.scales.majorPentatonic;
        const baseFreq = 293.66; // D4

        return [
            // Quick ascending runs
            {
                frequency: this.getFrequencyFromScale(baseFreq, scale, 0),
                startTime: 0,
                duration: 0.15,
                volume: 0.8,
                oscType: 'triangle',
                envelope: { attack: 0.005, decay: 0.05, sustain: 0.3, release: 0.095 }
            },
            {
                frequency: this.getFrequencyFromScale(baseFreq, scale, 1),
                startTime: 0.1,
                duration: 0.15,
                volume: 0.85,
                oscType: 'triangle',
                envelope: { attack: 0.005, decay: 0.05, sustain: 0.3, release: 0.095 }
            },
            {
                frequency: this.getFrequencyFromScale(baseFreq, scale, 2),
                startTime: 0.2,
                duration: 0.15,
                volume: 0.9,
                oscType: 'triangle',
                envelope: { attack: 0.005, decay: 0.05, sustain: 0.3, release: 0.095 }
            },
            {
                frequency: this.getFrequencyFromScale(baseFreq, scale, 3),
                startTime: 0.3,
                duration: 0.15,
                volume: 0.95,
                oscType: 'triangle',
                envelope: { attack: 0.005, decay: 0.05, sustain: 0.3, release: 0.095 }
            },
            {
                frequency: this.getFrequencyFromScale(baseFreq, scale, 4),
                startTime: 0.4,
                duration: 0.3,
                volume: 1.0,
                oscType: 'sine',
                envelope: { attack: 0.005, decay: 0.1, sustain: 0.5, release: 0.195 }
            }
        ];
    }

    /**
     * Create freeze stinger (FREEZE property)
     */
    private createFreezeStinger(): StingerNote[] {
        const scale = this.scales.wholeTone;
        const baseFreq = 440; // A4

        return [
            // Crystalline, dissonant harmonies
            {
                frequency: this.getFrequencyFromScale(baseFreq, scale, 0),
                startTime: 0,
                duration: 1.2,
                volume: 0.7,
                oscType: 'triangle',
                envelope: { attack: 0.1, decay: 0.3, sustain: 0.8, release: 0.8 }
            },
            {
                frequency: this.getFrequencyFromScale(baseFreq, scale, 2),
                startTime: 0.1,
                duration: 1.1,
                volume: 0.6,
                oscType: 'sine',
                envelope: { attack: 0.15, decay: 0.25, sustain: 0.7, release: 0.7 }
            },
            {
                frequency: this.getFrequencyFromScale(baseFreq, scale, 4),
                startTime: 0.2,
                duration: 1.0,
                volume: 0.5,
                oscType: 'triangle',
                envelope: { attack: 0.2, decay: 0.2, sustain: 0.6, release: 0.6 }
            },
            // High crystalline chime
            {
                frequency: baseFreq * 4,
                startTime: 0.5,
                duration: 0.4,
                volume: 0.3,
                oscType: 'sine',
                envelope: { attack: 0.02, decay: 0.1, sustain: 0.2, release: 0.28 }
            }
        ];
    }

    /**
     * Create lightning stinger
     */
    private createLightningStinger(): StingerNote[] {
        return [
            {
                frequency: 1760, // A6 - high crack
                startTime: 0,
                duration: 0.05,
                volume: 1.0,
                oscType: 'square',
                envelope: { attack: 0.001, decay: 0.02, sustain: 0.1, release: 0.029 }
            },
            {
                frequency: 880, // A5 - echo
                startTime: 0.02,
                duration: 0.1,
                volume: 0.7,
                oscType: 'sawtooth',
                envelope: { attack: 0.001, decay: 0.05, sustain: 0.2, release: 0.049 }
            },
            {
                frequency: 220, // A3 - thunder
                startTime: 0.1,
                duration: 0.8,
                volume: 0.5,
                oscType: 'triangle',
                envelope: { attack: 0.02, decay: 0.3, sustain: 0.4, release: 0.48 }
            }
        ];
    }

    /**
     * Create heal stinger
     */
    private createHealStinger(): StingerNote[] {
        const scale = this.scales.majorPentatonic;
        const baseFreq = 523.25; // C5

        return [
            // Warm, healing progression
            {
                frequency: this.getFrequencyFromScale(baseFreq, scale, 0), // C
                startTime: 0,
                duration: 0.8,
                volume: 0.8,
                oscType: 'sine',
                envelope: { attack: 0.1, decay: 0.2, sustain: 0.8, release: 0.5 }
            },
            {
                frequency: this.getFrequencyFromScale(baseFreq, scale, 2), // E
                startTime: 0.2,
                duration: 0.8,
                volume: 0.7,
                oscType: 'sine',
                envelope: { attack: 0.1, decay: 0.2, sustain: 0.7, release: 0.5 }
            },
            {
                frequency: this.getFrequencyFromScale(baseFreq, scale, 3), // G
                startTime: 0.4,
                duration: 0.8,
                volume: 0.6,
                oscType: 'triangle',
                envelope: { attack: 0.1, decay: 0.2, sustain: 0.6, release: 0.5 }
            }
        ];
    }

    /**
     * Create teleport stinger
     */
    private createTeleportStinger(): StingerNote[] {
        const scale = this.scales.wholeTone;
        const baseFreq = 880; // A5

        return [
            // Dimensional shift effect
            {
                frequency: this.getFrequencyFromScale(baseFreq, scale, 0),
                startTime: 0,
                duration: 0.3,
                volume: 0.8,
                oscType: 'triangle',
                envelope: { attack: 0.05, decay: 0.1, sustain: 0.3, release: 0.15 }
            },
            {
                frequency: this.getFrequencyFromScale(baseFreq, scale, 3),
                startTime: 0.15,
                duration: 0.3,
                volume: 0.6,
                oscType: 'sine',
                envelope: { attack: 0.02, decay: 0.1, sustain: 0.4, release: 0.18 }
            },
            {
                frequency: this.getFrequencyFromScale(baseFreq, scale, 1),
                startTime: 0.3,
                duration: 0.4,
                volume: 0.7,
                oscType: 'triangle',
                envelope: { attack: 0.02, decay: 0.15, sustain: 0.5, release: 0.23 }
            }
        ];
    }

    /**
     * Create multiply stinger
     */
    private createMultiplyStinger(): StingerNote[] {
        const scale = this.scales.majorPentatonic;
        const baseFreq = 659.25; // E5

        return [
            // Multiplying echo effect
            {
                frequency: this.getFrequencyFromScale(baseFreq, scale, 0),
                startTime: 0,
                duration: 0.4,
                volume: 1.0,
                oscType: 'triangle',
                envelope: { attack: 0.02, decay: 0.1, sustain: 0.7, release: 0.28 }
            },
            {
                frequency: this.getFrequencyFromScale(baseFreq, scale, 0),
                startTime: 0.15,
                duration: 0.4,
                volume: 0.7,
                oscType: 'triangle',
                envelope: { attack: 0.02, decay: 0.1, sustain: 0.5, release: 0.28 }
            },
            {
                frequency: this.getFrequencyFromScale(baseFreq, scale, 0),
                startTime: 0.3,
                duration: 0.4,
                volume: 0.5,
                oscType: 'sine',
                envelope: { attack: 0.02, decay: 0.1, sustain: 0.3, release: 0.28 }
            }
        ];
    }

    /**
     * Play modification stinger for rule changes
     */
    private async playModificationStinger(newValue: string): Promise<void> {
        if (!this.isInitialized || !this.audioContext || !this.gainNode) return;

        // Simple, subtle modification sound
        const notes: StingerNote[] = [
            {
                frequency: 523.25, // C5
                startTime: 0,
                duration: 0.2,
                volume: 0.4,
                oscType: 'sine',
                envelope: { attack: 0.01, decay: 0.05, sustain: 0.5, release: 0.14 }
            },
            {
                frequency: 659.25, // E5
                startTime: 0.1,
                duration: 0.2,
                volume: 0.3,
                oscType: 'triangle',
                envelope: { attack: 0.01, decay: 0.05, sustain: 0.3, release: 0.14 }
            }
        ];

        await this.playStingerNotes(notes, 0.5);
    }

    /**
     * Play conflict resolution stinger
     */
    private async playConflictStinger(resolution: string): Promise<void> {
        if (!this.isInitialized || !this.audioContext || !this.gainNode) return;

        let notes: StingerNote[] = [];

        switch (resolution) {
            case 'fusion':
                // Harmonic resolution
                notes = [
                    {
                        frequency: 440, // A4
                        startTime: 0,
                        duration: 0.5,
                        volume: 0.6,
                        oscType: 'triangle',
                        envelope: { attack: 0.05, decay: 0.15, sustain: 0.6, release: 0.3 }
                    },
                    {
                        frequency: 523.25, // C5
                        startTime: 0.2,
                        duration: 0.5,
                        volume: 0.5,
                        oscType: 'sine',
                        envelope: { attack: 0.05, decay: 0.15, sustain: 0.5, release: 0.3 }
                    }
                ];
                break;
            case 'cancel':
                // Dissonant cancellation
                notes = [
                    {
                        frequency: 466.16, // A#4
                        startTime: 0,
                        duration: 0.3,
                        volume: 0.5,
                        oscType: 'square',
                        envelope: { attack: 0.02, decay: 0.1, sustain: 0.3, release: 0.18 }
                    }
                ];
                break;
            default:
                // Default priority resolution
                notes = [
                    {
                        frequency: 392, // G4
                        startTime: 0,
                        duration: 0.4,
                        volume: 0.4,
                        oscType: 'triangle',
                        envelope: { attack: 0.02, decay: 0.1, sustain: 0.5, release: 0.28 }
                    }
                ];
        }

        await this.playStingerNotes(notes, 0.6);
    }

    /**
     * Get frequency from scale and root note
     */
    private getFrequencyFromScale(rootFreq: number, scale: MusicalScale, scaleIndex: number): number {
        if (scaleIndex >= scale.intervals.length) {
            scaleIndex = scaleIndex % scale.intervals.length;
        }
        const semitones = scale.intervals[scaleIndex];
        return rootFreq * Math.pow(2, semitones / 12);
    }

    /**
     * Update configuration
     */
    public updateConfig(newConfig: Partial<StingerConfig>): void {
        this.config = { ...this.config, ...newConfig };
        
        if (this.gainNode) {
            this.gainNode.gain.value = this.config.volume;
        }
    }

    /**
     * Get current configuration
     */
    public getConfig(): StingerConfig {
        return { ...this.config };
    }

    /**
     * Get available stinger types
     */
    public getAvailableStingers(): string[] {
        return Object.keys(this.ruleStingers);
    }

    /**
     * Resume audio context if suspended
     */
    public async resumeContext(): Promise<void> {
        if (this.audioContext && this.audioContext.state === 'suspended') {
            await this.audioContext.resume();
            console.log('🎵 RuleStingerSystem audio context resumed');
        }
    }
}