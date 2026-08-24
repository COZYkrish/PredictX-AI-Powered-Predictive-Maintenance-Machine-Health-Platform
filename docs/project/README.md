# PredictX Project Report

## Abstract
PredictX is an AI-powered system health monitoring platform designed to collect, analyze, and visualize Windows telemetry data. 

## Limitations
PredictX is a demonstrative AI predictive maintenance platform. Due to the lack of access to widespread hardware degradation datasets, the ML labels in this project are proxy/heuristic labels (based on resource thresholds) rather than certified physical hardware failures.
- **Hardware Failure**: PredictX does not guarantee hardware failure predictions. 
- **Sensors**: Not all Windows devices expose battery, GPU, or temperature sensors. Missing sensors gracefully degrade the telemetry collected without crashing.
- **Scalability**: The current WebSocket implementation operates in-memory on a single worker node. Horizontal scaling requires an external message broker like Redis Pub/Sub.

## Conclusion
PredictX successfully demonstrates a modern predictive maintenance workflow using FastAPI, Next.js, and scikit-learn models like XGBoost and Isolation Forests.
