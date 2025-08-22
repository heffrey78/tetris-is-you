/**
 * MelodyLayer - Lead musical theme implementation for Tetris Is You
 * 
 * Extends BaseMusicLayer to provide rich, dynamic melodic content that adapts
 * to different game states with variation systems to avoid repetition.
 * Features multiple melody themes based on the existing wizard soundtrack,
 * using triangle and sine oscillators for clear, mystical tones.
 * 
 * Key Features:
 * - State-specific melody themes for each MusicState
 * - Advanced variation system with phrase substitution and ornamentation
 * - Mid-frequency range optimization (200-800 Hz)
 * - Harmonic interval support and musical progressions
 * - Ominous/mystical character consistent with existing music
 * - Triangle/sine wave synthesis for clear melodic tones
 * 
 * @example
 * ```typescript
 * // Create and initialize melody layer
 * const melodyLayer = new MelodyLayer(audioContext);
 * melodyLayer.updateForState(MusicState.BUILDING, 0.7);
 * await melodyLayer.play(1000); // 1 second fade-in
 * 
 * // The layer will automatically generate appropriate melodies
 * // and handle variation to prevent repetitive patterns
 * ```
 */

import { 
    BaseMusicLayer, 
    Note, 
    Envelope, 
    OscillatorConfig 
} from './BaseMusicLayer.js';
import { 
    LayerType, 
    MusicState 
} from '../types/MusicTypes.js';

/**
 * Musical scale definitions for generating coherent melodies
 */
interface Scale {
    /** Scale name for identification */
    name: string;
    /** Root frequency in Hz */
    root: number;
    /** Interval ratios from root note */
    intervals: number[];
    /** Character description */
    character: string;
}

/**
 * Melody phrase configuration for musical structure
 */
interface MelodyPhrase {
    /** Unique identifier for this phrase */
    id: string;
    /** Array of note configurations */
    notes: Array<{
        /** Scale degree (0-based index) */
        scaleDegree: number;
        /** Start time in seconds */
        startTime: number;
        /** Duration in seconds */
        duration: number;
        /** Note velocity (0.0 - 1.0) */
        velocity: number;
        /** Optional envelope override */
        envelope?: Partial<Envelope>;
    }>;
    /** Total phrase duration */
    duration: number;
    /** Minimum intensity required to play this phrase */
    minIntensity: number;
    /** Musical character tags */
    tags: string[];
}

/**
 * Variation technique configuration
 */
interface VariationTechnique {
    /** Technique name */
    name: string;
    /** Probability of application (0.0 - 1.0) */
    probability: number;
    /** Function to apply the variation */
    apply: (phrase: MelodyPhrase, scale: Scale) => MelodyPhrase;
}

/**
 * MelodyLayer - Primary melodic content layer
 * 
 * Provides dynamic, state-aware melodies with sophisticated variation
 * systems to maintain musical interest throughout gameplay.
 */
export class MelodyLayer extends BaseMusicLayer {
    /** Current musical scale being used */
    private currentScale: Scale;
    
    /** Available melody phrases organized by music state */
    private melodyPhrases: Map<MusicState, MelodyPhrase[]> = new Map();
    
    /** Variation techniques for melodic development */
    private variationTechniques: VariationTechnique[] = [];
    
    /** Phrase history for intelligent variation selection */
    private phraseHistory: string[] = [];
    
    /** Maximum phrase history size */
    private readonly maxHistorySize = 8;
    
    /** Current intensity level for dynamic adaptation */
    private currentIntensity: number = 0.5;
    
    /** Loop duration in seconds */
    private readonly loopDuration = 16;
    
    /** Musical scales available for different moods */
    private readonly scales: { [key: string]: Scale } = {
        // Natural minor scale - dark and ominous
        darkMinor: {
            name: 'Dark Minor',
            root: 220, // A3
            intervals: [1, 1.125, 1.2, 1.35, 1.5, 1.6, 1.8, 2.0], // A B C D E F G A
            character: 'dark, ominous, mysterious'
        },
        
        // Harmonic minor - exotic and mystical  
        mysticalMinor: {
            name: 'Mystical Minor',
            root: 220, // A3
            intervals: [1, 1.125, 1.2, 1.35, 1.5, 1.6, 1.875, 2.0], // A B C D E F G# A
            character: 'mystical, exotic, wizard-like'
        },
        
        // Dorian mode - haunting but hopeful
        hopefulDorian: {
            name: 'Hopeful Dorian',
            root: 246.94, // B3
            intervals: [1, 1.125, 1.2667, 1.333, 1.5, 1.6875, 1.778, 2.0], // B C# D E F# G# A B
            character: 'haunting yet hopeful, bittersweet'
        },
        
        // Pentatonic scale - simple and flowing
        flowingPentatonic: {
            name: 'Flowing Pentatonic',
            root: 220, // A3
            intervals: [1, 1.125, 1.35, 1.5, 1.6875, 2.0], // A B D E G A
            character: 'flowing, simple, meditative'
        }
    };

    constructor(audioContext: AudioContext) {
        super(
            'melody-layer',
            LayerType.MELODY,
            [MusicState.BUILDING, MusicState.INTENSE, MusicState.VICTORY, MusicState.DEFEAT],
            0.8, // Base volume - melody should be prominent
            audioContext
        );
        
        // Initialize with dark minor scale for default ominous character
        this.currentScale = this.scales.darkMinor;
        
        // Override default oscillators for clear melodic tones
        this.defaultOscillators = [
            { type: 'triangle', frequency: 440, volume: 0.7 }, // Primary melodic voice
            { type: 'sine', frequency: 440, detune: 5, volume: 0.3 }, // Subtle detuning for richness
            { type: 'sine', frequency: 880, volume: 0.15 } // Octave harmonic for brightness
        ];
        
        // Softer envelope for legato melodic phrases
        this.defaultEnvelope = {
            attack: 0.08,
            decay: 0.15,
            sustain: 0.7,
            release: 0.4
        };
    }

    /**
     * Initialize layer-specific setup
     */
    protected initializeLayer(): void {
        this.initializeMelodyPhrases();
        this.initializeVariationTechniques();
        console.log('🎼 MelodyLayer initialized with mystical themes');
    }

    /**
     * Initialize melody phrases for each music state
     */
    private initializeMelodyPhrases(): void {
        // IDLE state - sparse, ambient melodies
        this.melodyPhrases.set(MusicState.IDLE, [
            {
                id: 'idle-whisper',
                notes: [
                    { scaleDegree: 0, startTime: 0, duration: 3, velocity: 0.4 },
                    { scaleDegree: 2, startTime: 4, duration: 2, velocity: 0.3 },
                    { scaleDegree: 1, startTime: 7, duration: 4, velocity: 0.35 }
                ],
                duration: 12,
                minIntensity: 0,
                tags: ['sparse', 'ambient', 'whisper']
            },
            {
                id: 'idle-drift',
                notes: [
                    { scaleDegree: 4, startTime: 0, duration: 2, velocity: 0.3 },
                    { scaleDegree: 2, startTime: 3, duration: 3, velocity: 0.35 },
                    { scaleDegree: 0, startTime: 8, duration: 4, velocity: 0.4 }
                ],
                duration: 14,
                minIntensity: 0,
                tags: ['drifting', 'peaceful', 'minimal']
            }
        ]);

        // BUILDING state - developing themes with moderate complexity
        this.melodyPhrases.set(MusicState.BUILDING, [
            {
                id: 'building-ascent',
                notes: [
                    { scaleDegree: 0, startTime: 0, duration: 1.5, velocity: 0.6 },
                    { scaleDegree: 1, startTime: 1.5, duration: 1, velocity: 0.65 },
                    { scaleDegree: 2, startTime: 2.5, duration: 1, velocity: 0.7 },
                    { scaleDegree: 4, startTime: 3.5, duration: 2, velocity: 0.75 },
                    { scaleDegree: 3, startTime: 6, duration: 1, velocity: 0.65 },
                    { scaleDegree: 2, startTime: 7, duration: 2, velocity: 0.6 }
                ],
                duration: 10,
                minIntensity: 0.3,
                tags: ['ascending', 'building', 'hopeful']
            },
            {
                id: 'building-wizard-call',
                notes: [
                    { scaleDegree: 7, startTime: 0, duration: 1.5, velocity: 0.7 }, // High A (octave)
                    { scaleDegree: 1, startTime: 1.5, duration: 1, velocity: 0.65 }, // B
                    { scaleDegree: 2, startTime: 2.5, duration: 1, velocity: 0.6 }, // C
                    { scaleDegree: 6, startTime: 4, duration: 1.5, velocity: 0.55 }, // G
                    { scaleDegree: 0, startTime: 6, duration: 3, velocity: 0.5 } // A resolution
                ],
                duration: 10,
                minIntensity: 0.4,
                tags: ['mystical', 'wizard', 'calling']
            }
        ]);

        // INTENSE state - complex, urgent melodic patterns
        this.melodyPhrases.set(MusicState.INTENSE, [
            {
                id: 'intense-storm',
                notes: [
                    { scaleDegree: 7, startTime: 0, duration: 0.75, velocity: 0.9 },
                    { scaleDegree: 6, startTime: 0.75, duration: 0.5, velocity: 0.85 },
                    { scaleDegree: 5, startTime: 1.25, duration: 0.75, velocity: 0.8 },
                    { scaleDegree: 4, startTime: 2, duration: 1, velocity: 0.85 },
                    { scaleDegree: 3, startTime: 3.5, duration: 0.75, velocity: 0.8 },
                    { scaleDegree: 2, startTime: 4.25, duration: 0.5, velocity: 0.75 },
                    { scaleDegree: 1, startTime: 4.75, duration: 1.25, velocity: 0.8 },
                    { scaleDegree: 0, startTime: 6, duration: 2, velocity: 0.7 }
                ],
                duration: 8,
                minIntensity: 0.7,
                tags: ['descending', 'urgent', 'storm']
            },
            {
                id: 'intense-lightning',
                notes: [
                    { scaleDegree: 0, startTime: 0, duration: 0.5, velocity: 0.8 },
                    { scaleDegree: 4, startTime: 0.5, duration: 0.5, velocity: 0.9 },
                    { scaleDegree: 7, startTime: 1, duration: 0.75, velocity: 1.0 },
                    { scaleDegree: 5, startTime: 2, duration: 0.5, velocity: 0.85 },
                    { scaleDegree: 2, startTime: 2.5, duration: 1, velocity: 0.75 },
                    { scaleDegree: 1, startTime: 4, duration: 0.5, velocity: 0.7 },
                    { scaleDegree: 0, startTime: 4.5, duration: 1.5, velocity: 0.6 }
                ],
                duration: 6,
                minIntensity: 0.8,
                tags: ['jagged', 'lightning', 'powerful']
            }
        ]);

        // VICTORY state - triumphant, soaring melodies
        this.melodyPhrases.set(MusicState.VICTORY, [
            {
                id: 'victory-soar',
                notes: [
                    { scaleDegree: 0, startTime: 0, duration: 1, velocity: 0.8 },
                    { scaleDegree: 2, startTime: 1, duration: 1, velocity: 0.85 },
                    { scaleDegree: 4, startTime: 2, duration: 1.5, velocity: 0.9 },
                    { scaleDegree: 7, startTime: 3.5, duration: 2, velocity: 0.95 },
                    { scaleDegree: 5, startTime: 6, duration: 1.5, velocity: 0.8 },
                    { scaleDegree: 7, startTime: 8, duration: 3, velocity: 0.9 }
                ],
                duration: 12,
                minIntensity: 0.5,
                tags: ['triumphant', 'soaring', 'victory']
            },
            {
                id: 'victory-cascade',
                notes: [
                    { scaleDegree: 7, startTime: 0, duration: 1, velocity: 0.9 },
                    { scaleDegree: 5, startTime: 1.5, duration: 1, velocity: 0.85 },
                    { scaleDegree: 4, startTime: 2.5, duration: 1, velocity: 0.8 },
                    { scaleDegree: 2, startTime: 3.5, duration: 1.5, velocity: 0.75 },
                    { scaleDegree: 0, startTime: 5, duration: 2, velocity: 0.8 },
                    { scaleDegree: 4, startTime: 8, duration: 2, velocity: 0.85 }
                ],
                duration: 11,
                minIntensity: 0.4,
                tags: ['cascading', 'celebration', 'joyful']
            }
        ]);

        // DEFEAT state - somber, descending melodies
        this.melodyPhrases.set(MusicState.DEFEAT, [
            {
                id: 'defeat-lament',
                notes: [
                    { scaleDegree: 4, startTime: 0, duration: 3, velocity: 0.5 },
                    { scaleDegree: 3, startTime: 3, duration: 2, velocity: 0.45 },
                    { scaleDegree: 2, startTime: 5, duration: 2, velocity: 0.4 },
                    { scaleDegree: 1, startTime: 7, duration: 3, velocity: 0.35 },
                    { scaleDegree: 0, startTime: 10, duration: 4, velocity: 0.3 }
                ],
                duration: 15,
                minIntensity: 0,
                tags: ['descending', 'somber', 'lament']
            },
            {
                id: 'defeat-fade',
                notes: [
                    { scaleDegree: 2, startTime: 0, duration: 4, velocity: 0.4 },
                    { scaleDegree: 0, startTime: 4, duration: 5, velocity: 0.35 },
                    { scaleDegree: 1, startTime: 10, duration: 2, velocity: 0.2 },
                    { scaleDegree: 0, startTime: 12, duration: 6, velocity: 0.15 }
                ],
                duration: 18,
                minIntensity: 0,
                tags: ['fading', 'peaceful', 'resignation']
            }
        ]);
    }

    /**
     * Initialize variation techniques for melodic development
     */
    private initializeVariationTechniques(): void {
        // Rhythmic displacement - shift note timings
        this.variationTechniques.push({
            name: 'rhythmic-displacement',
            probability: 0.3,
            apply: (phrase: MelodyPhrase, scale: Scale): MelodyPhrase => {
                const variation = { ...phrase };
                const displacement = Math.random() * 0.5 - 0.25; // ±0.25 seconds
                
                variation.id = phrase.id + '-displaced';
                variation.notes = phrase.notes.map(note => ({
                    ...note,
                    startTime: Math.max(0, note.startTime + displacement)
                }));
                
                return variation;
            }
        });

        // Octave transposition - move melody up or down an octave
        this.variationTechniques.push({
            name: 'octave-transposition',
            probability: 0.25,
            apply: (phrase: MelodyPhrase, scale: Scale): MelodyPhrase => {
                const variation = { ...phrase };
                const octaveShift = Math.random() > 0.5 ? 7 : -7; // Up or down an octave
                
                variation.id = phrase.id + '-transposed';
                variation.notes = phrase.notes.map(note => ({
                    ...note,
                    scaleDegree: Math.max(0, Math.min(7, note.scaleDegree + octaveShift))
                }));
                
                return variation;
            }
        });

        // Velocity variation - adjust note intensities
        this.variationTechniques.push({
            name: 'velocity-variation',
            probability: 0.4,
            apply: (phrase: MelodyPhrase, scale: Scale): MelodyPhrase => {
                const variation = { ...phrase };
                const velocityMultiplier = 0.8 + Math.random() * 0.4; // 0.8 to 1.2
                
                variation.id = phrase.id + '-velocity-varied';
                variation.notes = phrase.notes.map(note => ({
                    ...note,
                    velocity: Math.max(0.1, Math.min(1.0, note.velocity * velocityMultiplier))
                }));
                
                return variation;
            }
        });

        // Note ornamentation - add grace notes and embellishments
        this.variationTechniques.push({
            name: 'ornamentation',
            probability: 0.2,
            apply: (phrase: MelodyPhrase, scale: Scale): MelodyPhrase => {
                const variation = { ...phrase };
                variation.id = phrase.id + '-ornamented';
                variation.notes = [...phrase.notes];
                
                // Add grace notes before longer notes
                const longNotes = phrase.notes.filter(note => note.duration > 1.5);
                for (const longNote of longNotes) {
                    if (Math.random() < 0.5) {
                        const graceNote = {
                            scaleDegree: (longNote.scaleDegree + 1) % 7,
                            startTime: Math.max(0, longNote.startTime - 0.15),
                            duration: 0.1,
                            velocity: longNote.velocity * 0.6
                        };
                        variation.notes.push(graceNote);
                    }
                }
                
                // Sort notes by start time
                variation.notes.sort((a, b) => a.startTime - b.startTime);
                return variation;
            }
        });

        // Phrase inversion - flip melodic contour
        this.variationTechniques.push({
            name: 'phrase-inversion',
            probability: 0.15,
            apply: (phrase: MelodyPhrase, scale: Scale): MelodyPhrase => {
                const variation = { ...phrase };
                variation.id = phrase.id + '-inverted';
                
                // Find the center point of the phrase's range
                const scaleDegrees = phrase.notes.map(n => n.scaleDegree);
                const minDegree = Math.min(...scaleDegrees);
                const maxDegree = Math.max(...scaleDegrees);
                const center = (minDegree + maxDegree) / 2;
                
                variation.notes = phrase.notes.map(note => ({
                    ...note,
                    scaleDegree: Math.round(center * 2 - note.scaleDegree)
                }));
                
                return variation;
            }
        });
    }

    /**
     * Generate notes based on current music state and intensity
     */
    protected generateNotes(intensity: number): Note[] {
        this.currentIntensity = intensity;
        
        // Select appropriate scale based on intensity and current state
        this.selectScaleForState(intensity);
        
        // Get available phrases for current states
        const availablePhrases = this.getAvailablePhrasesForActiveStates(intensity);
        
        if (availablePhrases.length === 0) {
            return []; // No suitable phrases for current state/intensity
        }
        
        // Select phrase with variation to avoid repetition
        const selectedPhrase = this.selectPhraseWithVariation(availablePhrases);
        
        // Convert phrase to actual notes using current scale
        const notes = this.convertPhraseToNotes(selectedPhrase);
        
        // Update phrase history
        this.updatePhraseHistory(selectedPhrase.id);
        
        console.log(`🎼 Generated melody phrase '${selectedPhrase.id}' with ${notes.length} notes`);
        return notes;
    }

    /**
     * Select appropriate musical scale based on game state and intensity
     */
    private selectScaleForState(intensity: number): void {
        // Determine which states we're currently active in
        const activeInThisUpdate = this.activeStates;
        
        // Select scale based on predominant state and intensity
        if (activeInThisUpdate.includes(MusicState.VICTORY)) {
            this.currentScale = intensity > 0.7 ? this.scales.hopefulDorian : this.scales.flowingPentatonic;
        } else if (activeInThisUpdate.includes(MusicState.DEFEAT)) {
            this.currentScale = this.scales.darkMinor;
        } else if (activeInThisUpdate.includes(MusicState.INTENSE)) {
            this.currentScale = intensity > 0.8 ? this.scales.mysticalMinor : this.scales.darkMinor;
        } else if (activeInThisUpdate.includes(MusicState.BUILDING)) {
            this.currentScale = intensity > 0.6 ? this.scales.mysticalMinor : this.scales.darkMinor;
        } else {
            // Default to dark minor for ominous character
            this.currentScale = this.scales.darkMinor;
        }
    }

    /**
     * Get available phrases that match current active states and intensity
     */
    private getAvailablePhrasesForActiveStates(intensity: number): MelodyPhrase[] {
        const availablePhrases: MelodyPhrase[] = [];
        
        for (const state of this.activeStates) {
            const statePhrases = this.melodyPhrases.get(state) || [];
            const suitablePhrases = statePhrases.filter(phrase => 
                phrase.minIntensity <= intensity
            );
            availablePhrases.push(...suitablePhrases);
        }
        
        return availablePhrases;
    }

    /**
     * Select a phrase with intelligent variation to avoid repetition
     */
    private selectPhraseWithVariation(availablePhrases: MelodyPhrase[]): MelodyPhrase {
        // Filter out recently used phrases
        const recentlyUsed = this.phraseHistory.slice(-4); // Last 4 phrases
        const freshPhrases = availablePhrases.filter(phrase => 
            !recentlyUsed.includes(phrase.id)
        );
        
        // Use fresh phrases if available, otherwise fall back to all available
        const candidatePhrases = freshPhrases.length > 0 ? freshPhrases : availablePhrases;
        
        // Select random phrase
        let selectedPhrase = candidatePhrases[Math.floor(Math.random() * candidatePhrases.length)];
        
        // Apply variation techniques with probability
        for (const technique of this.variationTechniques) {
            if (Math.random() < technique.probability) {
                try {
                    selectedPhrase = technique.apply(selectedPhrase, this.currentScale);
                } catch (error) {
                    console.warn(`Failed to apply variation technique '${technique.name}':`, error);
                }
            }
        }
        
        return selectedPhrase;
    }

    /**
     * Convert a melody phrase to actual Note objects using current scale
     */
    private convertPhraseToNotes(phrase: MelodyPhrase): Note[] {
        const notes: Note[] = [];
        
        for (const phraseNote of phrase.notes) {
            // Calculate frequency from scale degree
            const scaleIndex = Math.max(0, Math.min(this.currentScale.intervals.length - 1, phraseNote.scaleDegree));
            const frequency = this.currentScale.root * this.currentScale.intervals[scaleIndex];
            
            // Ensure frequency is in our target mid-frequency range (200-800 Hz)
            let adjustedFrequency = frequency;
            while (adjustedFrequency > 800) {
                adjustedFrequency /= 2; // Drop octave
            }
            while (adjustedFrequency < 200) {
                adjustedFrequency *= 2; // Raise octave
            }
            
            // Create note with custom envelope if specified
            const noteEnvelope = phraseNote.envelope ? 
                { ...this.defaultEnvelope, ...phraseNote.envelope } : 
                this.defaultEnvelope;
            
            const note: Note = {
                frequency: adjustedFrequency,
                startTime: phraseNote.startTime,
                duration: phraseNote.duration,
                velocity: phraseNote.velocity * this.currentIntensity, // Scale by intensity
                envelope: noteEnvelope
            };
            
            notes.push(note);
        }
        
        return notes;
    }

    /**
     * Update phrase history for variation tracking
     */
    private updatePhraseHistory(phraseId: string): void {
        this.phraseHistory.push(phraseId);
        
        // Trim history to maximum size
        if (this.phraseHistory.length > this.maxHistorySize) {
            this.phraseHistory = this.phraseHistory.slice(-this.maxHistorySize);
        }
    }

    /**
     * Get current musical information for debugging/visualization
     */
    public getCurrentMelodyInfo(): {
        scale: string;
        intensity: number;
        recentPhrases: string[];
        activeStates: MusicState[];
    } {
        return {
            scale: this.currentScale.name,
            intensity: this.currentIntensity,
            recentPhrases: [...this.phraseHistory],
            activeStates: [...this.activeStates]
        };
    }

    /**
     * Add a custom melody phrase for extended functionality
     */
    public addCustomPhrase(state: MusicState, phrase: MelodyPhrase): void {
        const statePhrases = this.melodyPhrases.get(state) || [];
        statePhrases.push(phrase);
        this.melodyPhrases.set(state, statePhrases);
        
        console.log(`🎼 Added custom phrase '${phrase.id}' for state ${state}`);
    }

    /**
     * Create a custom scale for unique musical characters
     */
    public addCustomScale(name: string, scale: Scale): void {
        this.scales[name] = scale;
        console.log(`🎼 Added custom scale '${scale.name}' with character: ${scale.character}`);
    }
}