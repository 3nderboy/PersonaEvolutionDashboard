import pandas as pd
import json
import os
import random
import traceback
from datetime import datetime
from pathlib import Path
from tqdm import tqdm

# --- CONFIGURATION ---
# Use pathlib for robust path handling
BASE_DIR = Path(__file__).parent.parent
DATA_BASE_DIR = BASE_DIR / "data" / "NEU-HAI__OPeRA"
# Output to frontend public data
OUTPUT_DIR = BASE_DIR.parent / "frontend" / "public" / "data" / "sample"
TIMELINE_DIR = OUTPUT_DIR / "timelines"

# Load fewer rows but relevant cols
ROW_LIMIT = 200000 

# Columns to load (avoid massive HTML blobs)
USE_COLS = ['session_id', 'timestamp', 'action_type', 'click_type', 'element_meta', 'rationale']

PERSONAS = {
    "Decisive Shopper": {},  # Was "Action-Oriented Buyer"
    "Explorer": {},
    "Researcher": {},        # Was "Informed Researcher" -> "Researcher"
    "Budget Conscious": {},  # Was "Deal Hunter"
    "Methodical": {},        # Was "Loyal Customer" -> "Methodical"
}

def ensure_dirs():
    os.makedirs(TIMELINE_DIR, exist_ok=True)

def generate_interview(persona):
    """Generates a dummy transcribed interview based on persona."""
    if persona == "Decisive Shopper":
        return "I usually know exactly what I want. I don't like to waste time scrolling. If the price is right and the reviews are good, I buy it immediately."
    elif persona == "Explorer":
        return "I love just browsing and seeing what's new. Sometimes I end up with 50 tabs open! I might not buy today, but I'm always looking for inspiration."
    elif persona == "Researcher":
        return "I need to know every detail before I commit. I compare specs, read all the 1-star reviews, and watch video reviews. I hate buyer's remorse."
    elif persona == "Budget Conscious":
        return "I always filter by price low-to-high. I wait for sales and check for coupon codes. Why pay full price when you can get a deal?"
    elif persona == "Methodical":
        return "I stick to brands I trust. I have a routine when I shop, and I value consistency and good customer service over flashy new trends."
    return "I enjoy shopping online occasionally."

def determine_persona(metrics, total_actions):
    dec = metrics['decisiveness']
    expl = metrics['exploration']
    res = metrics['research_depth']
    price = metrics['price_sensitivity']
    eng = metrics['engagement']

    # Adjusted logic to map to new names
    if dec > 0.6 and total_actions > 5: return "Decisive Shopper"   
    if eng > 0.8: return "Methodical"         
    if price > 0.5: return "Budget Conscious" 
    if res > 0.5: return "Researcher"         
    return "Explorer"                         


def calculate_metrics(user_df):
    actions = user_df['norm_type'].value_counts()
    total = len(user_df)
    
    n_purchase = actions.get('purchase', 0)
    n_view = actions.get('view_detail', 0)
    n_search = actions.get('search', 0)
    n_review = actions.get('read_review', 0)
    n_filter = actions.get('filter', 0) + actions.get('sort', 0)
    
    decisiveness = (n_purchase / max(1, n_view)) * 2.0
    if n_purchase > 0: decisiveness += 0.3
    
    exploration = (n_search + n_view) / max(1, total)
    research_depth = n_review / max(1, n_view) * 3.0
    price_sensitivity = n_filter / max(1, total) * 5.0
    engagement = min(1.0, total / 100.0)
    
    return {
        "decisiveness": min(1.0, decisiveness),
        "exploration": min(1.0, exploration),
        "research_depth": min(1.0, research_depth),
        "price_sensitivity": min(1.0, price_sensitivity),
        "engagement": engagement
    }

def normalize_action(row):
    at = str(row.get('action_type', '')).lower()
    ct = str(row.get('click_type', '')).lower()
    
    if 'purchase' in at or 'purchase' in ct: return 'purchase'
    if 'add to cart' in at or 'add_to_cart' in ct: return 'add_to_cart'
    if 'filter' in ct or 'sort' in ct: return 'filter'
    if 'review' in ct or 'read' in ct: return 'read_review'
    if 'search' in at: return 'search'
    if 'detail' in at or 'product' in ct: return 'view_detail'
    return 'navigation'

def process():
    try:
        print("Starting Optimized Sample Data Generation...")
        ensure_dirs()
        # Use full_action/train.csv
        action_path = DATA_BASE_DIR / "full_action" / "train.csv"
        user_path = DATA_BASE_DIR / "full_user" / "train.csv" # Load user data for interviews
        
        if not action_path.exists():
             # Fallback or error
             print(f"Error: Data file not found at {action_path}")
             return

        # 1. Load user data for interview transcripts
        user_interviews = {}
        if user_path.exists():
            print("Loading user interviews...")
            user_df_raw = pd.read_csv(user_path, usecols=['user_id', 'interview_transcript_processed'], on_bad_lines='skip')
            for _, row in user_df_raw.iterrows():
                uid = str(row['user_id'])[:8] # First 8 chars to match action data
                if pd.notna(row.get('interview_transcript_processed')):
                    user_interviews[uid] = str(row['interview_transcript_processed'])[:500] # Limit length
            print(f"Loaded {len(user_interviews)} user interviews.")

        # 2. Peek columns first to ensure we request valid ones
        peek = pd.read_csv(action_path, nrows=1)
        available_cols = set(peek.columns)
        actual_use_cols = [c for c in USE_COLS if c in available_cols]
        print(f"Loading cols: {actual_use_cols}")

        # Use chunking if file is huge, or just load limit for sample generation

        print(f"Reading first {ROW_LIMIT} rows...")
        df = pd.read_csv(action_path, nrows=ROW_LIMIT, usecols=actual_use_cols, on_bad_lines='skip')
        print(f"Loaded {len(df)} rows.")

        if 'user_id' not in df.columns:
            if 'session_id' in df.columns:
                print("Deriving user_id...")
                df['user_id'] = df['session_id'].apply(lambda x: str(x).split('_s_')[0] if '_s_' in str(x) else str(x)[:8])
            else:
                raise KeyError("No session_id or user_id found")

        df['norm_type'] = df.apply(normalize_action, axis=1)
        grouped = df.groupby('user_id')
        
        users = []
        print("Processing users...")
        for uid, group in tqdm(grouped):
            if len(group) < 3: continue 
            metrics = calculate_metrics(group)
            persona = determine_persona(metrics, len(group))
            users.append({"user_id": uid, "metrics": metrics, "persona": persona, "event_count": len(group), "group_df": group})

        print(f"Eligible Users: {len(users)}")
        
        # Sampling
        users_by_persona = {p: [] for p in PERSONAS.keys()}
        for u in users:
            users_by_persona[u['persona']].append(u)
            
        final_sample = []
        for p, u_list in users_by_persona.items():
            # Sort by event count to get data-rich sessions, pick top 5
            selected = sorted(u_list, key=lambda x: x['event_count'], reverse=True)[:5]
            final_sample.extend(selected)
            print(f"  {p}: {len(selected)}")
            
        # JSON Gen
        users_json, sessions_json = [], []
        print("Generating JSON outputs...")
        for u in final_sample:
            # User
            impacts = {} 
            if u['metrics']['decisiveness'] > 0.5: impacts['decisiveness'] = ["High Purchase Rate"]
            
            # Calculate total actions across all sessions for this user
            total_actions = sum(len(g) for _, g in u['group_df'].groupby('session_id'))

            users_json.append({
                "user_id": str(u['user_id']),
                "name": f"User {str(u['user_id'])[-4:]}",
                "persona_type": u['persona'],
                "transcribed_interview": user_interviews.get(str(u['user_id'])[:8], generate_interview(u['persona'])), # Use real or fallback to generated
                "behavioral_metrics": u['metrics'],
                "impact_factors": impacts,
                "sessions_count": 1, 
                "total_actions": total_actions,
                "stats": {"total_sessions": 1, "total_time": "15m", "avg_cart": "$100"}
            })
            
            # User session count correction
            # The loop below iterates sessions, but we only append one user object. 
            # We should probably calculate sessions before appending user, or update it.
            # But the logic below iterates u['group_df'].groupby('session_id').
            group_sessions = list(u['group_df'].groupby('session_id'))
            users_json[-1]['sessions_count'] = len(group_sessions)
            
            # Sessions/Timeline
            for sess_id, sess_df in group_sessions:
                sess_df = sess_df.sort_values('timestamp')
                timeline = []
                # Use first timestamp as base
                base_ts_str = sess_df.iloc[0].get('timestamp', str(datetime.now()))
                try:
                    prev_ts = pd.to_datetime(base_ts_str)
                except:
                    prev_ts = datetime.now()

                for _, row in sess_df.iterrows():
                    try:
                        ts = pd.to_datetime(row.get('timestamp', prev_ts))
                    except:
                        ts = prev_ts
                        
                    delay = (ts - prev_ts).total_seconds()
                    prev_ts = ts
                    category = "navigation"
                    nt = row['norm_type']
                    if nt=='purchase': category="conversion"
                    elif nt=='add_to_cart': category="intent"
                    elif nt=='read_review': category="research"
                    elif nt=='search': category="discovery"
                    
                    timeline.append({
                        "timestamp": ts.isoformat(),
                        "action_type": str(row.get('action_type','')),
                        "click_type": str(row.get('click_type','')),
                        "category": category,
                        "product": str(row.get('element_meta',''))[:50],
                        "delay_from_previous_sec": max(0,delay)
                    })
                    
                # Fix: Sanitize session_id thoroughly to avoid OSError
                safe_sid = "".join([c if c.isalnum() else "_" for c in str(sess_id)]).strip()
                if len(safe_sid) > 100: safe_sid = safe_sid[:100]
                
                timeline_file = TIMELINE_DIR / f"{safe_sid}.json"
                with open(timeline_file, 'w') as f:
                    json.dump(timeline, f, indent=2)
                
                # Calculate duration in seconds
                start_dt = pd.to_datetime(sess_df.iloc[0].get('timestamp', base_ts_str))
                end_dt = pd.to_datetime(sess_df.iloc[-1].get('timestamp', base_ts_str))
                duration_sec = (end_dt - start_dt).total_seconds()

                sessions_json.append({
                    "session_id": safe_sid,
                    "safe_id": safe_sid, 
                    "user_id": str(u['user_id']),
                    "start_ts": start_dt.isoformat(), 
                    "duration_sec": max(1, int(duration_sec)), 
                    "action_count": len(sess_df),
                    "session_type": u['persona'],
                    "timeline_available": True # RENAMED from available to match Frontend
                })
                
        with open(OUTPUT_DIR / "users.json", 'w') as f: json.dump(users_json, f, indent=2)
        with open(OUTPUT_DIR / "sessions.json", 'w') as f: json.dump(sessions_json, f, indent=2)
        
        # Generate global_kpis.json (Missing in previous version)
        total_users = len(users_json)
        total_sessions = len(sessions_json)
        avg_sess = round(total_sessions / max(1, total_users), 1)
        
        kpis = {
            "total_users": total_users,
            "total_sessions": total_sessions,
            "avg_sessions_per_user": avg_sess,
            "mode": "SAMPLE",
            "generated_at": datetime.now().isoformat()
        }
        
        with open(OUTPUT_DIR / "global_kpis.json", 'w') as f: json.dump(kpis, f, indent=2)
        
        print(f"Success! Output generated in {OUTPUT_DIR}")
        
    except Exception as e:
        print("FAILED:")
        traceback.print_exc()

if __name__ == "__main__":
    process()
