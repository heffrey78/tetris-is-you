export interface MultiplyOptions {
    gridPosition: { x: number; y: number };
    intensity: number;
    duration: number;
    autoRemove: boolean;
}

interface DuplicationRipple {
    x: number;
    y: number;
    radius: number;
    maxRadius: number;
    life: number;
    decay: number;
    thickness: number;
}

interface CloneParticle {
    x: number;
    y: number;
    targetX: number;
    targetY: number;
    vx: number;
    vy: number;
    life: number;
    decay: number;
    size: number;
    color: string;
    phase: number;
    phaseSpeed: number;
}

interface SplitBeam {
    startX: number;
    startY: number;
    endX: number;
    endY: number;
    life: number;
    decay: number;
    thickness: number;
}

export class MultiplyEffect {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private gridX: number;
    private gridY: number;
    private intensity: number;
    private duration: number;
    private autoRemove: boolean;
    private startTime: number;
    private ripples: DuplicationRipple[] = [];
    private particles: CloneParticle[] = [];
    private beams: SplitBeam[] = [];
    private cellSize: number = 32;
    private isComplete: boolean = false;
    
    constructor(canvas: HTMLCanvasElement, options: MultiplyOptions) {
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
        
        this.initializeMultiplyEffect();
    }
    
    private initializeMultiplyEffect(): void {
        const centerPixel = this.gridToPixel(this.gridX, this.gridY);
        
        // Create initial duplication ripple
        this.createDuplicationRipple(centerPixel.x, centerPixel.y);
        
        // Create splitting beams
        setTimeout(() => this.createSplitBeams(centerPixel.x, centerPixel.y), 200);
        
        // Create clone particles
        setTimeout(() => this.createCloneParticles(centerPixel.x, centerPixel.y), 400);
        
        // Add secondary ripples
        setTimeout(() => this.createDuplicationRipple(centerPixel.x, centerPixel.y), 600);
    }
    
    private createDuplicationRipple(x: number, y: number): void {
        const rippleCount = 2 + Math.floor(this.intensity);
        
        for (let i = 0; i < rippleCount; i++) {
            setTimeout(() => {
                this.ripples.push({
                    x,
                    y,
                    radius: 0,
                    maxRadius: 80 + this.intensity * 40,
                    life: 1.0,
                    decay: 0.006,
                    thickness: 3 + this.intensity
                });
            }, i * 150);
        }
    }
    
    private createSplitBeams(centerX: number, centerY: number): void {
        const beamCount = 4 + Math.floor(this.intensity * 2);
        
        for (let i = 0; i < beamCount; i++) {
            const angle = (Math.PI * 2 * i) / beamCount + Math.random() * 0.3;
            const length = 60 + Math.random() * 80;
            const endX = centerX + Math.cos(angle) * length;
            const endY = centerY + Math.sin(angle) * length;
            
            this.beams.push({
                startX: centerX,
                startY: centerY,
                endX,
                endY,
                life: 1.0,
                decay: 0.008,
                thickness: 2 + this.intensity
            });
        }
    }
    
    private createCloneParticles(centerX: number, centerY: number): void {
        const particleCount = 10 + Math.floor(this.intensity * 6);
        
        for (let i = 0; i < particleCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const distance = 20 + Math.random() * 60;
            const targetDistance = distance + 40 + Math.random() * 80;
            
            const startX = centerX + Math.cos(angle) * distance;
            const startY = centerY + Math.sin(angle) * distance;
            const targetX = centerX + Math.cos(angle) * targetDistance;
            const targetY = centerY + Math.sin(angle) * targetDistance;
            
            const colors = ['#00FFFF', '#00FF88', '#88FFFF', '#FFFFFF', '#CCFFCC'];
            
            this.particles.push({
                x: startX,
                y: startY,
                targetX,
                targetY,
                vx: (targetX - startX) * 0.02,
                vy: (targetY - startY) * 0.02,
                life: 1.0,
                decay: 0.004 + Math.random() * 0.003,
                size: 2 + Math.random() * 4,
                color: colors[Math.floor(Math.random() * colors.length)],
                phase: Math.random() * Math.PI * 2,
                phaseSpeed: 0.1 + Math.random() * 0.1
            });
        }
    }
    
    private gridToPixel(gridX: number, gridY: number): { x: number; y: number } {
        return {
            x: gridX * this.cellSize + this.cellSize / 2,
            y: gridY * this.cellSize + this.cellSize / 2
        };
    }
    
    private updateRipple(ripple: DuplicationRipple): void {
        ripple.radius += 2 + this.intensity * 0.5;
        ripple.life -= ripple.decay;
        
        if (ripple.radius >= ripple.maxRadius) {
            ripple.life = Math.min(ripple.life, 0.5); // Start fading when max radius reached
        }
    }
    
    private updateBeam(beam: SplitBeam): void {
        beam.life -= beam.decay;
    }
    
    private updateParticle(particle: CloneParticle): void {
        // Move towards target with some drift
        particle.x += particle.vx;
        particle.y += particle.vy;
        
        // Add shimmering motion
        particle.phase += particle.phaseSpeed;
        particle.x += Math.sin(particle.phase) * 0.5;
        particle.y += Math.cos(particle.phase * 0.7) * 0.3;
        
        // Slow down as they reach target
        particle.vx *= 0.98;
        particle.vy *= 0.98;
        
        particle.life -= particle.decay;
        particle.size *= 0.995;
    }
    
    private drawRipple(ripple: DuplicationRipple): void {
        if (ripple.life <= 0) return;
        
        this.ctx.save();
        this.ctx.globalAlpha = ripple.life * 0.5;
        this.ctx.strokeStyle = '#00FFFF';
        this.ctx.lineWidth = ripple.thickness;
        this.ctx.shadowBlur = 10;
        this.ctx.shadowColor = '#00FFFF';
        
        // Draw double ring for duplication effect
        this.ctx.beginPath();
        this.ctx.arc(ripple.x, ripple.y, ripple.radius, 0, Math.PI * 2);
        this.ctx.stroke();
        
        if (ripple.radius > 15) {
            this.ctx.globalAlpha = ripple.life * 0.3;
            this.ctx.beginPath();
            this.ctx.arc(ripple.x, ripple.y, ripple.radius - 10, 0, Math.PI * 2);
            this.ctx.stroke();
        }
        
        this.ctx.restore();
    }
    
    private drawBeam(beam: SplitBeam): void {
        if (beam.life <= 0) return;
        
        this.ctx.save();
        this.ctx.globalAlpha = beam.life * 0.7;
        this.ctx.strokeStyle = '#FFFFFF';
        this.ctx.lineWidth = beam.thickness;
        this.ctx.shadowBlur = 8;
        this.ctx.shadowColor = '#00FFFF';
        this.ctx.lineCap = 'round';
        
        this.ctx.beginPath();
        this.ctx.moveTo(beam.startX, beam.startY);
        this.ctx.lineTo(beam.endX, beam.endY);
        this.ctx.stroke();
        
        // Draw brighter inner beam
        this.ctx.strokeStyle = '#00FFFF';
        this.ctx.lineWidth = beam.thickness * 0.5;
        this.ctx.shadowBlur = 4;
        this.ctx.beginPath();
        this.ctx.moveTo(beam.startX, beam.startY);
        this.ctx.lineTo(beam.endX, beam.endY);
        this.ctx.stroke();
        
        this.ctx.restore();
    }
    
    private drawParticle(particle: CloneParticle): void {
        if (particle.life <= 0) return;
        
        this.ctx.save();
        this.ctx.globalAlpha = particle.life * 0.7;
        this.ctx.fillStyle = particle.color;
        this.ctx.shadowBlur = 6;
        this.ctx.shadowColor = particle.color;
        
        // Draw shimmering star-like particle
        this.ctx.translate(particle.x, particle.y);
        this.ctx.rotate(particle.phase);
        
        const size = particle.size;
        this.ctx.beginPath();
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
        
        this.ctx.restore();
    }
    
    public update(deltaTime: number): void {
        // Update ripples
        for (let i = this.ripples.length - 1; i >= 0; i--) {
            this.updateRipple(this.ripples[i]);
            if (this.ripples[i].life <= 0) {
                this.ripples.splice(i, 1);
            }
        }
        
        // Update beams
        for (let i = this.beams.length - 1; i >= 0; i--) {
            this.updateBeam(this.beams[i]);
            if (this.beams[i].life <= 0) {
                this.beams.splice(i, 1);
            }
        }
        
        // Update particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            this.updateParticle(this.particles[i]);
            if (this.particles[i].life <= 0) {
                this.particles.splice(i, 1);
            }
        }
        
        // Check if effect is complete
        const elapsedTime = Date.now() - this.startTime;
        if (elapsedTime > this.duration && 
            this.ripples.length === 0 && 
            this.beams.length === 0 && 
            this.particles.length === 0) {
            this.isComplete = true;
        }
    }
    
    public render(): void {
        // Draw ripples first (background)
        this.ripples.forEach(ripple => {
            this.drawRipple(ripple);
        });
        
        // Draw beams
        this.beams.forEach(beam => {
            this.drawBeam(beam);
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
        this.ripples = [];
        this.beams = [];
        this.particles = [];
    }
}