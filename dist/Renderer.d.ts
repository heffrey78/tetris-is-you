import { GameState, Position } from './types.js';
import { EffectManager } from './EffectManager.js';
export declare class Renderer {
    private ctx;
    private canvas;
    private playfieldWidth;
    private playfieldHeight;
    private playfieldStartX;
    private playfieldStartY;
    private effectManager;
    constructor(canvas: HTMLCanvasElement);
    private calculateLayout;
    render(gameState: GameState, deltaTime?: number): void;
    private clear;
    private drawPlayfieldBorder;
    private drawGrid;
    private drawPlayfield;
    private drawCurrentPiece;
    private drawBlock;
    private drawEnhancedBlock;
    private applyGlowEffect;
    private drawEnhancedBorder;
    private drawPatternOverlay;
    private applyAnimationEffect;
    private easeInOutQuad;
    private easeInQuad;
    private easeOutQuad;
    private getApplicableRuleProperties;
    private colorToString;
    getGridPosition(pixelX: number, pixelY: number): Position;
    isInPlayfield(gridX: number, gridY: number): boolean;
    /**
     * Get the EffectManager instance for adding/managing effects
     */
    getEffectManager(): EffectManager;
}
