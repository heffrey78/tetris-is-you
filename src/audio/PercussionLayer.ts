/**
 * PercussionLayer - Rhythmic elements layer for Tetris Is You
 * 
 * Provides rhythmic percussion elements that enhance the intensity
 * and drive of the music during active gameplay states.
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
 * PercussionLayer class providing rhythmic elements
 */
export class PercussionLayer extends BaseMusicLayer {
    constructor(audioContext: AudioContext) {
        super(
            'percussion-layer',
            LayerType.PERCUSSION,
            [MusicState.INTENSE, MusicState.BUILDING],
            0.7, // Base volume - percussion should be punchy
            audioContext
        );
        
        // Configure percussion-specific oscillators for drum-like sounds
        this.defaultOscillators = [
            { type: 'square', frequency: 440, volume: 0.8 }, // Sharp attack for snare-like sounds
            { type: 'triangle', frequency: 220, volume: 0.6 }, // Mid-range rhythmic elements
            { type: 'sawtooth', frequency: 110, volume: 0.4 } // Low-end kick-like sounds
        ];
        
        // Percussion-specific envelope for sharp, percussive attacks
        this.defaultEnvelope = {
            attack: 0.01,
            decay: 0.1,
            sustain: 0.2,
            release: 0.2
        };
    }

    /**
     * Initialize percussion-specific layer setup
     */
    protected initializeLayer(): void {
        console.log('🎵 PercussionLayer initialized');
    }

    /**
     * Generate percussion notes based on current intensity
     * @param intensity Intensity level (0.0 - 1.0)
     * @returns Array of percussion notes to schedule
     */
    protected generateNotes(intensity: number): Note[] {
        const notes: Note[] = [];
        const beatDuration = 0.5; // 120 BPM quarter notes
        const patternLength = 8; // 8-beat pattern
        
        // Simple kick and snare pattern
        for (let beat = 0; beat < patternLength; beat++) {
            const startTime = beat * beatDuration;
            
            // Kick on beats 1 and 5
            if (beat % 4 === 0) {
                notes.push({
                    frequency: 60, // Low kick frequency
                    startTime,
                    duration: 0.2,
                    velocity: 0.8 + intensity * 0.2,
                    envelope: {
                        attack: 0.01,
                        decay: 0.05,
                        sustain: 0.1,
                        release: 0.14
                    }
                });
            }
            
            // Snare on beats 3 and 7 (higher intensity)
            if (beat % 4 === 2 && intensity > 0.3) {
                notes.push({
                    frequency: 200, // Snare-like frequency
                    startTime,
                    duration: 0.1,
                    velocity: 0.6 + intensity * 0.3,
                    envelope: {
                        attack: 0.01,
                        decay: 0.03,
                        sustain: 0.1,
                        release: 0.06
                    }
                });
            }
            
            // Hi-hat pattern (higher intensity)
            if (intensity > 0.6 && beat % 2 === 1) {
                notes.push({
                    frequency: 8000, // High frequency for hi-hat
                    startTime,
                    duration: 0.05,
                    velocity: 0.3 + intensity * 0.2,
                    envelope: {
                        attack: 0.001,
                        decay: 0.01,
                        sustain: 0.05,
                        release: 0.039
                    }
                });
            }
        }
        
        return notes;
    }
}