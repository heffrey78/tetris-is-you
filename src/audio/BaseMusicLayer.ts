/**
 * Abstract base implementation of MusicLayer interface with Web Audio synthesis
 * Provides comprehensive gain node management, crossfade logic, and note scheduling
 * for creating rich, dynamic musical layers in Tetris Is You.
 */

import { 
    MusicLayer, 
    LayerType, 
    MusicState, 
    CrossfadeConfig,
    LayerEvent,
    LayerEventCallback 
} from '../types/MusicTypes';
import { PerformanceMonitor, PerformanceMetrics } from '../utils/PerformanceMonitor';

/**
 * Configuration for oscillator synthesis
 */
export interface OscillatorConfig {
    /** Oscillator type */
    type: OscillatorType;
    /** Base frequency in Hz */
    frequency: number;
    /** Detune amount in cents */
    detune?: number;
    /** Volume contribution (0.0 - 1.0) */
    volume: number;
    /** Phase offset for stereo effects */
    phase?: number;
}

/**
 * ADSR Envelope configuration for synthesized sounds
 */
export interface Envelope {
    /** Attack time in seconds */
    attack: number;
    /** Decay time in seconds */
    decay: number;
    /** Sustain level (0.0 - 1.0) */
    sustain: number;
    /** Release time in seconds */
    release: number;
}

/**
 * Note definition for scheduled playback
 */
export interface Note {
    /** Frequency in Hz */
    frequency: number;
    /** Start time relative to layer start */
    startTime: number;
    /** Duration in seconds */
    duration: number;
    /** Velocity (0.0 - 1.0) */
    velocity: number;
    /** Optional envelope override */
    envelope?: Envelope;
    /** Optional oscillator configuration override */
    oscillator?: Partial<OscillatorConfig>;
}

/**
 * Performance metrics specific to audio layers
 */
export interface AudioPerformanceMetrics extends PerformanceMetrics {
    /** Number of active oscillators */
    activeOscillators: number;
    /** Number of active gain nodes */
    activeGainNodes: number;
    /** Audio context state */
    audioContextState: AudioContextState;
    /** Current audio latency */
    audioLatency: number;
}

/**
 * Abstract base class implementing MusicLayer interface with Web Audio synthesis
 */
export abstract class BaseMusicLayer implements MusicLayer {
    /** Unique identifier for this layer */
    public readonly id: string;
    
    /** Type category of this musical layer */
    public readonly type: LayerType;
    
    /** Music states where this layer should be active */
    public readonly activeStates: MusicState[];
    
    /** Base volume level (0.0 - 1.0) */
    public readonly baseVolume: number;
    
    /** Web Audio context */
    protected audioContext: AudioContext;
    
    /** Master gain node for this layer */
    protected masterGain: GainNode;
    
    /** Current playing state */
    private _isPlaying: boolean = false;
    
    /** Current volume level (0.0 - 1.0) */
    private _currentVolume: number = 0;
    
    /** Whether this layer is currently fading */
    private _isFading: boolean = false;
    
    /** Active oscillators and their gain nodes */
    protected activeNodes: Map<string, { oscillator: OscillatorNode; gain: GainNode }> = new Map();
    
    /** Scheduled notes queue */
    protected scheduledNotes: Note[] = [];
    
    /** Current playback start time */
    protected playStartTime: number = 0;
    
    /** Event listeners */
    protected eventListeners: LayerEventCallback[] = [];
    
    /** Performance monitor */
    protected performanceMonitor: PerformanceMonitor;
    
    /** Default envelope for synthesized sounds */
    protected defaultEnvelope: Envelope = {
        attack: 0.05,
        decay: 0.2,
        sustain: 0.6,
        release: 0.3
    };
    
    /** Default oscillator configurations for rich sound */
    protected defaultOscillators: OscillatorConfig[] = [
        { type: 'triangle', frequency: 440, volume: 0.6 },
        { type: 'sine', frequency: 440, detune: 7, volume: 0.3 },
        { type: 'sawtooth', frequency: 220, volume: 0.2 }
    ];
    
    constructor(
        id: string,
        type: LayerType,
        activeStates: MusicState[],
        baseVolume: number,
        audioContext: AudioContext
    ) {
        this.id = id;
        this.type = type;
        this.activeStates = activeStates;
        this.baseVolume = Math.max(0, Math.min(1, baseVolume));
        this.audioContext = audioContext;
        this._currentVolume = this.baseVolume;
        
        // Initialize performance monitoring
        this.performanceMonitor = new PerformanceMonitor();
        
        // Create master gain node
        this.masterGain = this.audioContext.createGain();
        this.masterGain.gain.value = 0; // Start silent
        this.masterGain.connect(this.audioContext.destination);
        
        // Initialize layer-specific setup
        this.initializeLayer();
        
        console.log(`🎵 BaseMusicLayer '${this.id}' (${this.type}) initialized`);
    }
    
    /** Abstract method for layer-specific initialization */
    protected abstract initializeLayer(): void;
    
    /** Abstract method for generating layer-specific notes */
    protected abstract generateNotes(intensity: number): Note[];
    
    /** Getters for readonly properties */
    public get isPlaying(): boolean {
        return this._isPlaying;
    }
    
    public get currentVolume(): number {
        return this._currentVolume;
    }
    
    public get isFading(): boolean {
        return this._isFading;
    }
    
    /**
     * Start playing this layer with optional fade-in
     * @param fadeInMs Optional fade-in duration in milliseconds
     * @returns Promise that resolves when playback starts
     */
    public async play(fadeInMs: number = 0): Promise<void> {
        if (this._isPlaying) {
            console.warn(`Layer '${this.id}' is already playing`);
            return;
        }
        
        try {
            // Resume audio context if suspended
            if (this.audioContext.state === 'suspended') {
                await this.audioContext.resume();
            }
            
            this._isPlaying = true;
            this.playStartTime = this.audioContext.currentTime;
            
            // Start with volume based on fade-in
            const startVolume = fadeInMs > 0 ? 0 : this._currentVolume;
            this.masterGain.gain.setValueAtTime(startVolume, this.playStartTime);
            
            // Apply fade-in if specified
            if (fadeInMs > 0) {
                this._isFading = true;
                const fadeInSeconds = fadeInMs / 1000;
                this.masterGain.gain.linearRampToValueAtTime(
                    this._currentVolume,
                    this.playStartTime + fadeInSeconds
                );
                
                // Clear fading flag after fade completes
                setTimeout(() => {
                    this._isFading = false;
                }, fadeInMs);
            }
            
            // Schedule notes for playback
            this.scheduleNotes();
            
            // Emit layer started event
            this.emitEvent('layer_started', { fadeInMs });
            
            console.log(`🎵 Layer '${this.id}' started playing${fadeInMs > 0 ? ` with ${fadeInMs}ms fade-in` : ''}`);
            
        } catch (error) {
            this._isPlaying = false;
            console.error(`Failed to start layer '${this.id}':`, error);
            throw error;
        }
    }
    
    /**
     * Stop playing this layer with optional fade-out
     * @param fadeOutMs Optional fade-out duration in milliseconds
     * @returns Promise that resolves when playback stops
     */
    public async stop(fadeOutMs: number = 0): Promise<void> {
        if (!this._isPlaying) {
            return;
        }
        
        try {
            const stopTime = this.audioContext.currentTime;
            
            if (fadeOutMs > 0) {
                this._isFading = true;
                const fadeOutSeconds = fadeOutMs / 1000;
                
                // Fade out the master gain
                this.masterGain.gain.setValueAtTime(this._currentVolume, stopTime);
                this.masterGain.gain.linearRampToValueAtTime(0, stopTime + fadeOutSeconds);
                
                // Stop all nodes after fade completes
                setTimeout(() => {
                    this.stopAllNodes();
                    this._isPlaying = false;
                    this._isFading = false;
                }, fadeOutMs);
                
            } else {
                // Immediate stop
                this.stopAllNodes();
                this._isPlaying = false;
                this.masterGain.gain.setValueAtTime(0, stopTime);
            }
            
            // Emit layer stopped event
            this.emitEvent('layer_stopped', { fadeOutMs });
            
            console.log(`🎵 Layer '${this.id}' stopped${fadeOutMs > 0 ? ` with ${fadeOutMs}ms fade-out` : ''}`);
            
        } catch (error) {
            console.error(`Failed to stop layer '${this.id}':`, error);
            throw error;
        }
    }
    
    /**
     * Set the volume level of this layer
     * @param volume Target volume (0.0 - 1.0)
     * @param transitionMs Duration of volume change in milliseconds
     * @returns Promise that resolves when volume change completes
     */
    public async setVolume(volume: number, transitionMs: number = 0): Promise<void> {
        const targetVolume = Math.max(0, Math.min(1, volume));
        
        try {
            const currentTime = this.audioContext.currentTime;
            
            if (transitionMs > 0) {
                this._isFading = true;
                const transitionSeconds = transitionMs / 1000;
                
                this.masterGain.gain.setValueAtTime(this._currentVolume, currentTime);
                this.masterGain.gain.linearRampToValueAtTime(targetVolume, currentTime + transitionSeconds);
                
                // Clear fading flag after transition
                setTimeout(() => {
                    this._isFading = false;
                }, transitionMs);
                
            } else {
                this.masterGain.gain.setValueAtTime(targetVolume, currentTime);
            }
            
            this._currentVolume = targetVolume;
            
            // Emit volume changed event
            this.emitEvent('layer_volume_changed', { 
                oldVolume: this._currentVolume,
                newVolume: targetVolume,
                transitionMs 
            });
            
        } catch (error) {
            console.error(`Failed to set volume for layer '${this.id}':`, error);
            throw error;
        }
    }
    
    /**
     * Perform a crossfade transition to another layer
     * @param targetLayer Layer to crossfade to
     * @param config Crossfade configuration
     * @returns Promise that resolves when crossfade completes
     */
    public async crossfadeTo(targetLayer: MusicLayer, config: CrossfadeConfig): Promise<void> {
        try {
            this.emitEvent('crossfade_started', { targetLayer: targetLayer.id, config });
            
            const fadeOutPromise = this.stop(config.duration);
            const fadeInPromise = targetLayer.play(config.duration);
            
            if (config.allowOverlap) {
                // Start target layer immediately for overlap
                await Promise.all([fadeOutPromise, fadeInPromise]);
            } else {
                // Wait for current layer to stop before starting target
                await fadeOutPromise;
                await fadeInPromise;
            }
            
            this.emitEvent('crossfade_completed', { targetLayer: targetLayer.id });
            
        } catch (error) {
            console.error(`Failed crossfade from '${this.id}' to '${targetLayer.id}':`, error);
            throw error;
        }
    }
    
    /**
     * Update layer state based on current music state and intensity
     * @param musicState Current music state
     * @param intensity Intensity level (0.0 - 1.0)
     */
    public updateForState(musicState: MusicState, intensity: number): void {
        // Check if this layer should be active for the current state
        const shouldBeActive = this.activeStates.includes(musicState);
        
        if (shouldBeActive && !this._isPlaying) {
            // Layer should be playing but isn't - start it
            this.play(1000); // 1 second fade-in
        } else if (!shouldBeActive && this._isPlaying) {
            // Layer should not be playing but is - stop it
            this.stop(1000); // 1 second fade-out
        }
        
        if (this._isPlaying) {
            // Update volume based on intensity
            const targetVolume = this.baseVolume * intensity;
            this.setVolume(targetVolume, 500); // 0.5 second transition
            
            // Regenerate notes based on new intensity
            this.scheduledNotes = this.generateNotes(intensity);
            
            // If we're already playing, reschedule with new notes
            if (this._isPlaying) {
                this.scheduleNotes();
            }
        }
    }
    
    /**
     * Schedule notes for playback using Web Audio precise timing
     */
    protected scheduleNotes(): void {
        const currentTime = this.audioContext.currentTime;
        const scheduleAheadTime = 0.1; // Schedule 100ms ahead
        
        for (const note of this.scheduledNotes) {
            const noteStartTime = this.playStartTime + note.startTime;
            
            // Only schedule notes that haven't started yet and are within scheduling window
            if (noteStartTime > currentTime && noteStartTime - currentTime <= scheduleAheadTime) {
                this.createAndScheduleNote(note);
            }
        }
        
        // Schedule next batch of notes
        setTimeout(() => {
            if (this._isPlaying) {
                this.scheduleNotes();
            }
        }, 50); // Check every 50ms for new notes to schedule
    }
    
    /**
     * Create and schedule a single note with multiple oscillators for rich sound
     */
    protected createAndScheduleNote(note: Note): void {
        try {
            const startTime = this.playStartTime + note.startTime;
            const endTime = startTime + note.duration;
            const envelope = note.envelope || this.defaultEnvelope;
            const nodeId = `note_${Date.now()}_${Math.random()}`;
            
            // Create a gain node for this note
            const noteGain = this.audioContext.createGain();
            noteGain.connect(this.masterGain);
            
            // Create multiple oscillators for rich sound
            const oscillators: OscillatorNode[] = [];
            const oscillatorConfigs = note.oscillator ? 
                [{ ...this.defaultOscillators[0], ...note.oscillator }] : 
                this.defaultOscillators;
            
            for (const oscConfig of oscillatorConfigs) {
                const oscillator = this.audioContext.createOscillator();
                const oscGain = this.audioContext.createGain();
                
                // Configure oscillator
                oscillator.type = oscConfig.type;
                oscillator.frequency.setValueAtTime(
                    note.frequency * (oscConfig.frequency / 440), // Scale relative to A4
                    startTime
                );
                
                if (oscConfig.detune) {
                    oscillator.detune.setValueAtTime(oscConfig.detune, startTime);
                }
                
                // Configure oscillator gain
                oscGain.gain.value = oscConfig.volume * note.velocity;
                
                // Connect oscillator -> oscGain -> noteGain
                oscillator.connect(oscGain);
                oscGain.connect(noteGain);
                
                oscillators.push(oscillator);
            }
            
            // Apply ADSR envelope to note gain
            this.applyEnvelope(noteGain, envelope, startTime, note.duration, note.velocity);
            
            // Start all oscillators
            for (const oscillator of oscillators) {
                oscillator.start(startTime);
                oscillator.stop(endTime);
            }
            
            // Store reference for cleanup
            this.activeNodes.set(nodeId, {
                oscillator: oscillators[0], // Store primary oscillator for reference
                gain: noteGain
            });
            
            // Clean up after note ends
            setTimeout(() => {
                this.activeNodes.delete(nodeId);
            }, (note.duration + envelope.release + 0.1) * 1000);
            
        } catch (error) {
            console.error(`Failed to create note for layer '${this.id}':`, error);
        }
    }
    
    /**
     * Apply ADSR envelope to a gain node
     */
    protected applyEnvelope(
        gainNode: GainNode, 
        envelope: Envelope, 
        startTime: number, 
        duration: number, 
        velocity: number
    ): void {
        const { attack, decay, sustain, release } = envelope;
        const peakLevel = velocity;
        const sustainLevel = peakLevel * sustain;
        
        // Set up envelope points
        gainNode.gain.setValueAtTime(0, startTime);
        
        // Attack phase
        gainNode.gain.linearRampToValueAtTime(peakLevel, startTime + attack);
        
        // Decay phase
        gainNode.gain.linearRampToValueAtTime(sustainLevel, startTime + attack + decay);
        
        // Sustain phase (hold until release)
        const releaseStartTime = startTime + duration - release;
        gainNode.gain.setValueAtTime(sustainLevel, releaseStartTime);
        
        // Release phase
        gainNode.gain.linearRampToValueAtTime(0, startTime + duration);
    }
    
    /**
     * Stop all active oscillators and clean up nodes
     */
    protected stopAllNodes(): void {
        const currentTime = this.audioContext.currentTime;
        
        this.activeNodes.forEach(({ oscillator, gain }, nodeId) => {
            try {
                // Quick fade out to avoid clicks
                gain.gain.setValueAtTime(gain.gain.value, currentTime);
                gain.gain.linearRampToValueAtTime(0, currentTime + 0.05);
                
                // Stop oscillator
                oscillator.stop(currentTime + 0.05);
            } catch (error) {
                // Oscillator may already be stopped
            }
        });
        
        // Clear all active nodes
        this.activeNodes.clear();
    }
    
    /**
     * Get performance metrics for this layer
     */
    public getPerformanceMetrics(): AudioPerformanceMetrics {
        const baseMetrics = this.performanceMonitor.getPerformanceMetrics();
        
        return {
            ...baseMetrics,
            activeOscillators: this.activeNodes.size,
            activeGainNodes: this.activeNodes.size, // Each note has one gain node
            audioContextState: this.audioContext.state,
            audioLatency: this.audioContext.baseLatency || 0
        };
    }
    
    /**
     * Emit a layer event to all listeners
     */
    protected emitEvent(type: LayerEvent['type'], data?: any): void {
        const event: LayerEvent = {
            type,
            layer: this,
            timestamp: Date.now(),
            data
        };
        
        for (const listener of this.eventListeners) {
            try {
                listener(event);
            } catch (error) {
                console.error(`Error in layer event listener for '${this.id}':`, error);
            }
        }
    }
    
    /**
     * Add event listener for this layer
     */
    public addEventListener(callback: LayerEventCallback): void {
        this.eventListeners.push(callback);
    }
    
    /**
     * Remove event listener
     */
    public removeEventListener(callback: LayerEventCallback): void {
        const index = this.eventListeners.indexOf(callback);
        if (index !== -1) {
            this.eventListeners.splice(index, 1);
        }
    }
    
    /**
     * Clean up resources and stop playback
     */
    public dispose(): void {
        try {
            // Stop playback immediately
            this.stop(0);
            
            // Clear all nodes
            this.stopAllNodes();
            
            // Disconnect master gain
            this.masterGain.disconnect();
            
            // Clear event listeners
            this.eventListeners = [];
            
            // Clear scheduled notes
            this.scheduledNotes = [];
            
            console.log(`🎵 Layer '${this.id}' disposed`);
            
        } catch (error) {
            console.error(`Error disposing layer '${this.id}':`, error);
        }
    }
}