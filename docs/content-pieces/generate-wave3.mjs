import puppeteer from 'puppeteer';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

const pages = [
  { file: 'branchenvergleich-7-branchen.html', out: 'NetCo_Branchenvergleich_7_Branchen_2026.pdf', landscape: false, margin: '10mm' },
  { file: 'prozess-comic-einfuehrung.html', out: 'NetCo_Prozess_Comic_Einfuehrung_2026.pdf', landscape: false, margin: '8mm' },
  { file: 'dienstanweisung-bodycam-muster.html', out: 'NetCo_Dienstanweisung_Muster_2026.pdf', landscape: false, margin: '12mm' },
  { file: 'schulungskonzept-train-the-trainer.html', out: 'NetCo_Schulungskonzept_Train_the_Trainer_2026.pdf', landscape: false, margin: '10mm' },
  { file: 'comic-gerichtsverfahren.html', out: 'NetCo_Gerichtsverfahren_mit_vs_ohne_2026.pdf', landscape: false, margin: '8mm' },
  { file: 'it-sicherheitskonzept-bsi.html', out: 'NetCo_IT_Sicherheitskonzept_BSI_2026.pdf', landscape: false, margin: '12mm' },
  { file: 'workshop-agenda-pilot-verkaufen.html', out: 'NetCo_Workshop_Pilot_Verkaufen_2026.pdf', landscape: false, margin: '10mm' },
  { file: 'video-storyboard-deeskalation.html', out: 'NetCo_Video_Storyboard_Deeskalation_2026.pdf', landscape: false, margin: '8mm' },
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
  console.log('\nDone!');
}

generatePDFs().catch(console.error);
