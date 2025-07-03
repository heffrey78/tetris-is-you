export interface TeleportOptions {
    gridPosition: { x: number; y: number };
    targetPosition?: { x: number; y: number };
    intensity: number;
    duration: number;
    autoRemove: boolean;
}

interface Portal {
    x: number;
    y: number;
    radius: number;
    maxRadius: number;
    life: number;
    decay: number;
    rotationSpeed: number;
    rotation: number;
    isDestination: boolean;
}

interface VortexParticle {
    x: number;
    y: number;
    angle: number;
    distance: number;
    targetDistance: number;
    angularVelocity: number;
    life: number;
    decay: number;
    size: number;
    color: string;
}

interface WarpBeam {
    startX: number;
    startY: number;
    endX: number;
    endY: number;
    life: number;
    decay: number;
    thickness: number;
    segments: Array<{ x: number; y: number }>;
}

export class TeleportEffect {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private gridX: number;
    private gridY: number;
    private targetX: number;
    private targetY: number;
    private intensity: number;
    private duration: number;
    private autoRemove: boolean;
    private startTime: number;
    private portals: Portal[] = [];
    private vortexParticles: VortexParticle[] = [];
    private warpBeams: WarpBeam[] = [];
    private cellSize: number = 32;
    private isComplete: boolean = false;
    
    constructor(canvas: HTMLCanvasElement, options: TeleportOptions) {
        this.canvas = canvas;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Cannot get canvas context');
        this.ctx = ctx;
        
        this.gridX = options.gridPosition.x;
        this.gridY = options.gridPosition.y;
        
        // If no target specified, create a random target
        if (options.targetPosition) {
            this.targetX = options.targetPosition.x;
            this.targetY = options.targetPosition.y;
        } else {
            this.targetX = Math.floor(Math.random() * 20);
            this.targetY = Math.floor(Math.random() * 20);
        }
        
        this.intensity = options.intensity;
        this.duration = options.duration;
        this.autoRemove = options.autoRemove;
        this.startTime = Date.now();
        
        this.initializeTeleportEffect();
    }
    
    private initializeTeleportEffect(): void {
        const sourcePixel = this.gridToPixel(this.gridX, this.gridY);
        const targetPixel = this.gridToPixel(this.targetX, this.targetY);
        
        // Create source portal
        this.createPortal(sourcePixel.x, sourcePixel.y, false);
        
        // Create destination portal (delayed)
        setTimeout(() => {
            this.createPortal(targetPixel.x, targetPixel.y, true);
        }, 300);
        
        // Create warp beam between portals
        setTimeout(() => {
            this.createWarpBeam(sourcePixel.x, sourcePixel.y, targetPixel.x, targetPixel.y);
        }, 500);
        
        // Create vortex particles
        this.createVortexParticles(sourcePixel.x, sourcePixel.y);
        setTimeout(() => {
            this.createVortexParticles(targetPixel.x, targetPixel.y);
        }, 400);
    }
    
    private createPortal(x: number, y: number, isDestination: boolean): void {
        this.portals.push({
            x,
            y,
            radius: 0,
            maxRadius: 30 + this.intensity * 10,
            life: 1.0,
            decay: 0.003,
            rotationSpeed: isDestination ? -0.08 : 0.08,
            rotation: 0,
            isDestination
        });
    }
    
    private createVortexParticles(centerX: number, centerY: number): void {
        const particleCount = 12 + Math.floor(this.intensity * 8);
        
        for (let i = 0; i < particleCount; i++) {
            const angle = (Math.PI * 2 * i) / particleCount + Math.random() * 0.5;
            const distance = 60 + Math.random() * 40;
            
            const colors = ['#9966FF', '#CC66FF', '#FF66CC', '#66CCFF', '#FFFFFF'];
            
            this.vortexParticles.push({
                x: centerX,
                y: centerY,
                angle,
                distance,
                targetDistance: 10 + Math.random() * 15,
                angularVelocity: 0.02 + Math.random() * 0.03,
                life: 1.0,
                decay: 0.003 + Math.random() * 0.002,
                size: 2 + Math.random() * 3,
                color: colors[Math.floor(Math.random() * colors.length)]
            });
        }
    }
    
    private createWarpBeam(startX: number, startY: number, endX: number, endY: number): void {
        const segments: Array<{ x: number; y: number }> = [];
        const segmentCount = 10;
        
        for (let i = 0; i <= segmentCount; i++) {
            const progress = i / segmentCount;
            let x = startX + (endX - startX) * progress;
            let y = startY + (endY - startY) * progress;
            
            // Add waviness to the beam
            if (i > 0 && i < segmentCount) {
                const waveAmount = 20 * Math.sin(progress * Math.PI * 3);
                const perpX = -(endY - startY);
                const perpY = (endX - startX);
                const perpLength = Math.sqrt(perpX * perpX + perpY * perpY);
                
                if (perpLength > 0) {
                    x += (perpX / perpLength) * waveAmount;
                    y += (perpY / perpLength) * waveAmount;
                }
            }
            
            segments.push({ x, y });
        }
        
        this.warpBeams.push({
            startX,
            startY,
            endX,
            endY,
            life: 1.0,
            decay: 0.004,
            thickness: 3 + this.intensity,
            segments
        });
    }
    
    private gridToPixel(gridX: number, gridY: number): { x: number; y: number } {
        return {
            x: gridX * this.cellSize + this.cellSize / 2,
            y: gridY * this.cellSize + this.cellSize / 2
        };
    }
    
    private updatePortal(portal: Portal): void {
        if (portal.radius < portal.maxRadius) {
            portal.radius += 1.5;
        }
        portal.rotation += portal.rotationSpeed;
        portal.life -= portal.decay;
    }
    
    private updateVortexParticle(particle: VortexParticle): void {
        // Spiral inward
        particle.distance += (particle.targetDistance - particle.distance) * 0.05;
        particle.angle += particle.angularVelocity;
        
        // Update position
        particle.x = particle.x + Math.cos(particle.angle) * particle.distance - Math.cos(particle.angle - particle.angularVelocity) * particle.distance;
        particle.y = particle.y + Math.sin(particle.angle) * particle.distance - Math.sin(particle.angle - particle.angularVelocity) * particle.distance;
        
        particle.life -= particle.decay;
        particle.size *= 0.998;
    }
    
    private updateWarpBeam(beam: WarpBeam): void {
        beam.life -= beam.decay;
        
        // Animate beam segments for ripple effect
        beam.segments.forEach((segment, index) => {
            const time = (Date.now() - this.startTime) * 0.005;
            const waveOffset = Math.sin(time + index * 0.3) * 3;
            
            const perpX = -(beam.endY - beam.startY);
            const perpY = (beam.endX - beam.startX);
            const perpLength = Math.sqrt(perpX * perpX + perpY * perpY);
            
            if (perpLength > 0) {
                segment.x += (perpX / perpLength) * waveOffset * beam.life;
                segment.y += (perpY / perpLength) * waveOffset * beam.life;
            }
        });
    }
    
    private drawPortal(portal: Portal): void {
        if (portal.life <= 0) return;
        
        this.ctx.save();
        this.ctx.translate(portal.x, portal.y);
        this.ctx.rotate(portal.rotation);
        
        // Draw outer ring
        this.ctx.globalAlpha = portal.life * 0.5;
        this.ctx.strokeStyle = portal.isDestination ? '#FF66CC' : '#9966FF';
        this.ctx.lineWidth = 4;
        this.ctx.shadowBlur = 15;
        this.ctx.shadowColor = this.ctx.strokeStyle;
        
        this.ctx.beginPath();
        this.ctx.arc(0, 0, portal.radius, 0, Math.PI * 2);
        this.ctx.stroke();
        
        // Draw inner rings with rotation
        for (let i = 1; i <= 3; i++) {
            this.ctx.globalAlpha = portal.life * (0.4 - i * 0.1);
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.arc(0, 0, portal.radius * (1 - i * 0.25), 0, Math.PI * 2);
            this.ctx.stroke();
        }
        
        // Draw swirling pattern
        this.ctx.globalAlpha = portal.life * 0.3;
        this.ctx.strokeStyle = '#FFFFFF';
        this.ctx.lineWidth = 1;
        for (let i = 0; i < 8; i++) {
            const angle = (Math.PI * 2 * i / 8) + portal.rotation * 2;
            this.ctx.beginPath();
            this.ctx.moveTo(Math.cos(angle) * portal.radius * 0.3, Math.sin(angle) * portal.radius * 0.3);
            this.ctx.lineTo(Math.cos(angle) * portal.radius * 0.8, Math.sin(angle) * portal.radius * 0.8);
            this.ctx.stroke();
        }
        
        this.ctx.restore();
    }
    
    private drawVortexParticle(particle: VortexParticle): void {
        if (particle.life <= 0) return;
        
        this.ctx.save();
        this.ctx.globalAlpha = particle.life * 0.7;
        this.ctx.fillStyle = particle.color;
        this.ctx.shadowBlur = 4;
        this.ctx.shadowColor = particle.color;
        
        this.ctx.beginPath();
        this.ctx.arc(particle.x, particle.y, Math.max(particle.size, 0.5), 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.restore();
    }
    
    private drawWarpBeam(beam: WarpBeam): void {
        if (beam.life <= 0) return;
        
        this.ctx.save();
        this.ctx.globalAlpha = beam.life * 0.7;
        this.ctx.strokeStyle = '#CCCCFF';
        this.ctx.lineWidth = beam.thickness;
        this.ctx.shadowBlur = 10;
        this.ctx.shadowColor = '#9966FF';
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
        
        // Draw beam
        this.ctx.beginPath();
        beam.segments.forEach((segment, index) => {
            if (index === 0) {
                this.ctx.moveTo(segment.x, segment.y);
            } else {
                this.ctx.lineTo(segment.x, segment.y);
            }
        });
        this.ctx.stroke();
        
        // Draw brighter inner beam
        this.ctx.strokeStyle = '#FFFFFF';
        this.ctx.lineWidth = beam.thickness * 0.5;
        this.ctx.shadowBlur = 5;
        this.ctx.beginPath();
        beam.segments.forEach((segment, index) => {
            if (index === 0) {
                this.ctx.moveTo(segment.x, segment.y);
            } else {
                this.ctx.lineTo(segment.x, segment.y);
            }
        });
        this.ctx.stroke();
        
        this.ctx.restore();
    }
    
    public update(deltaTime: number): void {
        // Update portals
        this.portals.forEach(portal => {
            this.updatePortal(portal);
        });
        this.portals = this.portals.filter(portal => portal.life > 0);
        
        // Update vortex particles
        for (let i = this.vortexParticles.length - 1; i >= 0; i--) {
            this.updateVortexParticle(this.vortexParticles[i]);
            if (this.vortexParticles[i].life <= 0) {
                this.vortexParticles.splice(i, 1);
            }
        }
        
        // Update warp beams
        for (let i = this.warpBeams.length - 1; i >= 0; i--) {
            this.updateWarpBeam(this.warpBeams[i]);
            if (this.warpBeams[i].life <= 0) {
                this.warpBeams.splice(i, 1);
            }
        }
        
        // Check if effect is complete
        const elapsedTime = Date.now() - this.startTime;
        if (elapsedTime > this.duration && 
            this.portals.length === 0 && 
            this.vortexParticles.length === 0 && 
            this.warpBeams.length === 0) {
            this.isComplete = true;
        }
    }
    
    public render(): void {
        // Draw warp beams first (background)
        this.warpBeams.forEach(beam => {
            this.drawWarpBeam(beam);
        });
        
        // Draw vortex particles
        this.vortexParticles.forEach(particle => {
            this.drawVortexParticle(particle);
        });
        
        // Draw portals on top
        this.portals.forEach(portal => {
            this.drawPortal(portal);
        });
    }
    
    public isFinished(): boolean {
        if (!this.autoRemove) return false;
        return this.isComplete;
    }
    
    public cleanup(): void {
        this.portals = [];
        this.vortexParticles = [];
        this.warpBeams = [];
    }
}