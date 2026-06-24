import type { ExportFormat } from '../../types';

function htmlToMarkdown(html: string): string {
  // Basic HTML to Markdown conversion
  return html
    .replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1\n\n')
    .replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1\n\n')
    .replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1\n\n')
    .replace(/<h4[^>]*>(.*?)<\/h4>/gi, '#### $1\n\n')
    .replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**')
    .replace(/<b[^>]*>(.*?)<\/b>/gi, '**$1**')
    .replace(/<em[^>]*>(.*?)<\/em>/gi, '*$1*')
    .replace(/<i[^>]*>(.*?)<\/i>/gi, '*$1*')
    .replace(/<code[^>]*>(.*?)<\/code>/gi, '`$1`')
    .replace(/<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi, '[$2]($1)')
    .replace(/<ul[^>]*>(.*?)<\/ul>/gis, (_, inner) =>
      inner.replace(/<li[^>]*>(.*?)<\/li>/gi, '- $1\n')
    )
    .replace(/<ol[^>]*>(.*?)<\/ol>/gis, (_, inner) => {
      let i = 0;
      return inner.replace(/<li[^>]*>(.*?)<\/li>/gi, () => `${++i}. $1\n`);
    })
    .replace(/<blockquote[^>]*>(.*?)<\/blockquote>/gis, '> $1\n\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<p[^>]*>(.*?)<\/p>/gi, '$1\n\n')
    .replace(/<hr\s*\/?>/gi, '---\n\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function htmlToText(html: string): string {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  return doc.body.textContent ?? '';
}

export function exportContent(html: string, format: ExportFormat, title: string): void {
  let content: string;
  let mimeType: string;
  let extension: string;

  switch (format) {
    case 'html':
      content = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif; max-width: 800px; margin: 40px auto; padding: 0 24px; line-height: 1.6; color: #1a1a1a; }
    h1, h2, h3, h4 { font-weight: 600; }
    code { background: #f4f4f4; padding: 2px 6px; border-radius: 4px; font-size: 0.9em; }
    pre { background: #f4f4f4; padding: 16px; border-radius: 8px; overflow-x: auto; }
    blockquote { border-left: 4px solid #e0e0e0; margin: 0; padding-left: 16px; color: #666; }
    a { color: #007aff; }
    table { border-collapse: collapse; width: 100%; }
    td, th { border: 1px solid #e0e0e0; padding: 8px 12px; text-align: left; }
    th { background: #f8f8f8; font-weight: 600; }
  </style>
</head>
<body>
  <h1>${title}</h1>
  ${html}
</body>
</html>`;
      mimeType = 'text/html';
      extension = 'html';
      break;

    case 'markdown':
      content = `# ${title}\n\n${htmlToMarkdown(html)}`;
      mimeType = 'text/markdown';
      extension = 'md';
      break;

    case 'text':
      content = `${title}\n${'='.repeat(title.length)}\n\n${htmlToText(html)}`;
      mimeType = 'text/plain';
      extension = 'txt';
      break;
  }

  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${title}.${extension}`;
  a.click();
  URL.revokeObjectURL(url);
}

export function printContent(html: string, title: string): void {
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  printWindow.document.write(`<!DOCTYPE html>
<html>
<head>
  <title>${title}</title>
  <style>
    @media print {
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif; max-width: 800px; margin: 0 auto; line-height: 1.6; color: #000; font-size: 11pt; }
      h1, h2, h3, h4 { page-break-after: avoid; }
      pre, blockquote { page-break-inside: avoid; }
      a { color: #000; text-decoration: underline; }
    }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif; max-width: 800px; margin: 40px auto; padding: 0 24px; line-height: 1.6; }
    code { background: #f4f4f4; padding: 2px 6px; border-radius: 4px; }
    pre { background: #f4f4f4; padding: 16px; border-radius: 8px; }
    blockquote { border-left: 4px solid #e0e0e0; margin: 0; padding-left: 16px; color: #666; }
  </style>
</head>
<body>
  <h1>${title}</h1>
  ${html}
</body>
</html>`);
  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => {
    printWindow.print();
    printWindow.close();
  }, 250);
}
