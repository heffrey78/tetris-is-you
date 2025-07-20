/**
 * TempoController for music layer tempo management
 * Handles smooth tempo transitions using Web Audio scheduling
 */

export interface TempoConfig {
    minBPM: number;
    maxBPM: number;
    transitionDuration: number; // in seconds
    scalingCurve: 'linear' | 'exponential' | 'logarithmic';
    responsiveness: number; // 0.1-1.0, how quickly tempo responds to changes
}

export interface TempoState {
    currentBPM: number;
    targetBPM: number;
    speedMultiplier: number;
    isTransitioning: boolean;
    transitionProgress: number;
}

export type TempoChangeEventDetail = {
    oldBPM: number;
    newBPM: number;
    speedMultiplier: number;
    transitionDuration: number;
    curve: string;
};

export class TempoController {
    private audioContext: AudioContext | null = null;
    private config: TempoConfig;
    private state: TempoState;
    private transitionStartTime: number = 0;
    private animationFrameId: number | null = null;
    private lastEmittedBPM: number = 60; // Track last emitted BPM for threshold checking
    
    constructor(
        audioContext: AudioContext | null = null,
        config: Partial<TempoConfig> = {}
    ) {
        this.audioContext = audioContext;
        
        // Default configuration
        this.config = {
            minBPM: 60,
            maxBPM: 180,
            transitionDuration: 2.0,
            scalingCurve: 'linear',
            responsiveness: 0.8,
            ...config
        };
        
        // Initialize state
        this.state = {
            currentBPM: this.config.minBPM,
            targetBPM: this.config.minBPM,
            speedMultiplier: 1.0,
            isTransitioning: false,
            transitionProgress: 0
        };
        
        console.log('🎵 TempoController initialized with config:', this.config);
    }
    
    /**
     * Set the audio context for Web Audio scheduling
     */
    public setAudioContext(audioContext: AudioContext): void {
        this.audioContext = audioContext;
        console.log('🎵 TempoController audio context updated');
    }
    
    /**
     * Set tempo based on speed multiplier (1.0-5.0)
     * Maps to BPM range using configured scaling curve
     */
    public setTempo(speedMultiplier: number): void {
        // Clamp speed multiplier to reasonable range
        speedMultiplier = Math.max(1.0, Math.min(5.0, speedMultiplier));
        
        const oldBPM = this.state.currentBPM;
        const targetBPM = this.calculateTargetBPM(speedMultiplier);
        
        // Only start transition if there's a significant change (> 2 BPM threshold)
        const bpmChange = Math.abs(targetBPM - this.state.targetBPM);
        if (bpmChange < 2) {
            return;
        }
        
        this.state.speedMultiplier = speedMultiplier;
        this.state.targetBPM = targetBPM;
        
        // Start smooth transition
        this.startTransition();
        
        // Emit tempo change event if change is significant (> 5 BPM threshold)
        const totalChange = Math.abs(targetBPM - this.lastEmittedBPM);
        if (totalChange > 5) {
            this.emitTempoChangeEvent(oldBPM, targetBPM);
            this.lastEmittedBPM = targetBPM;
        }
        
        console.log(`🎵 Tempo transition started: ${oldBPM.toFixed(1)} → ${targetBPM.toFixed(1)} BPM (${speedMultiplier.toFixed(2)}x speed)`);
    }
    
    /**
     * Calculate target BPM from speed multiplier using scaling curve
     */
    private calculateTargetBPM(speedMultiplier: number): number {
        const { minBPM, maxBPM, scalingCurve } = this.config;
        const normalizedSpeed = (speedMultiplier - 1.0) / 4.0; // Normalize 1.0-5.0 to 0.0-1.0
        
        let mappedValue: number;
        
        switch (scalingCurve) {
            case 'exponential':
                // Exponential curve: slower growth initially, rapid at end
                mappedValue = Math.pow(normalizedSpeed, 2);
                break;
                
            case 'logarithmic':
                // Logarithmic curve: rapid growth initially, slower at end
                mappedValue = normalizedSpeed === 0 ? 0 : Math.log(normalizedSpeed * 9 + 1) / Math.log(10);
                break;
                
            case 'linear':
            default:
                // Linear mapping
                mappedValue = normalizedSpeed;
                break;
        }
        
        return minBPM + mappedValue * (maxBPM - minBPM);
    }
    
    /**
     * Start smooth tempo transition using Web Audio scheduling
     */
    private startTransition(): void {
        if (!this.audioContext) {
            // Fallback to immediate change without Web Audio
            this.state.currentBPM = this.state.targetBPM;
            this.state.isTransitioning = false;
            this.state.transitionProgress = 1.0;
            return;
        }
        
        // Stop any existing transition
        this.stopTransition();
        
        this.state.isTransitioning = true;
        this.state.transitionProgress = 0;
        this.transitionStartTime = this.audioContext.currentTime;
        
        // Start animation loop for smooth transition
        this.animateTransition();
    }
    
    /**
     * Stop current transition
     */
    private stopTransition(): void {
        if (this.animationFrameId !== null) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
        this.state.isTransitioning = false;
    }
    
    /**
     * Animate tempo transition using requestAnimationFrame
     */
    private animateTransition(): void {
        if (!this.audioContext || !this.state.isTransitioning) {
            return;
        }
        
        const currentTime = this.audioContext.currentTime;
        const elapsed = currentTime - this.transitionStartTime;
        const progress = Math.min(elapsed / this.config.transitionDuration, 1.0);
        
        // Apply easing curve for smooth transition
        const easedProgress = this.applyEasing(progress);
        
        // Interpolate BPM
        const startBPM = this.state.currentBPM;
        const targetBPM = this.state.targetBPM;
        this.state.currentBPM = startBPM + (targetBPM - startBPM) * easedProgress * this.config.responsiveness;
        this.state.transitionProgress = progress;
        
        // Continue animation or finish
        if (progress < 1.0) {
            this.animationFrameId = requestAnimationFrame(() => this.animateTransition());
        } else {
            this.state.currentBPM = this.state.targetBPM;
            this.state.isTransitioning = false;
            this.state.transitionProgress = 1.0;
            console.log(`🎵 Tempo transition completed: ${this.state.currentBPM.toFixed(1)} BPM`);
        }
    }
    
    /**
     * Apply easing curve to transition progress
     */
    private applyEasing(progress: number): number {
        // Smooth ease-in-out curve for natural tempo transitions
        return progress < 0.5 
            ? 2 * progress * progress 
            : 1 - Math.pow(-2 * progress + 2, 2) / 2;
    }
    
    /**
     * Get current beats per minute
     */
    public getBeatsPerMinute(): number {
        return this.state.currentBPM;
    }
    
    /**
     * Get current tempo state
     */
    public getState(): TempoState {
        return { ...this.state };
    }
    
    /**
     * Get current configuration
     */
    public getConfig(): TempoConfig {
        return { ...this.config };
    }
    
    /**
     * Update tempo configuration
     */
    public updateConfig(newConfig: Partial<TempoConfig>): void {
        const oldConfig = { ...this.config };
        this.config = { ...this.config, ...newConfig };
        
        // Validate ranges
        this.config.minBPM = Math.max(30, Math.min(this.config.minBPM, this.config.maxBPM - 10));
        this.config.maxBPM = Math.max(this.config.minBPM + 10, Math.min(300, this.config.maxBPM));
        this.config.transitionDuration = Math.max(0.1, Math.min(10.0, this.config.transitionDuration));
        this.config.responsiveness = Math.max(0.1, Math.min(1.0, this.config.responsiveness));
        
        // Recalculate tempo if speed multiplier is set and ranges changed
        if (this.state.speedMultiplier > 1.0 && 
            (oldConfig.minBPM !== this.config.minBPM || 
             oldConfig.maxBPM !== this.config.maxBPM ||
             oldConfig.scalingCurve !== this.config.scalingCurve)) {
            this.setTempo(this.state.speedMultiplier);
        }
        
        console.log('🎵 TempoController configuration updated:', this.config);
    }
    
    /**
     * Reset tempo to minimum BPM
     */
    public reset(): void {
        this.stopTransition();
        
        this.state = {
            currentBPM: this.config.minBPM,
            targetBPM: this.config.minBPM,
            speedMultiplier: 1.0,
            isTransitioning: false,
            transitionProgress: 0
        };
        
        this.lastEmittedBPM = this.config.minBPM;
        console.log('🎵 TempoController reset to base tempo');
    }
    
    /**
     * Get tempo as a multiplier for scheduling intervals
     */
    public getTempoMultiplier(): number {
        return this.state.currentBPM / this.config.minBPM;
    }
    
    /**
     * Get beat interval in seconds for Web Audio scheduling
     */
    public getBeatInterval(): number {
        return 60.0 / this.state.currentBPM;
    }
    
    /**
     * Schedule next beat time for Web Audio
     */
    public getNextBeatTime(currentTime?: number): number {
        if (!this.audioContext) {
            return 0;
        }
        
        const now = currentTime || this.audioContext.currentTime;
        const beatInterval = this.getBeatInterval();
        return now + beatInterval;
    }
    
    /**
     * Emit tempo change event
     */
    private emitTempoChangeEvent(oldBPM: number, newBPM: number): void {
        const eventDetail: TempoChangeEventDetail = {
            oldBPM,
            newBPM,
            speedMultiplier: this.state.speedMultiplier,
            transitionDuration: this.config.transitionDuration,
            curve: this.config.scalingCurve
        };
        
        const event = new CustomEvent('tempoChange', {
            detail: eventDetail
        });
        
        window.dispatchEvent(event);
        
        console.log(`🎵 Tempo change event: ${oldBPM.toFixed(1)} → ${newBPM.toFixed(1)} BPM (${this.config.scalingCurve} curve)`);
    }
    
    /**
     * Check if tempo is currently transitioning
     */
    public isTransitioning(): boolean {
        return this.state.isTransitioning;
    }
    
    /**
     * Force immediate tempo change (bypass smooth transition)
     */
    public setTempoImmediate(speedMultiplier: number): void {
        speedMultiplier = Math.max(1.0, Math.min(5.0, speedMultiplier));
        
        const oldBPM = this.state.currentBPM;
        const newBPM = this.calculateTargetBPM(speedMultiplier);
        
        this.stopTransition();
        
        this.state = {
            currentBPM: newBPM,
            targetBPM: newBPM,
            speedMultiplier,
            isTransitioning: false,
            transitionProgress: 1.0
        };
        
        // Emit event for significant changes
        const bpmChange = Math.abs(newBPM - this.lastEmittedBPM);
        if (bpmChange > 5) {
            this.emitTempoChangeEvent(oldBPM, newBPM);
            this.lastEmittedBPM = newBPM;
        }
        
        console.log(`🎵 Immediate tempo change: ${newBPM.toFixed(1)} BPM (${speedMultiplier.toFixed(2)}x speed)`);
    }
    
    /**
     * Cleanup method to stop transitions and clear resources
     */
    public dispose(): void {
        this.stopTransition();
        this.audioContext = null;
        console.log('🎵 TempoController disposed');
    }
}