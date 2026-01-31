# Research Foundations

> Thesis preparation document with academic references and methodology documentation.

## Dataset: OPeRA

**Source:** [NEU-HAI/OPeRA](https://huggingface.co/datasets/NEU-HAI/OPeRA) on HuggingFace

This project uses the **filtered version** of OPeRA for cleaner action space (14 distinct click_types vs 47 in full dataset).

**Limitations:**
- E-commerce domain only (may not generalize to other domains)
- English-speaking users (Amazon.com marketplace)
- Simulated shopping tasks (not natural browsing behavior)

## Behavioral Key Metrics (BKMs)

All BKM definitions, formulas, and reasoning are documented in:
- **Specification:** [bkm-specification.json](../backend/data/NEU-HAI__OPeRA/bkm-specification.json)
- **Generator Prompt:** [analyze_dataset.txt](../backend/scripts/prompts/analyze_dataset.txt)

The specification is dataset-specific and generated via LLM analysis of the dataset schema.

**TODO:** Add academic citations for metric selection methodology

## Clustering: K-Means

The project uses K-Means clustering with centroids to represent persona archetypes.

**Configuration:**
- Fixed cluster count: 5 (based on [NN/g persona scope guidance](https://www.nngroup.com/articles/persona-scope/))
- Normalization: QuantileTransformer (uniform distribution 0-1)
- Features: 7 BKMs from specification `recommended_features`

**TODO:** Research and cite centroid-based persona representation methods

## LLM Configuration

| Provider | Model | Use Case |
|----------|-------|----------|
| Ollama (default) | gemma3 | Local, reproducible, free |
| OpenAI | gpt-4o-mini | Cloud alternative |

**Note:** This project does not measure LLM output quality. LLM is used for enrichment only (user profile summarization, persona narratives).

**TODO:** Document how to add other LLM providers (Anthropic, etc.)

## Limitations

1. **Fixed cluster count** - Always generates 5 personas regardless of dataset size
2. **Dataset-specific BKMs** - Formulas designed for OPeRA, need regeneration for other datasets
3. **No LLM quality evaluation** - Outputs not validated against ground truth
4. **Session-level analysis** - User-level evolution not directly modeled

## Component Reusability

### Fully Reusable (`/utils`)
- `logger.py` - Standardized logging
- `llm_client.py` - Ollama/OpenAI abstraction
- `file_helpers.py` - Safe file operations
- Clustering pipeline structure

### Dataset-Specific (regenerate for new dataset)
- BKM calculation formulas in `calculate_bkms()`
- Prompt templates for LLM extraction
