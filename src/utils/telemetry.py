import threading
from typing import Dict

class TelemetryManager:
    def __init__(self):
        self._lock = threading.Lock()
        self.request_count = 0
        self.error_count = 0
        self.total_latency = 0.0
        
        # AI & Vector search metrics
        self.ai_inference_count = 0
        self.total_ai_inference_time = 0.0
        
        self.vector_search_count = 0
        self.total_vector_search_time = 0.0
        
        self.status_counters: Dict[int, int] = {}

    def record_request(self, latency: float, status_code: int):
        with self._lock:
            self.request_count += 1
            self.total_latency += latency
            self.status_counters[status_code] = self.status_counters.get(status_code, 0) + 1

    def record_error(self):
        with self._lock:
            self.error_count += 1

    def record_ai_inference(self, duration: float):
        with self._lock:
            self.ai_inference_count += 1
            self.total_ai_inference_time += duration

    def record_vector_search(self, duration: float):
        with self._lock:
            self.vector_search_count += 1
            self.total_vector_search_time += duration

    def to_prometheus_format(self) -> str:
        with self._lock:
            avg_latency = self.total_latency / self.request_count if self.request_count > 0 else 0.0
            avg_inference = self.total_ai_inference_time / self.ai_inference_count if self.ai_inference_count > 0 else 0.0
            avg_search = self.total_vector_search_time / self.vector_search_count if self.vector_search_count > 0 else 0.0
            
            lines = [
                "# HELP http_requests_total Total number of HTTP requests processed.",
                "# TYPE http_requests_total counter",
                f"http_requests_total {self.request_count}",
                "",
                "# HELP http_errors_total Total number of system or HTTP errors encountered.",
                "# TYPE http_errors_total counter",
                f"http_errors_total {self.error_count}",
                "",
                "# HELP http_request_duration_average_seconds Average request duration in seconds.",
                "# TYPE http_request_duration_average_seconds gauge",
                f"http_request_duration_average_seconds {avg_latency:.6f}",
                "",
                "# HELP ai_inference_duration_average_seconds Average AI model generation duration in seconds.",
                "# TYPE ai_inference_duration_average_seconds gauge",
                f"ai_inference_duration_average_seconds {avg_inference:.6f}",
                "",
                "# HELP vector_search_duration_average_seconds Average vector search similarity query duration in seconds.",
                "# TYPE vector_search_duration_average_seconds gauge",
                f"vector_search_duration_average_seconds {avg_search:.6f}",
            ]
            
            lines.extend([
                "",
                "# HELP http_requests_by_status Total HTTP requests grouped by response status.",
                "# TYPE http_requests_by_status counter"
            ])
            for code, count in self.status_counters.items():
                lines.append(f'http_requests_by_status{{status="{code}"}} {count}')
                
            return "\n".join(lines) + "\n"

# Singleton Instance
telemetry = TelemetryManager()
