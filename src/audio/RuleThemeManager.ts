/**
 * RuleThemeManager for background music adaptation based on active rules
 * 
 * This manager creates ambient musical layers that respond to rule categories:
 * - Combat: BOMB, LIGHTNING, ACID
 * - Movement: TELEPORT, FLOAT, MAGNET
 * - Transformation: MULTIPLY, TRANSFORM, HEAL
 * 
 * Features:
 * - Layer intensity based on active rule count
 * - Smooth crossfading when rules activate/deactivate
 * - Multiple simultaneous rule themes with volume balancing
 * - Rule priority system affecting music prominence
 * - Performance optimization for multiple rule tracking
 */

import { Rule } from '../types.js';
import { RuleEngine } from '../RuleEngine.js';
import { EventMap, RuleCreatedEvent, RuleModifiedEvent, RuleConflictEvent } from '../EventEmitter.js';
import { 
    MusicLayer, 
    LayerType, 
    MusicState, 
    CrossfadeConfig,
    LayerEvent,
    LayerEventCallback 
} from '../types/MusicTypes.js';
import { BaseMusicLayer, Note, Envelope, OscillatorConfig } from './BaseMusicLayer.js';

/**
 * Categories of rules that trigger different musical themes
 */
export enum RuleCategory {
    COMBAT = 'combat',
    MOVEMENT = 'movement', 
    TRANSFORMATION = 'transformation',
    CONTROL = 'control',
    SPECIAL = 'special'
}

/**
 * Mapping of rule properties to their musical categories
 */
export const RULE_CATEGORY_MAP: Record<string, RuleCategory> = {
    // Combat rules - aggressive, percussive themes
    'BOMB': RuleCategory.COMBAT,
    'LIGHTNING': RuleCategory.COMBAT, 
    'ACID': RuleCategory.COMBAT,
    
    // Movement rules - flowing, dynamic themes
    'TELEPORT': RuleCategory.MOVEMENT,
    'FLOAT': RuleCategory.MOVEMENT,
    'MAGNET': RuleCategory.MOVEMENT,
    'SINK': RuleCategory.MOVEMENT,
    
    // Transformation rules - harmonic, mystical themes
    'MULTIPLY': RuleCategory.TRANSFORMATION,
    'TRANSFORM': RuleCategory.TRANSFORMATION,
    'HEAL': RuleCategory.TRANSFORMATION,
    
    // Control rules - rhythmic, structured themes
    'SLOW': RuleCategory.CONTROL,
    'FAST': RuleCategory.CONTROL,
    'PAUSE': RuleCategory.CONTROL,
    
    // Special/Fusion rules - complex, layered themes
    'WIN': RuleCategory.SPECIAL,
    'LOSE': RuleCategory.SPECIAL
};

/**
 * Configuration for rule theme layer behavior
 */
export interface RuleThemeConfig {
    /** Base volume for rule theme layers */
    baseVolume: number;
    /** Maximum volume multiplier based on rule count */
    maxVolumeMultiplier: number;
    /** Fade duration when rules activate/deactivate (ms) */
    fadeDuration: number;
    /** Minimum rule count to activate a theme */
    minRulesForActivation: number;
    /** Maximum concurrent theme layers */
    maxConcurrentThemes: number;
    /** Volume balance between different categories */
    categoryVolumeBalance: Record<RuleCategory, number>;
    /** Priority weights for rule prominence */
    priorityWeights: {
        base: number;
        lineClear: number; 
        'line-clear': number;  // Alternative format for compatibility
        fusion: number;
    };
}

/**
 * Default configuration for rule theme manager
 */
export const DEFAULT_RULE_THEME_CONFIG: RuleThemeConfig = {
    baseVolume: 0.3,
    maxVolumeMultiplier: 2.0,
    fadeDuration: 1500,
    minRulesForActivation: 1,
    maxConcurrentThemes: 3,
    categoryVolumeBalance: {
        [RuleCategory.COMBAT]: 0.8,
        [RuleCategory.MOVEMENT]: 0.6,
        [RuleCategory.TRANSFORMATION]: 0.7,
        [RuleCategory.CONTROL]: 0.5,
        [RuleCategory.SPECIAL]: 1.0
    },
    priorityWeights: {
        base: 1.0,
        lineClear: 1.5,
        'line-clear': 1.5,  // Same value as lineClear for compatibility
        fusion: 2.0
    }
};

/**
 * Statistics about active rule themes
 */
export interface RuleThemeStats {
    /** Number of active rule categories */
    activeCategoryCount: number;
    /** Total number of active rules */
    totalActiveRules: number;
    /** Currently playing theme layers */
    activeThemeLayers: string[];
    /** Intensity by category */
    categoryIntensities: Record<RuleCategory, number>;
    /** Weighted priority score */
    totalPriorityScore: number;
}

/**
 * Combat-themed ambient layer with aggressive percussive elements
 */
class CombatThemeLayer extends BaseMusicLayer {
    constructor(audioContext: AudioContext) {
        super(
            'combat-theme',
            LayerType.AMBIENT,
            [MusicState.BUILDING, MusicState.INTENSE],
            DEFAULT_RULE_THEME_CONFIG.baseVolume,
            audioContext
        );
    }

    protected initializeLayer(): void {
        // Combat theme uses more aggressive oscillator configs
        this.defaultOscillators = [
            { type: 'sawtooth', frequency: 110, volume: 0.4 }, // Deep aggressive bass
            { type: 'square', frequency: 220, detune: -12, volume: 0.3 }, // Harsh midrange
            { type: 'triangle', frequency: 440, detune: 7, volume: 0.2 } // Cutting high
        ];

        this.defaultEnvelope = {
            attack: 0.01,
            decay: 0.3,
            sustain: 0.4,
            release: 0.5
        };
    }

    protected generateNotes(intensity: number): Note[] {
        const notes: Note[] = [];
        const baseFrequency = 110; // A2 - deep and ominous
        const noteDuration = 2.0;
        const noteInterval = 0.5;

        // Create rhythmic combat pattern
        for (let i = 0; i < 8; i++) {
            const startTime = i * noteInterval;
            const frequency = baseFrequency * (i % 2 === 0 ? 1 : 1.125); // Alternate with tritone for tension
            
            notes.push({
                frequency,
                startTime,
                duration: noteDuration * (0.7 + intensity * 0.3),
                velocity: 0.6 + intensity * 0.4,
                envelope: {
                    attack: 0.01,
                    decay: 0.2,
                    sustain: 0.3 + intensity * 0.3,
                    release: 0.4
                }
            });
        }

        return notes;
    }
}

/**
 * Movement-themed ambient layer with flowing, dynamic elements
 */
class MovementThemeLayer extends BaseMusicLayer {
    constructor(audioContext: AudioContext) {
        super(
            'movement-theme',
            LayerType.AMBIENT,
            [MusicState.BUILDING, MusicState.INTENSE],
            DEFAULT_RULE_THEME_CONFIG.baseVolume,
            audioContext
        );
    }

    protected initializeLayer(): void {
        // Movement theme uses smoother, flowing oscillators
        this.defaultOscillators = [
            { type: 'sine', frequency: 220, volume: 0.5 }, // Smooth bass
            { type: 'triangle', frequency: 330, detune: 5, volume: 0.4 }, // Flowing mid
            { type: 'sine', frequency: 660, detune: -3, volume: 0.3 } // Ethereal high
        ];

        this.defaultEnvelope = {
            attack: 0.1,
            decay: 0.4,
            sustain: 0.6,
            release: 0.8
        };
    }

    protected generateNotes(intensity: number): Note[] {
        const notes: Note[] = [];
        const baseFrequencies = [220, 247, 294, 330]; // A3 - E4 scale
        const noteDuration = 3.0;

        // Create flowing arpeggiated pattern
        for (let i = 0; i < 8; i++) {
            const startTime = i * 0.375; // Flowing rhythm
            const freqIndex = Math.floor(i / 2) % baseFrequencies.length;
            const frequency = baseFrequencies[freqIndex] * (1 + intensity * 0.2);
            
            notes.push({
                frequency,
                startTime,
                duration: noteDuration,
                velocity: 0.4 + intensity * 0.3,
                envelope: {
                    attack: 0.1 + intensity * 0.05,
                    decay: 0.3,
                    sustain: 0.6,
                    release: 0.8
                }
            });
        }

        return notes;
    }
}

/**
 * Transformation-themed ambient layer with harmonic, mystical elements
 */
class TransformationThemeLayer extends BaseMusicLayer {
    constructor(audioContext: AudioContext) {
        super(
            'transformation-theme',
            LayerType.AMBIENT,
            [MusicState.BUILDING, MusicState.INTENSE],
            DEFAULT_RULE_THEME_CONFIG.baseVolume,
            audioContext
        );
    }

    protected initializeLayer(): void {
        // Transformation theme uses rich harmonic oscillators
        this.defaultOscillators = [
            { type: 'triangle', frequency: 174, volume: 0.4 }, // F3 - mystical foundation
            { type: 'sine', frequency: 261, volume: 0.5 }, // C4 - harmonic center
            { type: 'triangle', frequency: 392, detune: 2, volume: 0.3 }, // G4 - sparkle
            { type: 'sine', frequency: 523, detune: -1, volume: 0.2 } // C5 - ethereal top
        ];

        this.defaultEnvelope = {
            attack: 0.15,
            decay: 0.5,
            sustain: 0.7,
            release: 1.0
        };
    }

    protected generateNotes(intensity: number): Note[] {
        const notes: Note[] = [];
        const chordProgression = [
            [174, 261, 392], // F major - stable
            [196, 294, 440], // G major - lifting
            [147, 220, 330], // E minor - mystical
            [174, 261, 392]  // Return to F
        ];
        const noteDuration = 4.0;

        // Create harmonic chord progression
        for (let chordIndex = 0; chordIndex < chordProgression.length; chordIndex++) {
            const chord = chordProgression[chordIndex];
            const chordStartTime = chordIndex * 2.0;

            for (let noteIndex = 0; noteIndex < chord.length; noteIndex++) {
                const frequency = chord[noteIndex] * (1 + intensity * 0.1);
                const staggerDelay = noteIndex * 0.1; // Slight stagger for richness

                notes.push({
                    frequency,
                    startTime: chordStartTime + staggerDelay,
                    duration: noteDuration,
                    velocity: 0.3 + intensity * 0.2,
                    envelope: {
                        attack: 0.15 + staggerDelay,
                        decay: 0.5,
                        sustain: 0.7,
                        release: 1.0
                    }
                });
            }
        }

        return notes;
    }
}

/**
 * Main RuleThemeManager class that orchestrates rule-based ambient music
 */
export class RuleThemeManager {
    private ruleEngine: RuleEngine;
    private audioContext: AudioContext;
    private config: RuleThemeConfig;
    
    /** Theme layers by category */
    private themeLayers: Map<RuleCategory, MusicLayer> = new Map();
    
    /** Currently active rules grouped by category */
    private activeRulesByCategory: Map<RuleCategory, Set<Rule>> = new Map();
    
    /** Current intensity levels by category */
    private categoryIntensities: Map<RuleCategory, number> = new Map();
    
    /** Whether the manager is currently active */
    private isActive: boolean = false;
    
    /** Event listeners */
    private eventListeners: LayerEventCallback[] = [];
    
    /** Performance tracking */
    private lastUpdateTime: number = 0;
    private updateCount: number = 0;

    constructor(
        ruleEngine: RuleEngine,
        audioContext: AudioContext,
        config: RuleThemeConfig = DEFAULT_RULE_THEME_CONFIG
    ) {
        this.ruleEngine = ruleEngine;
        this.audioContext = audioContext;
        this.config = { ...config };
        
        this.initializeThemeLayers();
        this.subscribeToRuleEvents();
        this.initializeCategoryTracking();
        
        console.log('🎵 RuleThemeManager initialized with theme layers');
    }

    /**
     * Initialize theme layers for each rule category
     */
    private initializeThemeLayers(): void {
        // Create Combat theme layer
        const combatLayer = new CombatThemeLayer(this.audioContext);
        this.themeLayers.set(RuleCategory.COMBAT, combatLayer);
        
        // Create Movement theme layer
        const movementLayer = new MovementThemeLayer(this.audioContext);
        this.themeLayers.set(RuleCategory.MOVEMENT, movementLayer);
        
        // Create Transformation theme layer  
        const transformationLayer = new TransformationThemeLayer(this.audioContext);
        this.themeLayers.set(RuleCategory.TRANSFORMATION, transformationLayer);
        
        // Set up layer event listeners
        for (const [category, layer] of this.themeLayers) {
            layer.addEventListener((event: LayerEvent) => {
                this.handleLayerEvent(category, event);
            });
        }
    }

    /**
     * Subscribe to rule engine events
     */
    private subscribeToRuleEvents(): void {
        const eventEmitter = this.ruleEngine.getEventEmitter();
        
        // Subscribe to rule creation events
        eventEmitter.on('rule:created', (event: RuleCreatedEvent) => {
            this.handleRuleCreated(event);
        });
        
        // Subscribe to rule modification events  
        eventEmitter.on('rule:modified', (event: RuleModifiedEvent) => {
            this.handleRuleModified(event);
        });
        
        // Subscribe to rule conflict events
        eventEmitter.on('rule:conflict', (event: RuleConflictEvent) => {
            this.handleRuleConflict(event);
        });
        
        console.log('🎵 RuleThemeManager subscribed to rule engine events');
    }

    /**
     * Initialize category tracking maps
     */
    private initializeCategoryTracking(): void {
        for (const category of Object.values(RuleCategory)) {
            this.activeRulesByCategory.set(category, new Set());
            this.categoryIntensities.set(category, 0);
        }
    }

    /**
     * Handle rule creation events
     */
    private handleRuleCreated(event: RuleCreatedEvent): void {
        const rule = event.rule;
        const category = this.getRuleCategory(rule.property);
        
        if (category) {
            console.log(`🎵 Rule created: [${rule.noun}] IS [${rule.property}] → Category: ${category}`);
            
            // Add rule to category tracking
            this.activeRulesByCategory.get(category)?.add({
                id: rule.id,
                noun: rule.noun,
                property: rule.property,
                active: true,
                createdAt: Date.now(),
                priority: rule.priority,
                source: rule.source
            });
            
            // Update theme intensity for this category
            this.updateCategoryIntensity(category);
            
            // Update layer state
            this.updateThemeLayer(category);
        }
    }

    /**
     * Handle rule modification events
     */
    private handleRuleModified(event: RuleModifiedEvent): void {
        // Find the rule in our tracking and update category if property changed
        if (event.changes.field === 'property') {
            const oldCategory = this.getRuleCategory(event.changes.oldValue);
            const newCategory = this.getRuleCategory(event.changes.newValue);
            
            if (oldCategory !== newCategory) {
                console.log(`🎵 Rule property changed: ${event.ruleId} moved from ${oldCategory} to ${newCategory}`);
                
                // Remove from old category
                if (oldCategory) {
                    const oldCategoryRules = this.activeRulesByCategory.get(oldCategory);
                    if (oldCategoryRules) {
                        for (const rule of oldCategoryRules) {
                            if (rule.id === event.ruleId) {
                                oldCategoryRules.delete(rule);
                                break;
                            }
                        }
                        this.updateCategoryIntensity(oldCategory);
                        this.updateThemeLayer(oldCategory);
                    }
                }
                
                // Add to new category
                if (newCategory) {
                    // We need to get the full rule from the rule engine
                    const activeRules = this.ruleEngine.getActiveRules();
                    const rule = activeRules.find(r => r.id === event.ruleId);
                    if (rule) {
                        this.activeRulesByCategory.get(newCategory)?.add(rule);
                        this.updateCategoryIntensity(newCategory);
                        this.updateThemeLayer(newCategory);
                    }
                }
            }
        }
    }

    /**
     * Handle rule conflict events
     */
    private handleRuleConflict(event: RuleConflictEvent): void {
        console.log(`🎵 Rule conflict detected: ${event.conflict.noun} - Resolution: ${event.conflict.resolution}`);
        
        // Update all affected categories since conflicts can deactivate rules
        const affectedCategories = new Set<RuleCategory>();
        
        for (const conflictRule of event.conflict.conflictingRules) {
            const category = this.getRuleCategory(conflictRule.property);
            if (category) {
                affectedCategories.add(category);
            }
        }
        
        // Refresh category tracking from current active rules
        for (const category of affectedCategories) {
            this.refreshCategoryFromActiveRules(category);
            this.updateCategoryIntensity(category);
            this.updateThemeLayer(category);
        }
    }

    /**
     * Get the musical category for a rule property
     */
    private getRuleCategory(property: string): RuleCategory | null {
        // Check direct mapping first
        if (RULE_CATEGORY_MAP[property]) {
            return RULE_CATEGORY_MAP[property];
        }
        
        // Check for fusion rules
        if (property.startsWith('FUSION_')) {
            return RuleCategory.SPECIAL;
        }
        
        // Unknown property - no theme
        return null;
    }

    /**
     * Update intensity for a specific category based on active rules
     */
    private updateCategoryIntensity(category: RuleCategory): void {
        const categoryRules = this.activeRulesByCategory.get(category);
        if (!categoryRules) return;
        
        const ruleCount = categoryRules.size;
        let totalPriorityScore = 0;
        
        // Calculate weighted priority score
        for (const rule of categoryRules) {
            const priorityWeight = this.config.priorityWeights[rule.source] || 1.0;
            totalPriorityScore += rule.priority * priorityWeight;
        }
        
        // Convert to intensity (0.0 - 1.0)
        const baseIntensity = Math.min(ruleCount / 3, 1.0); // 3 rules = max intensity
        const priorityBonus = Math.min(totalPriorityScore / 1000, 0.5); // Priority can add up to 0.5
        const finalIntensity = Math.min(baseIntensity + priorityBonus, 1.0);
        
        this.categoryIntensities.set(category, finalIntensity);
        
        console.log(`🎵 Category ${category} intensity: ${finalIntensity.toFixed(2)} (${ruleCount} rules, priority: ${totalPriorityScore})`);
    }

    /**
     * Update theme layer for a specific category
     */
    private updateThemeLayer(category: RuleCategory): void {
        const layer = this.themeLayers.get(category);
        const intensity = this.categoryIntensities.get(category) || 0;
        const categoryRules = this.activeRulesByCategory.get(category);
        
        if (!layer || !categoryRules) return;
        
        const shouldPlay = intensity >= (this.config.minRulesForActivation / 3) && this.isActive;
        
        if (shouldPlay && !layer.isPlaying) {
            // Start playing the theme layer
            const categoryVolume = this.config.categoryVolumeBalance[category] || 1.0;
            const targetVolume = this.config.baseVolume * categoryVolume * intensity;
            
            layer.play(this.config.fadeDuration).then(() => {
                layer.setVolume(targetVolume, this.config.fadeDuration / 2);
            });
            
            console.log(`🎵 Started ${category} theme layer (intensity: ${intensity.toFixed(2)})`);
            
        } else if (!shouldPlay && layer.isPlaying) {
            // Stop playing the theme layer
            layer.stop(this.config.fadeDuration);
            console.log(`🎵 Stopped ${category} theme layer`);
            
        } else if (shouldPlay && layer.isPlaying) {
            // Update volume based on new intensity
            const categoryVolume = this.config.categoryVolumeBalance[category] || 1.0;
            const targetVolume = this.config.baseVolume * categoryVolume * intensity;
            layer.setVolume(targetVolume, this.config.fadeDuration / 3);
        }
    }

    /**
     * Refresh category tracking from current active rules (used after conflicts)
     */
    private refreshCategoryFromActiveRules(category: RuleCategory): void {
        const categoryRules = this.activeRulesByCategory.get(category);
        if (!categoryRules) return;
        
        categoryRules.clear();
        
        const activeRules = this.ruleEngine.getActiveRules();
        for (const rule of activeRules) {
            const ruleCategory = this.getRuleCategory(rule.property);
            if (ruleCategory === category) {
                categoryRules.add(rule);
            }
        }
    }

    /**
     * Handle layer events and forward to manager listeners
     */
    private handleLayerEvent(category: RuleCategory, event: LayerEvent): void {
        // Add category context to event data
        const enhancedEvent: LayerEvent = {
            ...event,
            data: {
                ...event.data,
                category,
                intensity: this.categoryIntensities.get(category) || 0
            }
        };
        
        // Forward to manager listeners
        for (const listener of this.eventListeners) {
            try {
                listener(enhancedEvent);
            } catch (error) {
                console.error(`Error in RuleThemeManager event listener:`, error);
            }
        }
    }

    /**
     * Start the rule theme manager
     */
    public start(): void {
        if (this.isActive) return;
        
        this.isActive = true;
        
        // Refresh all categories from current active rules
        for (const category of Object.values(RuleCategory)) {
            this.refreshCategoryFromActiveRules(category);
            this.updateCategoryIntensity(category);
            this.updateThemeLayer(category);
        }
        
        console.log('🎵 RuleThemeManager started');
    }

    /**
     * Stop the rule theme manager
     */
    public stop(): void {
        if (!this.isActive) return;
        
        this.isActive = false;
        
        // Stop all active theme layers
        for (const [category, layer] of this.themeLayers) {
            if (layer.isPlaying) {
                layer.stop(this.config.fadeDuration);
            }
        }
        
        console.log('🎵 RuleThemeManager stopped');
    }

    /**
     * Update configuration
     */
    public updateConfig(newConfig: Partial<RuleThemeConfig>): void {
        this.config = { ...this.config, ...newConfig };
        
        // Update all theme layers with new config
        for (const category of Object.values(RuleCategory)) {
            this.updateThemeLayer(category);
        }
        
        console.log('🎵 RuleThemeManager configuration updated');
    }

    /**
     * Get current statistics about rule themes
     */
    public getStats(): RuleThemeStats {
        const activeCategoryCount = Array.from(this.categoryIntensities.values())
            .filter(intensity => intensity > 0).length;
        
        let totalActiveRules = 0;
        for (const categoryRules of this.activeRulesByCategory.values()) {
            totalActiveRules += categoryRules.size;
        }
        
        const activeThemeLayers = Array.from(this.themeLayers.entries())
            .filter(([_, layer]) => layer.isPlaying)
            .map(([category, _]) => category);
        
        const categoryIntensities: Record<RuleCategory, number> = {} as any;
        for (const [category, intensity] of this.categoryIntensities) {
            categoryIntensities[category] = intensity;
        }
        
        // Calculate total priority score
        let totalPriorityScore = 0;
        for (const categoryRules of this.activeRulesByCategory.values()) {
            for (const rule of categoryRules) {
                const priorityWeight = this.config.priorityWeights[rule.source] || 1.0;
                totalPriorityScore += rule.priority * priorityWeight;
            }
        }
        
        return {
            activeCategoryCount,
            totalActiveRules,
            activeThemeLayers,
            categoryIntensities,
            totalPriorityScore
        };
    }

    /**
     * Add event listener for theme manager events
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
     * Get all theme layers (for external control)
     */
    public getThemeLayers(): ReadonlyMap<RuleCategory, MusicLayer> {
        return this.themeLayers;
    }

    /**
     * Get active rules by category (for debugging)
     */
    public getActiveRulesByCategory(): ReadonlyMap<RuleCategory, ReadonlySet<Rule>> {
        return this.activeRulesByCategory as any;
    }

    /**
     * Clean up resources
     */
    public dispose(): void {
        this.stop();
        
        // Dispose all theme layers
        for (const layer of this.themeLayers.values()) {
            layer.dispose();
        }
        
        // Clear tracking
        this.activeRulesByCategory.clear();
        this.categoryIntensities.clear();
        this.eventListeners = [];
        
        console.log('🎵 RuleThemeManager disposed');
    }
}