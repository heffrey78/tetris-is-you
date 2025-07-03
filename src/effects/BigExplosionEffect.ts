export interface BigExplosionOptions {
    intensity: number;
    duration: number;
    autoRemove: boolean;
}

interface ExplosionParticle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    size: number;
    life: number;
    decay: number;
    color: string;
    rotation: number;
    angularVelocity: number;
    type: 'fire' | 'spark' | 'debris' | 'shockwave';
}

interface ShockwaveRing {
    x: number;
    y: number;
    radius: number;
    maxRadius: number;
    thickness: number;
    life: number;
    decay: number;
}

export class BigExplosionEffect {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private intensity: number;
    private duration: number;
    private autoRemove: boolean;
    private startTime: number;
    private particles: ExplosionParticle[] = [];
    private shockwaves: ShockwaveRing[] = [];
    private isComplete: boolean = false;
    
    constructor(canvas: HTMLCanvasElement, options: BigExplosionOptions) {
        this.canvas = canvas;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Cannot get canvas context');
        this.ctx = ctx;
        
        this.intensity = options.intensity;
        this.duration = options.duration;
        this.autoRemove = options.autoRemove;
        this.startTime = Date.now();
        
        this.initializeExplosion();
    }
    
    private initializeExplosion(): void {
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        
        // Create initial shockwave
        this.shockwaves.push({
            x: centerX,
            y: centerY,
            radius: 0,
            maxRadius: Math.max(this.canvas.width, this.canvas.height) * 0.8,
            thickness: 20,
            life: 1.0,
            decay: 0.005
        });
        
        // Add secondary shockwave slightly delayed
        setTimeout(() => {
            this.shockwaves.push({
                x: centerX,
                y: centerY,
                radius: 0,
                maxRadius: Math.max(this.canvas.width, this.canvas.height) * 0.6,
                thickness: 15,
                life: 1.0,
                decay: 0.007
            });
        }, 200);
        
        // Create explosion particles in multiple waves
        this.createParticleWave(centerX, centerY, 'fire', 50);
        
        setTimeout(() => this.createParticleWave(centerX, centerY, 'spark', 100), 100);
        setTimeout(() => this.createParticleWave(centerX, centerY, 'debris', 75), 300);
        setTimeout(() => this.createParticleWave(centerX, centerY, 'fire', 30), 500);
    }
    
    private createParticleWave(centerX: number, centerY: number, type: 'fire' | 'spark' | 'debris' | 'shockwave', count: number): void {
        for (let i = 0; i < count * this.intensity; i++) {
            const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
            const speed = this.getSpeedForType(type) * (0.5 + Math.random() * 1.5);
            
            this.particles.push({
                x: centerX,
                y: centerY,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: this.getSizeForType(type),
                life: 1.0,
                decay: this.getDecayForType(type),
                color: this.getColorForType(type),
                rotation: Math.random() * Math.PI * 2,
                angularVelocity: (Math.random() - 0.5) * 0.3,
                type
            });
        }
    }
    
    private getSpeedForType(type: string): number {
        switch (type) {
            case 'fire': return 8;
            case 'spark': return 15;
            case 'debris': return 5;
            default: return 10;
        }
    }
    
    private getSizeForType(type: string): number {
        const base = 3 + Math.random() * 8;
        switch (type) {
            case 'fire': return base * 1.5;
            case 'spark': return base * 0.5;
            case 'debris': return base * 1.2;
            default: return base;
        }
    }
    
    private getDecayForType(type: string): number {
        switch (type) {
            case 'fire': return 0.008 + Math.random() * 0.004;
            case 'spark': return 0.015 + Math.random() * 0.01;
            case 'debris': return 0.003 + Math.random() * 0.002;
            default: return 0.01;
        }
    }
    
    private getColorForType(type: string): string {
        switch (type) {
            case 'fire':
                const fireColors = ['#FF4500', '#FF6600', '#FF8800', '#FFAA00', '#FFCC00'];
                return fireColors[Math.floor(Math.random() * fireColors.length)];
            case 'spark':
                const sparkColors = ['#FFFFFF', '#FFFF88', '#FFCC88', '#88FFFF'];
                return sparkColors[Math.floor(Math.random() * sparkColors.length)];
            case 'debris':
                const debrisColors = ['#888888', '#666666', '#444444', '#AAAAAA'];
                return debrisColors[Math.floor(Math.random() * debrisColors.length)];
            default:
                return '#FFFFFF';
        }
    }
    
    private updateParticle(particle: ExplosionParticle): void {
        // Physics
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.rotation += particle.angularVelocity;
        
        // Apply different physics per type
        switch (particle.type) {
            case 'fire':
                particle.vy -= 0.2; // Fire rises
                particle.vx *= 0.98; // Air resistance
                particle.vy *= 0.98;
                break;
            case 'spark':
                particle.vy += 0.1; // Light gravity
                particle.vx *= 0.995; // Less air resistance
                particle.vy *= 0.995;
                break;
            case 'debris':
                particle.vy += 0.4; // Heavy gravity
                particle.vx *= 0.97; // More air resistance
                particle.vy *= 0.97;
                break;
        }
        
        particle.life -= particle.decay;
        particle.size *= 0.995; // Gradual size reduction
    }
    
    private updateShockwave(shockwave: ShockwaveRing): void {
        const expansionSpeed = shockwave.maxRadius / (this.duration * 0.001);
        shockwave.radius += expansionSpeed * 16; // Assuming ~60fps
        shockwave.life -= shockwave.decay;
        
        if (shockwave.radius >= shockwave.maxRadius) {
            shockwave.life = 0;
        }
    }
    
    private drawParticle(particle: ExplosionParticle): void {
        if (particle.life <= 0) return;
        
        this.ctx.save();
        this.ctx.globalAlpha = Math.min(particle.life, 1) * 0.7;
        this.ctx.translate(particle.x, particle.y);
        this.ctx.rotate(particle.rotation);
        
        // Different rendering per type
        switch (particle.type) {
            case 'fire':
                this.ctx.shadowBlur = 15;
                this.ctx.shadowColor = particle.color;
                this.ctx.fillStyle = particle.color;
                this.ctx.beginPath();
                this.ctx.arc(0, 0, particle.size, 0, Math.PI * 2);
                this.ctx.fill();
                break;
                
            case 'spark':
                this.ctx.strokeStyle = particle.color;
                this.ctx.lineWidth = 2;
                this.ctx.shadowBlur = 10;
                this.ctx.shadowColor = particle.color;
                this.ctx.beginPath();
                this.ctx.moveTo(-particle.size, 0);
                this.ctx.lineTo(particle.size, 0);
                this.ctx.moveTo(0, -particle.size);
                this.ctx.lineTo(0, particle.size);
                this.ctx.stroke();
                break;
                
            case 'debris':
                this.ctx.fillStyle = particle.color;
                this.ctx.fillRect(-particle.size/2, -particle.size/2, particle.size, particle.size);
                break;
        }
        
        this.ctx.restore();
    }
    
    private drawShockwave(shockwave: ShockwaveRing): void {
        if (shockwave.life <= 0) return;
        
        this.ctx.save();
        this.ctx.globalAlpha = shockwave.life * 0.5;
        this.ctx.strokeStyle = '#FFFFFF';
        this.ctx.lineWidth = shockwave.thickness;
        this.ctx.shadowBlur = 20;
        this.ctx.shadowColor = '#FFFFFF';
        
        this.ctx.beginPath();
        this.ctx.arc(shockwave.x, shockwave.y, shockwave.radius, 0, Math.PI * 2);
        this.ctx.stroke();
        
        this.ctx.restore();
    }
    
    public update(deltaTime: number): void {
        // Update all particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            this.updateParticle(this.particles[i]);
            if (this.particles[i].life <= 0) {
                this.particles.splice(i, 1);
            }
        }
        
        // Update all shockwaves
        for (let i = this.shockwaves.length - 1; i >= 0; i--) {
            this.updateShockwave(this.shockwaves[i]);
            if (this.shockwaves[i].life <= 0) {
                this.shockwaves.splice(i, 1);
            }
        }
        
        // Check if effect is complete
        const elapsedTime = Date.now() - this.startTime;
        if (elapsedTime > this.duration && this.particles.length === 0 && this.shockwaves.length === 0) {
            this.isComplete = true;
        }
    }
    
    public render(): void {
        // Draw shockwaves first (behind particles)
        this.shockwaves.forEach(shockwave => {
            this.drawShockwave(shockwave);
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
        this.shockwaves = [];
    }
}