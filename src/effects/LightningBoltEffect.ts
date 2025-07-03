export interface LightningBoltOptions {
    gridPosition: { x: number; y: number };
    intensity: number;
    duration: number;
    autoRemove: boolean;
    direction?: 'horizontal' | 'vertical' | 'diagonal';
}

interface BoltSegment {
    x: number;
    y: number;
}

interface ElectricBolt {
    segments: BoltSegment[];
    life: number;
    decay: number;
    thickness: number;
    intensity: number;
    branches: ElectricBolt[];
}

interface ElectricSpark {
    x: number;
    y: number;
    vx: number;
    vy: number;
    life: number;
    decay: number;
    size: number;
}

export class LightningBoltEffect {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private gridX: number;
    private gridY: number;
    private intensity: number;
    private duration: number;
    private autoRemove: boolean;
    private direction: 'horizontal' | 'vertical' | 'diagonal';
    private startTime: number;
    private bolts: ElectricBolt[] = [];
    private sparks: ElectricSpark[] = [];
    private cellSize: number = 32;
    private isComplete: boolean = false;
    
    constructor(canvas: HTMLCanvasElement, options: LightningBoltOptions) {
        this.canvas = canvas;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Cannot get canvas context');
        this.ctx = ctx;
        
        this.gridX = options.gridPosition.x;
        this.gridY = options.gridPosition.y;
        this.intensity = options.intensity;
        this.duration = options.duration;
        this.autoRemove = options.autoRemove;
        this.direction = options.direction || 'horizontal';
        this.startTime = Date.now();
        
        this.initializeLightningBolt();
    }
    
    private initializeLightningBolt(): void {
        // Create main lightning bolt across the specified direction
        this.createMainBolt();
        
        // Add delayed secondary bolts
        setTimeout(() => this.createMainBolt(), 150);
        setTimeout(() => this.createMainBolt(), 300);
    }
    
    private createMainBolt(): void {
        const startPixel = this.gridToPixel(this.gridX, this.gridY);
        let endPixel: { x: number; y: number };
        
        // Determine bolt path based on direction
        switch (this.direction) {
            case 'horizontal':
                endPixel = { x: this.canvas.width, y: startPixel.y };
                break;
            case 'vertical':
                endPixel = { x: startPixel.x, y: this.canvas.height };
                break;
            case 'diagonal':
                endPixel = { x: this.canvas.width, y: this.canvas.height };
                break;
        }
        
        const bolt = this.generateBoltPath(startPixel.x, startPixel.y, endPixel.x, endPixel.y);
        this.bolts.push(bolt);
        
        // Create sparks along the bolt path
        this.createSparksAlongBolt(bolt);
        
        // Add branches
        if (Math.random() < 0.8) {
            this.addBoltBranches(bolt);
        }
    }
    
    private generateBoltPath(startX: number, startY: number, endX: number, endY: number): ElectricBolt {
        const segments: BoltSegment[] = [];
        const segmentCount = Math.floor(Math.sqrt((endX - startX) ** 2 + (endY - startY) ** 2) / 15);
        
        for (let i = 0; i <= segmentCount; i++) {
            const progress = i / segmentCount;
            let x = startX + (endX - startX) * progress;
            let y = startY + (endY - startY) * progress;
            
            // Add jagged randomness (less for endpoints)
            if (i > 0 && i < segmentCount) {
                const jagAmount = 30 * this.intensity * (1 - Math.abs(progress - 0.5) * 2); // More jag in middle
                x += (Math.random() - 0.5) * jagAmount;
                y += (Math.random() - 0.5) * jagAmount * 0.5;
            }
            
            segments.push({ x, y });
        }
        
        return {
            segments,
            life: 1.0,
            decay: 0.015 + Math.random() * 0.01,
            thickness: 2 + this.intensity * 2,
            intensity: this.intensity,
            branches: []
        };
    }
    
    private addBoltBranches(mainBolt: ElectricBolt): void {
        const branchCount = 1 + Math.floor(this.intensity);
        
        for (let i = 0; i < branchCount; i++) {
            // Pick a random segment to branch from (middle section preferred)
            const segmentIndex = Math.floor(mainBolt.segments.length * (0.3 + Math.random() * 0.4));
            const segment = mainBolt.segments[segmentIndex];
            
            if (segment) {
                const branchLength = 50 + Math.random() * 100;
                const branchAngle = (Math.random() - 0.5) * Math.PI * 0.8; // +/- 72 degrees
                const endX = segment.x + Math.cos(branchAngle) * branchLength;
                const endY = segment.y + Math.sin(branchAngle) * branchLength;
                
                const branch = this.generateBoltPath(segment.x, segment.y, endX, endY);
                branch.intensity *= 0.7; // Branches are less intense
                branch.thickness *= 0.7;
                mainBolt.branches.push(branch);
            }
        }
    }
    
    private createSparksAlongBolt(bolt: ElectricBolt): void {
        bolt.segments.forEach((segment, index) => {
            if (index % 3 === 0 && Math.random() < 0.6) { // Every 3rd segment, 60% chance
                const sparkCount = 3 + Math.floor(Math.random() * 4);
                
                for (let i = 0; i < sparkCount; i++) {
                    const angle = Math.random() * Math.PI * 2;
                    const speed = 2 + Math.random() * 6;
                    
                    this.sparks.push({
                        x: segment.x,
                        y: segment.y,
                        vx: Math.cos(angle) * speed,
                        vy: Math.sin(angle) * speed,
                        life: 1.0,
                        decay: 0.02 + Math.random() * 0.02,
                        size: 1 + Math.random() * 3
                    });
                }
            }
        });
    }
    
    private gridToPixel(gridX: number, gridY: number): { x: number; y: number } {
        return {
            x: gridX * this.cellSize,
            y: gridY * this.cellSize
        };
    }
    
    private updateBolt(bolt: ElectricBolt): void {
        bolt.life -= bolt.decay;
        
        // Update branches
        bolt.branches.forEach(branch => {
            this.updateBolt(branch);
        });
        
        // Remove dead branches
        bolt.branches = bolt.branches.filter(branch => branch.life > 0);
    }
    
    private updateSpark(spark: ElectricSpark): void {
        spark.x += spark.vx;
        spark.y += spark.vy;
        spark.vy += 0.1; // slight gravity
        spark.vx *= 0.98; // air resistance
        spark.vy *= 0.98;
        spark.life -= spark.decay;
        spark.size *= 0.99;
    }
    
    private drawBolt(bolt: ElectricBolt): void {
        if (bolt.life <= 0) return;
        
        this.ctx.save();
        this.ctx.globalAlpha = bolt.life;
        this.ctx.strokeStyle = '#FFFFFF';
        this.ctx.lineWidth = bolt.thickness;
        this.ctx.shadowBlur = 15;
        this.ctx.shadowColor = '#88CCFF';
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
        
        // Draw main bolt outline
        this.ctx.beginPath();
        bolt.segments.forEach((segment, index) => {
            if (index === 0) {
                this.ctx.moveTo(segment.x, segment.y);
            } else {
                this.ctx.lineTo(segment.x, segment.y);
            }
        });
        this.ctx.stroke();
        
        // Draw brighter inner bolt
        this.ctx.strokeStyle = '#FFFFFF';
        this.ctx.lineWidth = bolt.thickness * 0.4;
        this.ctx.shadowBlur = 5;
        this.ctx.globalAlpha = bolt.life * 1.2;
        this.ctx.beginPath();
        bolt.segments.forEach((segment, index) => {
            if (index === 0) {
                this.ctx.moveTo(segment.x, segment.y);
            } else {
                this.ctx.lineTo(segment.x, segment.y);
            }
        });
        this.ctx.stroke();
        
        this.ctx.restore();
        
        // Draw branches
        bolt.branches.forEach(branch => {
            this.drawBolt(branch);
        });
    }
    
    private drawSpark(spark: ElectricSpark): void {
        if (spark.life <= 0) return;
        
        this.ctx.save();
        this.ctx.globalAlpha = spark.life;
        this.ctx.fillStyle = '#88CCFF';
        this.ctx.shadowBlur = 8;
        this.ctx.shadowColor = '#88CCFF';
        
        this.ctx.beginPath();
        this.ctx.arc(spark.x, spark.y, Math.max(spark.size, 0.5), 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.restore();
    }
    
    public update(deltaTime: number): void {
        // Update all bolts
        for (let i = this.bolts.length - 1; i >= 0; i--) {
            this.updateBolt(this.bolts[i]);
            if (this.bolts[i].life <= 0) {
                this.bolts.splice(i, 1);
            }
        }
        
        // Update all sparks
        for (let i = this.sparks.length - 1; i >= 0; i--) {
            this.updateSpark(this.sparks[i]);
            if (this.sparks[i].life <= 0) {
                this.sparks.splice(i, 1);
            }
        }
        
        // Check if effect is complete
        const elapsedTime = Date.now() - this.startTime;
        if (elapsedTime > this.duration && this.bolts.length === 0 && this.sparks.length === 0) {
            this.isComplete = true;
        }
    }
    
    public render(): void {
        // Draw bolts
        this.bolts.forEach(bolt => {
            this.drawBolt(bolt);
        });
        
        // Draw sparks on top
        this.sparks.forEach(spark => {
            this.drawSpark(spark);
        });
    }
    
    public isFinished(): boolean {
        if (!this.autoRemove) return false;
        return this.isComplete;
    }
    
    public cleanup(): void {
        this.bolts = [];
        this.sparks = [];
    }
}