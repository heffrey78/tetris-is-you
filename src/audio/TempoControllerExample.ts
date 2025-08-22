/**
 * Example integration of TempoController with DifficultyScaler
 * Shows how to use TempoController for dynamic music tempo management
 */

import { TempoController, TempoConfig } from './TempoController.js';
import { DifficultyScaler } from '../DifficultyScaler.js';
import { GameConfig } from '../GameConfig.js';

export class TempoControllerExample {
    private tempoController: TempoController;
    private difficultyScaler: DifficultyScaler | null = null;
    
    constructor(audioContext?: AudioContext) {
        // Initialize TempoController with custom configuration
        const tempoConfig: Partial<TempoConfig> = {
            minBPM: 60,
            maxBPM: 180,
            transitionDuration: 2.5,
            scalingCurve: 'exponential', // Exponential for dramatic tempo changes
            responsiveness: 0.9
        };
        
        this.tempoController = new TempoController(audioContext, tempoConfig);
        
        // Listen for speed change events from DifficultyScaler
        window.addEventListener('speedChange', this.handleSpeedChange.bind(this) as EventListener);
        
        // Listen for tempo change events
        window.addEventListener('tempoChange', this.handleTempoChange.bind(this) as EventListener);
        
        console.log('🎵 TempoControllerExample initialized');
    }
    
    /**
     * Connect to DifficultyScaler for automatic tempo scaling
     */
    public connectToDifficultyScaler(difficultyScaler: DifficultyScaler): void {
        this.difficultyScaler = difficultyScaler;
        
        // Set initial tempo based on current difficulty
        const state = difficultyScaler.getState();
        this.tempoController.setTempo(state.speedMultiplier);
        
        console.log('🎵 TempoController connected to DifficultyScaler');
    }
    
    /**
     * Handle speed change events from DifficultyScaler
     */
    private handleSpeedChange(event: CustomEvent): void {
        const detail = event.detail;
        
        // Update tempo based on new speed
        this.tempoController.setTempo(detail.newSpeed);
        
        console.log(`🎵 Tempo updated from speed change: ${detail.oldSpeed.toFixed(2)}x → ${detail.newSpeed.toFixed(2)}x`);
    }
    
    /**
     * Handle tempo change events
     */
    private handleTempoChange(event: CustomEvent): void {
        const detail = event.detail;
        
        console.log(`🎵 Tempo changed: ${detail.oldBPM.toFixed(1)} → ${detail.newBPM.toFixed(1)} BPM`);
        console.log(`   - Speed: ${detail.speedMultiplier.toFixed(2)}x`);
        console.log(`   - Curve: ${detail.curve}`);
        console.log(`   - Duration: ${detail.transitionDuration}s`);
    }
    
    /**
     * Get current tempo information
     */
    public getCurrentTempo(): {
        bpm: number;
        speedMultiplier: number;
        beatInterval: number;
        tempoMultiplier: number;
        isTransitioning: boolean;
    } {
        const state = this.tempoController.getState();
        
        return {
            bpm: this.tempoController.getBeatsPerMinute(),
            speedMultiplier: state.speedMultiplier,
            beatInterval: this.tempoController.getBeatInterval(),
            tempoMultiplier: this.tempoController.getTempoMultiplier(),
            isTransitioning: this.tempoController.isTransitioning()
        };
    }
    
    /**
     * Manually set tempo (useful for testing or special events)
     */
    public setTempo(speedMultiplier: number, immediate: boolean = false): void {
        if (immediate) {
            this.tempoController.setTempoImmediate(speedMultiplier);
        } else {
            this.tempoController.setTempo(speedMultiplier);
        }
    }
    
    /**
     * Update tempo configuration
     */
    public updateConfig(config: Partial<TempoConfig>): void {
        this.tempoController.updateConfig(config);
    }
    
    /**
     * Reset tempo to minimum
     */
    public reset(): void {
        this.tempoController.reset();
    }
    
    /**
     * Get TempoController instance for advanced usage
     */
    public getTempoController(): TempoController {
        return this.tempoController;
    }
    
    /**
     * Demo different scaling curves
     */
    public async demoDifferentCurves(): Promise<void> {
        console.log('🎵 Starting tempo curve demonstration...');
        
        const curves: Array<'linear' | 'exponential' | 'logarithmic'> = ['linear', 'exponential', 'logarithmic'];
        const speeds = [1.0, 2.0, 3.0, 4.0, 5.0];
        
        for (const curve of curves) {
            console.log(`\n🎵 Testing ${curve} curve:`);
            this.tempoController.updateConfig({ scalingCurve: curve });
            
            for (const speed of speeds) {
                this.tempoController.setTempoImmediate(speed);
                const bpm = this.tempoController.getBeatsPerMinute();
                console.log(`   ${speed.toFixed(1)}x speed → ${bpm.toFixed(1)} BPM`);
            }
            
            // Wait a bit between curves
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        console.log('\n🎵 Tempo curve demonstration completed');
    }
    
    /**
     * Demo smooth transitions
     */
    public async demoSmoothTransitions(): Promise<void> {
        console.log('🎵 Starting smooth transition demonstration...');
        
        // Reset to starting position
        this.tempoController.reset();
        
        const transitionSteps = [
            { speed: 1.5, name: 'Beginner+' },
            { speed: 2.5, name: 'Intermediate' },
            { speed: 4.0, name: 'Advanced' },
            { speed: 5.0, name: 'Expert' },
            { speed: 3.0, name: 'Advanced-' },
            { speed: 1.0, name: 'Reset' }
        ];
        
        for (const step of transitionSteps) {
            console.log(`🎵 Transitioning to ${step.name} (${step.speed}x)...`);
            this.tempoController.setTempo(step.speed);
            
            // Wait for transition to complete
            await new Promise(resolve => setTimeout(resolve, 3000));
            
            const finalBPM = this.tempoController.getBeatsPerMinute();
            console.log(`   Final BPM: ${finalBPM.toFixed(1)}`);
        }
        
        console.log('🎵 Smooth transition demonstration completed');
    }
    
    /**
     * Cleanup
     */
    public dispose(): void {
        window.removeEventListener('speedChange', this.handleSpeedChange.bind(this) as EventListener);
        window.removeEventListener('tempoChange', this.handleTempoChange.bind(this) as EventListener);
        
        this.tempoController.dispose();
        
        console.log('🎵 TempoControllerExample disposed');
    }
}

/**
 * Usage example:
 * 
 * ```typescript
 * // Initialize with Web Audio context
 * const audioContext = new AudioContext();
 * const tempoExample = new TempoControllerExample(audioContext);
 * 
 * // Connect to existing DifficultyScaler
 * tempoExample.connectToDifficultyScaler(difficultyScaler);
 * 
 * // Manual tempo control
 * tempoExample.setTempo(3.0); // Smooth transition to 3x speed
 * tempoExample.setTempo(1.5, true); // Immediate change to 1.5x speed
 * 
 * // Get current tempo info
 * const tempo = tempoExample.getCurrentTempo();
 * console.log(`Current BPM: ${tempo.bpm}`);
 * 
 * // Demo different features
 * await tempoExample.demoDifferentCurves();
 * await tempoExample.demoSmoothTransitions();
 * 
 * // Cleanup
 * tempoExample.dispose();
 * ```
 */