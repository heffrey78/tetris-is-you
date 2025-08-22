export class FloatEffect {
    private particles: FloatParticle[] = [];
    private floatBlocks: FloatBlock[] = [];
    private bubbles: Bubble[] = [];
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
        this.createFloatEffect();
    }
    
    private createFloatEffect(): void {
        const intensity = this.options.intensity || 1.0;
        const centerX = this.options.gridPosition.x;
        const centerY = this.options.gridPosition.y;
        
        // Create floating block particles
        for (let i = 0; i < Math.floor(6 * intensity); i++) {
            this.floatBlocks.push(new FloatBlock(
                centerX + (Math.random() - 0.5) * 60,
                centerY + (Math.random() - 0.5) * 60,
                Math.random() * 1.5 + 0.5, // float speed
                Math.random() * 0.3 + 0.1 // bob amplitude
            ));
        }
        
        // Create shimmer particles
        for (let i = 0; i < Math.floor(20 * intensity); i++) {
            this.particles.push(new FloatParticle(
                centerX + (Math.random() - 0.5) * 80,
                centerY + (Math.random() - 0.5) * 80,
                Math.random() * 2 + 1, // upward speed
                (Math.random() - 0.5) * 0.3 // horizontal drift
            ));
        }
        
        // Create bubbles
        for (let i = 0; i < Math.floor(12 * intensity); i++) {
            this.bubbles.push(new Bubble(
                centerX + (Math.random() - 0.5) * 60,
                centerY + (Math.random() - 0.5) * 60,
                Math.random() * 1.2 + 0.8, // rise speed
                Math.random() * 3 + 2 // size
            ));
        }
    }
    
    public update(deltaTime: number): void {
        const elapsed = Date.now() - this.startTime;
        
        if (elapsed >= this.duration) {
            this.finished = true;
            return;
        }
        
        // Update floating blocks
        this.floatBlocks.forEach(block => block.update(deltaTime));
        this.floatBlocks = this.floatBlocks.filter(block => !block.finished);
        
        // Update particles
        this.particles.forEach(particle => particle.update(deltaTime));
        this.particles = this.particles.filter(particle => !particle.finished);
        
        // Update bubbles
        this.bubbles.forEach(bubble => bubble.update(deltaTime));
        this.bubbles = this.bubbles.filter(bubble => !bubble.finished);
    }
    
    public render(): void {
        this.ctx.save();
        
        // Render bubbles first (background)
        this.bubbles.forEach(bubble => bubble.render(this.ctx));
        
        // Render floating blocks
        this.floatBlocks.forEach(block => block.render(this.ctx));
        
        // Render shimmer particles on top
        this.particles.forEach(particle => particle.render(this.ctx));
        
        this.ctx.restore();
    }
    
    public isFinished(): boolean {
        return this.finished;
    }
    
    public cleanup(): void {
        this.particles = [];
        this.floatBlocks = [];
        this.bubbles = [];
    }
}

class FloatBlock {
    private life: number;
    private maxLife: number = 2500;
    private size: number = 10;
    private bobOffset: number = 0;
    private originalY: number;
    public finished: boolean = false;
    
    constructor(
        private x: number,
        private y: number,
        private floatSpeed: number,
        private bobAmplitude: number
    ) {
        this.life = this.maxLife;
        this.originalY = y;
    }
    
    public update(deltaTime: number): void {
        this.life -= deltaTime;
        
        if (this.life <= 0) {
            this.finished = true;
            return;
        }
        
        // Float upward slowly
        this.y -= this.floatSpeed * deltaTime * 0.05;
        
        // Add bobbing motion
        this.bobOffset += deltaTime * 0.003;
        const bobY = Math.sin(this.bobOffset) * this.bobAmplitude;
        
        // Fade out as it floats away
        if (this.life < this.maxLife * 0.3) {
            this.size *= 0.998;
        }
    }
    
    public render(ctx: CanvasRenderingContext2D): void {
        const alpha = Math.min(this.life / this.maxLife, 1);
        const bobY = Math.sin(this.bobOffset) * this.bobAmplitude;
        
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.translate(this.x, this.y + bobY);
        
        // Draw floating block with glow
        ctx.shadowColor = '#87CEEB';
        ctx.shadowBlur = 8;
        ctx.fillStyle = '#87CEEB'; // sky blue
        ctx.strokeStyle = '#4682B4'; // steel blue
        ctx.lineWidth = 1;
        
        ctx.fillRect(-this.size/2, -this.size/2, this.size, this.size);
        ctx.strokeRect(-this.size/2, -this.size/2, this.size, this.size);
        
        ctx.restore();
    }
}

class FloatParticle {
    private life: number;
    private maxLife: number = 1800;
    private size: number = 1.5;
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
        
        // Move upward with slight horizontal drift
        this.y -= this.vy * deltaTime * 0.05;
        this.x += this.vx * deltaTime * 0.05;
        
        // Sparkle effect
        this.size = 1 + Math.sin(Date.now() * 0.01) * 0.5;
    }
    
    public render(ctx: CanvasRenderingContext2D): void {
        const alpha = this.life / this.maxLife;
        
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = '#E6E6FA'; // lavender shimmer
        ctx.shadowColor = '#E6E6FA';
        ctx.shadowBlur = 4;
        
        // Draw star-like shimmer
        ctx.beginPath();
        for (let i = 0; i < 4; i++) {
            const angle = (i * Math.PI) / 2;
            const x = this.x + Math.cos(angle) * this.size;
            const y = this.y + Math.sin(angle) * this.size;
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
        ctx.closePath();
        ctx.fill();
        
        ctx.restore();
    }
}

class Bubble {
    private life: number;
    private maxLife: number = 3000;
    private wobble: number = 0;
    public finished: boolean = false;
    
    constructor(
        private x: number,
        private y: number,
        private riseSpeed: number,
        private size: number
    ) {
        this.life = this.maxLife;
    }
    
    public update(deltaTime: number): void {
        this.life -= deltaTime;
        
        if (this.life <= 0) {
            this.finished = true;
            return;
        }
        
        // Rise upward
        this.y -= this.riseSpeed * deltaTime * 0.03;
        
        // Add wobble motion
        this.wobble += deltaTime * 0.002;
        const wobbleX = Math.sin(this.wobble) * 0.5;
        
        // Expand slightly as it rises
        this.size += 0.001 * deltaTime;
    }
    
    public render(ctx: CanvasRenderingContext2D): void {
        const alpha = Math.min(this.life / this.maxLife * 0.3, 0.3);
        const wobbleX = Math.sin(this.wobble) * 0.5;
        
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.strokeStyle = '#B0E0E6'; // powder blue
        ctx.lineWidth = 1;
        
        ctx.beginPath();
        ctx.arc(this.x + wobbleX, this.y, this.size, 0, Math.PI * 2);
        ctx.stroke();
        
        ctx.restore();
    }
}