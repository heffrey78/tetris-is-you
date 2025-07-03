export interface MagnetOptions {
    gridPosition: { x: number; y: number };
    intensity: number;
    duration: number;
    autoRemove: boolean;
}

interface FieldLine {
    startX: number;
    startY: number;
    endX: number;
    endY: number;
    controlX: number;
    controlY: number;
    life: number;
    decay: number;
    phase: number;
    phaseSpeed: number;
}

interface IronFiling {
    x: number;
    y: number;
    vx: number;
    vy: number;
    targetX: number;
    targetY: number;
    life: number;
    decay: number;
    size: number;
    attracted: boolean;
}

interface MagneticPulse {
    x: number;
    y: number;
    radius: number;
    maxRadius: number;
    life: number;
    decay: number;
}

export class MagnetEffect {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private gridX: number;
    private gridY: number;
    private intensity: number;
    private duration: number;
    private autoRemove: boolean;
    private startTime: number;
    private fieldLines: FieldLine[] = [];
    private ironFilings: IronFiling[] = [];
    private magneticPulses: MagneticPulse[] = [];
    private cellSize: number = 32;
    private isComplete: boolean = false;
    
    constructor(canvas: HTMLCanvasElement, options: MagnetOptions) {
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
        
        this.initializeMagnetEffect();
    }
    
    private initializeMagnetEffect(): void {
        const centerPixel = this.gridToPixel(this.gridX, this.gridY);
        
        // Create magnetic field lines
        this.createFieldLines(centerPixel.x, centerPixel.y);
        
        // Create iron filings
        this.createIronFilings(centerPixel.x, centerPixel.y);
        
        // Create magnetic pulses
        this.createMagneticPulse(centerPixel.x, centerPixel.y);
        setTimeout(() => this.createMagneticPulse(centerPixel.x, centerPixel.y), 500);
        setTimeout(() => this.createMagneticPulse(centerPixel.x, centerPixel.y), 1000);
    }
    
    private createFieldLines(centerX: number, centerY: number): void {
        const lineCount = 8 + Math.floor(this.intensity * 4);
        
        for (let i = 0; i < lineCount; i++) {
            const angle = (Math.PI * 2 * i) / lineCount;
            const distance = 80 + this.intensity * 40;
            
            // Create curved field lines
            const startX = centerX + Math.cos(angle) * 20;
            const startY = centerY + Math.sin(angle) * 20;
            const endX = centerX + Math.cos(angle) * distance;
            const endY = centerY + Math.sin(angle) * distance;
            
            // Control point for curve (perpendicular offset)
            const midX = (startX + endX) / 2;
            const midY = (startY + endY) / 2;
            const perpX = -(endY - startY) * 0.3;
            const perpY = (endX - startX) * 0.3;
            
            this.fieldLines.push({
                startX,
                startY,
                endX,
                endY,
                controlX: midX + perpX,
                controlY: midY + perpY,
                life: 1.0,
                decay: 0.002,
                phase: Math.random() * Math.PI * 2,
                phaseSpeed: 0.05 + Math.random() * 0.03
            });
        }
    }
    
    private createIronFilings(centerX: number, centerY: number): void {
        const filingCount = 25 + Math.floor(this.intensity * 15);
        
        for (let i = 0; i < filingCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const distance = 100 + Math.random() * 150;
            const startX = centerX + Math.cos(angle) * distance;
            const startY = centerY + Math.sin(angle) * distance;
            
            // Calculate target position (closer to magnet)
            const attractDistance = 30 + Math.random() * 40;
            const targetX = centerX + Math.cos(angle) * attractDistance;
            const targetY = centerY + Math.sin(angle) * attractDistance;
            
            this.ironFilings.push({
                x: startX,
                y: startY,
                vx: 0,
                vy: 0,
                targetX,
                targetY,
                life: 1.0,
                decay: 0.003 + Math.random() * 0.002,
                size: 1 + Math.random() * 2,
                attracted: false
            });
        }
    }
    
    private createMagneticPulse(x: number, y: number): void {
        this.magneticPulses.push({
            x,
            y,
            radius: 0,
            maxRadius: 60 + this.intensity * 30,
            life: 1.0,
            decay: 0.008
        });
    }
    
    private gridToPixel(gridX: number, gridY: number): { x: number; y: number } {
        return {
            x: gridX * this.cellSize + this.cellSize / 2,
            y: gridY * this.cellSize + this.cellSize / 2
        };
    }
    
    private updateFieldLine(fieldLine: FieldLine): void {
        fieldLine.phase += fieldLine.phaseSpeed;
        fieldLine.life -= fieldLine.decay;
    }
    
    private updateIronFiling(filing: IronFiling): void {
        // Calculate attraction force
        const dx = filing.targetX - filing.x;
        const dy = filing.targetY - filing.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 5) {
            const force = this.intensity * 0.1;
            filing.vx += (dx / distance) * force;
            filing.vy += (dy / distance) * force;
            filing.attracted = true;
        }
        
        // Apply movement with some friction
        filing.x += filing.vx;
        filing.y += filing.vy;
        filing.vx *= 0.95;
        filing.vy *= 0.95;
        
        filing.life -= filing.decay;
    }
    
    private updateMagneticPulse(pulse: MagneticPulse): void {
        pulse.radius += 2;
        pulse.life -= pulse.decay;
        
        if (pulse.radius >= pulse.maxRadius) {
            pulse.life = Math.min(pulse.life, 0.3);
        }
    }
    
    private drawFieldLine(fieldLine: FieldLine): void {
        if (fieldLine.life <= 0) return;
        
        this.ctx.save();
        this.ctx.globalAlpha = fieldLine.life * (0.4 + 0.3 * Math.sin(fieldLine.phase));
        this.ctx.strokeStyle = '#FF6600';
        this.ctx.lineWidth = 2;
        this.ctx.shadowBlur = 8;
        this.ctx.shadowColor = '#FF6600';
        
        // Draw curved field line
        this.ctx.beginPath();
        this.ctx.moveTo(fieldLine.startX, fieldLine.startY);
        this.ctx.quadraticCurveTo(
            fieldLine.controlX, 
            fieldLine.controlY, 
            fieldLine.endX, 
            fieldLine.endY
        );
        this.ctx.stroke();
        
        // Draw direction arrows
        const progress = 0.7;
        const currentX = this.getQuadraticBezierPoint(fieldLine.startX, fieldLine.controlX, fieldLine.endX, progress);
        const currentY = this.getQuadraticBezierPoint(fieldLine.startY, fieldLine.controlY, fieldLine.endY, progress);
        const nextX = this.getQuadraticBezierPoint(fieldLine.startX, fieldLine.controlX, fieldLine.endX, progress + 0.1);
        const nextY = this.getQuadraticBezierPoint(fieldLine.startY, fieldLine.controlY, fieldLine.endY, progress + 0.1);
        
        const angle = Math.atan2(nextY - currentY, nextX - currentX);
        const arrowSize = 8;
        
        this.ctx.beginPath();
        this.ctx.moveTo(currentX, currentY);
        this.ctx.lineTo(
            currentX - Math.cos(angle - 0.3) * arrowSize,
            currentY - Math.sin(angle - 0.3) * arrowSize
        );
        this.ctx.moveTo(currentX, currentY);
        this.ctx.lineTo(
            currentX - Math.cos(angle + 0.3) * arrowSize,
            currentY - Math.sin(angle + 0.3) * arrowSize
        );
        this.ctx.stroke();
        
        this.ctx.restore();
    }
    
    private getQuadraticBezierPoint(p0: number, p1: number, p2: number, t: number): number {
        const u = 1 - t;
        return u * u * p0 + 2 * u * t * p1 + t * t * p2;
    }
    
    private drawIronFiling(filing: IronFiling): void {
        if (filing.life <= 0) return;
        
        this.ctx.save();
        this.ctx.globalAlpha = filing.life * 0.7;
        this.ctx.fillStyle = filing.attracted ? '#666666' : '#999999';
        
        if (filing.attracted) {
            this.ctx.shadowBlur = 3;
            this.ctx.shadowColor = '#FF6600';
        }
        
        // Draw small elongated particle
        this.ctx.translate(filing.x, filing.y);
        if (filing.attracted && (filing.vx !== 0 || filing.vy !== 0)) {
            this.ctx.rotate(Math.atan2(filing.vy, filing.vx));
        }
        
        this.ctx.fillRect(-filing.size, -filing.size * 0.5, filing.size * 2, filing.size);
        
        this.ctx.restore();
    }
    
    private drawMagneticPulse(pulse: MagneticPulse): void {
        if (pulse.life <= 0) return;
        
        this.ctx.save();
        this.ctx.globalAlpha = pulse.life * 0.5;
        this.ctx.strokeStyle = '#FF6600';
        this.ctx.lineWidth = 3;
        this.ctx.shadowBlur = 12;
        this.ctx.shadowColor = '#FF6600';
        
        this.ctx.beginPath();
        this.ctx.arc(pulse.x, pulse.y, pulse.radius, 0, Math.PI * 2);
        this.ctx.stroke();
        
        this.ctx.restore();
    }
    
    public update(deltaTime: number): void {
        // Update field lines
        this.fieldLines.forEach(line => {
            this.updateFieldLine(line);
        });
        this.fieldLines = this.fieldLines.filter(line => line.life > 0);
        
        // Update iron filings
        for (let i = this.ironFilings.length - 1; i >= 0; i--) {
            this.updateIronFiling(this.ironFilings[i]);
            if (this.ironFilings[i].life <= 0) {
                this.ironFilings.splice(i, 1);
            }
        }
        
        // Update magnetic pulses
        for (let i = this.magneticPulses.length - 1; i >= 0; i--) {
            this.updateMagneticPulse(this.magneticPulses[i]);
            if (this.magneticPulses[i].life <= 0) {
                this.magneticPulses.splice(i, 1);
            }
        }
        
        // Check if effect is complete
        const elapsedTime = Date.now() - this.startTime;
        if (elapsedTime > this.duration && 
            this.fieldLines.length === 0 && 
            this.ironFilings.length === 0 && 
            this.magneticPulses.length === 0) {
            this.isComplete = true;
        }
    }
    
    public render(): void {
        // Draw magnetic pulses first (background)
        this.magneticPulses.forEach(pulse => {
            this.drawMagneticPulse(pulse);
        });
        
        // Draw field lines
        this.fieldLines.forEach(line => {
            this.drawFieldLine(line);
        });
        
        // Draw iron filings on top
        this.ironFilings.forEach(filing => {
            this.drawIronFiling(filing);
        });
    }
    
    public isFinished(): boolean {
        if (!this.autoRemove) return false;
        return this.isComplete;
    }
    
    public cleanup(): void {
        this.fieldLines = [];
        this.ironFilings = [];
        this.magneticPulses = [];
    }
}