#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Analyse der Werbekosten 2023-2025 für NetCo und Microvista
Erstellt aggregierte Daten für den Marketingplan 2026
"""

import csv
import re
from collections import defaultdict
from pathlib import Path

# Arbeitsverzeichnis
BASE_DIR = Path(r"C:\Users\karent\Documents\Software\netcodashboard\docs\Werbekosten")

# Kanal-Kategorisierung mit Suchbegriffen (case-insensitive)
CHANNEL_MAPPING = {
    'Google Ads': [
        'google bsk', 'google bc ', 'google bk ', 'google marketing', 'google allgemein',
        'google ads', 'google adwords', 'google ireland',
        'google 01/', 'google 02/', 'google 03/', 'google 04/',
        'google 05/', 'google 06/', 'google 07/', 'google 08/',
        'google 09/', 'google 10/', 'google 11/', 'google 12/',
        'google  (', 'google ('
    ],
    'Microsoft/Bing Ads': [
        'microsoft/google bk', 'microsoft/google bc', 'microsoft ireland'
    ],
    'LinkedIn': [
        'sales navigator', 'linkedin', 'sales navi'
    ],
    'Meta/Facebook/Instagram': [
        'meta platforms', 'instagram', 'facebook'
    ],
    'Messen/Events': [
        'messekosten', 'messeaufbau', 'konferenz', 'propress', 'dorint',
        'bdws', 'bodycam-konferenz', 'sicherheitstag', 'ausstellergebühr',
        'ausstellergeb', 'conference dinner', 'tagung', 'messe', 'infostand',
        'bc konferenz', 'body-cam konferenz', 'bodycam-infotag',
        'nh collection', 'ameron', 'timeride', 'expo', 'bbom',
        'fachtagung', 'forum', 'kongress'
    ],
    'Content/Video': [
        'fiverr', 'tilo sichler', 'loft film', 'video editing',
        'animated explainer', 'screencasting', 'character animation',
        'fotoshooting', 'godschan', 'drohnen', 'service fee',
        'translation', 'website content', 'social media design',
        'logo design', 'industrial design', 'poster design',
        'search engine marketing'
    ],
    'PR/Presse': [
        'pressebox', 'pressemitteilung', 'stumpp', 'fachartikel',
        'presse', 'dvs media', 'oliver pohl', 'insider magazin',
        'anzeige zeitschrift', 'anzeige in', 'schaltung', 'work4media',
        'newsletter home of foundry'
    ],
    'SEO': [
        'legal.solutions', 'se ranking', 'ad20', 'claneo',
        'adseed', 'seo professional', 'keywordpauschale', 'keyword'
    ],
    'Werbemittel/Druck': [
        'wirmachendruck', 'harzdruckerei', 'reklamewerkstatt', 'trend punkt',
        'aufkleber', 'visitenkarten', 'broschüre', 'broschure', 'fahrzeugbeklebung',
        'xyberdyn', 'flyer', 'faltblatt', 'postkart', 'plastikkart',
        'banner', 'beachflag', 'l-banner', 'messewand', 'hartschaum',
        'plakat', 'block', 'mappe', 'lanyards', 'klatschpapp', 'warnweste',
        'textildruck', 'textilbeschrift', 'stickleistung', 'bedruckung',
        'werbetass', 'kugelschreiber', 'lasergravur', 'kartons',
        'isolierflaschen', 'plato group', 'pensaki', 'weihnachtskart',
        'eintrittskarten', 'einladungskarten', 'concept beschrift',
        'quedlinga', 'folie', 'folien', 'digitaldruck', 'montage'
    ],
    'Tools/Software': [
        'cleverreach', 'cloud4you', 'dropbox', 'elementor',
        'pipedrive', 'google cloud', 'miete crm', 'server tracking',
        'webhostOne', 'newslettermodul'
    ],
    'Freelancer/Agentur': [
        'glocal marketing', 'ekramul hassan', 'le connecteur', 'nessie',
        'ads managment', 'ads management', 'carlo siebert', 'account review',
        'content-marketing', 'content marketing', 'sales support',
        'bouwtafel', 'bouwtv', 'bouwty'
    ]
}

def parse_amount(amount_str):
    """Parse Beträge - CSV nutzt englisches Format: 8,492.94 EUR (Komma=Tausender, Punkt=Dezimal)"""
    if not amount_str or amount_str.strip() == '':
        return 0.0
    
    # Entferne EUR, Leerzeichen etc.
    amount_str = amount_str.replace('EUR', '').strip()
    
    if ',' in amount_str and '.' in amount_str:
        # Bestimme Format anhand Position: letztes Trennzeichen = Dezimal
        last_comma = amount_str.rfind(',')
        last_dot = amount_str.rfind('.')
        if last_dot > last_comma:
            # Englisch: 8,492.94 -> Komma ist Tausender, Punkt ist Dezimal
            amount_str = amount_str.replace(',', '')
        else:
            # Deutsch: 8.492,94 -> Punkt ist Tausender, Komma ist Dezimal
            amount_str = amount_str.replace('.', '').replace(',', '.')
    elif ',' in amount_str:
        amount_str = amount_str.replace(',', '.')
    
    try:
        return float(amount_str)
    except ValueError:
        return 0.0

def categorize_transaction(text, account_name=''):
    """Kategorisiere eine Buchung nach Kanal"""
    text_combined = (text + ' ' + account_name).lower()
    
    # Ignoriere Saldovorträge
    if 'saldovortrag' in text_combined:
        return None
    
    # Spezialfall: Google Cloud → Tools/Software (VOR Google Ads prüfen)
    if 'google cloud' in text_combined:
        return 'Tools/Software'
    
    # Kategorisiere nach Kanälen
    for channel, keywords in CHANNEL_MAPPING.items():
        for keyword in keywords:
            if keyword in text_combined:
                return channel
    
    return 'Sonstiges'

def get_google_subcategory(text):
    """Spezielle Trennung für Google Ads in BSK vs BC"""
    text_lower = text.lower()
    # BSK = BK = Baustellenkameras/BauTV+
    if 'bsk' in text_lower or 'bautv' in text_lower or 'google bk ' in text_lower or 'google bk\t' in text_lower:
        return 'Google Ads BSK'
    elif ' bc ' in text_lower or text_lower.endswith(' bc') or 'bodycam' in text_lower or 'google bc ' in text_lower:
        return 'Google Ads BC'
    elif 'marketing' in text_lower:
        return 'Google Ads Marketing'
    elif 'allgemein' in text_lower or 'nc ' in text_lower:
        return 'Google Ads Allgemein'
    return 'Google Ads Allgemein'

def read_csv_file(filepath, company):
    """Lese eine CSV-Datei und extrahiere Buchungen"""
    transactions = []
    
    # Probiere verschiedene Encodings
    rows = None
    for encoding in ['cp1252', 'utf-8-sig', 'latin-1', 'iso-8859-1']:
        try:
            with open(filepath, 'r', encoding=encoding) as f:
                reader = csv.reader(f)
                rows = list(reader)
            break
        except UnicodeDecodeError:
            continue
    
    if rows is None:
        print(f"FEHLER: Konnte Datei nicht lesen: {filepath}")
        return transactions
    
    # Finde Header-Zeile (enthält "Sachkonto", "Buchungsdatum", etc.)
    header_idx = 0
    for i, row in enumerate(rows):
        if len(row) > 5 and 'Sachkonto' in str(row[1]) and 'Buchungsdatum' in str(row[3]):
            header_idx = i
            break
    
    # Verarbeite Datenzeilen
    for row in rows[header_idx + 1:]:
        if len(row) < 12:
            continue
        
        account = row[1].strip() if len(row) > 1 else ''
        account_name = row[2].strip() if len(row) > 2 else ''
        date = row[3].strip() if len(row) > 3 else ''
        text = row[6].strip() if len(row) > 6 else ''
        creditor_name = row[8].strip() if len(row) > 8 else ''
        doc_type = row[9].strip() if len(row) > 9 else ''
        debit = row[10].strip() if len(row) > 10 else ''
        credit = row[11].strip() if len(row) > 11 else ''
        
        if not text and not creditor_name:
            continue
        
        # Ergebnis-Zeile überspringen
        if 'ergebnis' in text.lower() or 'ergebnis' in account.lower():
            continue
        
        # Parse Beträge
        debit_amount = parse_amount(debit)
        credit_amount = parse_amount(credit)
        net_amount = debit_amount - credit_amount
        
        # Sachkonto 460100 = Messekosten → direkt als Messen/Events
        if account == '460100':
            channel = 'Messen/Events'
        else:
            # Kategorisiere mit Positionstext + Kreditorname für bessere Zuordnung
            channel = categorize_transaction(text, creditor_name)
        if channel is None:  # Saldovortrag ignorieren
            continue
        
        # Bei NetCo + Google Ads: Subkategorisierung
        if company == 'NetCo' and channel == 'Google Ads':
            channel = get_google_subcategory(text)
        
        transactions.append({
            'company': company,
            'date': date,
            'text': text,
            'channel': channel,
            'amount': net_amount
        })
    
    return transactions

def aggregate_by_year_and_channel(transactions):
    """Aggregiere Transaktionen nach Jahr und Kanal"""
    result = defaultdict(float)
    
    for t in transactions:
        # Extrahiere Jahr aus Datum (Format: DD.MM.YYYY)
        if '.' in t['date']:
            year = t['date'].split('.')[-1]
            if year and year.isdigit():
                key = (t['company'], year, t['channel'])
                result[key] += t['amount']
    
    return result

def main():
    """Hauptfunktion: Parse alle CSVs und erstelle Aggregation"""
    
    files = [
        ('Werbekosten NetCo 2023.csv', 'NetCo', '2023'),
        ('Werbekosten NetCo 2024.csv', 'NetCo', '2024'),
        ('Werbekosten NetCo 2025.csv', 'NetCo', '2025'),
        ('Werbekosten MV 2023.csv', 'Microvista', '2023'),
        ('Werbekosten MV 2024.csv', 'Microvista', '2024'),
        ('Werbekosten MV 2025.csv', 'Microvista', '2025'),
    ]
    
    all_transactions = []
    
    print("Lese CSV-Dateien...")
    for filename, company, year in files:
        filepath = BASE_DIR / filename
        if not filepath.exists():
            print(f"WARNUNG: Datei nicht gefunden: {filepath}")
            continue
        
        print(f"  - {filename}")
        transactions = read_csv_file(filepath, company)
        all_transactions.extend(transactions)
    
    print(f"\nGesamt: {len(all_transactions)} Buchungen verarbeitet\n")
    
    # Aggregiere nach Jahr und Kanal
    aggregated = aggregate_by_year_and_channel(all_transactions)
    
    # Sortiere und ausgeben
    print("=" * 80)
    print("AGGREGIERTE WERBEKOSTEN 2023-2025")
    print("=" * 80)
    
    for company in ['NetCo', 'Microvista']:
        print(f"\n{'='*80}")
        print(f"{company}")
        print(f"{'='*80}\n")
        
        company_data = {k: v for k, v in aggregated.items() if k[0] == company}
        
        # Gruppiere nach Kanal
        channels = set(k[2] for k in company_data.keys())
        
        for channel in sorted(channels):
            print(f"\n{channel}:")
            for year in ['2023', '2024', '2025']:
                amount = company_data.get((company, year, channel), 0.0)
                if amount != 0:
                    print(f"  {year}: {amount:>12,.2f} EUR")
        
        # Jahressummen
        print(f"\n{'-'*80}")
        print("Jahressummen:")
        for year in ['2023', '2024', '2025']:
            year_total = sum(v for k, v in company_data.items() if k[1] == year)
            print(f"  {year}: {year_total:>12,.2f} EUR")
    
    # Speichere Daten für weitere Verarbeitung
    output_file = BASE_DIR / 'aggregated_data.csv'
    with open(output_file, 'w', encoding='utf-8', newline='') as f:
        writer = csv.writer(f)
        writer.writerow(['Company', 'Year', 'Channel', 'Amount'])
        for (company, year, channel), amount in sorted(aggregated.items()):
            writer.writerow([company, year, channel, f"{amount:.2f}"])
    
    print(f"\n\nOK - Daten gespeichert in: {output_file}")
    return aggregated

if __name__ == '__main__':
    main()
