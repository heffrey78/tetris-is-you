export class SinkEffect {
    private particles: SinkParticle[] = [];
    private fallBlocks: FallBlock[] = [];
    private startTime: number;
    private duration: number;
    private finished: boolean = false;
    
    constructor(
        private canvas: HTMLCanvasElement,
        private ctx: CanvasRenderingContext2D,
        private options: {
            gridPosition: { x: number; y: number };
            intensity?: number;
            duration?: number;
            autoRemove?: boolean;
        }
    ) {
        this.startTime = Date.now();
        this.duration = options.duration || 2000;
        this.createSinkEffect();
    }
    
    private createSinkEffect(): void {
        const intensity = this.options.intensity || 1.0;
        const centerX = this.options.gridPosition.x;
        const centerY = this.options.gridPosition.y;
        
        // Create falling block particles
        for (let i = 0; i < Math.floor(8 * intensity); i++) {
            this.fallBlocks.push(new FallBlock(
                centerX + (Math.random() - 0.5) * 60,
                centerY + (Math.random() - 0.5) * 60,
                Math.random() * 2 + 1, // fall speed
                Math.random() * 0.5 + 0.5 // rotation speed
            ));
        }
        
        // Create dust particles
        for (let i = 0; i < Math.floor(15 * intensity); i++) {
            this.particles.push(new SinkParticle(
                centerX + (Math.random() - 0.5) * 80,
                centerY + (Math.random() - 0.5) * 40,
                Math.random() * 1 + 0.5, // vertical speed
                (Math.random() - 0.5) * 0.5 // horizontal drift
            ));
        }
    }
    
    public update(deltaTime: number): void {
        const elapsed = Date.now() - this.startTime;
        
        if (elapsed >= this.duration) {
            this.finished = true;
            return;
        }
        
        // Update falling blocks
        this.fallBlocks.forEach(block => block.update(deltaTime));
        this.fallBlocks = this.fallBlocks.filter(block => !block.finished);
        
        // Update particles
        this.particles.forEach(particle => particle.update(deltaTime));
        this.particles = this.particles.filter(particle => !particle.finished);
    }
    
    public render(): void {
        this.ctx.save();
        
        // Render falling blocks
        this.fallBlocks.forEach(block => block.render(this.ctx));
        
        // Render dust particles
        this.particles.forEach(particle => particle.render(this.ctx));
        
        this.ctx.restore();
    }
    
    public isFinished(): boolean {
        return this.finished;
    }
    
    public cleanup(): void {
        this.particles = [];
        this.fallBlocks = [];
    }
}

class FallBlock {
    private life: number;
    private maxLife: number = 2000;
    private size: number = 8;
    private rotation: number = 0;
    public finished: boolean = false;
    
    constructor(
        private x: number,
        private y: number,
        private fallSpeed: number,
        private rotationSpeed: number
    ) {
        this.life = this.maxLife;
    }
    
    public update(deltaTime: number): void {
        this.life -= deltaTime;
        
        if (this.life <= 0) {
            this.finished = true;
            return;
        }
        
        // Fall downward with acceleration
        this.y += this.fallSpeed * deltaTime * 0.1;
        this.fallSpeed += 0.002 * deltaTime; // gravity acceleration
        
        // Rotate as it falls
        this.rotation += this.rotationSpeed * deltaTime * 0.01;
        
        // Fade out as it falls
        if (this.life < this.maxLife * 0.3) {
            this.size *= 0.995;
        }
    }
    
    public render(ctx: CanvasRenderingContext2D): void {
        const alpha = Math.min(this.life / this.maxLife, 1);
        
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        
        // Draw falling block with shadow
        ctx.fillStyle = '#8B4513'; // brown color
        ctx.strokeStyle = '#654321';
        ctx.lineWidth = 1;
        
        // Shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.fillRect(-this.size/2 + 2, -this.size/2 + 2, this.size, this.size);
        
        // Block
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(-this.size/2, -this.size/2, this.size, this.size);
        ctx.strokeRect(-this.size/2, -this.size/2, this.size, this.size);
        
        ctx.restore();
    }
}

class SinkParticle {
    private life: number;
    private maxLife: number = 1500;
    private size: number = 2;
    public finished: boolean = false;
    
    constructor(
        private x: number,
        private y: number,
        private vy: number,
        private vx: number
    ) {
        this.life = this.maxLife;
    }
    
    public update(deltaTime: number): void {
        this.life -= deltaTime;
        
        if (this.life <= 0) {
            this.finished = true;
            return;
        }
        
        // Move downward with slight horizontal drift
        this.y += this.vy * deltaTime * 0.05;
        this.x += this.vx * deltaTime * 0.05;
        
        // Fade out particle
        this.size = Math.max(0, this.size * 0.999);
    }
    
    public render(ctx: CanvasRenderingContext2D): void {
        const alpha = this.life / this.maxLife;
        
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = '#D2691E'; // saddle brown dust
        
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    }
}