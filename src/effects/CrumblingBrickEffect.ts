export interface CrumblingBrickOptions {
    gridPosition: { x: number; y: number };
    intensity: number;
    duration: number;
    autoRemove: boolean;
}

interface BrickPiece {
    x: number;
    y: number;
    width: number;
    height: number;
    color: string;
    rotation: number;
    vx: number;
    vy: number;
    angularVelocity: number;
    life: number;
    decay: number;
    bounced: boolean;
    settled: boolean;
}

interface DustParticle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    size: number;
    life: number;
    decay: number;
    opacity: number;
}

export class CrumblingBrickEffect {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private gridX: number;
    private gridY: number;
    private intensity: number;
    private duration: number;
    private autoRemove: boolean;
    private startTime: number;
    private pieces: BrickPiece[] = [];
    private dust: DustParticle[] = [];
    private cellSize: number = 32; // Default grid cell size
    
    constructor(canvas: HTMLCanvasElement, options: CrumblingBrickOptions) {
        this.canvas = canvas;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Cannot get canvas context');
        this.ctx = ctx;
        
        this.gridX = options.gridPosition.x;
        this.gridY = options.gridPosition.y;
        this.intensity = options.intensity;
        this.duration = options.duration;
        this.autoRemove = options.autoRemove;
        this.startTime = Date.now();
        
        this.initializeCrumbling();
    }
    
    private initializeCrumbling(): void {
        // Convert grid position to pixel position
        const pixelX = this.gridX * this.cellSize;
        const pixelY = this.gridY * this.cellSize;
        
        // Create brick pieces
        const piecesX = 3 + Math.floor(this.intensity * 2);
        const piecesY = 3 + Math.floor(this.intensity * 2);
        
        for (let i = 0; i < piecesX; i++) {
            for (let j = 0; j < piecesY; j++) {
                const pieceWidth = (this.cellSize / piecesX) + (Math.random() - 0.5) * 8;
                const pieceHeight = (this.cellSize / piecesY) + (Math.random() - 0.5) * 5;
                const pieceX = pixelX + (i * this.cellSize / piecesX) + (Math.random() - 0.5) * 5;
                const pieceY = pixelY + (j * this.cellSize / piecesY) + (Math.random() - 0.5) * 5;
                
                this.pieces.push(this.createBrickPiece(pieceX, pieceY, pieceWidth, pieceHeight));
            }
        }
        
        // Create dust particles
        const dustCount = 15 + Math.floor(this.intensity * 10);
        for (let i = 0; i < dustCount; i++) {
            const dustX = pixelX + Math.random() * this.cellSize;
            const dustY = pixelY + Math.random() * this.cellSize;
            this.dust.push(this.createDustParticle(dustX, dustY));
        }
    }
    
    private createBrickPiece(x: number, y: number, width: number, height: number): BrickPiece {
        return {
            x,
            y,
            width,
            height,
            color: this.getBrickColor(),
            rotation: 0,
            vx: (Math.random() - 0.5) * 4 * this.intensity,
            vy: Math.random() * -3 - 1,
            angularVelocity: (Math.random() - 0.5) * 0.2,
            life: 1.0,
            decay: Math.random() * 0.005 + 0.002,
            bounced: false,
            settled: false
        };
    }
    
    private createDustParticle(x: number, y: number): DustParticle {
        return {
            x,
            y,
            vx: (Math.random() - 0.5) * 2 * this.intensity,
            vy: Math.random() * -2 - 0.5,
            size: Math.random() * 3 + 1,
            life: 1.0,
            decay: Math.random() * 0.02 + 0.01,
            opacity: Math.random() * 0.5 + 0.3
        };
    }
    
    private getBrickColor(): string {
        const variations = [
            '#8B4513', '#A0522D', '#CD853F', '#D2691E', '#B8860B'
        ];
        return variations[Math.floor(Math.random() * variations.length)];
    }
    
    private updateBrickPiece(piece: BrickPiece): void {
        if (piece.settled) return;
        
        // Physics
        piece.vy += 0.3; // gravity
        piece.x += piece.vx;
        piece.y += piece.vy;
        piece.rotation += piece.angularVelocity;
        
        // Air resistance
        piece.vx *= 0.99;
        piece.vy *= 0.998;
        piece.angularVelocity *= 0.98;
        
        // Bounce off ground (canvas bottom)
        if (piece.y + piece.height > this.canvas.height - 20 && !piece.bounced) {
            piece.vy *= -0.4;
            piece.vx *= 0.7;
            piece.angularVelocity *= 0.5;
            piece.bounced = true;
            
            if (Math.abs(piece.vy) < 1) {
                piece.settled = true;
                piece.vy = 0;
            }
        }
        
        // Keep within bounds
        if (piece.x < -piece.width) piece.x = -piece.width;
        if (piece.x > this.canvas.width) piece.x = this.canvas.width;
        
        piece.life -= piece.decay;
    }
    
    private updateDustParticle(particle: DustParticle): void {
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.vy += 0.05; // slight gravity
        
        particle.vx *= 0.98;
        particle.vy *= 0.98;
        
        particle.life -= particle.decay;
        particle.size *= 0.995;
    }
    
    private drawBrickPiece(piece: BrickPiece): void {
        if (piece.life <= 0) return;
        
        this.ctx.save();
        this.ctx.globalAlpha = Math.min(piece.life, 1);
        this.ctx.translate(piece.x + piece.width/2, piece.y + piece.height/2);
        this.ctx.rotate(piece.rotation);
        
        // Draw brick piece with shadow
        this.ctx.shadowBlur = 5;
        this.ctx.shadowColor = 'rgba(0,0,0,0.3)';
        this.ctx.fillStyle = piece.color;
        this.ctx.fillRect(-piece.width/2, -piece.height/2, piece.width, piece.height);
        
        // Add highlight for 3D effect
        this.ctx.shadowBlur = 0;
        this.ctx.fillStyle = this.lightenColor(piece.color, 20);
        this.ctx.fillRect(-piece.width/2, -piece.height/2, piece.width, 3);
        this.ctx.fillRect(-piece.width/2, -piece.height/2, 3, piece.height);
        
        this.ctx.restore();
    }
    
    private drawDustParticle(particle: DustParticle): void {
        if (particle.life <= 0) return;
        
        const alpha = particle.life * particle.opacity;
        this.ctx.save();
        this.ctx.globalAlpha = alpha;
        this.ctx.fillStyle = '#8b4513';
        this.ctx.shadowBlur = 3;
        this.ctx.shadowColor = '#8b4513';
        
        this.ctx.beginPath();
        this.ctx.arc(particle.x, particle.y, Math.max(particle.size, 0.5), 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.restore();
    }
    
    private lightenColor(color: string, percent: number): string {
        const r = parseInt(color.substr(1,2), 16);
        const g = parseInt(color.substr(3,2), 16);
        const b = parseInt(color.substr(5,2), 16);
        
        const newR = Math.min(255, r + percent);
        const newG = Math.min(255, g + percent);
        const newB = Math.min(255, b + percent);
        
        return `rgb(${newR}, ${newG}, ${newB})`;
    }
    
    public update(deltaTime: number): void {
        // Update all pieces
        for (let i = this.pieces.length - 1; i >= 0; i--) {
            this.updateBrickPiece(this.pieces[i]);
            if (this.pieces[i].life <= 0) {
                this.pieces.splice(i, 1);
            }
        }
        
        // Update all dust particles
        for (let i = this.dust.length - 1; i >= 0; i--) {
            this.updateDustParticle(this.dust[i]);
            if (this.dust[i].life <= 0 || this.dust[i].size < 0.5) {
                this.dust.splice(i, 1);
            }
        }
    }
    
    public render(): void {
        // Draw all dust particles
        this.dust.forEach(particle => {
            this.drawDustParticle(particle);
        });
        
        // Draw all brick pieces
        this.pieces.forEach(piece => {
            this.drawBrickPiece(piece);
        });
    }
    
    public isFinished(): boolean {
        if (!this.autoRemove) return false;
        
        const elapsedTime = Date.now() - this.startTime;
        const hasParticles = this.pieces.length > 0 || this.dust.length > 0;
        
        return elapsedTime > this.duration && !hasParticles;
    }
    
    public cleanup(): void {
        this.pieces = [];
        this.dust = [];
    }
}