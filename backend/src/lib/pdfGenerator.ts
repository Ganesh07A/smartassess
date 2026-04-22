import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

/**
 * Generates a PDF from an HTML template with injected data.
 */
export async function generatePDF(templateName: string, data: Record<string, any>) {
  const templatePath = path.join(__dirname, '../templates', `${templateName}.html`);
  let html = fs.readFileSync(templatePath, 'utf8');

  // Simple string injection for the top-level fields
  Object.keys(data).forEach(key => {
    if (typeof data[key] !== 'object') {
      const regex = new RegExp(`{{${key}}}`, 'g');
      html = html.replace(regex, data[key]);
    }
  });

  // Handle sections loop (Specific to student report)
  if (data.sections && Array.isArray(data.sections)) {
    let sectionsHtml = '';
    data.sections.forEach((s: any) => {
      sectionsHtml += `
        <tr>
          <td>${s.sectionType}</td>
          <td>${s.score}</td>
          <td>${s.maxMarks}</td>
          <td>${Math.round((s.score / s.maxMarks) * 100)}%</td>
        </tr>
      `;
    });
    html = html.replace('{{#each sections}}', '').replace('{{/each}}', '');
    // Note: This is a very crude replacement for the sake of demo speed.
    // In production, use Handlebars or EJS.
    html = html.replace('<tr>\n                <td>{{sectionType}}</td>\n                <td>{{score}}</td>\n                <td>{{maxMarks}}</td>\n                <td>{{percentage}}%</td>\n            </tr>', sectionsHtml);
  }

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: 'networkidle0' });

  const pdfBuffer = await page.pdf({
    format: 'A4',
    printBackground: true,
    margin: { top: '20px', right: '20px', bottom: '20px', left: '20px' }
  });

  await browser.close();
  return pdfBuffer;
}
