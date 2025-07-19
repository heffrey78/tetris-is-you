// Simple EventEmitter implementation for game events
// Provides type-safe event emission and subscription for RuleEngine and GameLogic

export type EventListener<T = any> = (data: T) => void;

export interface EventData {
    timestamp: number;
    source: string;
}

// Rule Engine Events
export interface RuleCreatedEvent extends EventData {
    rule: {
        id: string;
        noun: string;
        property: string;
        priority: number;
        source: 'base' | 'line-clear' | 'fusion';
    };
}

export interface RuleModifiedEvent extends EventData {
    ruleId: string;
    changes: {
        oldValue: string;
        newValue: string;
        field: 'noun' | 'property';
    };
}

export interface RuleConflictEvent extends EventData {
    conflict: {
        noun: string;
        conflictingRules: Array<{ id: string; property: string; priority: number; }>;
        resolution: 'priority' | 'newest' | 'fusion' | 'cancel';
        resolvedRule?: { id: string; property: string; };
    };
}

// Game Logic Events
export interface LineClearEvent extends EventData {
    linesCleared: number;
    lineNumbers: number[];
    score: number;
    level: number;
    totalLinesCleared: number;
}

export interface SpellEffectEvent extends EventData {
    spellName: string;
    position: { x: number; y: number };
    intensity: number;
    affectedBlocks: Array<{ x: number; y: number; type: string; }>;
    isComboEffect: boolean;
}

export interface BlockTransformationEvent extends EventData {
    transformationType: 'color' | 'type' | 'property' | 'destruction' | 'creation';
    position: { x: number; y: number };
    before?: { type: string; color: any };
    after?: { type: string; color: any };
    ruleCause?: string;
}

export interface PieceMovementEvent extends EventData {
    pieceType: string;
    movement: 'drop' | 'left' | 'right' | 'rotate' | 'place';
    position: { x: number; y: number };
    speedModifier?: number; // For FAST/SLOW effects
}

export interface GameStateChangeEvent extends EventData {
    changeType: 'score' | 'level' | 'gameOver' | 'pause' | 'difficulty';
    oldValue: any;
    newValue: any;
}

// Event type mapping for type safety
export interface EventMap {
    // Rule Engine events
    'rule:created': RuleCreatedEvent;
    'rule:modified': RuleModifiedEvent;
    'rule:conflict': RuleConflictEvent;
    
    // Game Logic events
    'game:lineClear': LineClearEvent;
    'game:spellEffect': SpellEffectEvent;
    'game:blockTransformation': BlockTransformationEvent;
    'game:pieceMovement': PieceMovementEvent;
    'game:stateChange': GameStateChangeEvent;
}

export class EventEmitter<TEventMap = EventMap> {
    private listeners: Map<keyof TEventMap, Set<EventListener<any>>> = new Map();
    private onceListeners: Map<keyof TEventMap, Set<EventListener<any>>> = new Map();
    private maxListeners: number = 50;
    private debugMode: boolean = false;

    constructor(debugMode: boolean = false) {
        this.debugMode = debugMode;
    }

    /**
     * Add an event listener
     */
    public on<K extends keyof TEventMap>(
        event: K,
        listener: EventListener<TEventMap[K]>
    ): this {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, new Set());
        }

        const eventListeners = this.listeners.get(event)!;
        
        if (eventListeners.size >= this.maxListeners) {
            console.warn(`EventEmitter: Maximum listeners (${this.maxListeners}) reached for event '${String(event)}'`);
            return this;
        }

        eventListeners.add(listener);
        
        if (this.debugMode) {
            console.log(`EventEmitter: Added listener for '${String(event)}' (total: ${eventListeners.size})`);
        }

        return this;
    }

    /**
     * Add a one-time event listener
     */
    public once<K extends keyof TEventMap>(
        event: K,
        listener: EventListener<TEventMap[K]>
    ): this {
        if (!this.onceListeners.has(event)) {
            this.onceListeners.set(event, new Set());
        }

        this.onceListeners.get(event)!.add(listener);
        
        if (this.debugMode) {
            console.log(`EventEmitter: Added one-time listener for '${String(event)}'`);
        }

        return this;
    }

    /**
     * Remove an event listener
     */
    public off<K extends keyof TEventMap>(
        event: K,
        listener: EventListener<TEventMap[K]>
    ): this {
        const eventListeners = this.listeners.get(event);
        if (eventListeners) {
            eventListeners.delete(listener);
            
            if (this.debugMode) {
                console.log(`EventEmitter: Removed listener for '${String(event)}' (remaining: ${eventListeners.size})`);
            }
        }

        const onceListeners = this.onceListeners.get(event);
        if (onceListeners) {
            onceListeners.delete(listener);
        }

        return this;
    }

    /**
     * Remove all listeners for an event
     */
    public removeAllListeners<K extends keyof TEventMap>(event?: K): this {
        if (event) {
            this.listeners.delete(event);
            this.onceListeners.delete(event);
            
            if (this.debugMode) {
                console.log(`EventEmitter: Removed all listeners for '${String(event)}'`);
            }
        } else {
            this.listeners.clear();
            this.onceListeners.clear();
            
            if (this.debugMode) {
                console.log('EventEmitter: Removed all listeners for all events');
            }
        }

        return this;
    }

    /**
     * Emit an event to all listeners
     */
    public emit<K extends keyof TEventMap>(
        event: K,
        data: TEventMap[K]
    ): boolean {
        let hasListeners = false;

        // Call regular listeners
        const eventListeners = this.listeners.get(event);
        if (eventListeners && eventListeners.size > 0) {
            hasListeners = true;
            
            if (this.debugMode) {
                console.log(`EventEmitter: Emitting '${String(event)}' to ${eventListeners.size} listeners`);
            }

            // Convert to array to avoid issues if listeners are modified during iteration
            const listenersArray = Array.from(eventListeners);
            
            for (const listener of listenersArray) {
                try {
                    listener(data);
                } catch (error) {
                    console.error(`EventEmitter: Error in listener for '${String(event)}':`, error);
                }
            }
        }

        // Call one-time listeners and remove them
        const onceListeners = this.onceListeners.get(event);
        if (onceListeners && onceListeners.size > 0) {
            hasListeners = true;
            
            if (this.debugMode) {
                console.log(`EventEmitter: Emitting '${String(event)}' to ${onceListeners.size} one-time listeners`);
            }

            const onceListenersArray = Array.from(onceListeners);
            onceListeners.clear(); // Remove all once listeners after calling them
            
            for (const listener of onceListenersArray) {
                try {
                    listener(data);
                } catch (error) {
                    console.error(`EventEmitter: Error in one-time listener for '${String(event)}':`, error);
                }
            }
        }

        return hasListeners;
    }

    /**
     * Get the number of listeners for an event
     */
    public listenerCount<K extends keyof TEventMap>(event: K): number {
        const regularCount = this.listeners.get(event)?.size || 0;
        const onceCount = this.onceListeners.get(event)?.size || 0;
        return regularCount + onceCount;
    }

    /**
     * Get all event names that have listeners
     */
    public eventNames(): Array<keyof TEventMap> {
        const events = new Set<keyof TEventMap>();
        
        for (const event of this.listeners.keys()) {
            events.add(event);
        }
        
        for (const event of this.onceListeners.keys()) {
            events.add(event);
        }
        
        return Array.from(events);
    }

    /**
     * Set the maximum number of listeners per event
     */
    public setMaxListeners(n: number): this {
        this.maxListeners = n;
        return this;
    }

    /**
     * Get the maximum number of listeners per event
     */
    public getMaxListeners(): number {
        return this.maxListeners;
    }

    /**
     * Enable or disable debug mode
     */
    public setDebugMode(enabled: boolean): this {
        this.debugMode = enabled;
        return this;
    }
}