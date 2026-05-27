# Repo guidance

## Codebase Map

| Directory/File | Purpose |
|---|---|
| `task.ipynb` | Main notebook — BERT fine-tuning on IMDB: data preprocessing, tokenization, Trainer training loop, evaluation, model saving |
| `Model_loading_and_prediction_on_new_utterances.ipynb` | Inference notebook — load saved checkpoint, predict sentiment on new text inputs |
| `requirements.txt` | Python dependency manifest for local setup |
| `.obvious/` | Autobuild contract files — agent guidance, local dev skill, repo policy |

## Rules

<!-- synthesized from: no AGENTS.md/CLAUDE.md/CONTRIBUTING.md found — rules derived from repo structure -->

- **Python/ML project.** No web server, no database, no CI. Work units are Jupyter notebooks.
- **Originally Colab-designed.** Cells with `from google.colab import drive` / `drive.mount()` are Colab-only and will raise `ImportError` locally — this is expected. Do not remove these cells; document the limitation instead.
- **No test suite.** Verification is done by confirming imports succeed and running targeted Python snippets.
- **Model artifacts are gitignored.** Trained model checkpoints (`.bin`, `.safetensors`, `model_save/`) should not be committed to the repo.
- **Install via pip.** Use `pip install -r requirements.txt` for local setup.

## Local Verification

> **Warning:** No typecheck, lint, or test suite is configured for this repo.
> Verification is import-level and notebook-execution-level only.

### Verified Commands

```
python3 -c "import torch, transformers, datasets, pandas, numpy, sklearn, matplotlib, seaborn, tqdm"  # verified
python3 -c "from transformers import BertTokenizer, BertForSequenceClassification, Trainer"            # verified
```

### Scoped Workflow

Run these commands to verify dependencies after changes:

1. **Verify imports:** `python3 -c "import torch, transformers, datasets, pandas, numpy, sklearn, matplotlib, seaborn, tqdm"`
2. **Verify BERT imports:** `python3 -c "from transformers import BertTokenizer, BertForSequenceClassification, Trainer"`

<!-- local-verification-summary:v1 -->
- **Typecheck command:** not_discovered
- **Lint command:** not_discovered
- **Test command:** not_discovered
- **Scoped typecheck:** not_supported
- **Scoped lint:** not_supported
- **Scoped test:** not_supported
- **Full-repo check safe:** yes — no test suite; verification is import-level only
- **Scoped alternatives discovered:** yes — `python3 -c "import <package>"` verifies individual packages
<!-- /local-verification-summary -->

## Sandbox Snapshot

- **Snapshot ID:** `g3pht82c4m6xi50xv9vi:default`
- **Captured:** `2026-05-27T19:28:29.410Z`
- **Dev stack healthy:** yes

## Bibliography

> Nodes upserted: 4 (all new)
>
> Slugs: `ai-ml-project`, `bert-sentiment-training`, `model-inference-pipeline`, `huggingface-transformers`
>
> Hierarchy: `ai-ml-project` (system) → `bert-sentiment-training` (feature), `model-inference-pipeline` (feature), `huggingface-transformers` (integration)

## Security Scan

> **Note:** security_scan_not_triggered — repository gnunez1343/AI-ML-Project is not yet registered in the autobuild workspace. Trigger manually using the trigger_security_onboarding tool with commit SHA `27984d4dfd087cd548efedeec6454927a0c108d6` once the repository is connected via Settings → Repositories.

## Runbooks

[Populated by autobuild-runbooks skill when requested. See `.obvious/runbooks/` after that skill runs.]
