import { LAYOUT } from './types.js';
export class Renderer {
    constructor(canvas) {
        this.canvas = canvas;
        const context = canvas.getContext('2d');
        if (!context) {
            throw new Error('Could not get 2D rendering context');
        }
        this.ctx = context;
        this.calculateLayout();
    }
    calculateLayout() {
        // Use scaled values for proper 80/20 layout
        const scaledMargin = LAYOUT.SCALED_MARGIN || LAYOUT.MARGIN;
        this.playfieldWidth = LAYOUT.PLAYFIELD_PIXEL_WIDTH || (LAYOUT.PLAYFIELD_COLS * LAYOUT.GRID_SIZE);
        this.playfieldHeight = LAYOUT.PLAYFIELD_PIXEL_HEIGHT || (LAYOUT.PLAYFIELD_ROWS * LAYOUT.GRID_SIZE);
        this.playfieldStartX = scaledMargin;
        this.playfieldStartY = scaledMargin;
    }
    render(gameState) {
        this.clear();
        this.drawPlayfieldBorder();
        this.drawGrid();
        this.drawPlayfield(gameState.playfield);
        this.drawCurrentPiece(gameState.currentPiece);
        // Note: Side panel is now handled by HTML/UIManager, not canvas rendering
    }
    clear() {
        this.ctx.fillStyle = '#000000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }
    drawPlayfieldBorder() {
        // Draw main playfield border
        this.ctx.strokeStyle = '#666666';
        this.ctx.lineWidth = 3;
        this.ctx.strokeRect(this.playfieldStartX, this.playfieldStartY, this.playfieldWidth, this.playfieldHeight);
        // Side panel border removed - handled by HTML layout
    }
    drawGrid() {
        this.ctx.strokeStyle = '#111111';
        this.ctx.lineWidth = 1;
        const gridSize = LAYOUT.SCALED_GRID_SIZE || LAYOUT.GRID_SIZE;
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
    drawPlayfield(playfield) {
        for (let row = 0; row < playfield.length; row++) {
            for (let col = 0; col < playfield[row].length; col++) {
                const block = playfield[row][col];
                if (block) {
                    this.drawBlock(col, row, block.color, block.solid);
                }
            }
        }
    }
    drawCurrentPiece(piece) {
        if (!piece)
            return;
        // Draw piece blocks
        if (piece.blocks) {
            piece.blocks.forEach((blockPos) => {
                const worldX = piece.position.x + blockPos.x;
                const worldY = piece.position.y + blockPos.y;
                this.drawBlock(worldX, worldY, piece.color, true);
            });
        }
    }
    drawBlock(gridX, gridY, color, solid) {
        const gridSize = LAYOUT.SCALED_GRID_SIZE || LAYOUT.GRID_SIZE;
        const pixelX = this.playfieldStartX + (gridX * gridSize);
        const pixelY = this.playfieldStartY + (gridY * gridSize);
        // Draw block background
        if (solid) {
            this.ctx.fillStyle = this.colorToString(color);
        }
        else {
            // Ghost/transparent blocks
            this.ctx.fillStyle = this.colorToString({ ...color, a: 0.3 });
        }
        this.ctx.fillRect(pixelX + 1, pixelY + 1, gridSize - 2, gridSize - 2);
        // Draw block border
        this.ctx.strokeStyle = solid ? '#ffffff' : '#666666';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(pixelX + 1, pixelY + 1, gridSize - 2, gridSize - 2);
    }
    colorToString(color) {
        if (color.a !== undefined) {
            return `rgba(${color.r}, ${color.g}, ${color.b}, ${color.a})`;
        }
        return `rgb(${color.r}, ${color.g}, ${color.b})`;
    }
    getGridPosition(pixelX, pixelY) {
        const gridSize = LAYOUT.SCALED_GRID_SIZE || LAYOUT.GRID_SIZE;
        const gridX = Math.floor((pixelX - this.playfieldStartX) / gridSize);
        const gridY = Math.floor((pixelY - this.playfieldStartY) / gridSize);
        return { x: gridX, y: gridY };
    }
    isInPlayfield(gridX, gridY) {
        return gridX >= 0 && gridX < LAYOUT.PLAYFIELD_COLS &&
            gridY >= 0 && gridY < LAYOUT.PLAYFIELD_ROWS;
    }
}
//# sourceMappingURL=Renderer.js.map