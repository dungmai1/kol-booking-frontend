# -*- coding: utf-8 -*-
"""Refresh portfolio items for KOL @m.thang3001."""
import os
import sys

import psycopg2

VIDEOS = [
    (
        "Day 11 Hoàn thành — 30 ngày thay đổi bản thân",
        "https://www.tiktok.com/@m.thang3001/video/7631296449514769684",
        "Fitness challenge",
    ),
    (
        "Buổi tối của người độc lập tình cảm",
        "https://www.tiktok.com/@m.thang3001/video/7611216945299344660",
        "Vlog đời sống",
    ),
    (
        "Thức sớm nhất TikTok — bình minh",
        "https://www.tiktok.com/@m.thang3001/video/7601665697478954261",
        "Vlog buổi sáng",
    ),
    (
        "Review trà sen vàng cùng Hồng Ngọc",
        "https://www.tiktok.com/@m.thang3001/video/7597370056498056469",
        "Review đồ uống",
    ),
    (
        "Chạy rẽ khói là có thật",
        "https://www.tiktok.com/@m.thang3001/video/7606174419240635669",
        "Vlog viral",
    ),
]


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
    conn = connect()
    conn.autocommit = True
    cur = conn.cursor()
    cur.execute(
        """
        SELECT kp.id FROM kol_profile kp
        JOIN app_user u ON u.id = kp.user_id
        WHERE kp.slug = 'm-thang3001'
        """
    )
    row = cur.fetchone()
    if not row:
        print("KOL m-thang3001 not found", file=sys.stderr)
        sys.exit(1)
    kol_id = row[0]

    cur.execute("DELETE FROM kol_portfolio_item WHERE kol_profile_id = %s", (kol_id,))
    for title, media_url, campaign in VIDEOS:
        cur.execute(
            """
            INSERT INTO kol_portfolio_item (kol_profile_id, title, media_url, media_type, campaign_name)
            VALUES (%s, %s, %s, 'VIDEO', %s)
            """,
            (kol_id, title, media_url, campaign),
        )

    cur.execute(
        "SELECT id, title, media_url FROM kol_portfolio_item WHERE kol_profile_id = %s ORDER BY id",
        (kol_id,),
    )
    items = cur.fetchall()
    print(f"Portfolio updated for kol_profile_id={kol_id}: {len(items)} videos")
    for item in items:
        print(" -", item[0], item[1])
    conn.close()


if __name__ == "__main__":
    main()
