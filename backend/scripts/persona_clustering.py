"""
Session-Based Behavioral Persona Generation Pipeline

Processes behavioral action data from the OPeRA dataset to generate
data-driven personas using:
1. Behavioral Key Metrics (BKMs) extraction
2. Session-level clustering
3. Monthly aggregation
4. Persona profile generation

Output: JSON files for dashboard consumption
"""

import json
import traceback
from datetime import datetime
from typing import Dict, List, Tuple

import numpy as np
import pandas as pd
from sklearn.cluster import KMeans
from sklearn.decomposition import PCA
from sklearn.preprocessing import QuantileTransformer
from sklearn.metrics import silhouette_score
from tqdm import tqdm

from config import (
    SESSION_CSV,
    ACTION_CSV,
    USER_CSV,
    PERSONAS_DIR,
    CLUSTER_CONFIG,
)
from utils import Logger

# Clustering parameters from config
# Clustering parameters from config
MIN_CLUSTERS = CLUSTER_CONFIG["min_clusters"]
MAX_CLUSTERS = CLUSTER_CONFIG["max_clusters"]
RANDOM_STATE = CLUSTER_CONFIG["random_state"]


# FEATURE DESCRIPTORS (Dynamic Naming)
# Maps features to (Adjective, Description)
FEATURE_DESCRIPTORS = {
    "filter_usage_ratio": ("Filter-Focused", "uses filters extensively to narrow options"),
    "session_duration_seconds": ("Deliberate", "spends significant time exploring before deciding"),
    "purchase_intent_ratio": ("Decisive", "converts quickly once a decision is made"),
    "product_exploration_ratio": ("Explorer", "views many pages when evaluating options"),
    "option_selection_ratio": ("Detail-Oriented", "focuses on product options and configuration"),
    "search_ratio": ("Search-Driven", "relies on search functionality over navigation"),
    "review_engagement_ratio": ("Research-Minded", "heavily engages with reviews"),

    "input_ratio": ("Interactive", "high interaction with input forms")
}


# PHASE 1: DATA LOADING AND VALIDATION

def load_datasets(log: Logger) -> Tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame]:
    """Load and validate OPeRA datasets."""
    log.info("Loading datasets...")
    
    action_cols = [
        'session_id', 'action_id', 'timestamp', 'action_type', 
        'click_type', 'input_text', 'rationale', 'products'
    ]
    
    df_sessions = pd.read_csv(SESSION_CSV)
    df_actions = pd.read_csv(ACTION_CSV, usecols=lambda c: c in action_cols)
    df_users = pd.read_csv(USER_CSV)
    
    log.detail("Sessions", f"{len(df_sessions)} rows")
    log.detail("Actions", f"{len(df_actions)} rows")
    log.detail("Users", f"{len(df_users)} rows")
    
    return df_sessions, df_actions, df_users


def parse_session_timestamps(df_sessions: pd.DataFrame, log: Logger) -> pd.DataFrame:
    """Extract start/end times and assign to 3 equal-sized time periods (tertiles)."""
    log.info("Parsing session timestamps...")
    
    def extract_times(session_id: str) -> Tuple[str, str]:
        parts = session_id.split('_')
        if len(parts) >= 3:
            start_time = parts[-2]
            end_time = parts[-1]
            try:
                pd.to_datetime(start_time)
                pd.to_datetime(end_time)
                return start_time, end_time
            except:
                pass
        return None, None
    
    df_sessions[['start_time', 'end_time']] = df_sessions['session_id'].apply(
        lambda x: pd.Series(extract_times(x))
    )
    
    # Calculate duration in seconds
    df_sessions['start_dt'] = pd.to_datetime(df_sessions['start_time'], errors='coerce')
    df_sessions['end_dt'] = pd.to_datetime(df_sessions['end_time'], errors='coerce')
    df_sessions['duration_seconds'] = (
        df_sessions['end_dt'] - df_sessions['start_dt']
    ).dt.total_seconds().fillna(0).clip(lower=0)
    
    # Filter to valid timestamps
    valid_mask = df_sessions['start_dt'].notna()
    df_valid = df_sessions[valid_mask].copy()
    log.detail("Valid sessions", f"{len(df_valid)}/{len(df_sessions)}")
    
    # Sort by start time for consistent processing
    df_valid = df_valid.sort_values('start_dt').reset_index(drop=True)
    
    # Assign Month (YYYY-MM (Month Name) - sorts correctly)
    df_valid['month'] = df_valid['start_dt'].dt.strftime('%Y-%m (%B)')
    
    # Report distribution
    period_counts = df_valid['month'].value_counts().sort_index()
    log.detail("Months", len(period_counts))
    
    return df_valid


# PHASE 2: BEHAVIORAL KEY METRICS (BKMs)

def calculate_bkms(df_sessions: pd.DataFrame, df_actions: pd.DataFrame, log: Logger) -> pd.DataFrame:
    """
    Calculate Behavioral Key Metrics for each session.
    
    BKMs:
    1. session_duration_seconds - Time commitment
    2. action_density - Actions per second
    3. total_action_count - Session complexity
    4. purchase_intent_ratio - Buying signals (add to cart, checkout, buy now)
    5. search_ratio - Goal-directed search
    6. product_exploration_ratio - Browsing depth
    7. review_engagement_ratio - Information seeking
    8. filter_usage_ratio - Criteria-driven filtering
    9. option_selection_ratio - Purchase specification
    10. input_ratio - Active text entry
    """
    log.info("Calculating Behavioral Key Metrics...")
    
    # Group actions by session
    session_groups = df_actions.groupby('session_id')
    
    bkm_records = []
    
    for session_id, group in tqdm(session_groups, desc="Processing sessions"):
        # Get session metadata
        session_meta = df_sessions[df_sessions['session_id'] == session_id]
        if len(session_meta) == 0:
            continue
            
        session_meta = session_meta.iloc[0]
        
        # Total actions
        total_actions = len(group)
        if total_actions == 0:
            continue
        
        # Duration (from session metadata)
        duration = session_meta['duration_seconds']
        
        # Action type counts
        action_types = group['action_type'].fillna('').str.lower()
        click_types = group['click_type'].fillna('').str.lower()
        
        n_clicks = (action_types == 'click').sum()
        n_inputs = (action_types == 'input').sum()
        n_terminate = (action_types == 'terminate').sum()
        
        # Click type subcategories
        n_purchase = click_types.isin(['purchase']).sum()
        n_search = click_types.isin(['search']).sum()
        n_product_link = click_types.isin(['product_link']).sum()
        n_review = click_types.isin(['review']).sum()
        n_filter = click_types.isin(['filter']).sum()
        n_product_option = click_types.isin(['product_option']).sum()
        n_quantity = click_types.isin(['quantity']).sum()
        
        # Calculate BKMs
        bkm = {
            'session_id': session_id,
            'user_id': session_meta['user_id'],
            'month': session_meta['month'],
            'start_time': session_meta['start_time'],
            
            # Engagement Metrics
            'session_duration_seconds': duration,
            'action_density': total_actions / max(1, duration),
            'total_action_count': total_actions,
            
            # Shopping Intent Metrics
            'purchase_intent_ratio': n_purchase / total_actions,
            'search_ratio': n_search / total_actions,
            'product_exploration_ratio': n_product_link / total_actions,
            
            # Decision-Making Metrics
            'review_engagement_ratio': n_review / total_actions,
            'filter_usage_ratio': n_filter / total_actions,
            'option_selection_ratio': (n_product_option + n_quantity) / total_actions,
            
            # Session Outcome
            'input_ratio': n_inputs / total_actions,
        }
        
        bkm_records.append(bkm)
    
    df_bkm = pd.DataFrame(bkm_records)
    log.success(f"Computed BKMs for {len(df_bkm)} sessions")
    
    return df_bkm


def normalize_bkms(df_bkm: pd.DataFrame, log: Logger) -> Tuple[pd.DataFrame, QuantileTransformer, List[str]]:
    """Normalize BKM values using Quantile Transformation (Percentile Ranks)."""
    log.info("Normalizing BKMs (QuantileTransformer)...")
    
    bkm_columns = [
        'session_duration_seconds', 'action_density', 'total_action_count',
        'purchase_intent_ratio', 'search_ratio', 'product_exploration_ratio',
        'review_engagement_ratio', 'filter_usage_ratio', 'option_selection_ratio',
        'input_ratio'
    ]
    
    # Use Uniform Output (0-1) for maximum visual spread in Radar Charts
    scaler = QuantileTransformer(output_distribution='uniform', random_state=RANDOM_STATE)
    
    df_bkm_norm = df_bkm.copy()
    df_bkm_norm[bkm_columns] = scaler.fit_transform(df_bkm[bkm_columns])
    
    return df_bkm_norm, scaler, bkm_columns


# PHASE 3: CLUSTERING

def find_optimal_clusters(X: np.ndarray, log: Logger) -> int:
    """Find optimal number of clusters using silhouette score."""
    log.info("Finding optimal cluster count...")
    
    scores = {}
    for k in range(MIN_CLUSTERS, MAX_CLUSTERS + 1):
        kmeans = KMeans(n_clusters=k, random_state=RANDOM_STATE, n_init=10)
        labels = kmeans.fit_predict(X)
        score = silhouette_score(X, labels)
        scores[k] = score
        log.detail(f"k={k}", f"silhouette={score:.4f}")
    
    optimal_k = max(scores, key=scores.get)
    log.success(f"Optimal k={optimal_k} (silhouette={scores[optimal_k]:.4f})")
    
    return optimal_k


def cluster_sessions(df_bkm_norm: pd.DataFrame, bkm_columns: List[str], log: Logger) -> Tuple[pd.DataFrame, KMeans, int]:
    """Perform K-Means clustering on session BKM vectors."""
    log.info("Clustering sessions...")
    
    X = df_bkm_norm[bkm_columns].values
    
    # Find optimal k
    optimal_k = find_optimal_clusters(X, log)
    
    # Fit final model
    kmeans = KMeans(n_clusters=optimal_k, random_state=RANDOM_STATE, n_init=10)
    df_bkm_norm['cluster_id'] = kmeans.fit_predict(X)
    
    # Report cluster sizes
    cluster_sizes = df_bkm_norm['cluster_id'].value_counts().sort_index()
    for cluster_id, size in cluster_sizes.items():
        log.detail(f"Cluster {cluster_id}", f"{size} sessions")
    
    return df_bkm_norm, kmeans, optimal_k


def compute_cluster_centroids(df_bkm_norm: pd.DataFrame, bkm_columns: List[str], log: Logger) -> pd.DataFrame:
    """Compute mean BKM vector for each cluster."""
    log.info("Computing cluster centroids...")
    
    centroids = df_bkm_norm.groupby('cluster_id')[bkm_columns].mean().reset_index()
    
    return centroids


def apply_pca(df_bkm_norm: pd.DataFrame, centroids: pd.DataFrame, bkm_columns: List[str], log: Logger) -> Tuple[pd.DataFrame, pd.DataFrame, PCA]:
    """Apply PCA for 2D visualization."""
    log.info("Applying PCA for visualization...")
    
    pca = PCA(n_components=2, random_state=RANDOM_STATE)
    
    # Fit on all sessions
    X = df_bkm_norm[bkm_columns].values
    X_2d = pca.fit_transform(X)
    df_bkm_norm['pca_x'] = X_2d[:, 0]
    df_bkm_norm['pca_y'] = X_2d[:, 1]
    
    # Transform centroids
    centroids_2d = pca.transform(centroids[bkm_columns].values)
    centroids['pca_x'] = centroids_2d[:, 0]
    centroids['pca_y'] = centroids_2d[:, 1]
    
    log.detail("Explained variance", f"{pca.explained_variance_ratio_.sum():.2%}")
    
    return df_bkm_norm, centroids, pca


# PHASE 4: PERSONA CONSTRUCTION

def identify_cluster_traits(centroids: pd.DataFrame, df_bkm: pd.DataFrame, bkm_columns: List[str], log: Logger) -> Dict[int, Dict]:
    """Identify distinguishing traits for each cluster."""
    log.info("Identifying cluster traits...")
    
    # Compute overall means and stds
    overall_mean = df_bkm[bkm_columns].mean()
    overall_std = df_bkm[bkm_columns].std()
    
    cluster_traits = {}
    
    for _, row in centroids.iterrows():
        cluster_id = int(row['cluster_id'])
        
        # Compute z-scores for this cluster
        z_scores = {}
        high_traits = []
        low_traits = []
        
        for col in bkm_columns:
            z = (row[col] - overall_mean[col]) / (overall_std[col] + 1e-6)
            z_scores[col] = z
            
            if z > 1.0:
                high_traits.append((col, z))
            elif z < -1.0:
                low_traits.append((col, z))
        
        # Sort by absolute z-score
        high_traits.sort(key=lambda x: x[1], reverse=True)
        low_traits.sort(key=lambda x: x[1])
        
        cluster_traits[cluster_id] = {
            'z_scores': z_scores,
            'high_traits': high_traits[:3],  # Top 3
            'low_traits': low_traits[:3],
            'raw_values': {col: row[col] for col in bkm_columns}
        }
    
    return cluster_traits


def generate_persona_name(traits: Dict, cluster_id: int) -> Tuple[str, str]:
    """
    Generate a unique persona name based on cluster traits using dynamic Descriptors.
    Replaces hardcoded logic with adaptive 'Feature + Feature + User' naming.
    """
    # Extract feature names from high traits (sorted by z-score descending)
    high_traits = [t[0] for t in traits['high_traits']]
    
    adjectives = []
    tagline_parts = []
    
    # Process top 3 high traits
    for feat_name in high_traits:
        desc = FEATURE_DESCRIPTORS.get(feat_name)
        if desc:
            adjectives.append(desc[0])
            tagline_parts.append(desc[1])
        else:
            # Fallback for unknown features
            clean_name = feat_name.replace('_', ' ').title()
            tagline_parts.append(f"characterized by high {clean_name}")
            
    # Construct Name
    if adjectives:
        # Take top 2 adjectives for name to keep it concise
        name_adjectives = [adj for adj in adjectives[:2] if adj not in ["User", "Shopper"]]
        if not name_adjectives:
             name = "Distinct Segment"
        else:
             name = " ".join(name_adjectives) + " User"
    else:
        name = f"Cluster {cluster_id} Segment"
        
    # Construct Tagline
    if tagline_parts:
        tagline = "; ".join(tagline_parts)
        tagline = tagline[0].upper() + tagline[1:]
        if not tagline.endswith('.'):
            tagline += '.'
    else:
        tagline = "A unique behavioral segment identified in the data."
        
    return name, tagline


def select_representative_sessions(df_bkm_norm: pd.DataFrame, centroids: pd.DataFrame, bkm_columns: List[str], log: Logger) -> pd.DataFrame:
    """Select session closest to centroid for each cluster."""
    log.info("Selecting representative sessions...")
    
    representatives = []
    
    for _, centroid_row in centroids.iterrows():
        cluster_id = int(centroid_row['cluster_id'])
        cluster_sessions = df_bkm_norm[df_bkm_norm['cluster_id'] == cluster_id]
        
        centroid_vec = centroid_row[bkm_columns].values
        
        # Compute distances to centroid
        distances = np.sqrt(((cluster_sessions[bkm_columns].values - centroid_vec) ** 2).sum(axis=1))
        
        min_idx = distances.argmin()
        representative = cluster_sessions.iloc[min_idx].copy()
        representative['distance_to_centroid'] = distances[min_idx]
        
        representatives.append(representative)
    
    return pd.DataFrame(representatives)


def build_persona_profiles(
    centroids: pd.DataFrame,
    cluster_traits: Dict,
    representatives: pd.DataFrame,
    df_bkm_norm: pd.DataFrame,
    df_users: pd.DataFrame,
    bkm_columns: List[str],
    log: Logger
) -> List[Dict]:
    """Build complete persona profiles."""
    log.info("Building persona profiles...")
    
    personas = []
    
    for _, centroid_row in centroids.iterrows():
        cluster_id = int(centroid_row['cluster_id'])
        traits = cluster_traits[cluster_id]
        rep = representatives[representatives['cluster_id'] == cluster_id].iloc[0]
        
        # Get cluster sessions
        cluster_sessions = df_bkm_norm[df_bkm_norm['cluster_id'] == cluster_id]
        
        # Generate persona name (pass cluster_id for uniqueness)
        name, description = generate_persona_name(traits, cluster_id)
        
        # Get representative user info
        user_id = rep['user_id']
        
        # Build profile
        persona = {
            'cluster_id': cluster_id,
            'name': name,
            'description': description,
            'session_count': len(cluster_sessions),
            'centroid': {
                'pca_x': float(centroid_row['pca_x']),
                'pca_y': float(centroid_row['pca_y'])
            },
            'behavioral_metrics': {
                col: {
                    'value': float(centroid_row[col]),
                    'z_score': float(traits['z_scores'][col])
                }
                for col in bkm_columns
            },
            'distinguishing_traits': {
                'high': [{'metric': t[0], 'z_score': float(t[1])} for t in traits['high_traits']],
                'low': [{'metric': t[0], 'z_score': float(t[1])} for t in traits['low_traits']]
            },
            'representative_session': {
                'session_id': rep['session_id'],
                'user_id': user_id,
                'month': rep['month'],
                'duration_seconds': float(rep['session_duration_seconds']),
                'action_count': int(rep['total_action_count'])
            }
        }
        
        personas.append(persona)
    
    return personas


# PHASE 5: MONTHLY AGGREGATION

def aggregate_by_month(df_bkm_norm: pd.DataFrame, bkm_columns: List[str], log: Logger) -> Dict:
    """Aggregate cluster data by month with z-scores and traits."""
    log.info("Aggregating by month...")
    
    monthly_data = {}
    
    for month in df_bkm_norm['month'].unique():
        month_sessions = df_bkm_norm[df_bkm_norm['month'] == month]
        
        # Calculate monthly population statistics
        monthly_mean = month_sessions[bkm_columns].mean()
        monthly_std = month_sessions[bkm_columns].std()

        cluster_positions = []
        for cluster_id in sorted(month_sessions['cluster_id'].unique()):
            cluster_data = month_sessions[month_sessions['cluster_id'] == cluster_id]
            
            # Calculate cluster averages for this month
            cluster_mean = cluster_data[bkm_columns].mean()

            # Calculate z-scores: (cluster_mean - population_mean) / population_std
            behavioral_metrics = {}
            all_z_scores = []  # Track all z-scores for fallback

            for col in bkm_columns:
                z_score = (cluster_mean[col] - monthly_mean[col]) / (monthly_std[col] + 1e-6)
                behavioral_metrics[col] = {
                    'value': float(cluster_mean[col]),
                    'z_score': float(z_score)
                }
                all_z_scores.append({'metric': col, 'z_score': float(z_score)})

            # Identify distinguishing traits (|z| > 0.75)
            high_traits = [t for t in all_z_scores if t['z_score'] > 0.75]
            low_traits = [t for t in all_z_scores if t['z_score'] < -0.75]

            # Sort traits by absolute z-score
            high_traits.sort(key=lambda x: x['z_score'], reverse=True)
            low_traits.sort(key=lambda x: x['z_score'])

            # Ensure we always show at least top 2 traits, even if below threshold
            if len(high_traits) < 2:
                # Get all traits sorted by z-score, take top ones not already in high_traits
                all_sorted = sorted(all_z_scores, key=lambda x: x['z_score'], reverse=True)
                for trait in all_sorted:
                    if trait not in high_traits and len(high_traits) < 2:
                        high_traits.append(trait)

            if len(low_traits) < 2:
                # Get all traits sorted by z-score ascending, take bottom ones not already in low_traits
                all_sorted = sorted(all_z_scores, key=lambda x: x['z_score'])
                for trait in all_sorted:
                    if trait not in low_traits and len(low_traits) < 2:
                        low_traits.append(trait)

            cluster_positions.append({
                'cluster_id': int(cluster_id),
                'pca_x': float(cluster_data['pca_x'].mean()),
                'pca_y': float(cluster_data['pca_y'].mean()),
                'session_count': len(cluster_data),
                'behavioral_metrics': behavioral_metrics,
                'distinguishing_traits': {
                    'high': high_traits,
                    'low': low_traits
                }
            })
        
        monthly_data[month] = {
            'total_sessions': len(month_sessions),
            'clusters': cluster_positions
        }
    
    return monthly_data


# PHASE 6: OUTPUT GENERATION

def generate_output(
    personas: List[Dict],
    monthly_data: Dict,
    df_bkm_norm: pd.DataFrame,
    df_users: pd.DataFrame,
    bkm_columns: List[str],
    log: Logger
) -> None:
    """Generate JSON output files for dashboard."""
    log.step(6, "Generating output files")
    
    PERSONAS_DIR.mkdir(parents=True, exist_ok=True)
    
    # 1. Personas
    with open(PERSONAS_DIR / "personas.json", 'w') as f:
        json.dump(personas, f, indent=2)
    log.success(f"personas.json ({len(personas)} personas)")
    
    # 2. Monthly cluster positions
    with open(PERSONAS_DIR / "monthly_clusters.json", 'w') as f:
        json.dump(monthly_data, f, indent=2)
    log.success(f"monthly_clusters.json ({len(monthly_data)} months)")
    
    # 3. Session details (for drill-down)
    session_details = []
    for _, session in df_bkm_norm.iterrows():
        session_record = {
            'session_id': session['session_id'],
            'user_id': session['user_id'],
            'month': session['month'],
            'cluster_id': int(session['cluster_id']),
            'pca_x': float(session['pca_x']),
            'pca_y': float(session['pca_y']),
            'behavioral_metrics': {col: float(session[col]) for col in bkm_columns}
        }
        session_details.append(session_record)
    
    with open(PERSONAS_DIR / "sessions.json", 'w') as f:
        json.dump(session_details, f, indent=2)
    log.success(f"sessions.json ({len(session_details)} sessions)")
    
    # 4. Metadata with fixed PCA bounds
    pca_x_min = float(df_bkm_norm['pca_x'].min())
    pca_x_max = float(df_bkm_norm['pca_x'].max())
    pca_y_min = float(df_bkm_norm['pca_y'].min())
    pca_y_max = float(df_bkm_norm['pca_y'].max())
    
    # Add padding
    x_pad = (pca_x_max - pca_x_min) * 0.1
    y_pad = (pca_y_max - pca_y_min) * 0.1
    
    metadata = {
        'generated_at': datetime.now().isoformat(),
        'total_sessions': len(df_bkm_norm),
        'total_clusters': len(personas),
        'months': sorted(monthly_data.keys()),
        'bkm_columns': bkm_columns,
        'pca_bounds': {
            'x_min': pca_x_min - x_pad,
            'x_max': pca_x_max + x_pad,
            'y_min': pca_y_min - y_pad,
            'y_max': pca_y_max + y_pad
        }
    }
    
    with open(PERSONAS_DIR / "metadata.json", 'w') as f:
        json.dump(metadata, f, indent=2)
    log.success("metadata.json")


# MAIN PIPELINE

def run_pipeline():
    """Execute the full persona generation pipeline."""
    log = Logger("persona_clustering")
    log.header("Behavioral Persona Generation Pipeline")
    
    try:
        # Phase 1: Data Loading
        log.step(1, "Loading data")
        df_sessions, df_actions, df_users = load_datasets(log)
        df_sessions = parse_session_timestamps(df_sessions, log)
        
        # Phase 2: BKM Calculation
        log.step(2, "Calculating behavioral metrics")
        df_bkm = calculate_bkms(df_sessions, df_actions, log)
        df_bkm_norm, scaler, bkm_columns = normalize_bkms(df_bkm, log)
        
        # Phase 3: Clustering
        log.step(3, "Clustering sessions")
        df_bkm_norm, kmeans, optimal_k = cluster_sessions(df_bkm_norm, bkm_columns, log)
        centroids = compute_cluster_centroids(df_bkm_norm, bkm_columns, log)
        df_bkm_norm, centroids, pca = apply_pca(df_bkm_norm, centroids, bkm_columns, log)
        
        # Phase 4: Persona Construction
        log.step(4, "Constructing personas")
        cluster_traits = identify_cluster_traits(centroids, df_bkm, bkm_columns, log)
        representatives = select_representative_sessions(df_bkm_norm, centroids, bkm_columns, log)
        personas = build_persona_profiles(
            centroids, cluster_traits, representatives, 
            df_bkm_norm, df_users, bkm_columns, log
        )
        
        # Phase 5: Monthly Aggregation
        log.step(5, "Aggregating by month")
        monthly_data = aggregate_by_month(df_bkm_norm, bkm_columns, log)

        # Phase 6: Output
        generate_output(personas, monthly_data, df_bkm_norm, df_users, bkm_columns, log)
        
        log.summary(
            processed=len(df_bkm_norm),
            skipped=0,
            errors=0
        )
        log.info(f"Output: {PERSONAS_DIR}")
        
    except Exception as e:
        log.error(f"Pipeline failed: {e}")
        traceback.print_exc()
        raise


if __name__ == "__main__":
    run_pipeline()
