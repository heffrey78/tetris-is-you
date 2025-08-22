export class RulePreviewEffect {
    private highlightBlocks: HighlightBlock[] = [];
    private ruleText: string = '';
    private confidence: number = 0;
    private startTime: number;
    private finished: boolean = false;
    
    constructor(
        private canvas: HTMLCanvasElement,
        private ctx: CanvasRenderingContext2D,
        private blockPositions: { x: number; y: number }[],
        private potentialRule: string,
        private previewConfidence: number = 0.8
    ) {
        this.startTime = Date.now();
        this.ruleText = potentialRule;
        this.confidence = previewConfidence;
        this.createHighlightBlocks();
    }
    
    private createHighlightBlocks(): void {
        this.highlightBlocks = this.blockPositions.map(pos => 
            new HighlightBlock(pos.x, pos.y, this.confidence)
        );
    }
    
    public updateRule(newRule: string, newConfidence: number): void {
        this.ruleText = newRule;
        this.confidence = newConfidence;
        this.highlightBlocks.forEach(block => block.setConfidence(newConfidence));
    }
    
    public update(deltaTime: number): void {
        const elapsed = Date.now() - this.startTime;
        
        // Rule preview effects don't auto-finish, they're manually controlled
        if (elapsed > 10000) { // 10 second max lifetime
            this.finished = true;
            return;
        }
        
        // Update highlight blocks
        this.highlightBlocks.forEach(block => block.update(deltaTime));
    }
    
    public render(): void {
        this.ctx.save();
        
        // Render highlight blocks
        this.highlightBlocks.forEach(block => block.render(this.ctx));
        
        // Render rule preview text
        this.renderRulePreview();
        
        this.ctx.restore();
    }
    
    private renderRulePreview(): void {
        if (!this.ruleText || this.confidence < 0.3) return;
        
        const alpha = Math.min(this.confidence, 0.8);
        const x = this.canvas.width / 2;
        const y = 40;
        
        this.ctx.save();
        this.ctx.globalAlpha = alpha;
        
        // Background
        this.ctx.fillStyle = 'rgba(0, 100, 255, 0.2)';
        this.ctx.strokeStyle = 'rgba(0, 100, 255, 0.6)';
        this.ctx.lineWidth = 2;
        
        const textWidth = this.ctx.measureText(this.ruleText).width;
        const padding = 10;
        const boxWidth = textWidth + padding * 2;
        const boxHeight = 30;
        
        this.ctx.fillRect(x - boxWidth/2, y - boxHeight/2, boxWidth, boxHeight);
        this.ctx.strokeRect(x - boxWidth/2, y - boxHeight/2, boxWidth, boxHeight);
        
        // Preview text
        this.ctx.fillStyle = '#0066FF';
        this.ctx.font = '14px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(`PREVIEW: ${this.ruleText}`, x, y);
        
        // Confidence indicator
        this.ctx.fillStyle = `rgba(0, 100, 255, ${this.confidence})`;
        this.ctx.font = '10px Arial';
        this.ctx.fillText(`${Math.round(this.confidence * 100)}%`, x, y + 20);
        
        this.ctx.restore();
    }
    
    public isFinished(): boolean {
        return this.finished;
    }
    
    public cleanup(): void {
        this.highlightBlocks = [];
    }
    
    public dismiss(): void {
        this.finished = true;
    }
}

class HighlightBlock {
    private pulsePhase: number = 0;
    private confidence: number;
    private size: number = 32;
    
    constructor(
        private x: number,
        private y: number,
        initialConfidence: number
    ) {
        this.confidence = initialConfidence;
    }
    
    public setConfidence(newConfidence: number): void {
        this.confidence = newConfidence;
    }
    
    public update(deltaTime: number): void {
        this.pulsePhase += deltaTime * 0.003;
    }
    
    public render(ctx: CanvasRenderingContext2D): void {
        const alpha = Math.min(this.confidence * 0.6, 0.6);
        const pulseScale = 1 + Math.sin(this.pulsePhase) * 0.1;
        
        ctx.save();
        ctx.globalAlpha = alpha;
        
        // Highlight border
        ctx.strokeStyle = '#0066FF';
        ctx.lineWidth = 2 * pulseScale;
        ctx.strokeRect(
            this.x - this.size/2, 
            this.y - this.size/2, 
            this.size, 
            this.size
        );
        
        // Highlight fill
        ctx.fillStyle = 'rgba(0, 100, 255, 0.1)';
        ctx.fillRect(
            this.x - this.size/2, 
            this.y - this.size/2, 
            this.size, 
            this.size
        );
        
        // Corner indicators
        const cornerSize = 4 * pulseScale;
        ctx.fillStyle = '#0066FF';
        ctx.fillRect(this.x - this.size/2, this.y - this.size/2, cornerSize, cornerSize);
        ctx.fillRect(this.x + this.size/2 - cornerSize, this.y - this.size/2, cornerSize, cornerSize);
        ctx.fillRect(this.x - this.size/2, this.y + this.size/2 - cornerSize, cornerSize, cornerSize);
        ctx.fillRect(this.x + this.size/2 - cornerSize, this.y + this.size/2 - cornerSize, cornerSize, cornerSize);
        
        ctx.restore();
    }
}