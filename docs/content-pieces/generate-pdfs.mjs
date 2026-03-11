import puppeteer from 'puppeteer';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

async function generatePDFs() {
  const browser = await puppeteer.launch({ headless: true });

  // 1. Referenzliste — A4 Portrait
  console.log('Generating: Referenzliste 25 Kunden (A4 Portrait)...');
  const page1 = await browser.newPage();
  await page1.goto(`file://${join(__dirname, 'referenzliste-25-kunden.html')}`, { waitUntil: 'networkidle0', timeout: 30000 });
  await page1.pdf({
    path: join(__dirname, 'NetCo_Referenzliste_Kunden_2026.pdf'),
    format: 'A4',
    landscape: false,
    printBackground: true,
    margin: { top: '10mm', bottom: '10mm', left: '10mm', right: '10mm' },
  });
  console.log('  ✓ NetCo_Referenzliste_Kunden_2026.pdf');

  // 2. Anbieter-Vergleichsmatrix — A4 Landscape
  console.log('Generating: Anbieter-Vergleichsmatrix (A4 Landscape)...');
  const page2 = await browser.newPage();
  await page2.goto(`file://${join(__dirname, 'anbieter-vergleichsmatrix.html')}`, { waitUntil: 'networkidle0', timeout: 30000 });
  await page2.pdf({
    path: join(__dirname, 'NetCo_Anbieter_Vergleichsmatrix_2026.pdf'),
    format: 'A4',
    landscape: true,
    printBackground: true,
    margin: { top: '8mm', bottom: '8mm', left: '8mm', right: '8mm' },
  });
  console.log('  ✓ NetCo_Anbieter_Vergleichsmatrix_2026.pdf');

  await browser.close();
  console.log('\nDone! PDFs generated in:', __dirname);
}

generatePDFs().catch(console.error);
