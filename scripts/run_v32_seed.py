# -*- coding: utf-8 -*-
"""Apply V32 KOL seed SQL directly (one-off)."""
import os
import sys
from pathlib import Path

import psycopg2

SQL_FILE = Path(__file__).resolve().parents[2] / "kol-booking-backend" / "src" / "main" / "resources" / "db" / "migration" / "V32__seed_kol_m_thang3001.sql"


def main():
    url = os.environ.get("SPRING_DATASOURCE_URL", "")
    if url.startswith("jdbc:postgresql://"):
        # jdbc:postgresql://host:5432/dbname
        rest = url.removeprefix("jdbc:postgresql://")
        host_port, dbname = rest.split("/", 1)
        host, port = host_port.split(":")
    else:
        host = "ep-crimson-bird-aobj8b56-pooler.c-2.ap-southeast-1.aws.neon.tech"
        port = "5432"
        dbname = "neondb"

    user = os.environ.get("SPRING_DATASOURCE_USERNAME", "neondb_owner")
    password = os.environ.get("SPRING_DATASOURCE_PASSWORD")
    if not password:
        print("Set SPRING_DATASOURCE_PASSWORD", file=sys.stderr)
        sys.exit(1)

    sql = SQL_FILE.read_text(encoding="utf-8")
    conn = psycopg2.connect(
        host=host,
        port=int(port),
        dbname=dbname,
        user=user,
        password=password,
        sslmode="require",
    )
    conn.autocommit = True
    cur = conn.cursor()

    cur.execute("SELECT 1 FROM flyway_schema_history WHERE version = '32'")
    if cur.fetchone():
        print("V32 already applied — skipping SQL.")
    else:
        cur.execute(sql)
        print("V32 SQL executed.")

    cur.execute(
        """
        SELECT kp.id, kp.display_name, kp.slug, kp.status, c.follower_count
        FROM kol_profile kp
        JOIN app_user u ON u.id = kp.user_id
        LEFT JOIN kol_social_channel c ON c.kol_profile_id = kp.id AND c.platform = 'TIKTOK'
        WHERE u.email = 'm.thang3001@seed.local'
        """
    )
    row = cur.fetchone()
    print("KOL record:", row)
    conn.close()


if __name__ == "__main__":
    main()
