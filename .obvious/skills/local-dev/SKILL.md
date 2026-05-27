---
name: local-dev
version: 1.0.0
description: Bring the AI-ML-Project local development environment up from scratch.
category: local-dev
triggers:
  - local dev setup
  - run repo locally
  - install dependencies
  - bring up local stack
author: autobuild-setup
created: 2026-05-27
---

## Prerequisites

- Python 3.10+ (verified: Python 3.13.13)
- pip (verified: pip 26.1.1)
- Internet access -- HuggingFace downloads BERT weights on first use (~400MB)
- No Docker, database, or web server required

## Install

    pip install -r requirements.txt

Packages installed: torch, transformers, datasets, pandas, numpy, scikit-learn,
matplotlib, seaborn, tqdm, jupyter, nbconvert

## Environment

No .env file required. No secrets needed for local execution.

Optional HuggingFace token for higher rate limits:

    export HF_TOKEN=your_token

NOTE: Cells with 'from google.colab import drive' (task.ipynb cell 87,
Model_loading notebook cell 0) raise ImportError locally. This is expected
Colab-only behavior -- skip those cells when running locally.

## Start

No server to start. Development is Jupyter notebook-based.

Launch Jupyter (optional):

    jupyter notebook   # http://localhost:8888

Or verify imports directly:

    python3 -c "import torch, transformers, datasets, pandas, sklearn; print('OK')"

## Verify Primary User Flow

Step 1: Install dependencies
    pip install -r requirements.txt

Step 2: Verify all imports
    python3 -c "
    import torch, transformers, datasets, pandas, numpy
    import sklearn, matplotlib, seaborn, tqdm
    from transformers import BertTokenizer, BertForSequenceClassification, Trainer
    print('torch:', torch.__version__)
    print('transformers:', transformers.__version__)
    print('All OK')
    "

Step 3: Tokenize a test sentence
    python3 -c "
    from transformers import BertTokenizer
    tok = BertTokenizer.from_pretrained('bert-base-uncased')
    enc = tok('This movie was fantastic!', return_tensors='pt')
    print(enc['input_ids'].shape)
    "

Step 4: Verify matplotlib
    python3 -c "
    import matplotlib; matplotlib.use('Agg')
    import matplotlib.pyplot as plt
    plt.bar(['pos', 'neg'], [50, 50])
    plt.savefig('/tmp/test.png')
    print('Plot OK')
    "

Evidence: all 4 steps verified at 2026-05-27T19:27:12Z.
Screenshots: .obvious-install/screenshots/import-verification/

## Verified Commands

- Typecheck: not_discovered
- Lint: not_discovered
- Test: not_discovered
- Import check (verified): python3 -c "import torch, transformers, datasets, pandas, numpy, sklearn, matplotlib, seaborn, tqdm"

## Sandbox Snapshot

- snapshotId: g3pht82c4m6xi50xv9vi:default
- Restoring this snapshot reproduces the verified-healthy state from install.

## Known Blockers / Workarounds

1. google.colab ImportError: skip cells with 'from google.colab import drive' when running locally.
2. HuggingFace rate limits: set HF_TOKEN env var with a free HuggingFace account token.
3. IMDB dataset download: first run of task.ipynb downloads ~80MB; requires internet; cached after.
4. No GPU: PyTorch runs CPU-only on this sandbox; full training is slow; use Colab with GPU.
