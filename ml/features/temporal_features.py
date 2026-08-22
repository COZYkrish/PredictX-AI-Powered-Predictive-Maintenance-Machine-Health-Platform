import pandas as pd

def generate_temporal_features(df: pd.DataFrame) -> pd.DataFrame:
    """
    Generates rolling features based purely on past data.
    Ensures device_id boundaries are respected.
    """
    df = df.copy()
    
    # Must sort by time before rolling
    df = df.sort_values(by=['device_id', 'timestamp_utc'])
    
    # Group by device
    grouped = df.groupby('device_id')
    
    # Base numeric cols to apply rolling stats to
    cols_to_roll = [
        'cpu_usage_percent', 'memory_percent', 'disk_usage_percent',
        'network_upload_bytes_per_sec', 'network_download_bytes_per_sec'
    ]
    cols_to_roll = [c for c in cols_to_roll if c in df.columns]
    
    # Delta (difference from immediate previous)
    for col in cols_to_roll:
        df[f'delta_{col}'] = grouped[col].diff()
        
    # We can't strictly use time-based rolling easily with groupby in pandas directly without a DatetimeIndex
    # We will use row-based rolling assuming ~10s interval. 3 rows = 30s, 6 rows = 60s
    # Alternatively, set index to timestamp. Let's do that for clean time-based rolling.
    df = df.set_index('timestamp_utc')
    grouped = df.groupby('device_id')
    
    windows = {'30s': '30s', '60s': '60s'}
    
    for w_name, w_val in windows.items():
        for col in cols_to_roll:
            # past only (closed='right', default for rolling on datetime)
            roll = grouped[col].rolling(w_val)
            df[f'{col}_{w_name}_mean'] = roll.mean().reset_index(level=0, drop=True)
            df[f'{col}_{w_name}_max'] = roll.max().reset_index(level=0, drop=True)
            df[f'{col}_{w_name}_std'] = roll.std().reset_index(level=0, drop=True)
            
    df = df.reset_index()
    
    # Re-sort just to be safe
    df = df.sort_values(by=['device_id', 'timestamp_utc'])
    return df
