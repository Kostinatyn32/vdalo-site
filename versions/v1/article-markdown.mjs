const escapeHtml = value => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;');

function safeHref(value) {
  const href = value.trim();
  if (href.startsWith('/') || href.startsWith('#')) return href;
  try {
    const url = new URL(href);
    return ['https:', 'http:', 'mailto:'].includes(url.protocol) ? href : '';
  } catch {
    return '';
  }
}

function inlineMarkdown(value) {
  let html = escapeHtml(value);
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_match, label, rawHref) => {
    const href = safeHref(rawHref.replaceAll('&amp;', '&'));
    if (!href) return label;
    const external = /^https?:/i.test(href);
    return `<a href="${escapeHtml(href)}"${external ? ' rel="noopener noreferrer"' : ''}>${label}</a>`;
  });
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');
  return html;
}

function slugify(value) {
  return value.toLocaleLowerCase('uk')
    .replace(/[^\p{L}\p{N}\s-]/gu, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

function splitTableRow(line) {
  return line.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map(cell => cell.trim());
}

function isTableDivider(line) {
  return /^\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?$/.test(line.trim());
}

export function renderArticleMarkdown(markdown) {
  const lines = markdown.replace(/^\uFEFF/, '').replace(/\r/g, '').split('\n');
  const html = [];
  const toc = [];
  let index = 0;
  let sectionOpen = false;

  while (index < lines.length) {
    const line = lines[index].trim();
    if (!line) { index++; continue; }

    const heading = /^(#{2,3})\s+(.+)$/.exec(line);
    if (heading) {
      const level = heading[1].length;
      const title = heading[2].trim();
      const id = slugify(title);
      if (level === 2) {
        if (sectionOpen) html.push('</section>');
        html.push(`<section id="${escapeHtml(id)}"><h2>${inlineMarkdown(title)}</h2>`);
        sectionOpen = true;
        toc.push([title, id]);
      } else {
        html.push(`<h3 id="${escapeHtml(id)}">${inlineMarkdown(title)}</h3>`);
      }
      index++;
      continue;
    }

    if (line.startsWith('```')) {
      const code = [];
      index++;
      while (index < lines.length && !lines[index].trim().startsWith('```')) code.push(lines[index++]);
      if (index < lines.length) index++;
      html.push(`<pre><code>${escapeHtml(code.join('\n'))}</code></pre>`);
      continue;
    }

    if (line.startsWith('|') && index + 1 < lines.length && isTableDivider(lines[index + 1])) {
      const header = splitTableRow(line);
      index += 2;
      const rows = [];
      while (index < lines.length && lines[index].trim().startsWith('|')) rows.push(splitTableRow(lines[index++]));
      html.push('<div class="article-table-wrap"><table><thead><tr>');
      html.push(header.map(cell => `<th scope="col">${inlineMarkdown(cell)}</th>`).join(''));
      html.push('</tr></thead><tbody>');
      html.push(rows.map(row => `<tr>${header.map((_cell, cellIndex) => `<td>${inlineMarkdown(row[cellIndex] ?? '')}</td>`).join('')}</tr>`).join(''));
      html.push('</tbody></table></div>');
      continue;
    }

    if (line.startsWith('>')) {
      const quote = [];
      while (index < lines.length && lines[index].trim().startsWith('>')) quote.push(lines[index++].trim().replace(/^>\s?/, ''));
      html.push(`<blockquote><p>${quote.map(inlineMarkdown).join('<br>')}</p></blockquote>`);
      continue;
    }

    const listItem = /^([-*+]\s+|\d+\.\s+)(.*)$/.exec(line);
    if (listItem) {
      const ordered = /^\d/.test(line);
      const items = [];
      while (index < lines.length) {
        const match = /^(?:[-*+]\s+|\d+\.\s+)(.*)$/.exec(lines[index].trim());
        if (!match) break;
        const task = /^\[([ xX])\]\s+(.*)$/.exec(match[1]);
        if (task) {
          const checked = task[1].toLowerCase() === 'x';
          items.push(`<li class="article-task"><input type="checkbox" disabled${checked ? ' checked' : ''}> ${inlineMarkdown(task[2])}</li>`);
        } else {
          items.push(`<li>${inlineMarkdown(match[1])}</li>`);
        }
        index++;
      }
      html.push(`<${ordered ? 'ol' : 'ul'}>${items.join('')}</${ordered ? 'ol' : 'ul'}>`);
      continue;
    }

    const paragraph = [line];
    index++;
    while (index < lines.length && lines[index].trim() && !/^(#{1,6}\s|```|\s*\||>\s?|[-*+]\s+|\d+\.\s+)/.test(lines[index].trim())) paragraph.push(lines[index++].trim());
    html.push(`<p>${inlineMarkdown(paragraph.join(' '))}</p>`);
  }

  if (sectionOpen) html.push('</section>');
  return { html: html.join(''), toc };
}
