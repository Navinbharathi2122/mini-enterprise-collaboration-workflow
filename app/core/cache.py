import json
import logging
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

def get_json(key: str):
    try:
        value = _redis().get(key)
        return json.loads(value) if value else None
    except (RedisError, ValueError):
        logger.warning("Cache read unavailable; continuing without cache", exc_info=True)
        return None

def set_json(key: str, value, ttl: int = 60):
    try:
        _redis().setex(key, ttl, json.dumps(value, default=str))
    except RedisError:
        logger.warning("Cache write unavailable; continuing without cache", exc_info=True)

def delete_pattern(pattern: str):
    try:
        client = _redis()
        keys = list(client.scan_iter(match=pattern, count=100))
        if keys:
            client.delete(*keys)
    except RedisError:
        logger.warning("Cache invalidation unavailable", exc_info=True)
