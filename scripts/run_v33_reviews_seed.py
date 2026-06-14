# -*- coding: utf-8 -*-
"""Apply V33 review seed for KOL m-thang3001."""
import os
import sys
from pathlib import Path

import psycopg2

SQL_FILE = (
    Path(__file__).resolve().parents[2]
    / "kol-booking-backend"
    / "src"
    / "main"
    / "resources"
    / "db"
    / "migration"
    / "V33__seed_reviews_m_thang3001.sql"
)


def connect():
    url = os.environ.get("SPRING_DATASOURCE_URL", "")
    if url.startswith("jdbc:postgresql://"):
        rest = url.removeprefix("jdbc:postgresql://")
        host_port, dbname = rest.split("/", 1)
        host, port = host_port.split(":")
    else:
        host = "ep-crimson-bird-aobj8b56-pooler.c-2.ap-southeast-1.aws.neon.tech"
        port = "5432"
        dbname = "neondb"
    password = os.environ.get("SPRING_DATASOURCE_PASSWORD")
    if not password:
        print("Set SPRING_DATASOURCE_PASSWORD", file=sys.stderr)
        sys.exit(1)
    user = os.environ.get("SPRING_DATASOURCE_USERNAME", "neondb_owner")
    return psycopg2.connect(
        host=host, port=int(port), dbname=dbname, user=user, password=password, sslmode="require"
    )


def main():
    sql = SQL_FILE.read_text(encoding="utf-8")
    conn = connect()
    conn.autocommit = True
    cur = conn.cursor()

    cur.execute("SELECT 1 FROM flyway_schema_history WHERE version = '33'")
    if cur.fetchone():
        print("V33 already applied.")
    else:
        cur.execute(sql)
        print("V33 SQL executed.")

    cur.execute(
        """
        SELECT kp.display_name, kp.avg_rating, kp.review_count, COUNT(r.id)
        FROM kol_profile kp
        JOIN app_user u ON u.id = kp.user_id
        LEFT JOIN review r ON r.target_id = u.id AND r.direction = 'BRAND_TO_KOL'
        WHERE kp.slug = 'm-thang3001'
        GROUP BY kp.id, kp.display_name, kp.avg_rating, kp.review_count
        """
    )
    row = cur.fetchone()
    print("KOL:", row)

    cur.execute(
        """
        SELECT r.rating, r.comment, b.campaign_title
        FROM review r
        JOIN booking b ON b.id = r.booking_id
        JOIN kol_profile kp ON kp.id = b.kol_profile_id
        WHERE kp.slug = 'm-thang3001' AND r.direction = 'BRAND_TO_KOL'
        ORDER BY r.id
        """
    )
    for review in cur.fetchall():
        print(f"  [{review[0]}★] {review[2]}")
    conn.close()


if __name__ == "__main__":
    main()
