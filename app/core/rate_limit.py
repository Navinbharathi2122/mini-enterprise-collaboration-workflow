"""Redis-backed fixed-window limiter for sensitive endpoints."""
import logging
from fastapi import HTTPException, Request
from redis import Redis
from redis.exceptions import RedisError
from app.core.config import settings

logger = logging.getLogger(__name__)
_client = None

def _redis():
    global _client
    if _client is None:
        _client = Redis.from_url(settings.redis_url, decode_responses=True, socket_connect_timeout=1, socket_timeout=1)
    return _client

class RateLimit:
    def __init__(self, bucket: str, limit: int, window_seconds: int = 60):
        self.bucket, self.limit, self.window_seconds = bucket, limit, window_seconds

    def __call__(self, request: Request):
        # Do not trust arbitrary X-Forwarded-For values unless a trusted proxy is configured.
        client_ip = request.client.host if request.client else "unknown"
        key = f"mecw:rate:{self.bucket}:{client_ip}"
        try:
            client = _redis()
            count = client.incr(key)
            if count == 1:
                client.expire(key, self.window_seconds)
            ttl = client.ttl(key)
        except RedisError as exc:
            logger.error("Rate limiter unavailable for bucket=%s", self.bucket)
            raise HTTPException(status_code=503, detail="Security rate limiter is temporarily unavailable") from exc
        if count > self.limit:
            raise HTTPException(status_code=429, detail="Too many requests. Please try again later.", headers={"Retry-After": str(max(ttl, 1))})
