import { GameConfig, SpeedChangeEventDetail } from './GameConfig.js';
import { Rule } from './types.js';
import { RuleEngine } from './RuleEngine.js';

export interface DifficultyState {
    currentLevel: number;
    linesCleared: number;
    speedMultiplier: number;
    chaosLevel: number;
    nextRuleThreshold: number;
    difficultyName: string;
    scalingMode: 'speed' | 'chaos' | 'hybrid';
}

export class DifficultyScaler {
    private config: GameConfig;
    private ruleEngine: RuleEngine;
    private state: DifficultyState;
    private chaosRulePool: Array<{ noun: string; property: string; priority: number }>;
    private lastRuleAddition: number = 0;
    private lastSpeedEmitted: number = 1.0; // Track last emitted speed for threshold checking
    
    constructor(config: GameConfig, ruleEngine: RuleEngine) {
        this.config = config;
        this.ruleEngine = ruleEngine;
        
        this.state = {
            currentLevel: 1,
            linesCleared: 0,
            speedMultiplier: 1.0,
            chaosLevel: 0,
            nextRuleThreshold: config.difficultyScaling.chaosScaling.newRuleFrequency,
            difficultyName: 'Beginner',
            scalingMode: config.difficultyScaling.mode
        };
        
        // Initialize chaos rule pool with progressively complex rules
        this.chaosRulePool = [
            // Level 1 - Simple effects
            { noun: 'O', property: 'HEAL', priority: 90 },
            { noun: 'L', property: 'SHIELD', priority: 90 },
            { noun: 'J', property: 'FREEZE', priority: 90 },
            
            // Level 2 - Movement effects
            { noun: 'S', property: 'GHOST', priority: 80 },
            { noun: 'Z', property: 'MAGNET', priority: 80 },
            { noun: 'T', property: 'TELEPORT', priority: 80 },
            
            // Level 3 - Transformation effects
            { noun: 'I', property: 'MULTIPLY', priority: 70 },
            { noun: 'O', property: 'TRANSFORM', priority: 70 },
            { noun: 'L', property: 'SINK', priority: 70 },
            
            // Level 4 - Destructive effects
            { noun: 'J', property: 'BOMB', priority: 60 },
            { noun: 'S', property: 'LIGHTNING', priority: 60 },
            { noun: 'Z', property: 'ACID', priority: 60 },
            
            // Level 5 - Advanced combinations
            { noun: 'BLOCK', property: 'FLOAT', priority: 50 },
            { noun: 'WALL', property: 'WEAK', priority: 50 },
            { noun: 'T', property: 'HOT', priority: 50 },
            
            // Level 6 - Chaos mode
            { noun: 'I', property: 'PUSH', priority: 40 },
            { noun: 'O', property: 'MELT', priority: 40 },
            { noun: 'BLOCK', property: 'WIN', priority: 30 },
            { noun: 'WALL', property: 'DEFEAT', priority: 30 }
        ];
    }
    
    public update(gameState: { level: number; linesCleared: number }): void {
        this.state.currentLevel = gameState.level;
        this.state.linesCleared = gameState.linesCleared;
        
        // Update speed scaling
        if (this.config.difficultyScaling.speedScaling.enabled) {
            this.updateSpeedScaling();
        }
        
        // Update chaos scaling
        if (this.config.difficultyScaling.chaosScaling.enabled) {
            this.updateChaosScaling();
        }
        
        // Update difficulty name
        this.updateDifficultyName();
    }
    
    private updateSpeedScaling(): void {
        const speedConfig = this.config.difficultyScaling.speedScaling;
        const level = this.state.currentLevel;
        const oldSpeed = this.state.speedMultiplier;
        
        if (speedConfig.speedIncreaseCurve === 'linear') {
            this.state.speedMultiplier = Math.min(
                speedConfig.maxSpeedMultiplier,
                1.0 + (level - 1) * 0.2
            );
        } else { // exponential
            this.state.speedMultiplier = Math.min(
                speedConfig.maxSpeedMultiplier,
                Math.pow(1.15, level - 1)
            );
        }
        
        // Emit speed change event if change is significant (> 0.1 threshold)
        const speedChange = Math.abs(this.state.speedMultiplier - this.lastSpeedEmitted);
        if (speedChange > 0.1) {
            this.emitSpeedChangeEvent(oldSpeed, this.state.speedMultiplier);
            this.lastSpeedEmitted = this.state.speedMultiplier;
        }
    }
    
    private updateChaosScaling(): void {
        const chaosConfig = this.config.difficultyScaling.chaosScaling;
        const linesCleared = this.state.linesCleared;
        
        // Check if we should add a new rule
        if (linesCleared >= this.state.nextRuleThreshold && 
            this.ruleEngine.getActiveRules().length < chaosConfig.maxActiveRules) {
            
            this.addChaosRule();
            this.state.nextRuleThreshold = linesCleared + 
                Math.floor(chaosConfig.newRuleFrequency / Math.pow(chaosConfig.complexityProgression, this.state.chaosLevel));
        }
        
        // Update chaos level
        this.state.chaosLevel = Math.floor(linesCleared / chaosConfig.newRuleFrequency);
    }
    
    private addChaosRule(): void {
        const chaosConfig = this.config.difficultyScaling.chaosScaling;
        const availableRules = this.chaosRulePool.filter(rule => 
            !this.ruleEngine.getActiveRules().some(active => 
                active.noun === rule.noun && active.property === rule.property
            )
        );
        
        if (availableRules.length === 0) {
            console.log('🎯 No more chaos rules available!');
            return;
        }
        
        // Select rule based on chaos level (higher chaos = more complex rules)
        const maxComplexity = Math.min(
            availableRules.length - 1,
            Math.floor(this.state.chaosLevel * chaosConfig.complexityProgression)
        );
        
        const selectedRule = availableRules[Math.floor(Math.random() * (maxComplexity + 1))];
        
        // Add the rule to the engine
        this.ruleEngine.addRuleWithPriority(
            selectedRule.noun, 
            selectedRule.property, 
            selectedRule.priority, 
            'line-clear'
        );
        this.lastRuleAddition = Date.now();
        
        console.log(`🌪️ CHAOS RULE ADDED: [${selectedRule.noun}] IS [${selectedRule.property}] (Level ${this.state.chaosLevel})`);
    }
    
    private updateDifficultyName(): void {
        const level = this.state.currentLevel;
        const chaos = this.state.chaosLevel;
        const speed = this.state.speedMultiplier;
        
        if (this.state.scalingMode === 'speed') {
            if (speed < 1.5) this.state.difficultyName = 'Beginner';
            else if (speed < 2.5) this.state.difficultyName = 'Intermediate';
            else if (speed < 4.0) this.state.difficultyName = 'Advanced';
            else this.state.difficultyName = 'Expert';
        } else if (this.state.scalingMode === 'chaos') {
            if (chaos < 2) this.state.difficultyName = 'Stable';
            else if (chaos < 4) this.state.difficultyName = 'Chaotic';
            else if (chaos < 6) this.state.difficultyName = 'Pandemonium';
            else this.state.difficultyName = 'Apocalypse';
        } else { // hybrid
            const totalDifficulty = (speed - 1) * 2 + chaos;
            if (totalDifficulty < 2) this.state.difficultyName = 'Beginner';
            else if (totalDifficulty < 4) this.state.difficultyName = 'Intermediate';
            else if (totalDifficulty < 6) this.state.difficultyName = 'Advanced';
            else if (totalDifficulty < 8) this.state.difficultyName = 'Expert';
            else if (totalDifficulty < 10) this.state.difficultyName = 'Master';
            else this.state.difficultyName = 'Legendary';
        }
    }
    
    public getState(): DifficultyState {
        return { ...this.state };
    }
    
    public getDropInterval(): number {
        const baseInterval = this.config.progression.baseDropInterval;
        return Math.max(50, Math.floor(baseInterval / this.state.speedMultiplier));
    }
    
    public reset(): void {
        this.state = {
            currentLevel: 1,
            linesCleared: 0,
            speedMultiplier: 1.0,
            chaosLevel: 0,
            nextRuleThreshold: this.config.difficultyScaling.chaosScaling.newRuleFrequency,
            difficultyName: 'Beginner',
            scalingMode: this.config.difficultyScaling.mode
        };
        this.lastRuleAddition = 0;
        this.lastSpeedEmitted = 1.0;
    }
    
    public setScalingMode(mode: 'speed' | 'chaos' | 'hybrid'): void {
        this.state.scalingMode = mode;
        this.config.difficultyScaling.mode = mode;
        this.updateDifficultyName();
        
        console.log(`🎚️ Difficulty scaling mode changed to: ${mode}`);
    }
    
    private emitSpeedChangeEvent(oldSpeed: number, newSpeed: number): void {
        const dropInterval = this.getDropInterval();
        
        const eventDetail: SpeedChangeEventDetail = {
            oldSpeed,
            newSpeed,
            dropInterval,
            speedChange: newSpeed - oldSpeed,
            level: this.state.currentLevel,
            difficultyName: this.state.difficultyName
        };
        
        const event = new CustomEvent('speedChange', {
            detail: eventDetail
        });
        
        window.dispatchEvent(event);
        
        console.log(`⚡ Speed change: ${oldSpeed.toFixed(2)}x → ${newSpeed.toFixed(2)}x (${dropInterval}ms interval)`);
    }
}