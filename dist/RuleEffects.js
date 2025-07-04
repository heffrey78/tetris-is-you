export class RuleEffects {
    static getEffect(property) {
        return this.PROPERTY_EFFECTS[property.toUpperCase()] || null;
    }
    static getAllEffects() {
        return Object.values(this.PROPERTY_EFFECTS);
    }
    static getEffectDescription(property) {
        const effect = this.getEffect(property);
        return effect ? effect.description : `Unknown property: ${property}`;
    }
    static applyRulesToBlock(block, activeRules, ruleEngine) {
        let modifiedBlock = { ...block };
        // Find rules that apply to this block type, sorted by priority
        const applicableRules = activeRules
            .filter(rule => rule.noun === 'BLOCK' || rule.noun === block.type.toUpperCase())
            .sort((a, b) => (b.priority || 100) - (a.priority || 100)); // Higher priority first
        // Apply each rule's property effect with throttling check
        for (const rule of applicableRules) {
            const effect = this.getEffect(rule.property);
            if (effect && effect.applyToBlock) {
                // Check if this effect should be throttled
                if (ruleEngine && this.isThrottledEffect(rule.property)) {
                    if (ruleEngine.shouldThrottleEffect(rule.property)) {
                        console.log(`⏱️ Throttling ${rule.property} effect on block`);
                        continue; // Skip this effect due to throttling
                    }
                }
                modifiedBlock = effect.applyToBlock(modifiedBlock);
            }
        }
        return modifiedBlock;
    }
    static isThrottledEffect(property) {
        const throttledEffects = ['BOMB', 'MULTIPLY', 'SPAWN', 'TELEPORT', 'LIGHTNING'];
        return throttledEffects.includes(property);
    }
    static getVisualEffects(block, activeRules) {
        const applicableRules = activeRules.filter(rule => rule.noun === 'BLOCK' || rule.noun === block.type.toUpperCase());
        let combinedEffects = { opacity: 1.0, glow: false, animation: null };
        for (const rule of applicableRules) {
            const effect = this.getEffect(rule.property);
            if (effect && effect.visualEffect) {
                const visualEffect = effect.visualEffect(block);
                combinedEffects = { ...combinedEffects, ...visualEffect };
            }
        }
        return combinedEffects;
    }
    static checkWinConditions(gameState, activeRules) {
        const winRules = activeRules.filter(rule => rule.property === 'WIN');
        // Check if current piece or any placed block meets win conditions
        // This is a simplified check - full implementation would check piece collision with WIN blocks
        return false;
    }
    static checkLoseConditions(gameState, activeRules) {
        const loseRules = activeRules.filter(rule => rule.property === 'LOSE');
        // Check if current piece touches any LOSE blocks
        return false;
    }
}
RuleEffects.PROPERTY_EFFECTS = {
    // Destruction Spells
    'BOMB': {
        name: 'BOMB',
        description: 'Explodes when line cleared, destroying 3x3 area around it',
        applyToPhysics: (block, gameState) => {
            // Triggers explosion effect when this block is involved in line clear
            return { shouldFall: false, shouldDestroy: false };
        },
        visualEffect: () => ({ glow: true, animation: 'pulse', opacity: 1.0 })
    },
    'LIGHTNING': {
        name: 'LIGHTNING',
        description: 'Shoots lightning bolt across the row when placed, destroying blocks',
        applyToPhysics: (block, gameState) => {
            return { shouldFall: false, shouldDestroy: false };
        },
        visualEffect: () => ({ glow: true, animation: 'spark', opacity: 1.0 })
    },
    'ACID': {
        name: 'ACID',
        description: 'Dissolves blocks below it over time',
        applyToPhysics: (block, gameState) => {
            return { shouldFall: false, shouldDestroy: false };
        },
        visualEffect: () => ({ glow: true, animation: 'dissolve', opacity: 0.8 })
    },
    // Protection Spells
    'SHIELD': {
        name: 'SHIELD',
        description: 'Creates an indestructible barrier that blocks all effects',
        applyToBlock: (block) => ({ ...block, solid: true }),
        applyToPhysics: () => ({ shouldFall: false, shouldDestroy: false }),
        visualEffect: () => ({ glow: true, animation: 'barrier', opacity: 1.0 })
    },
    'FREEZE': {
        name: 'FREEZE',
        description: 'Stops time - all pieces pause for 3 seconds when this block appears',
        applyToPhysics: () => ({ shouldFall: false, shouldDestroy: false }),
        visualEffect: () => ({ glow: true, animation: 'freeze', opacity: 0.9 })
    },
    // Movement Spells
    'MAGNET': {
        name: 'MAGNET',
        description: 'Pulls all nearby blocks toward it when placed',
        applyToPhysics: (block, gameState) => {
            return { shouldFall: false, shouldDestroy: false };
        },
        visualEffect: () => ({ glow: true, animation: 'magnetic', opacity: 1.0 })
    },
    'TELEPORT': {
        name: 'TELEPORT',
        description: 'Randomly swaps positions with another block on the field',
        applyToPhysics: (block, gameState) => {
            return { shouldFall: false, shouldDestroy: false };
        },
        visualEffect: () => ({ glow: true, animation: 'portal', opacity: 0.7 })
    },
    // Creation Spells
    'MULTIPLY': {
        name: 'MULTIPLY',
        description: 'Creates a copy of itself in a random empty spot when line cleared',
        applyToPhysics: (block, gameState) => {
            return { shouldFall: false, shouldDestroy: false };
        },
        visualEffect: () => ({ glow: true, animation: 'duplicate', opacity: 1.0 })
    },
    'SPAWN': {
        name: 'SPAWN',
        description: 'Creates new random blocks above it every 5 seconds',
        applyToPhysics: (block, gameState) => {
            // Mark this block as a spawner and trigger spawning logic
            return { shouldFall: false, shouldDestroy: false };
        },
        visualEffect: () => ({ glow: true, animation: 'birth', opacity: 1.0 })
    },
    // Transformation Spells
    'TRANSFORM': {
        name: 'TRANSFORM',
        description: 'Changes adjacent blocks to match its type when placed',
        applyToPhysics: (block, gameState) => {
            return { shouldFall: false, shouldDestroy: false };
        },
        visualEffect: () => ({ glow: true, animation: 'morph', opacity: 0.9 })
    },
    // Utility Spells
    'HEAL': {
        name: 'HEAL',
        description: 'Repairs damaged blocks in a 5x5 area around it',
        applyToPhysics: (block, gameState) => {
            // HEAL blocks restore structural integrity to nearby blocks
            return { shouldFall: false, shouldDestroy: false };
        },
        visualEffect: () => ({ glow: true, animation: 'heal', opacity: 1.0, glowColor: '#00ff44' })
    },
    'REVEAL': {
        name: 'REVEAL',
        description: 'Shows ghost preview of next 3 pieces when this block is active',
        applyToPhysics: () => ({ shouldFall: false, shouldDestroy: false }),
        visualEffect: () => ({ glow: true, animation: 'insight', opacity: 0.8 })
    },
    'SLOW': {
        name: 'SLOW',
        description: 'Reduces falling speed of all pieces by 50% while active',
        applyToPhysics: () => ({ shouldFall: false, shouldDestroy: false }),
        visualEffect: () => ({ glow: true, animation: 'time', opacity: 0.9, glowColor: '#88ddff' })
    },
    'FAST': {
        name: 'FAST',
        description: 'Increases falling speed of all pieces by 70% while active',
        applyToPhysics: () => ({ shouldFall: false, shouldDestroy: false }),
        visualEffect: () => ({ glow: true, animation: 'time', opacity: 0.9, glowColor: '#ff4444' })
    },
    // Basic Properties (still needed for core gameplay)
    'SOLID': {
        name: 'SOLID',
        description: 'Blocks are solid and block movement',
        applyToBlock: (block) => ({ ...block, solid: true }),
        visualEffect: () => ({ opacity: 1.0 })
    },
    'GHOST': {
        name: 'GHOST',
        description: 'Blocks are transparent and can be passed through',
        applyToBlock: (block) => ({ ...block, solid: false }),
        visualEffect: () => ({ opacity: 0.3, animation: 'phase' })
    },
    // Color Properties (affect appearance and rules)
    'BLUE': {
        name: 'BLUE',
        description: 'Blocks are blue colored',
        applyToBlock: (block) => ({ ...block, color: { r: 0, g: 100, b: 255 } }),
        visualEffect: () => ({ opacity: 1.0 })
    },
    'RED': {
        name: 'RED',
        description: 'Blocks are red colored',
        applyToBlock: (block) => ({ ...block, color: { r: 255, g: 0, b: 0 } }),
        visualEffect: () => ({ opacity: 1.0 })
    },
    'GREEN': {
        name: 'GREEN',
        description: 'Blocks are green colored',
        applyToBlock: (block) => ({ ...block, color: { r: 0, g: 255, b: 0 } }),
        visualEffect: () => ({ opacity: 1.0 })
    },
    // Special Properties
    'WIN': {
        name: 'WIN',
        description: 'Touching this block wins the game',
        applyToPhysics: (block, gameState) => {
            // Check if player piece touches this block
            return { shouldFall: false, shouldDestroy: false };
        },
        visualEffect: () => ({ glow: true, opacity: 1.0, animation: 'pulse' })
    },
    'LOSE': {
        name: 'LOSE',
        description: 'Touching this block ends the game',
        applyToPhysics: (block, gameState) => {
            // Check if player piece touches this block  
            return { shouldFall: false, shouldDestroy: false };
        },
        visualEffect: () => ({ opacity: 0.8, animation: 'danger' })
    },
    // State Properties
    'MELT': {
        name: 'MELT',
        description: 'Blocks disappear after 10 seconds',
        applyToPhysics: (block, gameState) => {
            // Add melting timer to block if not already present
            const meltBlock = block;
            if (!meltBlock.meltTimer) {
                meltBlock.meltTimer = 10000; // 10 seconds
                meltBlock.meltStartTime = Date.now();
            }
            // Check if melt time has elapsed
            const elapsed = Date.now() - meltBlock.meltStartTime;
            if (elapsed >= meltBlock.meltTimer) {
                return { shouldFall: false, shouldDestroy: true };
            }
            return { shouldFall: false, shouldDestroy: false };
        },
        visualEffect: (block) => {
            const meltBlock = block;
            if (meltBlock.meltTimer && meltBlock.meltStartTime) {
                const elapsed = Date.now() - meltBlock.meltStartTime;
                const progress = elapsed / meltBlock.meltTimer;
                const opacity = Math.max(0.2, 1.0 - (progress * 0.8)); // Fade out as it melts
                return { opacity, animation: 'dissolve', glowColor: '#ff6600' };
            }
            return { opacity: 0.8, animation: 'dissolve', glowColor: '#ff6600' };
        }
    }
};
//# sourceMappingURL=RuleEffects.js.map