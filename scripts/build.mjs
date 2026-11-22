import { copyFile, mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import MarkdownIt from 'markdown-it';

const root = new URL('../', import.meta.url);
const manifests = new URL('research/guide-images/manifests/', root);
const output = new URL('dist/', root);
const read = (file) => readFile(file, 'utf8');
const escape = (value) => String(value).replace(/[&<>"']/g, (char) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
})[char]);
const slugify = (value) => value.normalize('NFKD').toLowerCase()
  .replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const topics = [
  {
    slug: 'alliance-duel',
    manifest: 'alliance-duel-vs',
    title: 'Alliance Duel',
    category: 'Weekly event',
    aliases: 'VS Alliance VS Duel',
    icon: 'duel',
    description: 'Plan your VS week, save the right resources, and find the daily scoring charts.',
    quick: [
      ['Check the day’s scoring tasks', 'Start with the weekly schedule below. Keep Radar tasks, recruitment tickets, speedups, and other resources for the day they score.'],
      ['Stack your scoring windows', 'When an eligible task counts for both VS and Arms Race, spend during the matching phase to earn progress toward both events.'],
      ['Plan around your alliance', 'Use the weekly planner to prep for upcoming days and coordinate when your alliance wants to spend.'],
    ],
    featured: ['Alliance Duel Weekly Schedule Infographic', 'Alliance VS Weekly Guide', 'VS Route / Weekly Plan Export'],
  },
  {
    slug: 'arms-race',
    manifest: 'arms-race',
    file: 'armsrace.md',
    title: 'Arms Race',
    category: 'Daily event',
    aliases: 'AR waterfall troop promotion 18 badges phase chests',
    icon: 'race',
    description: 'Plan your four-hour phases, reach 18 badges, and decide when extra chests are worth it.',
    quick: [
      ['Start with 18 badges', 'Three full phases earn six badges apiece. Pick the phases that match upgrades and spending you already planned.'],
      ['Check the next chest after 18', 'Phase chests still award their own Skill Medals, resources, and speedups. Use your in-game preview to decide whether another phase is worth completing.'],
      ['Time troop promotions with VS', 'Use the waterfall promotion setup in Unit Progression and look for an Alliance Duel overlap before spending speedups.'],
    ],
    featured: ['Unit Progression Chest Example', 'Barracks Waterfall Training Model', 'VS Duel + Arms Race Diagram'],
  },
  {
    slug: 'gold-zombies',
    manifest: 'pve-and-recurring-events',
    section: 'Zombie Invasion / Gold Zombies',
    file: 'goldzombies.md',
    title: 'Gold Zombies',
    category: 'Recurring event',
    aliases: 'Zombie Invasion Gold Zombie Golden Zombies PvE summoning stamina',
    icon: 'zombie',
    description: 'Make your stamina count, share discovered bosses, and get more from alliance rallies.',
    quick: [
      ['Farm the small invading zombies', 'Use stamina on level 10 invading zombies to earn rewards, discover Gold Zombie bosses, and build your Summoning Level.'],
      ['Share discoveries right away', 'Get each boss cleared before it expires. You receive the discovery reward even when another player leads the rally.'],
      ['Fill open rally seats', 'Joining a Gold Zombie rally as a member costs zero stamina and still earns rewards.'],
    ],
    featured: ['Zombie Invasion Full Visual Guide', 'Zombie Invasion Screenshot Guide', 'Zombie Invasion Boss Levels & Cooldown'],
  },
];

const markdown = new MarkdownIt({ html: false, linkify: true });
markdown.renderer.rules.table_open = () =>
  '<div class="table-scroll" tabindex="0" role="region" aria-label="Scrollable guide table"><table>\n';
markdown.renderer.rules.table_close = () => '</table></div>\n';

function externalUrl(value, location) {
  const url = new URL(value);
  if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password) {
    throw new Error('Invalid resource URL in ' + location);
  }
  return url.href;
}

function resourceType(title, directImage) {
  if (/\b(planner|spreadsheet|rankings?)\b|league win\/loss|weekly plan export/i.test(title) && !directImage) return 'Tool / reference';
  if (directImage || /\b(infographic|diagram|map|chart|screenshots?|quick-reference card)\b/i.test(title)) return 'Visual';
  return 'Guide / article';
}

function parseManifest(markdownText, manifest) {
  const lines = markdownText.split(/\r?\n/);
  const category = lines[0].replace(/^# /, '').split(' — Image Research')[0];
  let section = '';
  let entry;
  const entries = [];

  for (const line of lines) {
    if (line.startsWith('## ')) {
      section = line.slice(3);
      entry = undefined;
      continue;
    }
    if (line.startsWith('### ')) {
      entry = { title: line.slice(4), section, fields: new Map() };
      entries.push(entry);
      continue;
    }
    const field = line.match(/^- \*\*(.+?):\*\* (.+)$/);
    if (entry && field) {
      const values = entry.fields.get(field[1]) || [];
      entry.fields.set(field[1], [...values, field[2]]);
    }
  }

  return entries.map(({ title, section, fields }) => {
    const field = (name) => fields.get(name)?.[0];
    const location = manifest + ': ' + title;
    if (!field('Source') || !field('Contains') || (!field('Creator') && manifest !== 'source-hubs')) {
      throw new Error('Missing resource metadata in ' + location);
    }
    const topic = topics.find((item) => item.manifest === manifest && (!item.section || item.section === section));
    const image = field('Direct image') && externalUrl(field('Direct image'), location);
    return {
      title, section, image,
      creator: field('Creator'),
      source: externalUrl(field('Source'), location),
      alternates: (fields.get('Also') || []).map((value) => externalUrl(value, location)),
      description: field('Contains'),
      language: field('Language') || 'English',
      era: field('Era'),
      notes: field('Notes'),
      published: field('Published'),
      topicKey: topic?.slug ?? manifest,
      topic: topic?.title ?? category,
      aliases: topic?.aliases ?? '',
      type: manifest === 'source-hubs' ? 'Source library' : resourceType(title, image),
    };
  });
}

function icon(name = 'search') {
  return '<span class="icon icon-' + name + '" aria-hidden="true"></span>';
}

function layout({ title, description, base = './', current, body }) {
  const nav = [
    ['Guide index', base, !current],
    ...topics.map((topic) => [topic.title, base + topic.slug + '/', topic.slug === current]),
  ].map(([label, href, active]) => '<a href="' + href + '"' +
    (active ? ' aria-current="page"' : '') + '>' + escape(label) + '</a>').join('');
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="theme-color" content="#19221d">
  <meta name="description" content="${escape(description)}">
  <meta property="og:type" content="website">
  <meta property="og:title" content="${escape(title)}">
  <meta property="og:description" content="${escape(description)}">
  <title>${escape(title)}</title>
  <link rel="stylesheet" href="${base}assets/styles.css">
  <script src="${base}assets/app.js" defer></script>
</head>
<body>
  <a href="#main" class="skip">Skip to content</a>
  <header class="site-header">
    <div class="shell header-inner">
      <a class="brand" href="${base}">${icon('brand')}<span>Last War <b>Guidebook</b></span></a>
      <nav aria-label="Main navigation">${nav}</nav>
    </div>
  </header>
  <main id="main">${body}</main>
  <footer class="site-footer">
    <div class="shell footer-inner">
      <a class="brand" href="${base}">${icon('brand')}<span>Last War <b>Guidebook</b></span></a>
      <p>Alliance guides and community references for Last War: Survival.</p>
      <a href="${base}#resources">Browse resources</a>
    </div>
  </footer>
</body>
</html>
`;
}

function link(href, label, className = '') {
  return '<a href="' + escape(href) + '"' + (className ? ' class="' + className + '"' : '') + '>' + escape(label) + '</a>';
}

function resourceCard(item, showPreview = false) {
  const attrs = showPreview ? '' : Object.entries({
    topic: item.topicKey,
    type: item.type,
    language: item.language,
    title: item.title,
    search: [item.title, item.topic, item.section, item.aliases, item.description, item.creator, item.era, item.language].filter(Boolean).join(' '),
  }).map(([key, value]) => ' data-' + key + '="' + escape(value) + '"').join('');
  const meta = [item.creator, item.language === 'English' ? '' : item.language, item.era, item.published].filter(Boolean);
  const preview = showPreview && item.image
    ? '<a class="preview" href="' + escape(item.image) + '" aria-label="Open image for ' + escape(item.title) + '"><img loading="lazy" referrerpolicy="no-referrer" src="' + escape(item.image) + '" alt="' + escape(item.title) + '"></a>'
    : '';
  const openLabel = item.internal ? 'View topic guide' : item.image === item.source ? 'Open image' : 'Open source';
  return `<article class="resource-card"${attrs}>
  ${preview}
  <div class="resource-copy">
    <span class="resource-type">${escape(item.type)}</span>
    <h3>${link(item.source, item.title)}</h3>
    ${meta.length ? '<p class="resource-meta">' + escape(meta.join(' · ')) + '</p>' : ''}
    <p>${escape(item.description)}</p>
    ${item.notes ? '<p class="resource-meta">' + escape(item.notes) + '</p>' : ''}
    <div class="resource-links">
      ${link(item.source, openLabel)}
      ${item.image && item.image !== item.source ? link(item.image, 'Open image') : ''}
      ${item.alternates?.map((url, index) => link(url, index ? 'Alternate source ' + (index + 1) : 'Alternate source')).join('') ?? ''}
    </div>
  </div>
</article>`;
}

function options(values, first) {
  return '<option value="">' + escape(first) + '</option>' + values.map(([key, label]) =>
    '<option value="' + escape(key) + '">' + escape(label) + '</option>').join('');
}

function homePage(resources) {
  const groups = [...new Map(resources.map((item) => [item.topicKey, item.topic]))].sort((a, b) => a[1].localeCompare(b[1], 'en', { numeric: true }));
  const optionsFor = (values) => [...new Set(values)].sort().map((value) => [value, value]);
  const formats = optionsFor(resources.map((item) => item.type));
  const languages = optionsFor(resources.flatMap((item) => item.language.split(' / ')));
  return layout({
    title: 'Last War Guidebook',
    description: 'Search community infographics, event guides, and planners for Last War: Survival.',
    body: `
  <section class="hero home-hero" aria-labelledby="home-title">
    <div class="shell hero-inner">
      <p class="eyebrow">Last War: Survival</p>
      <h1 id="home-title">Find your<br>next guide.</h1>
      <p class="hero-summary">Search community guides, images, and planners for your alliance.</p>
      <form class="search-form" id="search" role="search" action="./">
        <label class="sr-only" for="query">Search guides and resources</label>
        ${icon()}
        <input id="query" name="q" type="search" maxlength="120" placeholder="Try VS, waterfall, or Season 6" autocomplete="off">
        <button type="submit">Search</button>
      </form>
    </div>
  </section>
  <section class="shell featured-section" aria-labelledby="featured-heading">
    <h2 id="featured-heading">Alliance guides</h2>
    <div class="topic-grid">
      ${topics.map((topic) => `
        <a class="topic-card accent-${topic.icon}" href="./${topic.slug}/">
          <span class="topic-symbol">${icon(topic.icon)}</span>
          <span class="topic-category">${escape(topic.category)}</span>
          <h3>${escape(topic.title)}</h3>
          <p>${escape(topic.description)}</p>
        </a>`).join('')}
    </div>
  </section>
  <section class="shell catalog" id="resources" aria-labelledby="catalog-heading">
    <div class="section-heading">
      <h2 id="catalog-heading" tabindex="-1">Resource library</h2>
      <p id="result-count" role="status">${resources.length} resources</p>
    </div>
    <div class="filters" hidden>
      <label>Topic<select id="topic">${options(groups, 'All topics')}</select></label>
      <label>Format<select id="format">${options(formats, 'All formats')}</select></label>
      <label>Language<select id="language">${options(languages, 'All languages')}</select></label>
      <button id="reset" class="button button-outline" type="button" hidden>Clear filters</button>
    </div>
    <noscript><p>Enable JavaScript to search and filter this list.</p></noscript>
    <div class="resource-grid" id="resource-grid">${resources.map((item) => resourceCard(item)).join('\n')}</div>
    <p id="no-results" class="empty-state" hidden>Nothing matched. Try a different term or clear the filters.</p>
    <button id="show-more" class="button button-outline show-more" type="button" hidden>Show more resources</button>
  </section>`,
  });
}

function renderGuide(source) {
  const tokens = markdown.parse(source.replace(/^# [^\r\n]+[\r\n]+/, ''), {});
  const headings = [];
  const used = new Set();
  tokens.forEach((token, index) => {
    if (token.type !== 'heading_open' || !['h2', 'h3'].includes(token.tag)) return;
    if (token.tag === 'h2') {
      const title = tokens[index + 1].content;
      const baseId = 'guide-' + slugify(title);
      let id = baseId;
      for (let number = 2; used.has(id); number++) id = baseId + '-' + number;
      used.add(id);
      headings.push({ title, id });
      token.attrSet('id', id);
    }
    token.tag = token.tag === 'h2' ? 'h3' : 'h4';
    tokens[index + 2].tag = token.tag;
  });
  return { html: markdown.renderer.render(tokens, markdown.options, {}), headings };
}

function topicPage(topic, resources, guide) {
  const byTitle = new Map(resources.map((item) => [item.title, item]));
  const featured = topic.featured.map((title) => {
    const item = byTitle.get(title);
    if (!item) throw new Error('Missing featured resource: ' + title);
    return item;
  });
  const additional = resources.filter((item) => item.topicKey === topic.slug && !featured.includes(item));
  return layout({
    title: topic.title + ' | Last War Guidebook',
    description: topic.description,
    base: '../',
    current: topic.slug,
    body: `
  <section class="hero topic-hero accent-${topic.icon}">
    <div class="shell hero-inner">
      <p class="eyebrow">${escape(topic.category)}</p>
      <h1>${escape(topic.title)}</h1>
      <p class="hero-summary">${escape(topic.description)}</p>
      <div class="hero-actions">
        ${link('#references', 'View resources', 'button button-primary')}
        ${guide ? link('#full-guide', 'Read full guide', 'button button-ghost') : ''}
        <button class="button button-ghost copy-link" type="button" hidden>Copy page link</button>
        <span class="copy-status" role="status"></span>
      </div>
    </div>
  </section>
  <section class="shell topic-section" aria-labelledby="quick-heading">
    <h2 id="quick-heading">Quick guide</h2>
    <ul class="quick-grid">
      ${topic.quick.map(([title, description]) => '<li><strong>' + escape(title) + '</strong><p>' + escape(description) + '</p></li>').join('')}
    </ul>
  </section>
  <section class="shell topic-section" id="references" aria-labelledby="references-heading">
    <h2 id="references-heading">Images &amp; guides</h2>
    <div class="resource-grid">${featured.map((item) => resourceCard(item, true)).join('\n')}</div>
    ${additional.length ? '<details class="additional"><summary>More ' + escape(topic.title) + ' resources (' + additional.length + ')</summary><div class="resource-grid">' + additional.map((item) => resourceCard(item, true)).join('\n') + '</div></details>' : ''}
  </section>
  ${guide ? `
  <section class="shell topic-section guide-section" id="full-guide" aria-labelledby="guide-heading">
    <h2 id="guide-heading">Full ${escape(topic.title)} guide</h2>
    <div class="guide-layout">
      <nav aria-label="In this guide" class="guide-toc">
        <details open><summary>In this guide</summary><ul>${guide.headings.map(({ id, title }) => '<li>' + link('#' + id, title.replace(/^\d+\. /, '')) + '</li>').join('')}</ul></details>
      </nav>
      <article class="guide-prose">${guide.html}</article>
    </div>
  </section>` : ''}
  <section class="shell topic-section related" aria-labelledby="related-heading">
    <h2 id="related-heading">Other alliance guides</h2>
    <div>${topics.filter((item) => item !== topic).map((item) => link('../' + item.slug + '/', item.title, 'button button-outline')).join('')}</div>
  </section>`,
  });
}

const files = (await readdir(manifests)).filter((name) => name.endsWith('.md')).sort();
const resources = (await Promise.all(files.map(async (file) =>
  parseManifest(await read(new URL(file, manifests)), file.slice(0, -3))))).flat();
const landingResources = topics.map((topic) => ({
  title: topic.title,
  topic: topic.title,
  topicKey: topic.slug,
  creator: 'Last War Guidebook',
  source: './' + topic.slug + '/',
  description: topic.description,
  aliases: topic.aliases,
  language: 'English',
  type: 'Topic guide',
  internal: true,
}));
const highlighted = topics.flatMap((topic) => resources.filter((item) => item.title === topic.featured[0]));
const homeResources = [
  ...landingResources,
  ...highlighted,
  ...resources.filter((item) => !highlighted.includes(item)),
];

await mkdir(new URL('assets/', output), { recursive: true });
await Promise.all(['styles.css', 'app.js'].map((file) =>
  copyFile(new URL('site/' + file, root), new URL('assets/' + file, output))));
await writeFile(new URL('index.html', output), homePage(homeResources));
for (const topic of topics) {
  const dir = new URL(topic.slug + '/', output);
  const guide = topic.file ? renderGuide(await read(new URL(topic.file, root))) : undefined;
  await mkdir(dir, { recursive: true });
  await writeFile(new URL('index.html', dir), topicPage(topic, resources, guide));
}
console.log('Built four pages with ' + resources.length + ' external resources.');
