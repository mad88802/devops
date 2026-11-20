from datetime import date, datetime


def to_iso(value):
    """MySQL returns date objects, SQLite returns strings."""
    if isinstance(value, datetime):
        return value.date().isoformat()
    if isinstance(value, date):
        return value.isoformat()
    return value


def clean_row(row, date_fields=()):
    out = dict(row)
    for f in date_fields:
        if f in out:
            out[f] = to_iso(out[f])
    return out
