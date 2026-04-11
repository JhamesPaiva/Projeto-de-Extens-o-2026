class ServiceError(Exception):
    def __init__(self, message, status_code=400, extra_payload=None):
        super().__init__(message)
        self.message = message
        self.status_code = status_code
        self.extra_payload = extra_payload or {}