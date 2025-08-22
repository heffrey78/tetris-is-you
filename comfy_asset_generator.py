#!/usr/bin/env python3
"""
Tetris-Is-You ComfyUI Asset Generator
Simplified ComfyUI interface for generating game assets
"""

import os
import sys
import json
import time
import uuid
import argparse
import urllib.request
import urllib.parse
import urllib.error
import subprocess
import signal
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Optional, Tuple

class ComfyUIAssetGenerator:
    """Simplified ComfyUI client for game asset generation"""
    
    def __init__(self, host: str = "127.0.0.1", port: int = 8188, output_dir: str = "./assets"):
        self.host = host
        self.port = port
        self.base_url = f"http://{host}:{port}"
        self.client_id = str(uuid.uuid4())
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(exist_ok=True)
        
    def is_server_running(self) -> bool:
        """Check if ComfyUI server is responding"""
        try:
            urllib.request.urlopen(f"{self.base_url}/system_stats", timeout=5)
            return True
        except:
            return False
    
    def get_models(self) -> List[str]:
        """Get list of available checkpoint models"""
        try:
            response = urllib.request.urlopen(f"{self.base_url}/object_info", timeout=10)
            data = json.loads(response.read().decode())
            checkpoints = data.get("CheckpointLoaderSimple", {}).get("input", {}).get("required", {}).get("ckpt_name", [[]])[0]
            return sorted(checkpoints) if checkpoints else []
        except Exception as e:
            print(f"Error fetching models: {e}")
            return []
    
    def load_workflow_template(self) -> Optional[Dict]:
        """Load the FLUX-DEV-GGUF.json workflow template"""
        workflow_path = Path("/home/jeffwikstrom/Downloads/FLUX-DEV-GGUF.json")
        try:
            with open(workflow_path, 'r') as f:
                return json.load(f)
        except FileNotFoundError:
            print(f"❌ Workflow template not found: {workflow_path}")
            return None
        except json.JSONDecodeError as e:
            print(f"❌ Invalid JSON in workflow template: {e}")
            return None

    def create_workflow(self, prompt: str, model: str = None, steps: int = 20, cfg: float = 7.0, 
                       width: int = 512, height: int = 512, seed: int = -1) -> Dict:
        """Create a text-to-image workflow from the Txt2Img.json template"""
        
        # Load workflow template
        workflow = self.load_workflow_template()
        if not workflow:
            # Fallback to programmatic workflow creation
            return self.create_fallback_workflow(prompt, model, steps, cfg, width, height, seed)
        
        # Generate random seed if needed
        if seed == -1:
            seed = int(time.time() * 1000) % 2147483647
        
        # Modify workflow with parameters (based on FLUX-DEV-GGUF.json structure)
        workflow["47"]["inputs"]["text"] = prompt  # Positive prompt (node 47)
        workflow["42"]["inputs"]["noise_seed"] = seed  # Random seed (RandomNoise node 42)  
        workflow["45"]["inputs"]["steps"] = steps  # Steps (BasicScheduler node 45)
        workflow["49"]["inputs"]["guidance"] = cfg  # Guidance (FluxGuidance node 49)
        workflow["46"]["inputs"]["width"] = width  # Width (EmptyLatentImage node 46)
        workflow["46"]["inputs"]["height"] = height # Height (EmptyLatentImage node 46)
        
        # Update model if specified
        if model:
            workflow["4"]["inputs"]["ckpt_name"] = model
        
        return workflow

    def create_fallback_workflow(self, prompt: str, model: str = None, steps: int = 20, cfg: float = 7.0, 
                       width: int = 512, height: int = 512, seed: int = -1) -> Dict:
        """Create a text-to-image workflow programmatically (fallback)"""
        
        # Use first available model if none specified
        if not model:
            models = self.get_models()
            model = models[0] if models else "model.safetensors"
        
        # Generate random seed if needed
        if seed == -1:
            seed = int(time.time() * 1000) % 2147483647
            
        return {
            "1": {
                "class_type": "CheckpointLoaderSimple",
                "inputs": {"ckpt_name": model}
            },
            "2": {
                "class_type": "CLIPTextEncode",
                "inputs": {
                    "clip": ["1", 1],
                    "text": prompt
                }
            },
            "3": {
                "class_type": "CLIPTextEncode", 
                "inputs": {
                    "clip": ["1", 1],
                    "text": "low quality, blurry, artifacts, bad anatomy"
                }
            },
            "4": {
                "class_type": "EmptyLatentImage",
                "inputs": {
                    "width": width,
                    "height": height,
                    "batch_size": 1
                }
            },
            "5": {
                "class_type": "KSampler",
                "inputs": {
                    "model": ["1", 0],
                    "positive": ["2", 0],
                    "negative": ["3", 0],
                    "latent_image": ["4", 0],
                    "seed": seed,
                    "steps": steps,
                    "cfg": cfg,
                    "sampler_name": "euler",
                    "scheduler": "normal",
                    "denoise": 1.0
                }
            },
            "6": {
                "class_type": "VAEDecode",
                "inputs": {
                    "samples": ["5", 0],
                    "vae": ["1", 2]
                }
            },
            "7": {
                "class_type": "SaveImage",
                "inputs": {
                    "filename_prefix": "TetrisAsset",
                    "images": ["6", 0]
                }
            }
        }
    
    def queue_prompt(self, workflow: Dict) -> Optional[str]:
        """Queue a prompt for generation"""
        try:
            data = json.dumps({"prompt": workflow, "client_id": self.client_id}).encode('utf-8')
            req = urllib.request.Request(f"{self.base_url}/prompt", data=data)
            req.add_header('Content-Type', 'application/json')
            response = urllib.request.urlopen(req, timeout=30)
            result = json.loads(response.read().decode())
            return result.get("prompt_id")
        except Exception as e:
            print(f"Error queuing prompt: {e}")
            return None
    
    def get_history(self, prompt_id: str) -> Optional[Dict]:
        """Get execution history for a prompt"""
        try:
            response = urllib.request.urlopen(f"{self.base_url}/history/{prompt_id}", timeout=10)
            history = json.loads(response.read().decode())
            return history.get(prompt_id)
        except Exception:
            return None
    
    def download_image(self, filename: str, subfolder: str = "") -> Optional[bytes]:
        """Download an image from ComfyUI"""
        try:
            params = urllib.parse.urlencode({
                "filename": filename,
                "subfolder": subfolder,
                "type": "output"
            })
            response = urllib.request.urlopen(f"{self.base_url}/view?{params}", timeout=30)
            return response.read()
        except Exception as e:
            print(f"Error downloading image: {e}")
            return None
    
    def generate_asset(self, prompt: str, asset_name: str = None, **kwargs) -> Optional[str]:
        """Generate a single asset and save it locally"""
        
        if not self.is_server_running():
            print("❌ ComfyUI server not running at", self.base_url)
            return None
        
        print(f"🎨 Generating: {prompt}")
        
        # Create workflow
        workflow = self.create_workflow(prompt, **kwargs)
        
        # Set asset name in SaveImage node (node 66 in FLUX workflow)
        if asset_name and "66" in workflow:
            workflow["66"]["inputs"]["filename_prefix"] = asset_name
        
        prompt_id = self.queue_prompt(workflow)
        
        if not prompt_id:
            print("❌ Failed to queue generation")
            return None
        
        print(f"⏳ Generation queued (ID: {prompt_id[:8]}...)")
        
        # Monitor progress
        start_time = time.time()
        while True:
            history = self.get_history(prompt_id)
            if history:
                elapsed = time.time() - start_time
                print(f"✅ Generated in {elapsed:.1f}s")
                
                # Handle completion
                try:
                    print(f"🔍 Debug: History keys: {list(history.keys())}")
                    outputs = history.get("outputs", {})
                    print(f"🔍 Debug: Output nodes: {list(outputs.keys())}")
                    
                    for node_id, node_output in outputs.items():
                        print(f"🔍 Debug: Node {node_id} output: {node_output.keys()}")
                        images = node_output.get("images", [])
                        print(f"🔍 Debug: Found {len(images)} images")
                        
                        for image_info in images:
                            print(f"🔍 Debug: Image info: {image_info}")
                            filename = image_info["filename"]
                            subfolder = image_info.get("subfolder", "")
                            print(f"📥 Downloading: {filename} (subfolder: '{subfolder}')")
                            
                            # Download image
                            image_data = self.download_image(filename, subfolder)
                            if not image_data:
                                print(f"❌ Failed to download {filename}")
                                continue
                            
                            # Save with custom name
                            if asset_name:
                                name, ext = os.path.splitext(filename)
                                local_filename = f"{asset_name}{ext}"
                            else:
                                local_filename = filename
                            
                            local_path = self.output_dir / local_filename
                            with open(local_path, 'wb') as f:
                                f.write(image_data)
                            
                            size_kb = len(image_data) / 1024
                            print(f"✅ Saved: {local_filename} ({size_kb:.1f}KB)")
                            print(f"📂 Location: {local_path.absolute()}")
                            return str(local_path.absolute())
                    
                    print("🔍 Debug: No images found in outputs")
                    return None
                            
                except Exception as e:
                    print(f"❌ Error processing result: {e}")
                    import traceback
                    traceback.print_exc()
                    return None
                break
            
            # Show progress
            elapsed = time.time() - start_time
            print(f"\r⏱️  {elapsed:.0f}s", end="", flush=True)
            time.sleep(1)
            
            # Timeout after 2 minutes
            if elapsed > 120:
                print("\n❌ Generation timed out")
                return None
        
        return None

def main():
    """Main entry point"""
    parser = argparse.ArgumentParser(description="Tetris-Is-You ComfyUI Asset Generator")
    parser.add_argument("prompt", help="Text prompt for asset generation")
    parser.add_argument("--name", help="Asset filename (without extension)")
    parser.add_argument("--model", help="Model name to use")
    parser.add_argument("--steps", type=int, default=20, help="Number of steps")
    parser.add_argument("--cfg", type=float, default=7.0, help="CFG scale")
    parser.add_argument("--size", default="512x512", help="Image size (WIDTHxHEIGHT)")
    parser.add_argument("--seed", type=int, default=-1, help="Random seed")
    parser.add_argument("--output", default="./assets", help="Output directory")
    parser.add_argument("--host", default="127.0.0.1", help="ComfyUI host")
    parser.add_argument("--port", type=int, default=8188, help="ComfyUI port")
    
    args = parser.parse_args()
    
    # Parse size
    try:
        width, height = map(int, args.size.split('x'))
    except:
        print("❌ Invalid size format. Use WIDTHxHEIGHT (e.g., 512x512)")
        return
    
    # Create generator
    generator = ComfyUIAssetGenerator(
        host=args.host,
        port=args.port, 
        output_dir=args.output
    )
    
    # Generate asset
    result = generator.generate_asset(
        prompt=args.prompt,
        asset_name=args.name,
        model=args.model,
        steps=args.steps,
        cfg=args.cfg,
        width=width,
        height=height,
        seed=args.seed
    )
    
    if result:
        print(f"\n🎉 Asset generated successfully: {result}")
    else:
        print("\n❌ Asset generation failed")
        sys.exit(1)

if __name__ == "__main__":
    main()