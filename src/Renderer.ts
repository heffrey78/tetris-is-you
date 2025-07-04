import { LAYOUT, GameState, Position, Color, TetrisBlock, PlayfieldCell, Rule } from './types.js';
import { EffectManager } from './EffectManager.js';
import { RuleEffects } from './RuleEffects.js';

export class Renderer {
    private ctx: CanvasRenderingContext2D;
    private canvas: HTMLCanvasElement;
    private playfieldWidth!: number;
    private playfieldHeight!: number;
    private playfieldStartX!: number;
    private playfieldStartY!: number;
    private effectManager: EffectManager;
    
    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        const context = canvas.getContext('2d');
        if (!context) {
            throw new Error('Could not get 2D rendering context');
        }
        this.ctx = context;
        
        this.calculateLayout();
        this.effectManager = new EffectManager(canvas);
    }
    
    private calculateLayout(): void {
        // Use scaled values for proper 80/20 layout
        const scaledMargin = (LAYOUT as any).SCALED_MARGIN || LAYOUT.MARGIN;
        
        this.playfieldWidth = (LAYOUT as any).PLAYFIELD_PIXEL_WIDTH || (LAYOUT.PLAYFIELD_COLS * LAYOUT.GRID_SIZE);
        this.playfieldHeight = (LAYOUT as any).PLAYFIELD_PIXEL_HEIGHT || (LAYOUT.PLAYFIELD_ROWS * LAYOUT.GRID_SIZE);
        this.playfieldStartX = scaledMargin;
        this.playfieldStartY = scaledMargin;
    }
    
    public render(gameState: GameState, deltaTime: number = 16): void {
        this.clear();
        this.drawPlayfieldBorder();
        this.drawGrid();
        this.drawPlayfield(gameState.playfield, gameState.rules);
        this.drawCurrentPiece(gameState.currentPiece, gameState.rules);
        
        // Update and render effects
        this.effectManager.update(deltaTime);
        this.effectManager.render();
        
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
        
        // Position border consistently - inward by half line width to prevent clipping
        const borderOffset = this.ctx.lineWidth / 2;
        this.ctx.strokeRect(
            this.playfieldStartX + borderOffset,
            this.playfieldStartY + borderOffset,
            this.playfieldWidth - this.ctx.lineWidth,
            this.playfieldHeight - this.ctx.lineWidth
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
    
    private drawPlayfield(playfield: PlayfieldCell[][], rules: Rule[]): void {
        for (let row = 0; row < playfield.length; row++) {
            for (let col = 0; col < playfield[row].length; col++) {
                const block = playfield[row][col];
                if (block) {
                    this.drawEnhancedBlock(col, row, block, rules);
                }
            }
        }
    }
    
    private drawCurrentPiece(piece: any, rules: Rule[]): void {
        if (!piece) return;
        
        // Draw piece blocks
        if (piece.blocks) {
            piece.blocks.forEach((blockPos: Position) => {
                const worldX = piece.position.x + blockPos.x;
                const worldY = piece.position.y + blockPos.y;
                
                // Create a temporary block object for rule application
                const tempBlock: TetrisBlock = {
                    x: worldX,
                    y: worldY,
                    color: piece.color,
                    solid: true,
                    type: piece.type || 'BLOCK'
                };
                this.drawEnhancedBlock(worldX, worldY, tempBlock, rules);
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
    
    private drawEnhancedBlock(gridX: number, gridY: number, block: TetrisBlock, rules: Rule[]): void {
        const gridSize = (LAYOUT as any).SCALED_GRID_SIZE || LAYOUT.GRID_SIZE;
        const pixelX = this.playfieldStartX + (gridX * gridSize);
        const pixelY = this.playfieldStartY + (gridY * gridSize);
        
        // Get visual effects for this block based on active rules
        const visualEffects = RuleEffects.getVisualEffects(block, rules);
        
        // Save context for effects
        this.ctx.save();
        
        // Apply glow effect if present
        if (visualEffects.glow) {
            this.applyGlowEffect(pixelX, pixelY, gridSize, block, rules);
        }
        
        // Draw block background with proper opacity
        const opacity = visualEffects.opacity !== undefined ? visualEffects.opacity : (block.solid ? 1.0 : 0.3);
        this.ctx.fillStyle = this.colorToString({...block.color, a: opacity});
        this.ctx.fillRect(pixelX + 1, pixelY + 1, gridSize - 2, gridSize - 2);
        
        // Draw enhanced border based on block properties
        this.drawEnhancedBorder(pixelX, pixelY, gridSize, block, rules, visualEffects);
        
        // Draw pattern overlays for specific properties
        this.drawPatternOverlay(pixelX, pixelY, gridSize, block, rules, visualEffects);
        
        // Apply animation effects
        if (visualEffects.animation) {
            this.applyAnimationEffect(pixelX, pixelY, gridSize, visualEffects.animation);
        }
        
        this.ctx.restore();
    }

    private applyGlowEffect(pixelX: number, pixelY: number, gridSize: number, block: TetrisBlock, rules: Rule[]): void {
        // Determine glow color based on block properties
        let glowColor = '#ffffff';
        
        // Get applicable rules to determine glow color
        const blockRules = this.getApplicableRuleProperties(block, rules);
        
        if (blockRules.includes('BOMB')) glowColor = '#ff8800';
        else if (blockRules.includes('HEAL')) glowColor = '#00ff44';
        else if (blockRules.includes('SHIELD')) glowColor = '#0088ff';
        else if (blockRules.includes('LIGHTNING')) glowColor = '#ffff00';
        else if (blockRules.includes('WIN')) glowColor = '#ffd700';
        else if (blockRules.includes('LOSE')) glowColor = '#ff0000';
        else if (blockRules.includes('FREEZE')) glowColor = '#88ddff';
        else if (blockRules.includes('MAGNET')) glowColor = '#ff00ff';
        
        this.ctx.shadowBlur = 10;
        this.ctx.shadowColor = glowColor;
    }

    private drawEnhancedBorder(pixelX: number, pixelY: number, gridSize: number, block: TetrisBlock, rules: Rule[], visualEffects: any): void {
        const blockRules = this.getApplicableRuleProperties(block, rules);
        
        this.ctx.lineWidth = 1;
        
        if (blockRules.includes('SHIELD')) {
            // Double blue border for shield
            this.ctx.strokeStyle = '#0088ff';
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(pixelX + 1, pixelY + 1, gridSize - 2, gridSize - 2);
            this.ctx.strokeRect(pixelX + 3, pixelY + 3, gridSize - 6, gridSize - 6);
        } else if (blockRules.includes('BOMB')) {
            // Thick orange border for bomb
            this.ctx.strokeStyle = '#ff8800';
            this.ctx.lineWidth = 3;
            this.ctx.strokeRect(pixelX + 1, pixelY + 1, gridSize - 2, gridSize - 2);
        } else if (blockRules.includes('GHOST')) {
            // Dashed gray border for ghost
            this.ctx.strokeStyle = '#666666';
            this.ctx.setLineDash([4, 4]);
            this.ctx.strokeRect(pixelX + 1, pixelY + 1, gridSize - 2, gridSize - 2);
            this.ctx.setLineDash([]); // Reset line dash
        } else if (blockRules.includes('WIN')) {
            // Golden border for win
            this.ctx.strokeStyle = '#ffd700';
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(pixelX + 1, pixelY + 1, gridSize - 2, gridSize - 2);
        } else if (blockRules.includes('LOSE')) {
            // Red danger border
            this.ctx.strokeStyle = '#ff0000';
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(pixelX + 1, pixelY + 1, gridSize - 2, gridSize - 2);
        } else {
            // Default white border
            this.ctx.strokeStyle = block.solid ? '#ffffff' : '#666666';
            this.ctx.strokeRect(pixelX + 1, pixelY + 1, gridSize - 2, gridSize - 2);
        }
    }

    private drawPatternOverlay(pixelX: number, pixelY: number, gridSize: number, block: TetrisBlock, rules: Rule[], visualEffects: any): void {
        const blockRules = this.getApplicableRuleProperties(block, rules);
        const centerX = pixelX + gridSize / 2;
        const centerY = pixelY + gridSize / 2;
        
        this.ctx.save();
        
        if (blockRules.includes('MULTIPLY')) {
            // Split/clone pattern
            this.ctx.strokeStyle = '#ffffff';
            this.ctx.lineWidth = 1;
            this.ctx.setLineDash([2, 2]);
            this.ctx.beginPath();
            this.ctx.moveTo(centerX, pixelY + 2);
            this.ctx.lineTo(centerX, pixelY + gridSize - 2);
            this.ctx.moveTo(pixelX + 2, centerY);
            this.ctx.lineTo(pixelX + gridSize - 2, centerY);
            this.ctx.stroke();
            this.ctx.setLineDash([]);
        } else if (blockRules.includes('FREEZE')) {
            // Ice crystal pattern
            this.ctx.strokeStyle = '#88ddff';
            this.ctx.lineWidth = 1;
            const radius = gridSize * 0.25;
            this.ctx.beginPath();
            for (let i = 0; i < 6; i++) {
                const angle = (i * Math.PI) / 3;
                const x = centerX + Math.cos(angle) * radius;
                const y = centerY + Math.sin(angle) * radius;
                if (i === 0) this.ctx.moveTo(x, y);
                else this.ctx.lineTo(x, y);
            }
            this.ctx.closePath();
            this.ctx.stroke();
        } else if (blockRules.includes('MAGNET')) {
            // Magnetic field lines
            this.ctx.strokeStyle = '#ff00ff';
            this.ctx.lineWidth = 1;
            this.ctx.beginPath();
            this.ctx.arc(centerX - 3, centerY, 4, 0, Math.PI);
            this.ctx.arc(centerX + 3, centerY, 4, Math.PI, 0);
            this.ctx.stroke();
        } else if (blockRules.includes('TELEPORT')) {
            // Portal swirl
            this.ctx.strokeStyle = '#8800ff';
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.arc(centerX, centerY, gridSize * 0.2, 0, Math.PI * 1.5);
            this.ctx.stroke();
        } else if (blockRules.includes('HEAL')) {
            // Plus sign for healing
            this.ctx.strokeStyle = '#00ff44';
            this.ctx.lineWidth = 2;
            const size = gridSize * 0.2;
            this.ctx.beginPath();
            this.ctx.moveTo(centerX - size, centerY);
            this.ctx.lineTo(centerX + size, centerY);
            this.ctx.moveTo(centerX, centerY - size);
            this.ctx.lineTo(centerX, centerY + size);
            this.ctx.stroke();
        }
        
        this.ctx.restore();
    }

    private applyAnimationEffect(pixelX: number, pixelY: number, gridSize: number, animation: string): void {
        // For now, we'll add subtle animation hints
        // Full animations would require animation frames and timing
        const time = Date.now() * 0.001; // Convert to seconds
        
        switch (animation) {
            case 'pulse':
                // Slight scale variation for pulse effect
                const pulseScale = 1 + Math.sin(time * 4) * 0.05;
                this.ctx.transform(pulseScale, 0, 0, pulseScale, pixelX + gridSize/2, pixelY + gridSize/2);
                break;
            case 'phase':
                // Slight opacity variation for phase effect
                this.ctx.globalAlpha *= 0.7 + Math.sin(time * 3) * 0.2;
                break;
        }
    }

    private getApplicableRuleProperties(block: TetrisBlock, rules: Rule[]): string[] {
        return rules
            .filter(rule => rule.noun === 'BLOCK' || rule.noun === block.type.toUpperCase())
            .map(rule => rule.property);
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

    /**
     * Get the EffectManager instance for adding/managing effects
     */
    public getEffectManager(): EffectManager {
        return this.effectManager;
    }
}