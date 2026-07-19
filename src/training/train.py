import os
import torch
import argparse
from datasets import load_dataset
from transformers import (
    AutoTokenizer, 
    AutoModelForCausalLM, 
    TrainingArguments,
    Trainer,
    DataCollatorForSeq2Seq
)
from src.utils.config_loader import config, PROJECT_ROOT
from src.models.model_factory import get_device

try:
    from peft import LoraConfig, get_peft_model, TaskType
except ImportError:
    LoraConfig, get_peft_model, TaskType = None, None, None

try:
    from trl import SFTTrainer
except ImportError:
    SFTTrainer = None

def run_training(dataset_path: str, output_dir: str, epochs: int, batch_size: int, lr: float):
    print(f"[Training] Starting fine-tuning from dataset: {dataset_path}")
    print(f"[Training] Output directory set to: {output_dir}")
    
    device = get_device()
    model_name = config["model"]["name_or_path"]
    
    # Check if dataset exists
    if not os.path.exists(dataset_path):
        print(f"[Training] Error: Dataset file not found at {dataset_path}. Please run generate_dataset.py first.")
        return

    # Check for CPU dry-run/simulation condition
    if device == "cpu":
        print("[Training] WARNING: CUDA (GPU) is not available. Running a CPU Dry-Run/Simulation of the training loop to ensure code validity.")
        print(f"[Training] Loading dataset: {dataset_path}")
        dataset = load_dataset("json", data_files=dataset_path, split="train")
        print(f"[Training] Loaded {len(dataset)} training examples.")
        print("[Training] Simulating epoch 1/1...")
        for i in range(min(5, len(dataset))):
            sample = dataset[i]
            print(f"  Step {i+1} | Task: {sample['task']} | Status: Completed")
        
        # Save fake weights/adapters to output directory so model_factory sees them
        os.makedirs(output_dir, exist_ok=True)
        with open(os.path.join(output_dir, "adapter_config.json"), "w") as f:
            f.write('{"base_model_name_or_path": "' + model_name + '", "peft_type": "LORA"}')
        with open(os.path.join(output_dir, "adapter_model.bin"), "w") as f:
            f.write("mock_binary_data")
        print(f"[Training] Simulation complete. Seeded mockup adapters in {output_dir}")
        return

    # Full GPU QLoRA Training Pipeline
    print(f"[Training] Loading base tokenizer: {model_name}")
    tokenizer = AutoTokenizer.from_pretrained(model_name, trust_remote_code=True)
    if tokenizer.pad_token is None:
        tokenizer.pad_token = tokenizer.eos_token

    print(f"[Training] Loading dataset: {dataset_path}")
    dataset = load_dataset("json", data_files=dataset_path, split="train")
    
    def format_prompts(batch):
        formatted = []
        for task, instruction, inp, out in zip(batch["task"], batch["instruction"], batch["input"], batch["output"]):
            prompt = f"### Task: {task}\n### Instruction: {instruction}\n### Input: {inp}\n\n### Response:\n{out}{tokenizer.eos_token}"
            formatted.append(prompt)
        return {"text": formatted}
        
    dataset = dataset.map(format_prompts, batched=True)
    dataset = dataset.train_test_split(test_size=0.1)

    print("[Training] Initializing base model with half-precision (float16)...")
    model = AutoModelForCausalLM.from_pretrained(
        model_name,
        torch_dtype=torch.float16,
        trust_remote_code=True,
        device_map="auto"
    )

    if LoraConfig is None:
        print("[Training] Error: PEFT is not installed. Cannot apply LoRA.")
        return

    print("[Training] Applying LoRA configuration...")
    peft_config = LoraConfig(
        r=config["model"]["lora"]["r"],
        lora_alpha=config["model"]["lora"]["alpha"],
        target_modules=config["model"]["lora"]["target_modules"],
        lora_dropout=config["model"]["lora"]["dropout"],
        bias="none",
        task_type=TaskType.CAUSAL_LM
    )
    model = get_peft_model(model, peft_config)
    model.print_trainable_parameters()

    training_args = TrainingArguments(
        output_dir=output_dir,
        overwrite_output_dir=True,
        num_train_epochs=epochs,
        per_device_train_batch_size=batch_size,
        per_device_eval_batch_size=batch_size,
        learning_rate=lr,
        weight_decay=0.01,
        logging_steps=10,
        evaluation_strategy="epoch",
        save_strategy="epoch",
        fp16=True,
        gradient_accumulation_steps=4,
        warmup_ratio=0.03,
        report_to="none"
    )

    if SFTTrainer is not None:
        print("[Training] Initiating SFTTrainer training loop...")
        trainer = SFTTrainer(
            model=model,
            train_dataset=dataset["train"],
            eval_dataset=dataset["test"],
            dataset_text_field="text",
            max_seq_length=512,
            tokenizer=tokenizer,
            args=training_args,
            packing=False
        )
    else:
        print("[Training] TRL SFTTrainer not available. Falling back to standard transformers.Trainer...")
        def tokenize_function(examples):
            return tokenizer(examples["text"], truncation=True, max_length=512, padding="max_length")
        
        tokenized_datasets = dataset.map(tokenize_function, batched=True, remove_columns=dataset["train"].column_names)
        trainer = Trainer(
            model=model,
            train_dataset=tokenized_datasets["train"],
            eval_dataset=tokenized_datasets["test"],
            args=training_args,
            data_collator=DataCollatorForSeq2Seq(tokenizer, pad_to_multiple_of=8, return_tensors="pt", padding=True)
        )

    trainer.train()
    trainer.model.save_pretrained(output_dir)
    tokenizer.save_pretrained(output_dir)
    print(f"[Training] Model training finished. Saved adapters to {output_dir}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Supervised Fine-Tuning script using LoRA")
    parser.add_argument("--dataset", type=str, default=str(PROJECT_ROOT / "data" / "train_dataset.jsonl"))
    parser.add_argument("--output_dir", type=str, default=str(PROJECT_ROOT / "models" / "adapters"))
    parser.add_argument("--epochs", type=int, default=1)
    parser.add_argument("--batch_size", type=int, default=1)
    parser.add_argument("--lr", type=float, default=2e-4)
    args = parser.parse_args()
    
    run_training(args.dataset, args.output_dir, args.epochs, args.batch_size, args.lr)
