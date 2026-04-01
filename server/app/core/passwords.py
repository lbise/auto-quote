import base64
import hashlib
import hmac
import secrets


SCRYPT_N = 2**14
SCRYPT_R = 8
SCRYPT_P = 1
SCRYPT_DKLEN = 64


def hash_password(password: str) -> str:
    salt = secrets.token_bytes(16)
    derived_key = hashlib.scrypt(
        password.encode("utf-8"),
        salt=salt,
        n=SCRYPT_N,
        r=SCRYPT_R,
        p=SCRYPT_P,
        dklen=SCRYPT_DKLEN,
    )
    return "scrypt${}${}${}${}${}".format(
        SCRYPT_N,
        SCRYPT_R,
        SCRYPT_P,
        _b64encode(salt),
        _b64encode(derived_key),
    )


def verify_password(password: str, password_hash: str) -> bool:
    try:
        scheme, n_value, r_value, p_value, encoded_salt, encoded_hash = password_hash.split("$", 5)
    except ValueError:
        return False

    if scheme != "scrypt":
        return False

    try:
        salt = _b64decode(encoded_salt)
        expected_hash = _b64decode(encoded_hash)
        derived_key = hashlib.scrypt(
            password.encode("utf-8"),
            salt=salt,
            n=int(n_value),
            r=int(r_value),
            p=int(p_value),
            dklen=len(expected_hash),
        )
    except (ValueError, TypeError):
        return False

    return hmac.compare_digest(derived_key, expected_hash)


def _b64encode(value: bytes) -> str:
    return base64.urlsafe_b64encode(value).decode("utf-8").rstrip("=")


def _b64decode(value: str) -> bytes:
    padding = "=" * (-len(value) % 4)
    return base64.urlsafe_b64decode(f"{value}{padding}")
