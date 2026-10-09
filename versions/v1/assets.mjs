import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

const publicUrl = new URL('./public/', import.meta.url);
const digest = value => createHash('sha256').update(value).digest('hex').slice(0, 12);

export function assetVersion(name) {
 return digest(readFileSync(new URL(name, publicUrl)));
}

export function assetUrl(name) {
 return `/assets/${name}?v=${assetVersion(`assets/${name}`)}`;
}

const sharedStyles = [
 'styles.css',
 'design-system-2.css',
 'polish.css',
 'refinement.css',
 'integration-channels.css',
 'pricing.css',
];

function bundle(files) {
 const contents = files.map(name => readFileSync(new URL(name, publicUrl), 'utf8'));
 const css = contents.join('\n');
 return { css, version: digest(css) };
}

export const siteCssBundle = bundle(sharedStyles);
export const homeCssBundle = bundle([...sharedStyles, 'living-hotel.css', 'living-hotel-mobile.css']);
