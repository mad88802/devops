class ValidationError(Exception):
    """Payload rejected. details = [{"field": ..., "message": ...}, ...]"""

    def __init__(self, details):
        super().__init__("validation failed")
        self.details = details


class NotFoundError(Exception):
    """Requested resource does not exist."""


class ConflictError(Exception):
    """The request conflicts with the current state (e.g. the same report twice)."""
