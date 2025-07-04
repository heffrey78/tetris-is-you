export interface GameConfig {
    initialRules: Array<{
        noun: string;
        property: string;
        priority: number;
    }>;
    spellDurations: {
        explosion: number;
        lightning: number;
        acidBath: number;
        shield: number;
        freeze: number;
        magnet: number;
        teleport: number;
        multiply: number;
        heal: number;
        transform: number;
    };
    progression: {
        baseDropInterval: number;
        speedIncreasePerLevel: number;
        linesPerLevel: number;
    };
    visual: {
        enableEnhancedEffects: boolean;
        glowIntensity: number;
        animationSpeed: number;
        effectQuality: 'low' | 'medium' | 'high' | 'ultra';
    };
    throttling: {
        maxEffectsPerSecond: number;
        effectCooldownMs: number;
    };
    effectIntensity: {
        particleCount: number;
        lightningComplexity: number;
        explosionRadius: number;
        sparkDensity: number;
        glowRadius: number;
        animationDuration: number;
        maxConcurrentEffects: number;
    };
}
export declare const DEFAULT_CONFIG: GameConfig;
export declare const DIFFICULTY_CONFIGS: {
    EASY: {
        initialRules: {
            noun: string;
            property: string;
            priority: number;
        }[];
        spellDurations: {
            explosion: number;
            acidBath: number;
            lightning: number;
            shield: number;
            freeze: number;
            magnet: number;
            teleport: number;
            multiply: number;
            heal: number;
            transform: number;
        };
        progression: {
            baseDropInterval: number;
            speedIncreasePerLevel: number;
            linesPerLevel: number;
        };
        visual: {
            enableEnhancedEffects: boolean;
            glowIntensity: number;
            animationSpeed: number;
            effectQuality: "low" | "medium" | "high" | "ultra";
        };
        throttling: {
            maxEffectsPerSecond: number;
            effectCooldownMs: number;
        };
        effectIntensity: {
            particleCount: number;
            lightningComplexity: number;
            explosionRadius: number;
            sparkDensity: number;
            glowRadius: number;
            animationDuration: number;
            maxConcurrentEffects: number;
        };
    };
    NORMAL: GameConfig;
    HARD: {
        initialRules: {
            noun: string;
            property: string;
            priority: number;
        }[];
        spellDurations: {
            explosion: number;
            acidBath: number;
            lightning: number;
            shield: number;
            freeze: number;
            magnet: number;
            teleport: number;
            multiply: number;
            heal: number;
            transform: number;
        };
        progression: {
            baseDropInterval: number;
            speedIncreasePerLevel: number;
            linesPerLevel: number;
        };
        visual: {
            enableEnhancedEffects: boolean;
            glowIntensity: number;
            animationSpeed: number;
            effectQuality: "low" | "medium" | "high" | "ultra";
        };
        throttling: {
            maxEffectsPerSecond: number;
            effectCooldownMs: number;
        };
        effectIntensity: {
            particleCount: number;
            lightningComplexity: number;
            explosionRadius: number;
            sparkDensity: number;
            glowRadius: number;
            animationDuration: number;
            maxConcurrentEffects: number;
        };
    };
};
export declare const EFFECT_QUALITY_PRESETS: {
    low: {
        particleCount: number;
        lightningComplexity: number;
        explosionRadius: number;
        sparkDensity: number;
        glowRadius: number;
        animationDuration: number;
        maxConcurrentEffects: number;
    };
    medium: {
        particleCount: number;
        lightningComplexity: number;
        explosionRadius: number;
        sparkDensity: number;
        glowRadius: number;
        animationDuration: number;
        maxConcurrentEffects: number;
    };
    high: {
        particleCount: number;
        lightningComplexity: number;
        explosionRadius: number;
        sparkDensity: number;
        glowRadius: number;
        animationDuration: number;
        maxConcurrentEffects: number;
    };
    ultra: {
        particleCount: number;
        lightningComplexity: number;
        explosionRadius: number;
        sparkDensity: number;
        glowRadius: number;
        animationDuration: number;
        maxConcurrentEffects: number;
    };
};
