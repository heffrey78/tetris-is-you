import { TetrisBlock, Position, GameState, Rule } from './types.js';
import { RuleEngine } from './RuleEngine.js';
export interface PropertyEffect {
    name: string;
    description: string;
    applyToBlock?: (block: TetrisBlock) => TetrisBlock;
    applyToMovement?: (position: Position, gameState: GameState) => Position;
    applyToPhysics?: (block: TetrisBlock, gameState: GameState) => {
        shouldFall: boolean;
        shouldDestroy: boolean;
    };
    visualEffect?: (block: TetrisBlock) => {
        opacity?: number;
        glow?: boolean;
        animation?: string;
    };
}
export declare class RuleEffects {
    private static readonly PROPERTY_EFFECTS;
    static getEffect(property: string): PropertyEffect | null;
    static getAllEffects(): PropertyEffect[];
    static getEffectDescription(property: string): string;
    static applyRulesToBlock(block: TetrisBlock, activeRules: Rule[], ruleEngine?: RuleEngine): TetrisBlock;
    private static isThrottledEffect;
    static getVisualEffects(block: TetrisBlock, activeRules: Rule[]): any;
    static checkWinConditions(gameState: GameState, activeRules: Rule[]): boolean;
    static checkLoseConditions(gameState: GameState, activeRules: Rule[]): boolean;
}
