import { GameState, Position } from './types.js';
export declare class Renderer {
    private ctx;
    private canvas;
    private playfieldWidth;
    private playfieldHeight;
    private playfieldStartX;
    private playfieldStartY;
    constructor(canvas: HTMLCanvasElement);
    private calculateLayout;
    render(gameState: GameState): void;
    private clear;
    private drawPlayfieldBorder;
    private drawGrid;
    private drawPlayfield;
    private drawCurrentPiece;
    private drawBlock;
    private colorToString;
    getGridPosition(pixelX: number, pixelY: number): Position;
    isInPlayfield(gridX: number, gridY: number): boolean;
}
