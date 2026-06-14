# -*- coding: utf-8 -*-
"""Add missing Vinamilk booking + review for m-thang3001 if absent."""
import os
import psycopg2
from pathlib import Path

for line in Path(r"C:\Users\win11\Desktop\dungmai\kol-booking-backend\.env").read_text().splitlines():
    if "=" in line and not line.startswith("#"):
        k, v = line.split("=", 1)
        os.environ[k.strip()] = v.strip()

u = os.environ["SPRING_DATASOURCE_URL"].replace("jdbc:postgresql://", "")
hp, db = u.split("/", 1)
h, p = hp.split(":")
conn = psycopg2.connect(
    host=h, port=int(p), dbname=db,
    user=os.environ["SPRING_DATASOURCE_USERNAME"],
    password=os.environ["SPRING_DATASOURCE_PASSWORD"],
    sslmode="require",
)
conn.autocommit = True
cur = conn.cursor()

cur.execute(
    "SELECT 1 FROM booking b JOIN kol_profile kp ON kp.id=b.kol_profile_id "
    "WHERE kp.slug='m-thang3001' AND b.campaign_title='Koi Vinamilk Fit Morning'"
)
if cur.fetchone():
    print("Vinamilk booking already exists")
else:
    cur.execute("""
        INSERT INTO booking (
            brand_profile_id, kol_profile_id, campaign_title, campaign_brief,
            deliverables, budget, start_date, end_date, status
        )
        SELECT bp.id, kp.id,
            'Koi Vinamilk Fit Morning',
            'Series buoi sang tap luyen ket hop uong sua Vinamilk.',
            '2 TikTok fitness vlogs + 1 IG story', 12000000.00,
            DATE '2026-04-10', DATE '2026-04-28', 'COMPLETED'
        FROM brand_profile bp, kol_profile kp
        WHERE bp.company_name = 'Vinamilk' AND kp.slug = 'm-thang3001'
    """)
    print("Inserted Vinamilk booking")

cur.execute("""
    INSERT INTO review (booking_id, author_id, target_id, direction, rating, comment)
    SELECT b.id, brand_u.id, kol_u.id, 'BRAND_TO_KOL', 5,
        'Noi dung tap luyen buoi sang rat nang luong, sua Vinamilk duoc long ghep tu nhien. Video de viral trong cong dong fitness.'
    FROM booking b
    JOIN brand_profile bp ON bp.id = b.brand_profile_id
    JOIN kol_profile kp ON kp.id = b.kol_profile_id
    JOIN app_user brand_u ON brand_u.id = bp.user_id
    JOIN app_user kol_u ON kol_u.id = kp.user_id
    WHERE kp.slug = 'm-thang3001' AND b.campaign_title = 'Koi Vinamilk Fit Morning'
      AND NOT EXISTS (
          SELECT 1 FROM review r WHERE r.booking_id = b.id AND r.direction = 'BRAND_TO_KOL'
      )
""")

cur.execute("""
    UPDATE kol_profile k SET
        avg_rating = stats.avg_rating,
        review_count = stats.review_count,
        updated_at = NOW()
    FROM (
        SELECT r.target_id AS kol_user_id,
               ROUND(AVG(r.rating)::NUMERIC, 2) AS avg_rating,
               COUNT(*)::INTEGER AS review_count
        FROM review r
        JOIN kol_profile kp ON kp.user_id = r.target_id
        WHERE r.direction = 'BRAND_TO_KOL' AND kp.slug = 'm-thang3001'
        GROUP BY r.target_id
    ) stats
    WHERE k.user_id = stats.kol_user_id
""")

cur.execute(
    "SELECT avg_rating, review_count FROM kol_profile WHERE slug='m-thang3001'"
)
print("Updated:", cur.fetchone())
conn.close()
