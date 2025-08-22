export class RuleChangeEffect {
    private particles: RuleChangeParticle[] = [];
    private textAlpha: number = 1;
    private textScale: number = 1;
    private textY: number;
    private startTime: number;
    private duration: number = 3000;
    private finished: boolean = false;
    
    constructor(
        private canvas: HTMLCanvasElement,
        private ctx: CanvasRenderingContext2D,
        private ruleText: string,
        private x: number = canvas.width - 200,
        private y: number = 50
    ) {
        this.startTime = Date.now();
        this.textY = this.y;
        this.createParticles();
    }
    
    private createParticles(): void {
        // Create sparkle particles around the rule text
        for (let i = 0; i < 15; i++) {
            this.particles.push(new RuleChangeParticle(
                this.x + Math.random() * 200 - 100,
                this.y + Math.random() * 60 - 30,
                Math.random() * 2 - 1,
                Math.random() * 2 - 1
            ));
        }
    }
    
    public update(deltaTime: number): void {
        const elapsed = Date.now() - this.startTime;
        const progress = elapsed / this.duration;
        
        if (progress >= 1) {
            this.finished = true;
            return;
        }
        
        // Animation phases
        if (progress < 0.2) {
            // Slide in from right
            const slideProgress = progress / 0.2;
            this.textScale = 0.8 + slideProgress * 0.2;
            this.textAlpha = slideProgress;
        } else if (progress < 0.8) {
            // Stable display
            this.textScale = 1;
            this.textAlpha = 1;
        } else {
            // Fade out
            const fadeProgress = (progress - 0.8) / 0.2;
            this.textScale = 1 - fadeProgress * 0.2;
            this.textAlpha = 1 - fadeProgress;
        }
        
        // Update particles
        this.particles.forEach(particle => particle.update(deltaTime));
        this.particles = this.particles.filter(particle => !particle.finished);
    }
    
    public render(): void {
        this.ctx.save();
        
        // Draw background box
        this.ctx.globalAlpha = this.textAlpha * 0.9;
        this.ctx.fillStyle = '#ffff00';
        this.ctx.strokeStyle = '#ffffff';
        this.ctx.lineWidth = 2;
        
        const boxWidth = 180;
        const boxHeight = 40;
        const boxX = this.x - boxWidth / 2;
        const boxY = this.y - boxHeight / 2;
        
        this.ctx.fillRect(boxX, boxY, boxWidth, boxHeight);
        this.ctx.strokeRect(boxX, boxY, boxWidth, boxHeight);
        
        // Draw rule text
        this.ctx.globalAlpha = this.textAlpha;
        this.ctx.fillStyle = '#000000';
        this.ctx.font = `${12 * this.textScale}px Arial`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        
        const lines = this.ruleText.split('\n');
        lines.forEach((line, index) => {
            this.ctx.fillText(line, this.x, this.y + (index - lines.length / 2 + 0.5) * 14);
        });
        
        // Draw particles
        this.particles.forEach(particle => particle.render(this.ctx));
        
        this.ctx.restore();
    }
    
    public isFinished(): boolean {
        return this.finished;
    }
    
    public cleanup(): void {
        this.particles = [];
    }
}

class RuleChangeParticle {
    private life: number = 1;
    private maxLife: number = 1;
    private size: number = 2;
    public finished: boolean = false;
    
    constructor(
        private x: number,
        private y: number,
        private vx: number,
        private vy: number
    ) {
        this.maxLife = 1000 + Math.random() * 2000;
        this.life = this.maxLife;
    }
    
    public update(deltaTime: number): void {
        this.life -= deltaTime;
        
        if (this.life <= 0) {
            this.finished = true;
            return;
        }
        
        this.x += this.vx * deltaTime * 0.05;
        this.y += this.vy * deltaTime * 0.05;
        
        // Sparkle effect
        this.size = 1 + Math.sin(Date.now() * 0.01) * 0.5;
    }
    
    public render(ctx: CanvasRenderingContext2D): void {
        const alpha = this.life / this.maxLife;
        
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = '#ffffff';
        
        // Draw star shape
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