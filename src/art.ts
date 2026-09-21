export const icons = {
  play: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 4.8c0-1 1.1-1.6 1.9-1.1l12 7.2a1.3 1.3 0 0 1 0 2.2l-12 7.2A1.3 1.3 0 0 1 7 19.2z"/></svg>',
  pause: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><rect x="6" y="4" width="4" height="16" rx="1.5"/><rect x="14" y="4" width="4" height="16" rx="1.5"/></svg>',
  reset: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 10a8 8 0 1 1 1.5 7M4 4v6h6"/></svg>',
  sound: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 5 6 9H3v6h3l5 4zM15 8a6 6 0 0 1 0 8M18 5a10 10 0 0 1 0 14"/></svg>',
  mute: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 5 6 9H3v6h3l5 4zM16 9l6 6m0-6-6 6"/></svg>',
  leaf: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 4C10 1 3 6 5 13c1 5 10 8 14-9ZM4 21c0-6 5-10 10-12"/></svg>',
};

export function apple(id: string, bite = 0): string {
  const bites = [[73, 39, 11], [70, 59, 12], [60, 72, 12], [55, 49, 13], [56, 30, 10], [41, 65, 12], [36, 44, 12], [29, 73, 12], [22, 51, 14]];
  return `<svg viewBox="0 0 80 88" fill="none" aria-hidden="true">
    <defs><mask id="apple-${id}"><rect width="80" height="88" fill="white"/>${bites.slice(0, bite).map(([x, y, radius]) => `<circle cx="${x}" cy="${y}" r="${radius}" fill="black"/>`).join('')}</mask></defs>
    <ellipse cx="40" cy="83" rx="22" ry="3" fill="#443c2c" opacity=".07"/>
    <path d="M40 28c-2-10 0-15 4-20" stroke="#7c5d43" stroke-width="4" stroke-linecap="round"/>
    <path d="M44 20C45 9 59 7 64 10c-2 10-13 15-20 10Z" fill="#86a96d"/>
    <g mask="url(#apple-${id})"><path d="M40 30C16 10 1 36 11 60c5 15 13 22 22 18 5-2 9-2 14 0 9 4 17-3 22-18C79 36 64 10 40 30Z" fill="#e77d70"/>
    <path d="M20 40c-4 6-4 11-2 16" stroke="#ffc1b4" stroke-width="5" stroke-linecap="round"/>
    </g>
  </svg>`;
}

export const core = `<svg viewBox="0 0 80 88" fill="none" aria-hidden="true"><ellipse cx="40" cy="83" rx="17" ry="3" fill="#443c2c" opacity=".05"/><path d="M40 26c-2-8 0-14 4-18" stroke="#b2a082" stroke-width="3" stroke-linecap="round"/><path d="M43 19c2-9 12-10 17-8-3 8-10 11-17 8" fill="#b5c5a1"/><path d="M26 30c9-5 17-5 28 0-14 12-14 28 0 43-10 5-18 5-28 0 14-15 14-31 0-43" fill="#f4e3bf"/><path d="M26 30c9-5 17-5 28 0M26 73c9 4 19 4 28 0" stroke="#e0ac94" stroke-width="5" stroke-linecap="round"/><path d="M38 48c-6 6-4 10 0 9m5-3c5 6 4 8 0 8" fill="#b19976"/></svg>`;

export const caterpillar = `<svg viewBox="0 0 188 108" fill="none" aria-hidden="true">
  <ellipse cx="90" cy="97" rx="75" ry="6" fill="#577345" opacity=".12"/>
  <g class="worm-body"><path d="m33 87-4 6m24-6-2 7m25-7 1 7m22-9 3 7m21-12 3 9" stroke="#60814f" stroke-width="5" stroke-linecap="round"/>
  <circle cx="31" cy="73" r="20" fill="#99ba77"/>
  <circle cx="54" cy="70" r="24" fill="#accf89"/><circle cx="82" cy="72" r="25" fill="#b8d997"/><circle cx="108" cy="69" r="27" fill="#a4ca80"/>
  <path d="M40 57c3-3 7-4 10-4M69 56c3-3 7-4 10-3M96 51c3-3 7-4 10-3" stroke="#d0e7ad" stroke-width="4" stroke-linecap="round"/></g>
  <g class="worm-head"><path d="M137 28c-5-10-11-11-13-17m29 15c3-11 9-12 10-18" stroke="#648751" stroke-width="3.5" stroke-linecap="round"/>
  <circle cx="123" cy="10" r="4" fill="#9bbb76"/><circle cx="163" cy="8" r="4" fill="#9bbb76"/>
  <path d="M174 57c0 22-13 35-34 35-22 0-33-15-33-33 0-22 13-38 33-38s34 16 34 36" fill="#b6d893"/>
  <ellipse cx="123" cy="65" rx="7" ry="4.5" fill="#e9aa9a"/><ellipse cx="163" cy="65" rx="7" ry="4.5" fill="#e9aa9a"/>
  <g class="worm-eyes"><ellipse cx="130" cy="54" rx="3" ry="4" fill="#42513a"/><ellipse cx="157" cy="54" rx="3" ry="4" fill="#42513a"/><circle cx="131" cy="53" r=".9" fill="white"/><circle cx="158" cy="53" r=".9" fill="white"/></g>
  <path class="worm-mouth" d="M137 66q7 8 14 0" stroke="#546345" stroke-width="2.8" stroke-linecap="round"/>
  <path d="M119 39c4-6 10-9 16-9" stroke="#d9edbb" stroke-width="4" stroke-linecap="round"/></g>
</svg>`;

export const flower = `<svg viewBox="0 0 50 70" fill="none" aria-hidden="true"><path d="M25 35v32m0-13C13 52 9 44 11 42c9-1 13 5 14 12m0-8c10-1 14-8 13-11-9 0-12 6-13 11" stroke="#95b18a" stroke-width="2.5" fill="#adc299" stroke-linecap="round"/><path d="M25 18C13 1 1 20 16 27 0 35 17 48 25 35c8 13 25 0 9-8C49 20 37 1 25 18" fill="#fffdf5"/><circle cx="25" cy="27" r="6" fill="#eacb79"/></svg>`;
