import { GameConfig } from './GameConfig.js';
export declare class ConfigLoader {
    private static instance;
    private currentConfig;
    private constructor();
    static getInstance(): ConfigLoader;
    /**
     * Load configuration from a JSON file path
     * In a browser environment, this would require the JSON to be served as a static asset
     */
    loadConfig(configPath: string): Promise<GameConfig>;
    /**
     * Load configuration based on difficulty level
     */
    loadDifficultyConfig(difficulty: 'easy' | 'normal' | 'hard'): Promise<GameConfig>;
    /**
     * Validate and merge loaded config with defaults to ensure all properties exist
     */
    private validateAndMergeConfig;
    /**
     * Get current configuration
     */
    getCurrentConfig(): GameConfig;
    /**
     * Update current configuration
     */
    updateConfig(newConfig: Partial<GameConfig>): void;
    /**
     * Save current configuration to localStorage (browser persistence)
     */
    saveConfigToStorage(key?: string): void;
    /**
     * Load configuration from localStorage
     */
    loadConfigFromStorage(key?: string): GameConfig;
}
