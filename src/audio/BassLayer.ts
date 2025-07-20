/**
 * BassLayer implementation for deep, ominous bass lines in Tetris Is You
 * Extends BaseMusicLayer with bass-specific patterns and low-frequency synthesis
 * Creates rich, wizard-themed bass tones using sawtooth and triangle oscillators
 */

import { 
    BaseMusicLayer, 
    Note, 
    OscillatorConfig, 
    Envelope 
} from './BaseMusicLayer';
import { 
    LayerType, 
    MusicState 
} from '../types/MusicTypes';

/**
 * Bass note pattern types for different musical contexts
 */
export enum BassPattern {
    /** Simple root note pattern for minimal bass */
    ROOT_ONLY = 'root_only',
    /** Root and fifth interval pattern */
    ROOT_FIFTH = 'root_fifth',
    /** Root, fifth, and octave pattern */
    ROOT_FIFTH_OCTAVE = 'root_fifth_octave',
    /** Walking bass line with chromatic movement */
    WALKING = 'walking',
    /** Syncopated bass with rhythm emphasis */
    SYNCOPATED = 'syncopated',
    /** Drone bass for atmospheric tension */
    DRONE = 'drone'
}

/**
 * Configuration for bass-specific behavior
 */
export interface BassConfig {
    /** Root frequency for bass patterns (default: E1 at ~41Hz) */
    rootFrequency: number;
    /** Pattern complexity based on intensity */
    patternComplexity: BassPattern[];
    /** Rhythm subdivision (4 = quarter notes, 8 = eighth notes, etc.) */
    rhythmSubdivision: number;
    /** Enable pitch bending for expressive bass */
    enablePitchBend: boolean;
    /** Amount of detuning for thickness (cents) */
    detuneAmount: number;
    /** Sub-bass frequency ratio (for ultra-low content) */
    subBassRatio: number;
}

/**
 * Musical intervals in semitones for bass harmony
 */
const BASS_INTERVALS = {
    UNISON: 0,
    MINOR_THIRD: 3,
    PERFECT_FOURTH: 5,
    PERFECT_FIFTH: 7,
    MINOR_SEVENTH: 10,
    OCTAVE: 12,
    MAJOR_NINTH: 14
} as const;

/**
 * Bass frequency ranges for different registers
 */
const BASS_FREQUENCIES = {
    /** Ultra-low sub-bass (20-40 Hz) */
    SUB_BASS: { min: 20, max: 40 },
    /** Low bass (40-80 Hz) */
    LOW_BASS: { min: 40, max: 80 },
    /** Mid bass (80-160 Hz) */
    MID_BASS: { min: 80, max: 160 },
    /** Upper bass (160-250 Hz) */
    UPPER_BASS: { min: 160, max: 250 }
} as const;

/**
 * BassLayer class providing rich, low-frequency musical foundation
 * Implements wizard-themed bass patterns with intensity-based variations
 */
export class BassLayer extends BaseMusicLayer {
    /** Bass-specific configuration */
    private bassConfig: BassConfig;
    
    /** Current bass pattern being used */
    private currentPattern: BassPattern = BassPattern.ROOT_ONLY;
    
    /** Beat counter for pattern synchronization */
    private beatCounter: number = 0;
    
    /** Pattern length in beats */
    private patternLength: number = 4;
    
    /** Last scheduled note time for continuous bass */
    private lastNoteTime: number = 0;
    
    /** Note duration cache for performance */
    private noteDurationCache: Map<string, number> = new Map();

    constructor(
        id: string = 'bass_layer',
        activeStates: MusicState[] = [
            MusicState.BUILDING, 
            MusicState.INTENSE, 
            MusicState.DEFEAT
        ],
        baseVolume: number = 0.6,
        audioContext: AudioContext,
        bassConfig: Partial<BassConfig> = {}
    ) {
        super(id, LayerType.BASE, activeStates, baseVolume, audioContext);
        
        // Initialize bass-specific configuration
        this.bassConfig = {
            rootFrequency: 41.2, // E1 - Perfect for ominous wizard theme
            patternComplexity: [
                BassPattern.ROOT_ONLY,
                BassPattern.ROOT_FIFTH,
                BassPattern.ROOT_FIFTH_OCTAVE,
                BassPattern.WALKING,
                BassPattern.SYNCOPATED
            ],
            rhythmSubdivision: 4,
            enablePitchBend: true,
            detuneAmount: 12, // 12 cents for subtle thickness
            subBassRatio: 0.5, // Octave below for sub-bass
            ...bassConfig
        };
        
        // Configure bass-specific oscillators for rich, dark sound
        this.defaultOscillators = [
            // Primary sawtooth bass - rich harmonics
            { 
                type: 'sawtooth', 
                frequency: 440, 
                volume: 0.7,
                detune: 0
            },
            // Secondary triangle - smoother low end
            { 
                type: 'triangle', 
                frequency: 440, 
                volume: 0.5,
                detune: this.bassConfig.detuneAmount
            },
            // Sub-bass sine wave - ultra-low foundation
            { 
                type: 'sine', 
                frequency: 220, // Will be scaled down further
                volume: 0.3,
                detune: 0
            }
        ];
        
        // Bass-specific envelope for punchy yet sustained notes
        this.defaultEnvelope = {
            attack: 0.02,  // Quick attack for punch
            decay: 0.15,   // Short decay
            sustain: 0.8,  // High sustain for drone-like quality
            release: 0.4   // Medium release for smooth transitions
        };
        
        console.log(`🎵 BassLayer '${this.id}' initialized with root frequency ${this.bassConfig.rootFrequency}Hz`);
    }

    /**
     * Initialize bass-specific layer setup
     */
    protected initializeLayer(): void {
        // Pre-calculate note durations for common patterns
        this.cacheNoteDurations();
        
        // Set initial pattern based on first active state
        if (this.activeStates.length > 0) {
            this.currentPattern = this.getPatternForState(this.activeStates[0], 0.5);
        }
        
        console.log(`🎵 BassLayer initialized with pattern: ${this.currentPattern}`);
    }

    /**
     * Generate bass notes based on current intensity and music state
     * @param intensity Intensity level (0.0 - 1.0)
     * @returns Array of bass notes to schedule
     */
    protected generateNotes(intensity: number): Note[] {
        const notes: Note[] = [];
        const patternLength = this.getPatternLength(intensity);
        const beatDuration = this.getBeatDuration();
        
        // Select pattern based on intensity
        this.currentPattern = this.selectPatternByIntensity(intensity);
        
        // Generate bass pattern
        for (let beat = 0; beat < patternLength; beat++) {
            const startTime = beat * beatDuration;
            const bassNotes = this.generateBassNotesForBeat(beat, intensity, startTime, beatDuration);
            notes.push(...bassNotes);
        }
        
        console.log(`🎵 Generated ${notes.length} bass notes for pattern: ${this.currentPattern} (intensity: ${intensity.toFixed(2)})`);
        return notes;
    }

    /**
     * Generate bass notes for a single beat based on current pattern
     * @param beat Beat number in pattern
     * @param intensity Current intensity level
     * @param startTime Note start time
     * @param beatDuration Duration of one beat
     * @returns Array of notes for this beat
     */
    private generateBassNotesForBeat(
        beat: number, 
        intensity: number, 
        startTime: number, 
        beatDuration: number
    ): Note[] {
        const notes: Note[] = [];
        const rootFreq = this.bassConfig.rootFrequency;
        const velocity = this.calculateVelocity(beat, intensity);
        
        try {
            switch (this.currentPattern) {
                case BassPattern.ROOT_ONLY:
                    notes.push(this.createBassNote(rootFreq, startTime, beatDuration, velocity));
                    break;
                    
                case BassPattern.ROOT_FIFTH:
                    if (beat % 2 === 0) {
                        notes.push(this.createBassNote(rootFreq, startTime, beatDuration, velocity));
                    } else {
                        const fifthFreq = this.transposeFrequency(rootFreq, BASS_INTERVALS.PERFECT_FIFTH);
                        notes.push(this.createBassNote(fifthFreq, startTime, beatDuration, velocity));
                    }
                    break;
                    
                case BassPattern.ROOT_FIFTH_OCTAVE:
                    if (beat % 4 === 0) {
                        notes.push(this.createBassNote(rootFreq, startTime, beatDuration, velocity));
                    } else if (beat % 4 === 1) {
                        const fifthFreq = this.transposeFrequency(rootFreq, BASS_INTERVALS.PERFECT_FIFTH);
                        notes.push(this.createBassNote(fifthFreq, startTime, beatDuration, velocity));
                    } else if (beat % 4 === 2) {
                        const octaveFreq = this.transposeFrequency(rootFreq, BASS_INTERVALS.OCTAVE);
                        notes.push(this.createBassNote(octaveFreq, startTime, beatDuration, velocity));
                    } else {
                        const fifthFreq = this.transposeFrequency(rootFreq, BASS_INTERVALS.PERFECT_FIFTH);
                        notes.push(this.createBassNote(fifthFreq, startTime, beatDuration, velocity));
                    }
                    break;
                    
                case BassPattern.WALKING:
                    const walkingInterval = this.getWalkingInterval(beat);
                    const walkingFreq = this.transposeFrequency(rootFreq, walkingInterval);
                    notes.push(this.createBassNote(walkingFreq, startTime, beatDuration, velocity));
                    break;
                    
                case BassPattern.SYNCOPATED:
                    if (this.isSyncopatedBeat(beat)) {
                        const syncoFreq = beat % 2 === 0 ? rootFreq : 
                            this.transposeFrequency(rootFreq, BASS_INTERVALS.PERFECT_FIFTH);
                        notes.push(this.createBassNote(syncoFreq, startTime, beatDuration * 0.75, velocity));
                    }
                    break;
                    
                case BassPattern.DRONE:
                    // Long sustained drone note
                    if (beat === 0) {
                        const droneLength = beatDuration * this.getPatternLength(intensity);
                        notes.push(this.createBassNote(rootFreq, startTime, droneLength, velocity * 0.8));
                        
                        // Add harmonic drone
                        const harmonicFreq = this.transposeFrequency(rootFreq, BASS_INTERVALS.PERFECT_FIFTH);
                        notes.push(this.createBassNote(harmonicFreq, startTime, droneLength, velocity * 0.5));
                    }
                    break;
                    
                default:
                    notes.push(this.createBassNote(rootFreq, startTime, beatDuration, velocity));
                    break;
            }
            
        } catch (error) {
            console.error(`Error generating bass notes for beat ${beat}:`, error);
            // Fallback to simple root note
            notes.push(this.createBassNote(rootFreq, startTime, beatDuration, velocity));
        }
        
        return notes;
    }

    /**
     * Create a bass note with bass-specific oscillator configuration
     * @param frequency Base frequency in Hz
     * @param startTime Note start time
     * @param duration Note duration
     * @param velocity Note velocity (0.0 - 1.0)
     * @returns Configured bass note
     */
    private createBassNote(
        frequency: number, 
        startTime: number, 
        duration: number, 
        velocity: number
    ): Note {
        // Ensure frequency is in bass range
        const bassFreq = this.constrainToBassRange(frequency);
        
        // Create bass-specific envelope with slight variations
        const envelope: Envelope = {
            ...this.defaultEnvelope,
            attack: this.defaultEnvelope.attack + (Math.random() * 0.01), // Slight variation
            release: this.defaultEnvelope.release + (Math.random() * 0.1)
        };
        
        // Configure oscillators for rich bass sound
        const oscillatorConfig: Partial<OscillatorConfig> = {
            type: 'sawtooth',
            frequency: 440, // Will be scaled by note frequency
            volume: velocity,
            detune: this.bassConfig.detuneAmount * (Math.random() * 0.5 + 0.75) // Slight random detune
        };
        
        return {
            frequency: bassFreq,
            startTime,
            duration: Math.max(0.1, duration), // Minimum note duration
            velocity: Math.max(0.1, Math.min(1.0, velocity)),
            envelope,
            oscillator: oscillatorConfig
        };
    }

    /**
     * Select bass pattern based on intensity level
     * @param intensity Current intensity (0.0 - 1.0)
     * @returns Appropriate bass pattern
     */
    private selectPatternByIntensity(intensity: number): BassPattern {
        const patterns = this.bassConfig.patternComplexity;
        const patternIndex = Math.floor(intensity * patterns.length);
        const clampedIndex = Math.max(0, Math.min(patterns.length - 1, patternIndex));
        
        return patterns[clampedIndex];
    }

    /**
     * Get pattern for specific music state
     * @param state Music state
     * @param intensity Current intensity
     * @returns Appropriate bass pattern
     */
    private getPatternForState(state: MusicState, intensity: number): BassPattern {
        switch (state) {
            case MusicState.IDLE:
                return intensity > 0.3 ? BassPattern.ROOT_ONLY : BassPattern.DRONE;
                
            case MusicState.BUILDING:
                return intensity > 0.7 ? BassPattern.ROOT_FIFTH : BassPattern.ROOT_ONLY;
                
            case MusicState.INTENSE:
                return intensity > 0.8 ? BassPattern.SYNCOPATED : BassPattern.ROOT_FIFTH_OCTAVE;
                
            case MusicState.VICTORY:
                return BassPattern.WALKING;
                
            case MusicState.DEFEAT:
                return BassPattern.DRONE;
                
            default:
                return BassPattern.ROOT_ONLY;
        }
    }

    /**
     * Calculate velocity for bass note based on beat position and intensity
     * @param beat Beat number in pattern
     * @param intensity Current intensity level
     * @returns Velocity value (0.0 - 1.0)
     */
    private calculateVelocity(beat: number, intensity: number): number {
        const baseVelocity = 0.6 + (intensity * 0.4); // 0.6 to 1.0 range
        
        // Add rhythmic emphasis on strong beats
        let emphasis = 1.0;
        if (beat % 4 === 0) {
            emphasis = 1.2; // Strong beat emphasis
        } else if (beat % 2 === 0) {
            emphasis = 1.1; // Moderate beat emphasis
        }
        
        // Apply slight randomization for humanization
        const randomization = 0.95 + (Math.random() * 0.1); // ±5% variation
        
        return Math.max(0.1, Math.min(1.0, baseVelocity * emphasis * randomization));
    }

    /**
     * Transpose frequency by semitone interval
     * @param baseFreq Base frequency in Hz
     * @param semitones Number of semitones to transpose
     * @returns Transposed frequency
     */
    private transposeFrequency(baseFreq: number, semitones: number): number {
        return baseFreq * Math.pow(2, semitones / 12);
    }

    /**
     * Constrain frequency to appropriate bass range
     * @param frequency Input frequency
     * @returns Frequency within bass range
     */
    private constrainToBassRange(frequency: number): number {
        const { min, max } = BASS_FREQUENCIES.LOW_BASS;
        
        if (frequency < min) {
            // Transpose up by octaves until in range
            while (frequency < min) {
                frequency *= 2;
            }
        } else if (frequency > max) {
            // Transpose down by octaves until in range
            while (frequency > max) {
                frequency /= 2;
            }
        }
        
        return frequency;
    }

    /**
     * Get walking bass interval for specific beat
     * @param beat Beat number
     * @returns Interval in semitones
     */
    private getWalkingInterval(beat: number): number {
        // Wizard-themed walking bass pattern
        const walkingPattern = [
            BASS_INTERVALS.UNISON,        // Root
            BASS_INTERVALS.MINOR_THIRD,   // Minor third (dark harmony)
            BASS_INTERVALS.PERFECT_FIFTH, // Fifth
            BASS_INTERVALS.PERFECT_FOURTH // Fourth (tension)
        ];
        
        return walkingPattern[beat % walkingPattern.length];
    }

    /**
     * Check if beat should have syncopated bass note
     * @param beat Beat number
     * @returns Whether beat is syncopated
     */
    private isSyncopatedBeat(beat: number): boolean {
        // Syncopated pattern: emphasize off-beats and weak beats
        const syncoPattern = [true, false, true, true, false, true, false, true];
        return syncoPattern[beat % syncoPattern.length];
    }

    /**
     * Get pattern length in beats based on intensity
     * @param intensity Current intensity level
     * @returns Pattern length in beats
     */
    private getPatternLength(intensity: number): number {
        // More complex patterns for higher intensity
        if (intensity > 0.8) return 8;  // Complex 8-beat patterns
        if (intensity > 0.5) return 4;  // Standard 4-beat patterns
        return 2;                       // Simple 2-beat patterns
    }

    /**
     * Get beat duration in seconds
     * @returns Duration of one beat
     */
    private getBeatDuration(): number {
        // Default to 120 BPM = 0.5 seconds per beat
        // This can be integrated with TempoController if available
        return 0.5;
    }

    /**
     * Cache common note durations for performance optimization
     */
    private cacheNoteDurations(): void {
        const commonDurations = [0.25, 0.5, 1.0, 1.5, 2.0];
        
        for (const duration of commonDurations) {
            this.noteDurationCache.set(duration.toString(), duration);
        }
    }

    /**
     * Update bass configuration
     * @param newConfig Partial bass configuration to merge
     */
    public updateBassConfig(newConfig: Partial<BassConfig>): void {
        const oldConfig = { ...this.bassConfig };
        this.bassConfig = { ...this.bassConfig, ...newConfig };
        
        // Validate configuration values
        this.bassConfig.rootFrequency = Math.max(20, Math.min(200, this.bassConfig.rootFrequency));
        this.bassConfig.detuneAmount = Math.max(0, Math.min(50, this.bassConfig.detuneAmount));
        this.bassConfig.subBassRatio = Math.max(0.25, Math.min(1.0, this.bassConfig.subBassRatio));
        
        console.log(`🎵 BassLayer configuration updated:`, {
            oldRoot: oldConfig.rootFrequency,
            newRoot: this.bassConfig.rootFrequency,
            detune: this.bassConfig.detuneAmount
        });
    }

    /**
     * Get current bass configuration
     * @returns Current bass configuration
     */
    public getBassConfig(): BassConfig {
        return { ...this.bassConfig };
    }

    /**
     * Get current bass pattern information
     * @returns Current pattern and beat information
     */
    public getPatternInfo(): { pattern: BassPattern; beat: number; length: number } {
        return {
            pattern: this.currentPattern,
            beat: this.beatCounter,
            length: this.patternLength
        };
    }

    /**
     * Force pattern change (useful for testing or special effects)
     * @param pattern New bass pattern to use
     */
    public setPattern(pattern: BassPattern): void {
        if (Object.values(BassPattern).includes(pattern)) {
            this.currentPattern = pattern;
            this.beatCounter = 0; // Reset beat counter
            
            console.log(`🎵 BassLayer pattern changed to: ${pattern}`);
            
            // Regenerate notes if currently playing
            if (this.isPlaying) {
                this.scheduledNotes = this.generateNotes(0.5); // Use medium intensity
            }
        } else {
            console.warn(`Invalid bass pattern: ${pattern}`);
        }
    }

    /**
     * Get performance metrics specific to bass layer
     */
    public getBassPerformanceMetrics(): any {
        const baseMetrics = this.getPerformanceMetrics();
        
        return {
            ...baseMetrics,
            currentPattern: this.currentPattern,
            patternLength: this.patternLength,
            beatCounter: this.beatCounter,
            rootFrequency: this.bassConfig.rootFrequency,
            activeOscillatorTypes: this.defaultOscillators.map(osc => osc.type),
            noteCacheSize: this.noteDurationCache.size
        };
    }
}