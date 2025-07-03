export interface FairyDustOptions {
    intensity: number;
    duration: number;
    autoRemove: boolean;
}

interface StarParticle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    size: number;
    life: number;
    decay: number;
    color: string;
    twinklePhase: number;
    twinkleSpeed: number;
    trailPoints: Array<{ x: number; y: number; life: number }>;
}

interface WaveRipple {
    x: number;
    y: number;
    radius: number;
    maxRadius: number;
    life: number;
    decay: number;
    color: string;
}

export class FairyDustEffect {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private intensity: number;
    private duration: number;
    private autoRemove: boolean;
    private startTime: number;
    private particles: StarParticle[] = [];
    private ripples: WaveRipple[] = [];
    private isComplete: boolean = false;
    private particleSpawnTimer: number = 0;
    
    constructor(canvas: HTMLCanvasElement, options: FairyDustOptions) {
        this.canvas = canvas;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Cannot get canvas context');
        this.ctx = ctx;
        
        this.intensity = options.intensity;
        this.duration = options.duration;
        this.autoRemove = options.autoRemove;
        this.startTime = Date.now();
        
        this.initializeFairyDust();
    }
    
    private initializeFairyDust(): void {
        // Create initial magical ripples from multiple points
        const ripplePoints = [
            { x: this.canvas.width * 0.2, y: this.canvas.height * 0.3 },
            { x: this.canvas.width * 0.8, y: this.canvas.height * 0.7 },
            { x: this.canvas.width * 0.5, y: this.canvas.height * 0.2 },
            { x: this.canvas.width * 0.3, y: this.canvas.height * 0.8 },
            { x: this.canvas.width * 0.7, y: this.canvas.height * 0.4 }
        ];
        
        ripplePoints.forEach((point, index) => {
            setTimeout(() => {
                this.createMagicalRipple(point.x, point.y);
            }, index * 300);
        });
        
        // Start creating flowing fairy dust
        this.createFairyDustWave();
    }
    
    private createMagicalRipple(x: number, y: number): void {
        const colors = ['#FFD700', '#FF69B4', '#00FFFF', '#9370DB', '#00FF7F'];
        
        for (let i = 0; i < 3; i++) {
            setTimeout(() => {
                this.ripples.push({
                    x,
                    y,
                    radius: 0,
                    maxRadius: 150 + Math.random() * 100,
                    life: 1.0,
                    decay: 0.008,
                    color: colors[Math.floor(Math.random() * colors.length)]
                });
            }, i * 200);
        }
    }
    
    private createFairyDustWave(): void {
        const particleCount = 30 + Math.floor(this.intensity * 20);
        
        for (let i = 0; i < particleCount; i++) {
            setTimeout(() => {
                this.createFairyParticle();
            }, i * 50);
        }
    }
    
    private createFairyParticle(): void {
        const startSide = Math.floor(Math.random() * 4); // 0=top, 1=right, 2=bottom, 3=left
        let x: number, y: number, vx: number, vy: number;
        
        switch (startSide) {
            case 0: // Top
                x = Math.random() * this.canvas.width;
                y = -20;
                vx = (Math.random() - 0.5) * 4;
                vy = Math.random() * 3 + 1;
                break;
            case 1: // Right
                x = this.canvas.width + 20;
                y = Math.random() * this.canvas.height;
                vx = -Math.random() * 3 - 1;
                vy = (Math.random() - 0.5) * 4;
                break;
            case 2: // Bottom
                x = Math.random() * this.canvas.width;
                y = this.canvas.height + 20;
                vx = (Math.random() - 0.5) * 4;
                vy = -Math.random() * 3 - 1;
                break;
            default: // Left
                x = -20;
                y = Math.random() * this.canvas.height;
                vx = Math.random() * 3 + 1;
                vy = (Math.random() - 0.5) * 4;
                break;
        }
        
        const colors = ['#FFD700', '#FFFFFF', '#FF69B4', '#00FFFF', '#9370DB', '#00FF7F', '#FFA500'];
        
        this.particles.push({
            x,
            y,
            vx,
            vy,
            size: 2 + Math.random() * 4,
            life: 1.0,
            decay: 0.003 + Math.random() * 0.002,
            color: colors[Math.floor(Math.random() * colors.length)],
            twinklePhase: Math.random() * Math.PI * 2,
            twinkleSpeed: 0.1 + Math.random() * 0.1,
            trailPoints: []
        });
    }
    
    private updateParticle(particle: StarParticle): void {
        // Add current position to trail
        particle.trailPoints.push({
            x: particle.x,
            y: particle.y,
            life: 1.0
        });
        
        // Limit trail length
        if (particle.trailPoints.length > 8) {
            particle.trailPoints.shift();
        }
        
        // Update trail points
        particle.trailPoints.forEach(point => {
            point.life -= 0.15;
        });
        particle.trailPoints = particle.trailPoints.filter(point => point.life > 0);
        
        // Physics with magical floating behavior
        particle.x += particle.vx;
        particle.y += particle.vy;
        
        // Add gentle swirling motion
        const time = (Date.now() - this.startTime) * 0.001;
        particle.vx += Math.sin(time * 2 + particle.x * 0.01) * 0.05;
        particle.vy += Math.cos(time * 1.5 + particle.y * 0.01) * 0.05;
        
        // Gentle drift towards center
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        const dx = centerX - particle.x;
        const dy = centerY - particle.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 0) {
            particle.vx += (dx / distance) * 0.02;
            particle.vy += (dy / distance) * 0.02;
        }
        
        // Apply light air resistance
        particle.vx *= 0.995;
        particle.vy *= 0.995;
        
        // Update twinkling
        particle.twinklePhase += particle.twinkleSpeed;
        
        particle.life -= particle.decay;
    }
    
    private updateRipple(ripple: WaveRipple): void {
        ripple.radius += 2;
        ripple.life -= ripple.decay;
        
        if (ripple.radius >= ripple.maxRadius) {
            ripple.life = 0;
        }
    }
    
    private drawParticle(particle: StarParticle): void {
        if (particle.life <= 0) return;
        
        // Draw trail first
        particle.trailPoints.forEach((point, index) => {
            if (point.life <= 0) return;
            
            this.ctx.save();
            this.ctx.globalAlpha = point.life * particle.life * 0.3;
            this.ctx.fillStyle = particle.color;
            const trailSize = particle.size * 0.5 * point.life;
            this.ctx.beginPath();
            this.ctx.arc(point.x, point.y, trailSize, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.restore();
        });
        
        // Draw main particle with twinkling effect
        this.ctx.save();
        const twinkle = 0.5 + 0.5 * Math.sin(particle.twinklePhase);
        this.ctx.globalAlpha = particle.life * (0.7 + 0.3 * twinkle);
        
        // Create star shape
        this.ctx.translate(particle.x, particle.y);
        this.ctx.fillStyle = particle.color;
        this.ctx.shadowBlur = 10 + 5 * twinkle;
        this.ctx.shadowColor = particle.color;
        
        // Draw 4-pointed star
        this.ctx.beginPath();
        const size = particle.size * (0.8 + 0.4 * twinkle);
        this.ctx.moveTo(0, -size);
        this.ctx.lineTo(size * 0.3, -size * 0.3);
        this.ctx.lineTo(size, 0);
        this.ctx.lineTo(size * 0.3, size * 0.3);
        this.ctx.lineTo(0, size);
        this.ctx.lineTo(-size * 0.3, size * 0.3);
        this.ctx.lineTo(-size, 0);
        this.ctx.lineTo(-size * 0.3, -size * 0.3);
        this.ctx.closePath();
        this.ctx.fill();
        
        // Add bright center
        this.ctx.shadowBlur = 0;
        this.ctx.globalAlpha = particle.life * twinkle;
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.beginPath();
        this.ctx.arc(0, 0, size * 0.3, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.restore();
    }
    
    private drawRipple(ripple: WaveRipple): void {
        if (ripple.life <= 0) return;
        
        this.ctx.save();
        this.ctx.globalAlpha = ripple.life * 0.6;
        this.ctx.strokeStyle = ripple.color;
        this.ctx.lineWidth = 3;
        this.ctx.shadowBlur = 15;
        this.ctx.shadowColor = ripple.color;
        
        this.ctx.beginPath();
        this.ctx.arc(ripple.x, ripple.y, ripple.radius, 0, Math.PI * 2);
        this.ctx.stroke();
        
        this.ctx.restore();
    }
    
    public update(deltaTime: number): void {
        this.particleSpawnTimer += deltaTime;
        
        // Continue spawning particles during effect
        if (this.particleSpawnTimer > 100 && Date.now() - this.startTime < this.duration * 0.8) {
            this.createFairyParticle();
            this.particleSpawnTimer = 0;
        }
        
        // Update all particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            this.updateParticle(this.particles[i]);
            if (this.particles[i].life <= 0) {
                this.particles.splice(i, 1);
            }
        }
        
        // Update all ripples
        for (let i = this.ripples.length - 1; i >= 0; i--) {
            this.updateRipple(this.ripples[i]);
            if (this.ripples[i].life <= 0) {
                this.ripples.splice(i, 1);
            }
        }
        
        // Check if effect is complete
        const elapsedTime = Date.now() - this.startTime;
        if (elapsedTime > this.duration && this.particles.length === 0 && this.ripples.length === 0) {
            this.isComplete = true;
        }
    }
    
    public render(): void {
        // Draw ripples first (behind particles)
        this.ripples.forEach(ripple => {
            this.drawRipple(ripple);
        });
        
        // Draw particles on top
        this.particles.forEach(particle => {
            this.drawParticle(particle);
        });
    }
    
    public isFinished(): boolean {
        if (!this.autoRemove) return false;
        return this.isComplete;
    }
    
    public cleanup(): void {
        this.particles = [];
        this.ripples = [];
    }
}