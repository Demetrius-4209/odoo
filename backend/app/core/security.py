from datetime import datetime, timedelta
from jose import JWTError, jwt
from passlib.context import CryptContext
from app.core.config import settings

# bcrypt password context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def _truncate_password(password: str) -> str:
    """
    Ensure password fits bcrypt's 72 byte limit.
    Handles UTF-8 safely.
    """
    encoded = password.encode("utf-8")

    if len(encoded) <= 72:
        return password

    encoded = encoded[:72]

    # Avoid cutting UTF-8 characters in half
    while True:
        try:
            return encoded.decode("utf-8")
        except UnicodeDecodeError:
            encoded = encoded[:-1]


def hash_password(password: str) -> str:
    """
    Hash password safely for bcrypt.
    """
    safe_password = _truncate_password(password)
    return pwd_context.hash(safe_password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify password safely against stored hash.
    """
    safe_password = _truncate_password(plain_password)
    return pwd_context.verify(safe_password, hashed_password)


def create_access_token(data: dict) -> str:
    """
    Create JWT access token.
    """
    to_encode = data.copy()

    expire = datetime.utcnow() + timedelta(
        minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
    )

    to_encode.update({"exp": expire})

    return jwt.encode(
        to_encode,
        settings.SECRET_KEY,
        algorithm=settings.ALGORITHM
    )


def decode_token(token: str):
    """
    Decode JWT token.
    """
    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM]
        )
        return payload
    except JWTError:
        return None