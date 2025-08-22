# ComfyUI Integration for Tetris-Is-You

## Overview

This project integrates ComfyUI for AI-powered game asset generation. The integration includes:

- **Fixed ComfyUI CLI Script**: `comfy_asset_generator.py`
- **Claude Code Slash Command**: `/generate-asset`
- **Batch Asset Generator**: `generate_assets_batch.py`

## Setup Requirements

### 1. ComfyUI Server
ComfyUI should be running at `http://127.0.0.1:8188` (default)
```bash
# From ComfyUI directory
python main.py --listen 127.0.0.1 --port 8188
```

### 2. Models
Ensure you have at least one checkpoint model in `ComfyUI/models/checkpoints/`

## Usage

### Single Asset Generation (Slash Command)

Use the Claude Code slash command to generate individual assets:

```bash
/generate-asset "3D letter A block, blue background, white text" --name block_A --type block
```

**Command Options:**
- `--name`: Output filename (without extension)
- `--type`: Asset type (block|ui|background|effect) - affects size and styling
- `--steps`: Generation steps (default: 15)
- `--cfg`: CFG scale (default: 7.0)

**Asset Types:**
- **block** (512x512): Game piece blocks with 3D styling
- **ui** (256x256): Interface elements with flat design
- **background** (1024x768): Game backgrounds, atmospheric
- **effect** (256x256): Particle effects, transparent backgrounds

### Batch Asset Generation

Generate all assets from the specification:

```bash
python generate_assets_batch.py
```

This will create:
- 26 letter blocks (A-Z) with unique colors
- 6 special blocks (BOMB, WALL, SINK, FLOAT, YOU, SOLID)
- 4 UI elements (panels, buttons)
- 3 effect assets (particles, glows)

### Direct Script Usage

Use the underlying script directly:

```bash
python comfy_asset_generator.py "prompt text" --name asset_name --size 512x512
```

## Asset Specifications

### Letter Blocks (A-Z)
- **Size**: 512x512px
- **Style**: 3D with soft beveled edges
- **Colors**: Each letter has unique background color
- **Format**: PNG with transparency support

### Special Blocks
- **BOMB**: Red/orange with danger symbols
- **WALL**: Stone/brick texture, gray tones
- **SINK**: Blue with downward arrows
- **FLOAT**: Light blue with upward arrows
- **YOU**: Golden with crown/star
- **SOLID**: Neutral geometric cube

### UI Elements
- **Panels**: Semi-transparent overlays
- **Buttons**: Clean, game-consistent design
- **Size**: 256x256px for scalability

### Effect Assets
- **Explosions**: Particle systems for BOMB
- **Sparkles**: Line clear effects
- **Glows**: Rule formation highlights
- **Size**: 256x256px with transparency

## Generated Files

Assets are saved to `./assets/` directory:
```
assets/
├── block_letter_A.png
├── block_letter_B.png
├── ...
├── block_bomb.png
├── block_wall.png
├── ...
├── score_panel.png
├── explosion_particle.png
└── ...
```

## Integration with Game

### CSS Integration
```css
.block-A {
    background-image: url('./assets/block_letter_A.png');
    background-size: contain;
}
```

### JavaScript/TypeScript Integration
```typescript
// In your renderer or game logic
const blockAssets = {
    'A': './assets/block_letter_A.png',
    'B': './assets/block_letter_B.png',
    // ... etc
};
```

## Troubleshooting

### ComfyUI Not Running
```bash
# Check if server is running
curl -s http://127.0.0.1:8188/system_stats
```

### No Models Found
- Place models in `ComfyUI/models/checkpoints/`
- Supported formats: `.safetensors`, `.ckpt`

### Generation Failures
- Check ComfyUI console for errors
- Verify sufficient VRAM available
- Try reducing `--steps` or image size

### Permission Issues
```bash
chmod +x comfy_asset_generator.py
chmod +x .claude/commands/generate-asset.py
chmod +x generate_assets_batch.py
```

## Customization

### Custom Prompts
Edit `generate_assets_batch.py` to modify asset prompts:

```python
LETTER_BLOCKS = [
    {"name": "block_letter_A", "prompt": "your custom prompt", "type": "block"}
    # ...
]
```

### Custom Sizes
Modify size maps in `.claude/commands/generate-asset.py`:

```python
size_map = {
    "block": "1024x1024",  # Higher resolution
    "ui": "512x512",
    # ...
}
```

### Style Variations
Create theme variants by modifying style prompts:

```python
style_map = {
    "block": "pixel art style, 8-bit game aesthetic",  # Retro theme
    # ...
}
```

## Performance Tips

- **Batch Generation**: Use lower steps (10-15) for faster generation
- **Memory**: Generate in smaller batches if VRAM is limited
- **Quality**: Use higher steps (20-30) for final production assets

## File Structure

```
tetris-is-you/
├── comfy_asset_generator.py          # Core generator script
├── generate_assets_batch.py          # Batch generation
├── .claude/commands/generate-asset.py # Slash command
├── assets/                           # Generated assets
├── VISUAL_ASSET_SPECIFICATION.md     # Asset specifications
└── COMFYUI_INTEGRATION.md           # This documentation
```

This integration provides a complete pipeline for generating all visual assets needed for the Tetris-Is-You game using AI assistance.