/**
 * HarmonyLayer - Harmonic accompaniment layer for Tetris Is You
 * 
 * Provides rich harmonic content that complements the melody layer
 * with chord progressions and harmonic textures appropriate for
 * the wizard theme of the game.
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
 * HarmonyLayer class providing harmonic accompaniment
 */
export class HarmonyLayer extends BaseMusicLayer {
    constructor(audioContext: AudioContext) {
        super(
            'harmony-layer',
            LayerType.HARMONY,
            [MusicState.BUILDING, MusicState.INTENSE, MusicState.VICTORY],
            0.6, // Base volume - harmony should be supportive
            audioContext
        );
        
        // Configure harmony-specific oscillators
        this.defaultOscillators = [
            { type: 'triangle', frequency: 440, volume: 0.6 }, // Warm harmonic base
            { type: 'sine', frequency: 440, detune: 4, volume: 0.4 }, // Slight detuning for richness
            { type: 'triangle', frequency: 220, volume: 0.3 } // Lower harmonic support
        ];
        
        // Harmony-specific envelope for smooth chord changes
        this.defaultEnvelope = {
            attack: 0.1,
            decay: 0.3,
            sustain: 0.7,
            release: 0.6
        };
    }

    /**
     * Initialize harmony-specific layer setup
     */
    protected initializeLayer(): void {
        console.log('🎵 HarmonyLayer initialized');
    }

    /**
     * Generate harmony notes based on current intensity
     * @param intensity Intensity level (0.0 - 1.0)
     * @returns Array of harmony notes to schedule
     */
    protected generateNotes(intensity: number): Note[] {
        const notes: Note[] = [];
        const baseFrequency = 220; // A3
        const chordDuration = 4.0;
        
        // Simple chord progression for wizard theme
        const chordProgression = [
            [1.0, 1.2, 1.5],     // A minor (A, C, E)
            [1.125, 1.35, 1.6875], // B diminished (B, D, F)
            [1.0, 1.2, 1.5],     // A minor return
            [0.75, 0.9, 1.125]   // G major (G, B, D)
        ];
        
        for (let chordIndex = 0; chordIndex < chordProgression.length; chordIndex++) {
            const chord = chordProgression[chordIndex];
            const startTime = chordIndex * chordDuration;
            
            for (let noteIndex = 0; noteIndex < chord.length; noteIndex++) {
                const frequency = baseFrequency * chord[noteIndex];
                const velocity = 0.4 + intensity * 0.3;
                
                notes.push({
                    frequency,
                    startTime: startTime + noteIndex * 0.05, // Slight chord stagger
                    duration: chordDuration * 0.9,
                    velocity,
                    envelope: this.defaultEnvelope
                });
            }
        }
        
        return notes;
    }
}