#!/usr/bin/env python3
"""
Claude Code slash command for generating game assets using ComfyUI
Usage: /generate-asset "prompt text" [--name asset_name] [--type block|ui|background]
"""

import sys
import os
import subprocess
import argparse
from pathlib import Path

def main():
    parser = argparse.ArgumentParser(description="Generate game assets using ComfyUI")
    parser.add_argument("prompt", help="Text prompt for asset generation")
    parser.add_argument("--name", help="Asset filename (without extension)")
    parser.add_argument("--type", choices=["block", "ui", "background", "effect"], 
                       default="block", help="Asset type (affects size and style)")
    parser.add_argument("--steps", type=int, default=15, help="Generation steps")
    parser.add_argument("--cfg", type=float, default=7.0, help="CFG scale")
    
    args = parser.parse_args()
    
    # Get project root
    project_root = Path(__file__).parent.parent.parent
    assets_dir = project_root / "assets"
    assets_dir.mkdir(exist_ok=True)
    
    # Configure based on asset type
    size_map = {
        "block": "512x512",
        "ui": "256x256", 
        "background": "1024x768",
        "effect": "256x256"
    }
    
    style_map = {
        "block": "minimalist 3D game piece, clean edges, soft shadows, game asset style",
        "ui": "clean UI element, flat design, game interface style", 
        "background": "game background, atmospheric, detailed",
        "effect": "particle effect, transparent background, game VFX style"
    }
    
    # Enhance prompt with style
    enhanced_prompt = f"{args.prompt}, {style_map[args.type]}"
    size = size_map[args.type]
    
    # Default name based on prompt if not provided
    if not args.name:
        # Simple name generation from prompt
        words = args.prompt.lower().split()[:3]
        args.name = "_".join(w for w in words if w.isalnum())
    
    # Run asset generator
    generator_path = project_root / "comfy_asset_generator.py"
    
    cmd = [
        sys.executable, str(generator_path),
        enhanced_prompt,
        "--name", args.name,
        "--steps", str(args.steps),
        "--cfg", str(args.cfg),
        "--size", size,
        "--output", str(assets_dir)
    ]
    
    print(f"🎨 Generating {args.type} asset: {args.name}")
    print(f"📝 Prompt: {enhanced_prompt}")
    print(f"📏 Size: {size}")
    print()
    
    try:
        result = subprocess.run(cmd, check=False, capture_output=False)
        if result.returncode == 0:
            asset_path = assets_dir / f"{args.name}.png"
            if asset_path.exists():
                print(f"\n✅ Asset saved to: {asset_path}")
                print(f"💡 Add to your game with: import './assets/{args.name}.png'")
            else:
                print(f"\n⚠️  Generation completed but file not found at expected location")
        else:
            print(f"\n❌ Generation failed with exit code {result.returncode}")
    except Exception as e:
        print(f"\n❌ Error running generator: {e}")

if __name__ == "__main__":
    main()