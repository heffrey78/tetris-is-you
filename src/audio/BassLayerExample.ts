/**
 * Example implementation showing how to use BassLayer in Tetris Is You
 * Demonstrates integration with the audio system and different usage patterns
 */

import { BassLayer, BassPattern } from './BassLayer.js';
import { MusicState } from '../types/MusicTypes.js';

/**
 * Example class showing BassLayer integration
 */
export class BassLayerExample {
    private audioContext: AudioContext | null = null;
    private bassLayer: BassLayer | null = null;
    private isInitialized: boolean = false;

    constructor() {
        console.log('🎵 BassLayerExample initialized');
    }

    /**
     * Initialize the audio context and bass layer
     */
    public async initialize(): Promise<void> {
        try {
            // Create audio context
            this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
            
            // Resume if suspended (required for user interaction)
            if (this.audioContext.state === 'suspended') {
                await this.audioContext.resume();
            }

            // Create bass layer for wizard-themed gameplay
            this.bassLayer = new BassLayer(
                'wizard_bass', // Layer ID
                [MusicState.BUILDING, MusicState.INTENSE, MusicState.DEFEAT], // Active states
                0.7, // Base volume
                this.audioContext,
                {
                    rootFrequency: 41.2, // Deep E1 for ominous feel
                    patternComplexity: [
                        BassPattern.ROOT_ONLY,
                        BassPattern.ROOT_FIFTH,
                        BassPattern.ROOT_FIFTH_OCTAVE,
                        BassPattern.WALKING,
                        BassPattern.SYNCOPATED
                    ],
                    rhythmSubdivision: 4,
                    enablePitchBend: true,
                    detuneAmount: 15, // Slightly more detune for wizard mystique
                    subBassRatio: 0.5
                }
            );

            this.isInitialized = true;
            console.log('🎵 BassLayerExample initialized successfully');

        } catch (error) {
            console.error('Failed to initialize BassLayerExample:', error);
            throw error;
        }
    }

    /**
     * Start bass playback with fade-in
     */
    public async startBass(fadeInMs: number = 1000): Promise<void> {
        if (!this.isInitialized || !this.bassLayer) {
            throw new Error('BassLayerExample not initialized');
        }

        try {
            await this.bassLayer.play(fadeInMs);
            console.log(`🎵 Bass started with ${fadeInMs}ms fade-in`);
        } catch (error) {
            console.error('Failed to start bass:', error);
            throw error;
        }
    }

    /**
     * Stop bass playback with fade-out
     */
    public async stopBass(fadeOutMs: number = 1000): Promise<void> {
        if (!this.bassLayer) {
            return;
        }

        try {
            await this.bassLayer.stop(fadeOutMs);
            console.log(`🎵 Bass stopped with ${fadeOutMs}ms fade-out`);
        } catch (error) {
            console.error('Failed to stop bass:', error);
            throw error;
        }
    }

    /**
     * Update bass for different game states
     */
    public updateForGameState(state: MusicState, intensity: number): void {
        if (!this.bassLayer) {
            return;
        }

        this.bassLayer.updateForState(state, intensity);
        console.log(`🎵 Bass updated for state: ${state}, intensity: ${intensity.toFixed(2)}`);
    }

    /**
     * Change bass pattern manually
     */
    public changeBassPattern(pattern: BassPattern): void {
        if (!this.bassLayer) {
            return;
        }

        this.bassLayer.setPattern(pattern);
        console.log(`🎵 Bass pattern changed to: ${pattern}`);
    }

    /**
     * Adjust bass volume
     */
    public async setBassVolume(volume: number, transitionMs: number = 500): Promise<void> {
        if (!this.bassLayer) {
            return;
        }

        try {
            await this.bassLayer.setVolume(volume, transitionMs);
            console.log(`🎵 Bass volume set to: ${volume.toFixed(2)}`);
        } catch (error) {
            console.error('Failed to set bass volume:', error);
            throw error;
        }
    }

    /**
     * Get current bass layer performance metrics
     */
    public getBassMetrics(): any {
        if (!this.bassLayer) {
            return null;
        }

        return this.bassLayer.getBassPerformanceMetrics();
    }

    /**
     * Demonstrate different bass patterns for different game scenarios
     */
    public async demonstrateBassPatterns(): Promise<void> {
        if (!this.isInitialized || !this.bassLayer) {
            console.error('Bass layer not initialized');
            return;
        }

        console.log('🎵 Starting bass pattern demonstration...');

        const patterns = [
            { pattern: BassPattern.ROOT_ONLY, duration: 3000, description: 'Simple root note for calm moments' },
            { pattern: BassPattern.ROOT_FIFTH, duration: 3000, description: 'Root and fifth for building tension' },
            { pattern: BassPattern.WALKING, duration: 4000, description: 'Walking bass for dynamic gameplay' },
            { pattern: BassPattern.SYNCOPATED, duration: 4000, description: 'Syncopated pattern for intense moments' },
            { pattern: BassPattern.DRONE, duration: 3000, description: 'Atmospheric drone for ominous scenes' }
        ];

        try {
            await this.startBass(500);

            for (const { pattern, duration, description } of patterns) {
                console.log(`🎵 Playing ${pattern}: ${description}`);
                this.changeBassPattern(pattern);
                await this.sleep(duration);
            }

            await this.stopBass(500);
            console.log('🎵 Bass pattern demonstration complete');

        } catch (error) {
            console.error('Error during bass demonstration:', error);
        }
    }

    /**
     * Simulate game intensity progression
     */
    public async simulateGameIntensity(): Promise<void> {
        if (!this.isInitialized || !this.bassLayer) {
            console.error('Bass layer not initialized');
            return;
        }

        console.log('🎵 Simulating game intensity progression...');

        const scenarios = [
            { state: MusicState.IDLE, intensity: 0.2, duration: 2000, description: 'Game start - calm' },
            { state: MusicState.BUILDING, intensity: 0.4, duration: 3000, description: 'Tension building' },
            { state: MusicState.BUILDING, intensity: 0.7, duration: 3000, description: 'Higher tension' },
            { state: MusicState.INTENSE, intensity: 0.9, duration: 4000, description: 'Peak intensity' },
            { state: MusicState.VICTORY, intensity: 0.6, duration: 3000, description: 'Victory celebration' },
            { state: MusicState.DEFEAT, intensity: 0.3, duration: 3000, description: 'Game over' }
        ];

        try {
            await this.startBass(1000);

            for (const { state, intensity, duration, description } of scenarios) {
                console.log(`🎵 ${description} - State: ${state}, Intensity: ${intensity}`);
                this.updateForGameState(state, intensity);
                await this.sleep(duration);
            }

            await this.stopBass(1000);
            console.log('🎵 Intensity simulation complete');

        } catch (error) {
            console.error('Error during intensity simulation:', error);
        }
    }

    /**
     * Update bass configuration during runtime
     */
    public updateBassConfiguration(newConfig: any): void {
        if (!this.bassLayer) {
            return;
        }

        this.bassLayer.updateBassConfig(newConfig);
        console.log('🎵 Bass configuration updated:', newConfig);
    }

    /**
     * Utility method for async delays
     */
    private sleep(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Get current initialization status
     */
    public isReady(): boolean {
        return this.isInitialized && this.bassLayer !== null;
    }

    /**
     * Clean up resources
     */
    public dispose(): void {
        if (this.bassLayer) {
            this.bassLayer.dispose();
            this.bassLayer = null;
        }

        if (this.audioContext) {
            this.audioContext.close();
            this.audioContext = null;
        }

        this.isInitialized = false;
        console.log('🎵 BassLayerExample disposed');
    }
}

/**
 * Global demonstration function for testing in browser console
 */
export async function demonstrateBassLayer(): Promise<void> {
    const example = new BassLayerExample();
    
    try {
        console.log('🎵 Starting BassLayer demonstration...');
        
        // Initialize the bass layer
        await example.initialize();
        
        // Demonstrate different patterns
        await example.demonstrateBassPatterns();
        
        // Wait a moment
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Simulate game intensity progression
        await example.simulateGameIntensity();
        
        console.log('🎵 BassLayer demonstration complete!');
        
    } catch (error) {
        console.error('Demonstration failed:', error);
    } finally {
        example.dispose();
    }
}

/**
 * Quick test function for browser console
 */
export async function quickBassTest(): Promise<void> {
    const example = new BassLayerExample();
    
    try {
        await example.initialize();
        await example.startBass(500);
        
        // Test a few patterns quickly
        example.changeBassPattern(BassPattern.ROOT_FIFTH);
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        example.changeBassPattern(BassPattern.WALKING);
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        await example.stopBass(500);
        console.log('🎵 Quick bass test complete!');
        
    } catch (error) {
        console.error('Quick test failed:', error);
    } finally {
        example.dispose();
    }
}

// Make functions available globally for console testing
if (typeof window !== 'undefined') {
    (window as any).demonstrateBassLayer = demonstrateBassLayer;
    (window as any).quickBassTest = quickBassTest;
    console.log('🎵 BassLayer demo functions available: demonstrateBassLayer(), quickBassTest()');
}