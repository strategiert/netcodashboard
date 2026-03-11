import puppeteer from 'puppeteer';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

const pages = [
  { file: 'referenzliste-25-kunden.html', out: 'NetCo_Referenzliste_Kunden_2026.pdf', landscape: false, margin: '10mm' },
  { file: 'anbieter-vergleichsmatrix.html', out: 'NetCo_Anbieter_Vergleichsmatrix_2026.pdf', landscape: true, margin: '8mm' },
  { file: 'checkliste-pilotprojekt-oepnv.html', out: 'NetCo_Checkliste_Pilotprojekt_OEPNV_2026.pdf', landscape: false, margin: '10mm' },
  { file: 'implementierungs-guide-90-tage.html', out: 'NetCo_90_Tage_Rollout_Guide_2026.pdf', landscape: false, margin: '10mm' },
  { file: 'case-study-koeln.html', out: 'NetCo_Case_Study_Koeln_2026.pdf', landscape: false, margin: '10mm' },
];

async function generatePDFs() {
  const browser = await puppeteer.launch({ headless: true });

  for (const p of pages) {
    console.log(`Generating: ${p.out}...`);
    const page = await browser.newPage();
    await page.goto(`file://${join(__dirname, p.file)}`, { waitUntil: 'networkidle0', timeout: 30000 });
    await page.pdf({
      path: join(__dirname, p.out),
      format: 'A4',
      landscape: p.landscape,
      printBackground: true,
      margin: { top: p.margin, bottom: p.margin, left: p.margin, right: p.margin },
    });
    console.log(`  ✓ ${p.out}`);
  }

  await browser.close();
  console.log('\nDone! PDFs generated in:', __dirname);
}

generatePDFs().catch(console.error);
