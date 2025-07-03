export interface LightningStormOptions {
    intensity: number;
    duration: number;
    autoRemove: boolean;
}

interface LightningBolt {
    segments: Array<{ x: number; y: number }>;
    life: number;
    decay: number;
    thickness: number;
    color: string;
    branches: LightningBolt[];
    intensity: number;
}

interface ThunderCloud {
    x: number;
    y: number;
    width: number;
    height: number;
    life: number;
    decay: number;
    flashIntensity: number;
    flashTimer: number;
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

export class LightningStormEffect {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private intensity: number;
    private duration: number;
    private autoRemove: boolean;
    private startTime: number;
    private bolts: LightningBolt[] = [];
    private clouds: ThunderCloud[] = [];
    private sparks: ElectricSpark[] = [];
    private isComplete: boolean = false;
    private boltTimer: number = 0;
    
    constructor(canvas: HTMLCanvasElement, options: LightningStormOptions) {
        this.canvas = canvas;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Cannot get canvas context');
        this.ctx = ctx;
        
        this.intensity = options.intensity;
        this.duration = options.duration;
        this.autoRemove = options.autoRemove;
        this.startTime = Date.now();
        
        this.initializeLightningStorm();
    }
    
    private initializeLightningStorm(): void {
        // Create storm clouds
        this.createThunderClouds();
        
        // Start with immediate lightning
        this.createLightningBolt();
        
        // Schedule more lightning bolts
        setTimeout(() => this.createLightningBolt(), 300);
        setTimeout(() => this.createLightningBolt(), 800);
        setTimeout(() => this.createLightningBolt(), 1200);
    }
    
    private createThunderClouds(): void {
        const cloudCount = 3 + Math.floor(this.intensity);
        
        for (let i = 0; i < cloudCount; i++) {
            this.clouds.push({
                x: (this.canvas.width / cloudCount) * i + Math.random() * 100,
                y: -50 + Math.random() * 100,
                width: 150 + Math.random() * 200,
                height: 80 + Math.random() * 60,
                life: 1.0,
                decay: 0.001,
                flashIntensity: 0,
                flashTimer: 0
            });
        }
    }
    
    private createLightningBolt(): void {
        const startX = Math.random() * this.canvas.width;
        const startY = 0;
        const endX = Math.random() * this.canvas.width;
        const endY = this.canvas.height;
        
        const bolt = this.generateLightningPath(startX, startY, endX, endY, this.intensity);
        this.bolts.push(bolt);
        
        // Create sparks at impact point
        this.createElectricSparks(endX, endY, 15);
        
        // Flash nearby clouds
        this.flashNearestCloud(startX, startY);
        
        // Create branches
        if (Math.random() < 0.7) {
            const branchPoint = Math.floor(bolt.segments.length * (0.3 + Math.random() * 0.4));
            const segment = bolt.segments[branchPoint];
            if (segment) {
                const branchX = segment.x + (Math.random() - 0.5) * 200;
                const branchY = segment.y + Math.random() * 100;
                const branch = this.generateLightningPath(segment.x, segment.y, branchX, branchY, this.intensity * 0.6);
                bolt.branches.push(branch);
            }
        }
    }
    
    private generateLightningPath(startX: number, startY: number, endX: number, endY: number, intensity: number): LightningBolt {
        const segments: Array<{ x: number; y: number }> = [];
        const segmentCount = 20 + Math.floor(intensity * 10);
        
        for (let i = 0; i <= segmentCount; i++) {
            const progress = i / segmentCount;
            let x = startX + (endX - startX) * progress;
            let y = startY + (endY - startY) * progress;
            
            // Add jagged randomness
            if (i > 0 && i < segmentCount) {
                x += (Math.random() - 0.5) * 60 * intensity;
                y += (Math.random() - 0.5) * 20;
            }
            
            segments.push({ x, y });
        }
        
        return {
            segments,
            life: 1.0,
            decay: 0.02 + Math.random() * 0.01,
            thickness: 2 + intensity * 3,
            color: '#FFFFFF',
            branches: [],
            intensity
        };
    }
    
    private createElectricSparks(x: number, y: number, count: number): void {
        for (let i = 0; i < count; i++) {
            const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
            const speed = 2 + Math.random() * 8;
            
            this.sparks.push({
                x,
                y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 1.0,
                decay: 0.02 + Math.random() * 0.01,
                size: 1 + Math.random() * 3
            });
        }
    }
    
    private flashNearestCloud(x: number, y: number): void {
        let nearestCloudIndex = -1;
        let nearestDistance = Infinity;
        
        this.clouds.forEach((cloud, index) => {
            const distance = Math.sqrt((cloud.x - x) ** 2 + (cloud.y - y) ** 2);
            if (distance < nearestDistance) {
                nearestDistance = distance;
                nearestCloudIndex = index;
            }
        });
        
        if (nearestCloudIndex >= 0) {
            this.clouds[nearestCloudIndex].flashIntensity = 1.0;
            this.clouds[nearestCloudIndex].flashTimer = 200; // Flash for 200ms
        }
    }
    
    private updateLightningBolt(bolt: LightningBolt): void {
        bolt.life -= bolt.decay;
        
        // Update branches
        bolt.branches.forEach(branch => {
            this.updateLightningBolt(branch);
        });
        
        // Remove dead branches
        bolt.branches = bolt.branches.filter(branch => branch.life > 0);
    }
    
    private updateThunderCloud(cloud: ThunderCloud): void {
        cloud.life -= cloud.decay;
        
        // Update flash
        if (cloud.flashTimer > 0) {
            cloud.flashTimer -= 16; // Assuming ~60fps
            cloud.flashIntensity = Math.max(0, cloud.flashTimer / 200);
        } else {
            cloud.flashIntensity = 0;
        }
    }
    
    private updateElectricSpark(spark: ElectricSpark): void {
        spark.x += spark.vx;
        spark.y += spark.vy;
        spark.vy += 0.2; // gravity
        spark.vx *= 0.98; // air resistance
        spark.vy *= 0.98;
        spark.life -= spark.decay;
        spark.size *= 0.99;
    }
    
    private drawLightningBolt(bolt: LightningBolt): void {
        if (bolt.life <= 0) return;
        
        this.ctx.save();
        this.ctx.globalAlpha = bolt.life * 0.7;
        this.ctx.strokeStyle = bolt.color;
        this.ctx.lineWidth = bolt.thickness;
        this.ctx.shadowBlur = 15;
        this.ctx.shadowColor = '#88CCFF';
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
        
        // Draw main bolt
        this.ctx.beginPath();
        bolt.segments.forEach((segment, index) => {
            if (index === 0) {
                this.ctx.moveTo(segment.x, segment.y);
            } else {
                this.ctx.lineTo(segment.x, segment.y);
            }
        });
        this.ctx.stroke();
        
        // Draw thinner inner bolt for brightness
        this.ctx.strokeStyle = '#FFFFFF';
        this.ctx.lineWidth = bolt.thickness * 0.3;
        this.ctx.shadowBlur = 5;
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
            this.drawLightningBolt(branch);
        });
    }
    
    private drawThunderCloud(cloud: ThunderCloud): void {
        if (cloud.life <= 0) return;
        
        this.ctx.save();
        this.ctx.globalAlpha = cloud.life * 0.5;
        
        // Base cloud color
        const gradient = this.ctx.createRadialGradient(
            cloud.x + cloud.width / 2, cloud.y + cloud.height / 2, 0,
            cloud.x + cloud.width / 2, cloud.y + cloud.height / 2, cloud.width / 2
        );
        gradient.addColorStop(0, '#444444');
        gradient.addColorStop(1, '#222222');
        
        // Add flash effect
        if (cloud.flashIntensity > 0) {
            this.ctx.globalAlpha = cloud.flashIntensity * 0.4;
            this.ctx.fillStyle = '#FFFFFF';
            this.ctx.shadowBlur = 30;
            this.ctx.shadowColor = '#FFFFFF';
        } else {
            this.ctx.fillStyle = gradient;
        }
        
        // Draw cloud shape
        this.ctx.beginPath();
        this.ctx.ellipse(cloud.x + cloud.width / 2, cloud.y + cloud.height / 2, 
                        cloud.width / 2, cloud.height / 2, 0, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.restore();
    }
    
    private drawElectricSpark(spark: ElectricSpark): void {
        if (spark.life <= 0) return;
        
        this.ctx.save();
        this.ctx.globalAlpha = spark.life * 0.7;
        this.ctx.fillStyle = '#88CCFF';
        this.ctx.shadowBlur = 8;
        this.ctx.shadowColor = '#88CCFF';
        
        this.ctx.beginPath();
        this.ctx.arc(spark.x, spark.y, spark.size, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.restore();
    }
    
    public update(deltaTime: number): void {
        this.boltTimer += deltaTime;
        
        // Create new lightning bolts periodically
        if (this.boltTimer > 600 && Date.now() - this.startTime < this.duration * 0.8) {
            if (Math.random() < 0.3) { // 30% chance per frame when timer is ready
                this.createLightningBolt();
                this.boltTimer = 0;
            }
        }
        
        // Update all lightning bolts
        for (let i = this.bolts.length - 1; i >= 0; i--) {
            this.updateLightningBolt(this.bolts[i]);
            if (this.bolts[i].life <= 0) {
                this.bolts.splice(i, 1);
            }
        }
        
        // Update all clouds
        this.clouds.forEach(cloud => {
            this.updateThunderCloud(cloud);
        });
        
        // Update all sparks
        for (let i = this.sparks.length - 1; i >= 0; i--) {
            this.updateElectricSpark(this.sparks[i]);
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
        // Draw clouds first (behind lightning)
        this.clouds.forEach(cloud => {
            this.drawThunderCloud(cloud);
        });
        
        // Draw lightning bolts
        this.bolts.forEach(bolt => {
            this.drawLightningBolt(bolt);
        });
        
        // Draw sparks on top
        this.sparks.forEach(spark => {
            this.drawElectricSpark(spark);
        });
    }
    
    public isFinished(): boolean {
        if (!this.autoRemove) return false;
        return this.isComplete;
    }
    
    public cleanup(): void {
        this.bolts = [];
        this.clouds = [];
        this.sparks = [];
    }
}