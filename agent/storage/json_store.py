from ..models.telemetry import TelemetrySample

def to_json(sample: TelemetrySample) -> str:
    return sample.model_dump_json(indent=2)
