/**
 * MusicEventSubscriber - Event subscription management for AudioSystem
 * 
 * This class manages event subscriptions from RuleEngine and GameLogic,
 * implements debouncing to prevent audio spam, and maps game events to
 * appropriate music responses including stingers and layer changes.
 * 
 * Features:
 * - Event subscription management with proper cleanup
 * - Debouncing for rapid events (configurable, default 300ms)
 * - Event filtering based on music configuration
 * - Callback registration for different event types
 * - Comprehensive logging and debugging
 * - Music state transitions and intensity changes
 */

import { EventEmitter, EventMap, EventListener } from '../EventEmitter.js';
import { MusicState, LayeredMusicConfig } from '../types/MusicTypes.js';
import { AudioConfig } from '../AudioSystem.js';

/**
 * Configuration interface for the music event subscriber
 */
export interface MusicEventSubscriberConfig {
    /** Debounce delay for rapid events in milliseconds */
    debounceDelayMs: number;
    
    /** Enable debug logging */
    enableDebugLogging: boolean;
    
    /** Maximum number of queued events before dropping */
    maxQueuedEvents: number;
    
    /** Event filtering configuration */
    eventFilters: {
        /** Minimum intensity threshold for spell effects */
        minSpellIntensity: number;
        
        /** Minimum lines cleared to trigger music response */
        minLinesClearedForMusic: number;
        
        /** Whether to respond to piece movement events */
        enablePieceMovementEvents: boolean;
        
        /** Whether to respond to block transformation events */
        enableBlockTransformationEvents: boolean;
        
        /** Enabled event types */
        enabledEventTypes: Set<string>;
    };
    
    /** Music response configuration */
    musicResponses: {
        /** Enable automatic state transitions */
        enableAutoStateTransitions: boolean;
        
        /** Enable stinger sounds for events */
        enableStingers: boolean;
        
        /** Enable layer changes for events */
        enableLayerChanges: boolean;
        
        /** Intensity scaling factor for events */
        intensityScalingFactor: number;
    };
}

/**
 * Default configuration for music event subscriber
 */
export const DEFAULT_MUSIC_EVENT_CONFIG: MusicEventSubscriberConfig = {
    debounceDelayMs: 300,
    enableDebugLogging: false,
    maxQueuedEvents: 50,
    
    eventFilters: {
        minSpellIntensity: 0.3,
        minLinesClearedForMusic: 1,
        enablePieceMovementEvents: true,
        enableBlockTransformationEvents: true,
        enabledEventTypes: new Set([
            'rule:created',
            'rule:modified', 
            'rule:conflict',
            'game:lineClear',
            'game:spellEffect',
            'game:blockTransformation',
            'game:pieceMovement',
            'game:stateChange'
        ])
    },
    
    musicResponses: {
        enableAutoStateTransitions: true,
        enableStingers: true,
        enableLayerChanges: true,
        intensityScalingFactor: 1.0
    }
};

/**
 * Callback function for music events
 */
export type MusicEventCallback = (
    eventType: keyof EventMap,
    eventData: any,
    musicAction: MusicAction
) => void;

/**
 * Music action types that can be triggered by events
 */
export interface MusicAction {
    type: 'stinger' | 'layer_change' | 'state_transition' | 'intensity_change' | 'none';
    data?: {
        soundEffect?: string;
        newState?: MusicState;
        intensity?: number;
        layerChanges?: Array<{
            layerId: string;
            action: 'start' | 'stop' | 'volume_change';
            value?: number;
        }>;
    };
}

/**
 * Debounced event entry for queue management
 */
interface DebouncedEvent {
    eventType: keyof EventMap;
    eventData: any;
    timestamp: number;
    processed: boolean;
}

/**
 * Music event subscriber class for managing event-driven audio responses
 */
export class MusicEventSubscriber {
    private config: MusicEventSubscriberConfig;
    private isSubscribed: boolean = false;
    private callbacks: Set<MusicEventCallback> = new Set();
    
    // Event emitter references
    private ruleEngineEmitter: EventEmitter<EventMap> | null = null;
    private gameLogicEmitter: EventEmitter<EventMap> | null = null;
    
    // Debouncing and queue management
    private debouncedEvents: Map<string, DebouncedEvent> = new Map();
    private debounceTimers: Map<string, NodeJS.Timeout> = new Map();
    private eventQueue: DebouncedEvent[] = [];
    
    // Current music state tracking
    private currentMusicState: MusicState = MusicState.IDLE;
    private currentIntensity: number = 0.0;
    
    // Event listeners for cleanup
    private registeredListeners: Map<keyof EventMap, EventListener<any>[]> = new Map();
    
    constructor(config: Partial<MusicEventSubscriberConfig> = {}) {
        this.config = { ...DEFAULT_MUSIC_EVENT_CONFIG, ...config };
        this.log('MusicEventSubscriber initialized with config:', this.config);
    }
    
    /**
     * Subscribe to RuleEngine and GameLogic events
     */
    public subscribe(
        ruleEngine: { getEventEmitter(): EventEmitter<EventMap> },
        gameLogic: { getEventEmitter(): EventEmitter<EventMap> }
    ): void {
        if (this.isSubscribed) {
            this.log('Already subscribed to events, unsubscribing first');
            this.unsubscribe();
        }
        
        try {
            this.ruleEngineEmitter = ruleEngine.getEventEmitter();
            this.gameLogicEmitter = gameLogic.getEventEmitter();
            
            if (!this.ruleEngineEmitter || !this.gameLogicEmitter) {
                throw new Error('Failed to get EventEmitter instances from RuleEngine or GameLogic');
            }
            
            this.subscribeToRuleEngineEvents();
            this.subscribeToGameLogicEvents();
            
            this.isSubscribed = true;
            this.log('Successfully subscribed to RuleEngine and GameLogic events');
            
        } catch (error) {
            console.error('MusicEventSubscriber: Failed to subscribe to events:', error);
            this.unsubscribe(); // Clean up any partial subscriptions
            throw error;
        }
    }
    
    /**
     * Unsubscribe from all events and clean up resources
     */
    public unsubscribe(): void {
        if (!this.isSubscribed) {
            return;
        }
        
        try {
            // Clear all debounce timers
            this.debounceTimers.forEach(timer => clearTimeout(timer));
            this.debounceTimers.clear();
            
            // Remove all registered listeners
            this.registeredListeners.forEach((listeners, eventType) => {
                if (this.ruleEngineEmitter) {
                    listeners.forEach((listener: EventListener<any>) => {
                        this.ruleEngineEmitter!.off(eventType, listener);
                    });
                }
                if (this.gameLogicEmitter) {
                    listeners.forEach((listener: EventListener<any>) => {
                        this.gameLogicEmitter!.off(eventType, listener);
                    });
                }
            });
            this.registeredListeners.clear();
            
            // Clear event queue and debounced events
            this.eventQueue.length = 0;
            this.debouncedEvents.clear();
            
            // Clear emitter references
            this.ruleEngineEmitter = null;
            this.gameLogicEmitter = null;
            
            this.isSubscribed = false;
            this.log('Successfully unsubscribed from all events');
            
        } catch (error) {
            console.error('MusicEventSubscriber: Error during unsubscribe:', error);
        }
    }
    
    /**
     * Register a callback for music events
     */
    public registerCallback(callback: MusicEventCallback): void {
        this.callbacks.add(callback);
        this.log(`Registered new callback, total callbacks: ${this.callbacks.size}`);
    }
    
    /**
     * Remove a registered callback
     */
    public removeCallback(callback: MusicEventCallback): void {
        const removed = this.callbacks.delete(callback);
        if (removed) {
            this.log(`Removed callback, remaining callbacks: ${this.callbacks.size}`);
        }
    }
    
    /**
     * Update configuration
     */
    public updateConfig(newConfig: Partial<MusicEventSubscriberConfig>): void {
        this.config = { ...this.config, ...newConfig };
        this.log('Updated configuration:', newConfig);
    }
    
    /**
     * Get current music state
     */
    public getCurrentMusicState(): MusicState {
        return this.currentMusicState;
    }
    
    /**
     * Get current intensity level
     */
    public getCurrentIntensity(): number {
        return this.currentIntensity;
    }
    
    /**
     * Get subscription status
     */
    public isActivelySubscribed(): boolean {
        return this.isSubscribed;
    }
    
    /**
     * Get event queue status for debugging
     */
    public getQueueStatus(): {
        queuedEvents: number;
        debouncedEvents: number;
        activeTimers: number;
    } {
        return {
            queuedEvents: this.eventQueue.length,
            debouncedEvents: this.debouncedEvents.size,
            activeTimers: this.debounceTimers.size
        };
    }
    
    /**
     * Subscribe to RuleEngine events
     */
    private subscribeToRuleEngineEvents(): void {
        if (!this.ruleEngineEmitter) return;
        
        // Rule creation events
        if (this.config.eventFilters.enabledEventTypes.has('rule:created')) {
            const listener = (event: any) => this.handleEvent('rule:created', event);
            this.ruleEngineEmitter.on('rule:created', listener);
            this.addRegisteredListener('rule:created', listener);
        }
        
        // Rule modification events
        if (this.config.eventFilters.enabledEventTypes.has('rule:modified')) {
            const listener = (event: any) => this.handleEvent('rule:modified', event);
            this.ruleEngineEmitter.on('rule:modified', listener);
            this.addRegisteredListener('rule:modified', listener);
        }
        
        // Rule conflict events
        if (this.config.eventFilters.enabledEventTypes.has('rule:conflict')) {
            const listener = (event: any) => this.handleEvent('rule:conflict', event);
            this.ruleEngineEmitter.on('rule:conflict', listener);
            this.addRegisteredListener('rule:conflict', listener);
        }
        
        this.log('Subscribed to RuleEngine events');
    }
    
    /**
     * Subscribe to GameLogic events
     */
    private subscribeToGameLogicEvents(): void {
        if (!this.gameLogicEmitter) return;
        
        // Line clear events
        if (this.config.eventFilters.enabledEventTypes.has('game:lineClear')) {
            const listener = (event: any) => this.handleEvent('game:lineClear', event);
            this.gameLogicEmitter.on('game:lineClear', listener);
            this.addRegisteredListener('game:lineClear', listener);
        }
        
        // Spell effect events
        if (this.config.eventFilters.enabledEventTypes.has('game:spellEffect')) {
            const listener = (event: any) => this.handleEvent('game:spellEffect', event);
            this.gameLogicEmitter.on('game:spellEffect', listener);
            this.addRegisteredListener('game:spellEffect', listener);
        }
        
        // Block transformation events
        if (this.config.eventFilters.enabledEventTypes.has('game:blockTransformation') &&
            this.config.eventFilters.enableBlockTransformationEvents) {
            const listener = (event: any) => this.handleEvent('game:blockTransformation', event);
            this.gameLogicEmitter.on('game:blockTransformation', listener);
            this.addRegisteredListener('game:blockTransformation', listener);
        }
        
        // Piece movement events
        if (this.config.eventFilters.enabledEventTypes.has('game:pieceMovement') &&
            this.config.eventFilters.enablePieceMovementEvents) {
            const listener = (event: any) => this.handleEvent('game:pieceMovement', event);
            this.gameLogicEmitter.on('game:pieceMovement', listener);
            this.addRegisteredListener('game:pieceMovement', listener);
        }
        
        // Game state change events
        if (this.config.eventFilters.enabledEventTypes.has('game:stateChange')) {
            const listener = (event: any) => this.handleEvent('game:stateChange', event);
            this.gameLogicEmitter.on('game:stateChange', listener);
            this.addRegisteredListener('game:stateChange', listener);
        }
        
        this.log('Subscribed to GameLogic events');
    }
    
    /**
     * Add a listener to the registered listeners map for cleanup
     */
    private addRegisteredListener(eventType: keyof EventMap, listener: EventListener<any>): void {
        if (!this.registeredListeners.has(eventType)) {
            this.registeredListeners.set(eventType, []);
        }
        this.registeredListeners.get(eventType)!.push(listener);
    }
    
    /**
     * Handle incoming events with debouncing and filtering
     */
    private handleEvent(eventType: keyof EventMap, eventData: any): void {
        try {
            // Apply event filtering
            if (!this.shouldProcessEvent(eventType, eventData)) {
                this.log(`Event filtered out: ${eventType}`);
                return;
            }
            
            // Create debounce key based on event type and relevant data
            const debounceKey = this.createDebounceKey(eventType, eventData);
            
            // Check if we already have this event debouncing
            if (this.debounceTimers.has(debounceKey)) {
                // Update the existing debounced event
                const existingEvent = this.debouncedEvents.get(debounceKey);
                if (existingEvent) {
                    existingEvent.eventData = eventData;
                    existingEvent.timestamp = Date.now();
                    this.log(`Updated debounced event: ${eventType} (key: ${debounceKey})`);
                }
                return;
            }
            
            // Create new debounced event
            const debouncedEvent: DebouncedEvent = {
                eventType,
                eventData,
                timestamp: Date.now(),
                processed: false
            };
            
            this.debouncedEvents.set(debounceKey, debouncedEvent);
            
            // Set up debounce timer
            const timer = setTimeout(() => {
                this.processDebouncedEvent(debounceKey);
            }, this.config.debounceDelayMs);
            
            this.debounceTimers.set(debounceKey, timer);
            
            this.log(`Debouncing event: ${eventType} (key: ${debounceKey}, delay: ${this.config.debounceDelayMs}ms)`);
            
        } catch (error) {
            console.error(`MusicEventSubscriber: Error handling event ${eventType}:`, error);
        }
    }
    
    /**
     * Process a debounced event after the debounce period
     */
    private processDebouncedEvent(debounceKey: string): void {
        const debouncedEvent = this.debouncedEvents.get(debounceKey);
        if (!debouncedEvent || debouncedEvent.processed) {
            return;
        }
        
        try {
            // Mark as processed
            debouncedEvent.processed = true;
            
            // Add to queue if not full
            if (this.eventQueue.length < this.config.maxQueuedEvents) {
                this.eventQueue.push(debouncedEvent);
            } else {
                this.log(`Event queue full, dropping event: ${debouncedEvent.eventType}`);
            }
            
            // Process the event
            const musicAction = this.mapEventToMusicAction(debouncedEvent.eventType, debouncedEvent.eventData);
            
            // Notify callbacks
            this.callbacks.forEach(callback => {
                try {
                    callback(debouncedEvent.eventType, debouncedEvent.eventData, musicAction);
                } catch (error) {
                    console.error('MusicEventSubscriber: Error in callback:', error);
                }
            });
            
            this.log(`Processed event: ${debouncedEvent.eventType}, action: ${musicAction.type}`);
            
        } catch (error) {
            console.error(`MusicEventSubscriber: Error processing debounced event:`, error);
        } finally {
            // Clean up
            this.debouncedEvents.delete(debounceKey);
            this.debounceTimers.delete(debounceKey);
        }
    }
    
    /**
     * Check if an event should be processed based on filters
     */
    private shouldProcessEvent(eventType: keyof EventMap, eventData: any): boolean {
        // Check if event type is enabled
        if (!this.config.eventFilters.enabledEventTypes.has(eventType)) {
            return false;
        }
        
        // Apply specific filters based on event type
        switch (eventType) {
            case 'game:spellEffect':
                return eventData.intensity >= this.config.eventFilters.minSpellIntensity;
                
            case 'game:lineClear':
                return eventData.linesCleared >= this.config.eventFilters.minLinesClearedForMusic;
                
            case 'game:pieceMovement':
                return this.config.eventFilters.enablePieceMovementEvents &&
                       (eventData.movement === 'place' || eventData.movement === 'rotate');
                
            case 'game:blockTransformation':
                return this.config.eventFilters.enableBlockTransformationEvents;
                
            default:
                return true;
        }
    }
    
    /**
     * Create a debounce key for event deduplication
     */
    private createDebounceKey(eventType: keyof EventMap, eventData: any): string {
        switch (eventType) {
            case 'game:spellEffect':
                return `${eventType}:${eventData.spellName}:${eventData.position?.x || 0}:${eventData.position?.y || 0}`;
            
            case 'game:blockTransformation':
                return `${eventType}:${eventData.transformationType}:${eventData.position?.x || 0}:${eventData.position?.y || 0}`;
            
            case 'game:pieceMovement':
                return `${eventType}:${eventData.movement}:${eventData.pieceType}`;
            
            case 'rule:created':
            case 'rule:modified':
                return `${eventType}:${eventData.rule?.id || eventData.ruleId}`;
            
            default:
                return `${eventType}:${Date.now()}`;
        }
    }
    
    /**
     * Map game events to music actions
     */
    private mapEventToMusicAction(eventType: keyof EventMap, eventData: any): MusicAction {
        if (!this.config.musicResponses.enableStingers && !this.config.musicResponses.enableLayerChanges) {
            return { type: 'none' };
        }
        
        switch (eventType) {
            case 'rule:created':
                return this.handleRuleCreatedEvent(eventData);
                
            case 'rule:modified':
                return this.handleRuleModifiedEvent(eventData);
                
            case 'rule:conflict':
                return this.handleRuleConflictEvent(eventData);
                
            case 'game:lineClear':
                return this.handleLineClearEvent(eventData);
                
            case 'game:spellEffect':
                return this.handleSpellEffectEvent(eventData);
                
            case 'game:blockTransformation':
                return this.handleBlockTransformationEvent(eventData);
                
            case 'game:pieceMovement':
                return this.handlePieceMovementEvent(eventData);
                
            case 'game:stateChange':
                return this.handleGameStateChangeEvent(eventData);
                
            default:
                return { type: 'none' };
        }
    }
    
    /**
     * Handle rule creation events
     */
    private handleRuleCreatedEvent(eventData: any): MusicAction {
        this.updateMusicStateForRuleEvent();
        
        return {
            type: 'stinger',
            data: {
                soundEffect: 'ruleFormation'
            }
        };
    }
    
    /**
     * Handle rule modification events
     */
    private handleRuleModifiedEvent(eventData: any): MusicAction {
        this.updateMusicStateForRuleEvent();
        
        return {
            type: 'stinger',
            data: {
                soundEffect: 'blockTransformation'
            }
        };
    }
    
    /**
     * Handle rule conflict events
     */
    private handleRuleConflictEvent(eventData: any): MusicAction {
        const intensity = Math.min(1.0, this.currentIntensity + 0.2);
        this.updateIntensity(intensity);
        
        return {
            type: 'stinger',
            data: {
                soundEffect: 'error'
            }
        };
    }
    
    /**
     * Handle line clear events
     */
    private handleLineClearEvent(eventData: any): MusicAction {
        const linesCleared = eventData.linesCleared || 0;
        
        // Update intensity based on lines cleared
        const intensityIncrease = linesCleared * 0.15;
        const newIntensity = Math.min(1.0, this.currentIntensity + intensityIncrease);
        this.updateIntensity(newIntensity);
        
        // Transition to more intense state for multi-line clears
        if (linesCleared >= 4) {
            this.updateMusicState(MusicState.INTENSE);
            return {
                type: 'state_transition',
                data: {
                    newState: MusicState.INTENSE,
                    soundEffect: 'success'
                }
            };
        } else if (linesCleared >= 2) {
            this.updateMusicState(MusicState.BUILDING);
            return {
                type: 'state_transition',
                data: {
                    newState: MusicState.BUILDING,
                    soundEffect: 'lineClear'
                }
            };
        }
        
        return {
            type: 'stinger',
            data: {
                soundEffect: 'lineClear'
            }
        };
    }
    
    /**
     * Handle spell effect events
     */
    private handleSpellEffectEvent(eventData: any): MusicAction {
        const spellName = eventData.spellName || '';
        const intensity = eventData.intensity || 0;
        const isCombo = eventData.isComboEffect || false;
        
        // Update intensity based on spell effect
        const intensityIncrease = intensity * 0.3 * this.config.musicResponses.intensityScalingFactor;
        const newIntensity = Math.min(1.0, this.currentIntensity + intensityIncrease);
        this.updateIntensity(newIntensity);
        
        // Transition to intense state for powerful spells
        if (intensity > 0.7) {
            this.updateMusicState(MusicState.INTENSE);
        } else if (intensity > 0.4) {
            this.updateMusicState(MusicState.BUILDING);
        }
        
        // Map spell names to sound effects
        const spellSounds: { [key: string]: string } = {
            'BOMB': 'bombExplosion',
            'LIGHTNING': 'lightning',
            'ACID': 'acid',
            'MULTIPLY': 'multiply',
            'TELEPORT': 'teleport',
            'MAGNET': 'magnet',
            'TRANSFORM': 'transform',
            'HEAL': 'heal',
            'SINK': 'sink',
            'FLOAT': 'float'
        };
        
        const soundEffect = spellSounds[spellName] || 'blockTransformation';
        
        return {
            type: 'stinger',
            data: {
                soundEffect,
                intensity: newIntensity
            }
        };
    }
    
    /**
     * Handle block transformation events
     */
    private handleBlockTransformationEvent(eventData: any): MusicAction {
        return {
            type: 'stinger',
            data: {
                soundEffect: 'blockTransformation'
            }
        };
    }
    
    /**
     * Handle piece movement events
     */
    private handlePieceMovementEvent(eventData: any): MusicAction {
        const movement = eventData.movement || '';
        
        switch (movement) {
            case 'place':
                return {
                    type: 'stinger',
                    data: {
                        soundEffect: 'pieceDrop'
                    }
                };
            
            case 'rotate':
                return {
                    type: 'stinger',
                    data: {
                        soundEffect: 'pieceRotate'
                    }
                };
            
            default:
                return { type: 'none' };
        }
    }
    
    /**
     * Handle game state change events
     */
    private handleGameStateChangeEvent(eventData: any): MusicAction {
        const changeType = eventData.changeType || '';
        const newValue = eventData.newValue;
        
        switch (changeType) {
            case 'gameOver':
                if (newValue) {
                    this.updateMusicState(MusicState.DEFEAT);
                    return {
                        type: 'state_transition',
                        data: {
                            newState: MusicState.DEFEAT,
                            soundEffect: 'error'
                        }
                    };
                }
                break;
                
            case 'level':
                this.updateMusicState(MusicState.BUILDING);
                return {
                    type: 'state_transition',
                    data: {
                        newState: MusicState.BUILDING,
                        soundEffect: 'success'
                    }
                };
                
            case 'pause':
                // Could handle pause/resume music logic here
                break;
        }
        
        return { type: 'none' };
    }
    
    /**
     * Update music state for rule-related events
     */
    private updateMusicStateForRuleEvent(): void {
        if (this.config.musicResponses.enableAutoStateTransitions) {
            // Rule events typically indicate increasing complexity
            if (this.currentMusicState === MusicState.IDLE) {
                this.updateMusicState(MusicState.BUILDING);
            }
        }
    }
    
    /**
     * Update the current music state
     */
    private updateMusicState(newState: MusicState): void {
        if (this.currentMusicState !== newState) {
            const oldState = this.currentMusicState;
            this.currentMusicState = newState;
            this.log(`Music state transition: ${oldState} -> ${newState}`);
        }
    }
    
    /**
     * Update the current intensity level
     */
    private updateIntensity(newIntensity: number): void {
        const clampedIntensity = Math.max(0.0, Math.min(1.0, newIntensity));
        if (Math.abs(this.currentIntensity - clampedIntensity) > 0.05) {
            this.currentIntensity = clampedIntensity;
            this.log(`Intensity updated: ${this.currentIntensity.toFixed(2)}`);
        }
    }
    
    /**
     * Log debug messages if debug logging is enabled
     */
    private log(message: string, data?: any): void {
        if (this.config.enableDebugLogging) {
            if (data !== undefined) {
                console.log(`[MusicEventSubscriber] ${message}`, data);
            } else {
                console.log(`[MusicEventSubscriber] ${message}`);
            }
        }
    }
    
    /**
     * Dispose of all resources and clean up
     */
    public dispose(): void {
        this.log('Disposing MusicEventSubscriber');
        this.unsubscribe();
        this.callbacks.clear();
    }
}