"""
Session-Based Behavioral Persona Generation Pipeline
====================================================

Processes behavioral action data from the OPeRA dataset to generate
data-driven personas using:
1. Behavioral Key Metrics (BKMs) extraction
2. Session-level clustering
3. Monthly aggregation
4. Persona profile generation

Output: JSON files for dashboard consumption
"""

import json
import os
import traceback
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Tuple, Any

import numpy as np
import pandas as pd
from sklearn.cluster import KMeans
from sklearn.decomposition import PCA
from sklearn.preprocessing import QuantileTransformer
from sklearn.metrics import silhouette_score
from tqdm import tqdm

# --- CONFIGURATION ---
BASE_DIR = Path(__file__).parent.parent
DATA_DIR = BASE_DIR / "data" / "NEU-HAI__OPeRA"
OUTPUT_DIR = BASE_DIR.parent / "frontend" / "public" / "data" / "personas"

# Use filtered version (cleaner action space: click, input, terminate)
SESSION_PATH = DATA_DIR / "filtered_session" / "train.csv"
ACTION_PATH = DATA_DIR / "filtered_action" / "train.csv"
USER_PATH = DATA_DIR / "filtered_user" / "train.csv"

# Clustering parameters
MIN_CLUSTERS = 5
MAX_CLUSTERS = 5
RANDOM_STATE = 42


# =============================================================================
# PHASE 1: DATA LOADING AND VALIDATION
# =============================================================================

def load_datasets() -> Tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame]:
    """Load and validate OPeRA datasets."""
    print("Loading datasets...")
    
    action_cols = [
        'session_id', 'action_id', 'timestamp', 'action_type', 
        'click_type', 'input_text', 'rationale', 'products'
    ]
    
    df_sessions = pd.read_csv(SESSION_PATH)
    df_actions = pd.read_csv(ACTION_PATH, usecols=lambda c: c in action_cols)
    df_users = pd.read_csv(USER_PATH)
    
    print(f"  Sessions: {len(df_sessions)} rows")
    print(f"  Actions: {len(df_actions)} rows")
    print(f"  Users: {len(df_users)} rows")
    
    return df_sessions, df_actions, df_users


def parse_session_timestamps(df_sessions: pd.DataFrame) -> pd.DataFrame:
    """Extract start/end times and assign to 3 equal-sized time periods (tertiles)."""
    print("Parsing session timestamps...")
    
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
    print(f"  Valid sessions with timestamps: {len(df_valid)}/{len(df_sessions)}")
    
    # Sort by start time for consistent processing
    df_valid = df_valid.sort_values('start_dt').reset_index(drop=True)
    
    # Assign Month (YYYY-MM (Month Name) - sorts correctly)
    df_valid['month'] = df_valid['start_dt'].dt.strftime('%Y-%m (%B)')
    
    # Report distribution
    period_counts = df_valid['month'].value_counts().sort_index()
    print(f"  Period distribution: {dict(period_counts)}")
    
    return df_valid


# =============================================================================
# PHASE 2: BEHAVIORAL KEY METRICS (BKMs)
# =============================================================================

def calculate_bkms(df_sessions: pd.DataFrame, df_actions: pd.DataFrame) -> pd.DataFrame:
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
    print("Calculating Behavioral Key Metrics...")
    
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
    print(f"  Computed BKMs for {len(df_bkm)} sessions")
    
    return df_bkm


def normalize_bkms(df_bkm: pd.DataFrame) -> Tuple[pd.DataFrame, QuantileTransformer, List[str]]:
    """Normalize BKM values using Quantile Transformation (Percentile Ranks)."""
    print("Normalizing BKMs (QuantileTransformer)...")
    
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


# =============================================================================
# PHASE 3: CLUSTERING
# =============================================================================

def find_optimal_clusters(X: np.ndarray) -> int:
    """Find optimal number of clusters using silhouette score."""
    print("Finding optimal cluster count...")
    
    scores = {}
    for k in range(MIN_CLUSTERS, MAX_CLUSTERS + 1):
        kmeans = KMeans(n_clusters=k, random_state=RANDOM_STATE, n_init=10)
        labels = kmeans.fit_predict(X)
        score = silhouette_score(X, labels)
        scores[k] = score
        print(f"  k={k}: silhouette={score:.4f}")
    
    optimal_k = max(scores, key=scores.get)
    print(f"  Optimal k={optimal_k} (silhouette={scores[optimal_k]:.4f})")
    
    return optimal_k


def cluster_sessions(df_bkm_norm: pd.DataFrame, bkm_columns: List[str]) -> Tuple[pd.DataFrame, KMeans, int]:
    """Perform K-Means clustering on session BKM vectors."""
    print("Clustering sessions...")
    
    X = df_bkm_norm[bkm_columns].values
    
    # Find optimal k
    optimal_k = find_optimal_clusters(X)
    
    # Fit final model
    kmeans = KMeans(n_clusters=optimal_k, random_state=RANDOM_STATE, n_init=10)
    df_bkm_norm['cluster_id'] = kmeans.fit_predict(X)
    
    # Report cluster sizes
    cluster_sizes = df_bkm_norm['cluster_id'].value_counts().sort_index()
    print("  Cluster sizes:")
    for cluster_id, size in cluster_sizes.items():
        print(f"    Cluster {cluster_id}: {size} sessions")
    
    return df_bkm_norm, kmeans, optimal_k


def compute_cluster_centroids(df_bkm_norm: pd.DataFrame, bkm_columns: List[str]) -> pd.DataFrame:
    """Compute mean BKM vector for each cluster."""
    print("Computing cluster centroids...")
    
    centroids = df_bkm_norm.groupby('cluster_id')[bkm_columns].mean().reset_index()
    
    return centroids


def apply_pca(df_bkm_norm: pd.DataFrame, centroids: pd.DataFrame, bkm_columns: List[str]) -> Tuple[pd.DataFrame, pd.DataFrame, PCA]:
    """Apply PCA for 2D visualization."""
    print("Applying PCA for visualization...")
    
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
    
    print(f"  Explained variance: {pca.explained_variance_ratio_.sum():.2%}")
    
    return df_bkm_norm, centroids, pca


# =============================================================================
# PHASE 4: PERSONA CONSTRUCTION
# =============================================================================

def identify_cluster_traits(centroids: pd.DataFrame, df_bkm: pd.DataFrame, bkm_columns: List[str]) -> Dict[int, Dict]:
    """Identify distinguishing traits for each cluster."""
    print("Identifying cluster traits...")
    
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
    """Generate a unique persona name based on cluster traits."""
    high_traits = [t[0] for t in traits['high_traits']]
    low_traits = [t[0] for t in traits['low_traits']]
    
    # Rule-based naming with unique fallbacks
    if 'purchase_intent_ratio' in high_traits:
        if 'option_selection_ratio' in high_traits:
            return "Decisive Buyer", "High purchase intent with detailed product customization"
        return "Action-Oriented Shopper", "Quick to make purchase decisions"
    
    if 'review_engagement_ratio' in high_traits:
        if 'filter_usage_ratio' in high_traits:
            return "Methodical Researcher", "Extensively reads reviews and uses filters"
        return "Informed Evaluator", "Focuses on product reviews before deciding"
    
    if 'search_ratio' in high_traits:
        if 'input_ratio' in high_traits:
            return "Search-Driven Navigator", "Heavy search and text input usage"
        return "Goal-Directed Seeker", "Uses search to find specific products"
    
    if 'product_exploration_ratio' in high_traits:
        return "Curious Browser", "Explores many product pages"
    
    if 'filter_usage_ratio' in high_traits:
        return "Criteria-Driven Shopper", "Relies heavily on filters to narrow options"
    
    if 'option_selection_ratio' in high_traits:
        return "Detail-Oriented Selector", "Focuses on product options and quantities"
    
    if 'action_density' in high_traits:
        if 'session_duration_seconds' in low_traits:
            return "Quick Scanner", "High activity in short time windows"
        return "Engaged Explorer", "Active engagement throughout session"
    
    if 'session_duration_seconds' in high_traits:
        return "Deliberate Shopper", "Takes time to make decisions"
    
    if 'input_ratio' in high_traits:
        return "Active Searcher", "Frequently uses text input"
    
    # Fallback with cluster ID to ensure uniqueness
    fallback_names = [
        ("Moderate Browser", "Balanced browsing behavior"),
        ("Steady Shopper", "Consistent shopping patterns"),
        ("Typical User", "Average across all metrics"),
        ("General Shopper", "No extreme behavioral tendencies"),
        ("Neutral Navigator", "Middle-ground shopping style"),
    ]
    return fallback_names[cluster_id % len(fallback_names)]


def select_representative_sessions(df_bkm_norm: pd.DataFrame, centroids: pd.DataFrame, bkm_columns: List[str]) -> pd.DataFrame:
    """Select session closest to centroid for each cluster."""
    print("Selecting representative sessions...")
    
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
    bkm_columns: List[str]
) -> List[Dict]:
    """Build complete persona profiles."""
    print("Building persona profiles...")
    
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


# =============================================================================
# PHASE 5: MONTHLY AGGREGATION
# =============================================================================

def aggregate_by_month(df_bkm_norm: pd.DataFrame) -> Dict:
    """Aggregate cluster data by month."""
    print("Aggregating by month...")
    
    monthly_data = {}
    
    for month in df_bkm_norm['month'].unique():
        month_sessions = df_bkm_norm[df_bkm_norm['month'] == month]
        
        cluster_positions = []
        for cluster_id in month_sessions['cluster_id'].unique():
            cluster_data = month_sessions[month_sessions['cluster_id'] == cluster_id]
            
            cluster_positions.append({
                'cluster_id': int(cluster_id),
                'pca_x': float(cluster_data['pca_x'].mean()),
                'pca_y': float(cluster_data['pca_y'].mean()),
                'session_count': len(cluster_data)
            })
        
        monthly_data[month] = {
            'total_sessions': len(month_sessions),
            'clusters': cluster_positions
        }
    
    return monthly_data


# =============================================================================
# PHASE 6: OUTPUT GENERATION
# =============================================================================

def generate_output(
    personas: List[Dict],
    monthly_data: Dict,
    df_bkm_norm: pd.DataFrame,
    df_users: pd.DataFrame,
    bkm_columns: List[str]
) -> None:
    """Generate JSON output files for dashboard."""
    print("Generating output files...")
    
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    
    # 1. Personas
    with open(OUTPUT_DIR / "personas.json", 'w') as f:
        json.dump(personas, f, indent=2)
    print(f"  Created: personas.json ({len(personas)} personas)")
    
    # 2. Monthly cluster positions
    with open(OUTPUT_DIR / "monthly_clusters.json", 'w') as f:
        json.dump(monthly_data, f, indent=2)
    print(f"  Created: monthly_clusters.json ({len(monthly_data)} months)")
    
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
    
    with open(OUTPUT_DIR / "sessions.json", 'w') as f:
        json.dump(session_details, f, indent=2)
    print(f"  Created: sessions.json ({len(session_details)} sessions)")
    
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
    
    with open(OUTPUT_DIR / "metadata.json", 'w') as f:
        json.dump(metadata, f, indent=2)
    print(f"  Created: metadata.json")


# =============================================================================
# MAIN PIPELINE
# =============================================================================

def run_pipeline():
    """Execute the full persona generation pipeline."""
    print("=" * 60)
    print("Behavioral Persona Generation Pipeline")
    print("=" * 60)
    
    try:
        # Phase 1: Data Loading
        df_sessions, df_actions, df_users = load_datasets()
        df_sessions = parse_session_timestamps(df_sessions)
        
        # Phase 2: BKM Calculation
        df_bkm = calculate_bkms(df_sessions, df_actions)
        df_bkm_norm, scaler, bkm_columns = normalize_bkms(df_bkm)
        
        # Phase 3: Clustering
        df_bkm_norm, kmeans, optimal_k = cluster_sessions(df_bkm_norm, bkm_columns)
        centroids = compute_cluster_centroids(df_bkm_norm, bkm_columns)
        df_bkm_norm, centroids, pca = apply_pca(df_bkm_norm, centroids, bkm_columns)
        
        # Phase 4: Persona Construction
        cluster_traits = identify_cluster_traits(centroids, df_bkm, bkm_columns)
        representatives = select_representative_sessions(df_bkm_norm, centroids, bkm_columns)
        personas = build_persona_profiles(
            centroids, cluster_traits, representatives, 
            df_bkm_norm, df_users, bkm_columns
        )
        
        # Phase 5: Monthly Aggregation
        monthly_data = aggregate_by_month(df_bkm_norm)
        
        # Phase 6: Output
        generate_output(personas, monthly_data, df_bkm_norm, df_users, bkm_columns)
        
        print("=" * 60)
        print("Pipeline completed successfully!")
        print(f"Output directory: {OUTPUT_DIR}")
        print("=" * 60)
        
    except Exception as e:
        print(f"Pipeline failed: {e}")
        traceback.print_exc()
        raise


if __name__ == "__main__":
    run_pipeline()
