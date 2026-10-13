export function addAuthorContext(html) {
  const byline = '<span>Автор: <a href="/authors/oleh-stepeniev">Олег Степенєв</a></span>';
  const context = '<span class="article-author-context"><a href="/authors/oleh-stepeniev">Підприємець із 20+ роками досвіду; останні 7 років працює з модульними будинками й готельною нерухомістю</a></span>';
  return html.replaceAll(byline, `${byline}${context}`).replace('</head>', '<style>.article-author-context{flex-basis:100%;font-size:.84rem;line-height:1.5;color:#675b68}.article-author-context a{color:inherit;text-decoration-color:#c8799e;text-underline-offset:3px}.article-author-context a:hover{text-decoration-thickness:2px}</style></head>');
}
