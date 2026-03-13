import csv

for fname, company in [('Werbekosten MV 2025.csv', 'MV'), ('Werbekosten NetCo 2025.csv', 'NetCo')]:
    print(f"\n=== {company} 2025 - Sonstiges ===")
    with open(fname, encoding='cp1252') as f:
        rows = list(csv.reader(f))
    
    # Find header
    header_idx = 0
    for i, row in enumerate(rows):
        if len(row) > 5 and 'Sachkonto' in str(row[1]):
            header_idx = i
            break
    
    for row in rows[header_idx+1:]:
        if len(row) < 12:
            continue
        text = row[6].strip()
        creditor = row[8].strip() if len(row) > 8 else ''
        soll = row[10].strip()
        haben = row[11].strip()
        
        if not text or 'saldovortrag' in text.lower() or 'ergebnis' in row[1].strip().lower():
            continue
        if not soll and not haben:
            continue
            
        combined = (text + ' ' + creditor).lower()
        
        # Quick check: does it match any known category?
        known = ['google', 'microsoft', 'linkedin', 'meta platform', 'messe', 'fiverr',
                 'tilo sichler', 'loft film', 'video', 'animated', 'screencasting',
                 'presse', 'dvs media', 'oliver pohl', 'fachartikel', 'anzeige',
                 'se ranking', 'ad20', 'adseed', 'seo', 'keyword', 'claneo',
                 'wirmachendruck', 'harzdruckerei', 'reklamewerkstatt', 'trend punkt',
                 'flyer', 'faltblatt', 'postkart', 'plastikkart', 'visitenkart',
                 'brosch', 'banner', 'beachflag', 'messewand', 'hartschaum',
                 'aufkleber', 'folie', 'digitaldruck', 'plakat', 'mappe', 'lanyards',
                 'werbetass', 'kugelschreiber', 'kartons', 'isolierflaschen',
                 'weihnachtskart', 'eintrittskart', 'bedruckung', 'textil', 'stickleistung',
                 'warnweste', 'concept beschrift', 'quedlinga', 'pensaki', 'plato group',
                 'cleverreach', 'cloud4you', 'dropbox', 'elementor', 'pipedrive',
                 'google cloud', 'miete crm', 'server tracking', 'webhostOne'.lower(), 'newslettermodul',
                 'glocal marketing', 'ekramul hassan', 'le connecteur', 'nessie',
                 'ads managment', 'ads management', 'carlo siebert', 'account review',
                 'content-marketing', 'content marketing', 'sales support',
                 'bouwtafel', 'bouwtv', 'service fee', 'translation', 'website content',
                 'social media design', 'logo design', 'industrial design', 'poster design',
                 'search engine marketing', 'fotoshoot', 'godschan', 'drohnen',
                 'character animation', 'work4media', 'schaltung',
                 'konferenz', 'propress', 'dorint', 'bdws', 'sicherheitstag',
                 'ausstellergeb', 'tagung', 'infostand', 'nh collection', 'ameron',
                 'timeride', 'expo', 'bbom', 'fachtagung', 'forum', 'kongress',
                 'bodycam-infotag', 'sales navi', 'instagram', 'facebook',
                 'insider magazin', 'home of foundry']
        
        is_known = any(k in combined for k in known)
        if not is_known:
            print(f"  {text[:60]:60s} | {creditor[:30]:30s} | S:{soll:>15s} H:{haben:>15s}")
