import { LAYOUT, GameState, Position, Color, TetrisBlock, PlayfieldCell, Rule } from './types.js';

export class Renderer {
    private ctx: CanvasRenderingContext2D;
    private canvas: HTMLCanvasElement;
    private playfieldWidth!: number;
    private playfieldHeight!: number;
    private playfieldStartX!: number;
    private playfieldStartY!: number;
    
    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        const context = canvas.getContext('2d');
        if (!context) {
            throw new Error('Could not get 2D rendering context');
        }
        this.ctx = context;
        
        this.calculateLayout();
    }
    
    private calculateLayout(): void {
        // Use scaled values for proper 80/20 layout
        const scaledMargin = (LAYOUT as any).SCALED_MARGIN || LAYOUT.MARGIN;
        
        this.playfieldWidth = (LAYOUT as any).PLAYFIELD_PIXEL_WIDTH || (LAYOUT.PLAYFIELD_COLS * LAYOUT.GRID_SIZE);
        this.playfieldHeight = (LAYOUT as any).PLAYFIELD_PIXEL_HEIGHT || (LAYOUT.PLAYFIELD_ROWS * LAYOUT.GRID_SIZE);
        this.playfieldStartX = scaledMargin;
        this.playfieldStartY = scaledMargin;
    }
    
    public render(gameState: GameState): void {
        this.clear();
        this.drawPlayfieldBorder();
        this.drawGrid();
        this.drawPlayfield(gameState.playfield);
        this.drawCurrentPiece(gameState.currentPiece);
        // Note: Side panel is now handled by HTML/UIManager, not canvas rendering
    }
    
    private clear(): void {
        this.ctx.fillStyle = '#000000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }
    
    private drawPlayfieldBorder(): void {
        // Draw main playfield border
        this.ctx.strokeStyle = '#666666';
        this.ctx.lineWidth = 3;
        this.ctx.strokeRect(
            this.playfieldStartX,
            this.playfieldStartY,
            this.playfieldWidth,
            this.playfieldHeight
        );
        
        // Side panel border removed - handled by HTML layout
    }
    
    private drawGrid(): void {
        this.ctx.strokeStyle = '#111111';
        this.ctx.lineWidth = 1;
        
        const gridSize = (LAYOUT as any).SCALED_GRID_SIZE || LAYOUT.GRID_SIZE;
        
        // Vertical lines
        for (let col = 0; col <= LAYOUT.PLAYFIELD_COLS; col++) {
            const x = this.playfieldStartX + (col * gridSize);
            this.ctx.beginPath();
            this.ctx.moveTo(x, this.playfieldStartY);
            this.ctx.lineTo(x, this.playfieldStartY + this.playfieldHeight);
            this.ctx.stroke();
        }
        
        // Horizontal lines
        for (let row = 0; row <= LAYOUT.PLAYFIELD_ROWS; row++) {
            const y = this.playfieldStartY + (row * gridSize);
            this.ctx.beginPath();
            this.ctx.moveTo(this.playfieldStartX, y);
            this.ctx.lineTo(this.playfieldStartX + this.playfieldWidth, y);
            this.ctx.stroke();
        }
    }
    
    private drawPlayfield(playfield: PlayfieldCell[][]): void {
        for (let row = 0; row < playfield.length; row++) {
            for (let col = 0; col < playfield[row].length; col++) {
                const block = playfield[row][col];
                if (block) {
                    this.drawBlock(col, row, block.color, block.solid);
                }
            }
        }
    }
    
    private drawCurrentPiece(piece: any): void {
        if (!piece) return;
        
        // Draw piece blocks
        if (piece.blocks) {
            piece.blocks.forEach((blockPos: Position) => {
                const worldX = piece.position.x + blockPos.x;
                const worldY = piece.position.y + blockPos.y;
                this.drawBlock(worldX, worldY, piece.color, true);
            });
        }
    }
    
    private drawBlock(gridX: number, gridY: number, color: Color, solid: boolean): void {
        const gridSize = (LAYOUT as any).SCALED_GRID_SIZE || LAYOUT.GRID_SIZE;
        const pixelX = this.playfieldStartX + (gridX * gridSize);
        const pixelY = this.playfieldStartY + (gridY * gridSize);
        
        // Draw block background
        if (solid) {
            this.ctx.fillStyle = this.colorToString(color);
        } else {
            // Ghost/transparent blocks
            this.ctx.fillStyle = this.colorToString({...color, a: 0.3});
        }
        
        this.ctx.fillRect(pixelX + 1, pixelY + 1, gridSize - 2, gridSize - 2);
        
        // Draw block border
        this.ctx.strokeStyle = solid ? '#ffffff' : '#666666';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(pixelX + 1, pixelY + 1, gridSize - 2, gridSize - 2);
    }
    
    private colorToString(color: Color): string {
        if (color.a !== undefined) {
            return `rgba(${color.r}, ${color.g}, ${color.b}, ${color.a})`;
        }
        return `rgb(${color.r}, ${color.g}, ${color.b})`;
    }
    
    
    
    
    
    
    public getGridPosition(pixelX: number, pixelY: number): Position {
        const gridSize = (LAYOUT as any).SCALED_GRID_SIZE || LAYOUT.GRID_SIZE;
        const gridX = Math.floor((pixelX - this.playfieldStartX) / gridSize);
        const gridY = Math.floor((pixelY - this.playfieldStartY) / gridSize);
        return { x: gridX, y: gridY };
    }
    
    public isInPlayfield(gridX: number, gridY: number): boolean {
        return gridX >= 0 && gridX < LAYOUT.PLAYFIELD_COLS && 
               gridY >= 0 && gridY < LAYOUT.PLAYFIELD_ROWS;
    }
}