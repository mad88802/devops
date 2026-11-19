"""T2.3 - Company getter (Company_Intf: Display_Company)."""
from ..errors import NotFoundError


def get_company(conn, company_id):
    row = conn.fetch_one("SELECT * FROM company WHERE company_id = %s", (company_id,))
    if row is None:
        raise NotFoundError(f"company {company_id} not found")
    return row


def company_exists(conn, company_id):
    return conn.fetch_one("SELECT 1 AS ok FROM company WHERE company_id = %s",
                          (company_id,)) is not None
