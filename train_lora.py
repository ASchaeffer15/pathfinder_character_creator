"""
Pathfinder Training & Knowledge Ingestion Pipeline
Allows adding training/knowledge from user-provided text files (.txt, .md).

Modes:
1. RAG Knowledge Ingestion (Default & Recommended for LangChain):
   python train_lora.py --file path/to/my_rules.txt
   
2. Fine-Tuning Script (LoRA / PEFT using Hugging Face Transformers):
   python train_lora.py --file path/to/my_rules.txt --mode fine_tune
"""

import sys
import os
import argparse
from backend.knowledge_service import knowledge_service

def ingest_text_file(filepath: str, chunk_size: int = 500, chunk_overlap: int = 50):
    if not os.path.exists(filepath):
        print(f"[!] Error: File '{filepath}' not found.")
        sys.exit(1)

    print(f"[*] Reading text file: {filepath}")
    with open(filepath, "r", encoding="utf-8", errors="ignore") as f:
        content = f.read()

    title = os.path.basename(filepath)
    print(f"[*] Splitting text using LangChain RecursiveCharacterTextSplitter (chunk_size={chunk_size}, overlap={chunk_overlap})...")
    res = knowledge_service.ingest_text(title=title, text=content, chunk_size=chunk_size, chunk_overlap=chunk_overlap)
    print(f"[+] SUCCESS: Indexed {res['num_chunks']} chunks into LangChain vector memory!")
    print("[+] The Pathfinder AI chat and character builder will now draw context from this file.")

def fine_tune_lora(filepath: str, model_id: str = "mradermacher/PathfinderAI-GGUF", output_dir: str = "./lora_output"):
    """
    Template for LoRA fine-tuning using Hugging Face Transformers & PEFT.
    """
    print(f"[*] Initializing LoRA fine-tuning on '{filepath}' with base model '{model_id}'...")
    print("""
    from transformers import AutoTokenizer, AutoModelForCausalLM, TrainingArguments, Trainer
    from peft import LoraConfig, get_peft_model

    # 1. Load tokenizer and base model
    tokenizer = AutoTokenizer.from_pretrained(model_id)
    model = AutoModelForCausalLM.from_pretrained(model_id, device_map="auto")

    # 2. Configure LoRA adapter
    lora_config = LoraConfig(
        r=8,
        lora_alpha=16,
        target_modules=["q_proj", "v_proj"],
        lora_dropout=0.05,
        bias="none",
        task_type="CAUSAL_LM"
    )
    model = get_peft_model(model, lora_config)

    # 3. Prepare dataset from text file
    with open(filepath, 'r', encoding='utf-8') as f:
        train_text = f.read()
    ...
    # 4. Train with Trainer(...)
    """)
    print("[+] Fine-tuning workflow template prepared. For real-time inference in the web UI, RAG ingestion is active.")

def main():
    parser = argparse.ArgumentParser(description="Add custom text file training to Pathfinder AI")
    parser.add_argument("--file", "-f", type=str, required=True, help="Path to .txt or .md file")
    parser.add_argument("--mode", "-m", choices=["rag", "fine_tune"], default="rag", help="Ingestion mode")
    parser.add_argument("--chunk_size", type=int, default=500, help="Chunk size for LangChain splitter")
    args = parser.parse_args()

    if args.mode == "rag":
        ingest_text_file(args.file, chunk_size=args.chunk_size)
    else:
        fine_tune_lora(args.file)

if __name__ == "__main__":
    main()
