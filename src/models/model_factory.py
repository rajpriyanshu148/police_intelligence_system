from src.utils.config_loader import config

def get_device() -> str:
    try:
        import torch
        user_device = config["model"].get("device", "cpu")
        if user_device == "cuda" and torch.cuda.is_available():
            return "cuda"
    except ImportError:
        pass
    return "cpu"

def load_base_model_and_tokenizer():
    try:
        import torch
        from transformers import AutoTokenizer, AutoModelForCausalLM, AutoModelForSeq2SeqLM
    except ImportError:
        print("[ModelFactory] transformers or torch is not installed. Causal neural generation will be unavailable.")
        return None, None

    model_name = config["model"]["name_or_path"]
    device = get_device()
    
    print(f"[ModelFactory] Loading tokenizer for {model_name}...")
    try:
        tokenizer = AutoTokenizer.from_pretrained(model_name, trust_remote_code=True)
        if tokenizer.pad_token is None:
            tokenizer.pad_token = tokenizer.eos_token
    except Exception as e:
        print(f"[ModelFactory] Warning: Failed to load online tokenizer. Error: {e}")
        tokenizer = None
        
    print(f"[ModelFactory] Loading base model on device: {device}...")
    model = None
    
    is_seq2seq = "t5" in model_name.lower() or "bart" in model_name.lower()
    
    try:
        if is_seq2seq:
            model = AutoModelForSeq2SeqLM.from_pretrained(model_name)
        else:
            model = AutoModelForCausalLM.from_pretrained(
                model_name,
                torch_dtype=torch.float16 if device == "cuda" else torch.float32,
                trust_remote_code=True
            )
        model.to(device)
    except Exception as e:
        print(f"[ModelFactory] Warning: Failed to load online model. Error: {e}")
        model = None
        
    return model, tokenizer

def load_fine_tuned_model(adapter_path: str = None):
    """
    Loads base model and attaches LoRA fine-tuning weights.
    """
    try:
        import torch
        from peft import PeftModel
    except ImportError:
        PeftModel = None
        torch = None

    model, tokenizer = load_base_model_and_tokenizer()
    if model is None:
        return None, tokenizer
        
    if adapter_path is None:
        adapter_path = config["model"]["training"]["output_dir"]
        
    if PeftModel is not None and adapter_path and torch is not None and torch.cuda.is_available():
        try:
            import os
            # Verify if adapter config exists
            if os.path.exists(os.path.join(adapter_path, "adapter_config.json")):
                print(f"[ModelFactory] Attaching PEFT LoRA adapters from {adapter_path}...")
                model = PeftModel.from_pretrained(model, adapter_path)
            else:
                print(f"[ModelFactory] No LoRA adapters found at {adapter_path}. Running base model.")
        except Exception as e:
            print(f"[ModelFactory] Error attaching LoRA adapter: {e}")
            
    return model, tokenizer
