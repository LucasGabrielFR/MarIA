import {
  CanonicalHoursParser,
  EXPECTED_ORATIO_HOURS,
} from './canonical-hours-parser';

function indexFixture(
  slugs = EXPECTED_ORATIO_HOURS.map((hour) => hour.slug),
): string {
  const hours = Object.fromEntries(
    EXPECTED_ORATIO_HOURS.map(({ slug }) => [
      slug,
      `/liturgia-das-horas/2026/10/22/${slug}/`,
    ]),
  );
  const cards = slugs
    .map((slug) => {
      const hour = EXPECTED_ORATIO_HOURS.find((item) => item.slug === slug)!;
      const variantTitle =
        hour.type === 'compline' ? 'Completas de Quinta-feira' : 'Hora';
      return `<article data-hour-card data-hour-date="2026-10-22" data-hour-slug="${slug}"><a href="/liturgia-das-horas/2026/10/22/${slug}/"><div class="liturgy-hour-card__body"><h3>Completas</h3><p>${variantTitle}</p></div></a></article>`;
    })
    .join('');
  const entry = {
    date: '2026-10-22',
    label: 'Quinta-feira, 22 de outubro de 2026',
    celebration: 'Quinta-feira da 29ª semana do Tempo Comum',
    hours,
  };
  return `<section class="liturgy-summary"><h1>Liturgia</h1><p class="liturgy-summary__date">Quinta-feira, 22 de outubro de 2026</p><dl class="liturgy-facts"><dt>Tempo</dt><dd>Tempo Comum</dd><dt>Saltério</dt><dd>1ª semana</dd></dl></section><script type="application/json" data-liturgy-days-json>${JSON.stringify([entry])}</script><div class="liturgy-invitatory-banner">Invitatório</div>${cards}`;
}

describe('CanonicalHoursParser for Oratio', () => {
  it('requires exactly the seven cards for the requested date and excludes recommended prior day', () => {
    const html = indexFixture().replace(
      '<div class="liturgy-invitatory-banner">',
      '<article data-hour-card data-hour-date="2026-10-21" data-hour-slug="vesperas"><a href="/liturgia-das-horas/2026/10/21/vesperas/">Anterior</a></article><div class="liturgy-invitatory-banner">',
    );
    const parsed = CanonicalHoursParser.parseDayIndex(html, '2026-10-22');
    expect(parsed.hours).toHaveLength(7);
    expect(parsed.hours.map((hour) => hour.slug)).toEqual(
      EXPECTED_ORATIO_HOURS.map((hour) => hour.slug),
    );
    expect(parsed.metadata.season).toBe('Tempo Comum');
    expect(
      parsed.hours.find((hour) => hour.type === 'compline')?.variantTitle,
    ).toBe('Completas de Quinta-feira');
  });

  it('rejects a missing hour before persistence can begin', () => {
    const html = indexFixture(
      EXPECTED_ORATIO_HOURS.slice(1).map((hour) => hour.slug),
    );
    expect(() =>
      CanonicalHoursParser.parseDayIndex(html, '2026-10-22'),
    ).toThrow(/incompleto/);
  });

  it('keeps liturgical markup and line breaks while removing executable markup and unsafe links', () => {
    const html = `<header class="liturgy-hour-hero"><div class="liturgy-hour-hero__content"><h1>Vésperas</h1><p>Quinta-feira, 22 de outubro de 2026</p></div></header><div class="liturgy-reading__text" data-reading-text><h2 id="salmo">Salmo</h2><p class="rub">(De pé)</p><p class="liturgy-antiphon">Antífona</p><p>℣ Texto<br>continua ℟ resposta</p><script>alert(1)</script><a href="https://evil.example">link</a><span onclick="alert(1)">Texto longo preservado para satisfazer a validação do conteúdo litúrgico com mais de cinquenta caracteres.</span></div>`;
    const parsed = CanonicalHoursParser.parseHour(
      html,
      '2026-10-22',
      'vesperas',
    );
    expect(parsed.rawCleanText).toContain('<h2 id="salmo">');
    expect(parsed.rawCleanText).toContain('class="rub"');
    expect(parsed.rawCleanText).toContain('<br');
    expect(parsed.rawCleanText).not.toContain('<script');
    expect(parsed.rawCleanText).not.toContain('onclick');
    expect(parsed.rawCleanText).not.toContain('evil.example');
    expect(parsed.plainText.length).toBeGreaterThan(50);
  });

  it('rejects a detail page whose visible hero date differs from its route date', () => {
    const html = `<header class="liturgy-hour-hero"><div class="liturgy-hour-hero__content"><h1>Vésperas</h1><p>Quarta-feira, 21 de outubro de 2026</p></div></header><div class="liturgy-reading__text" data-reading-text>${'Conteúdo litúrgico válido. '.repeat(10)}</div>`;
    expect(() =>
      CanonicalHoursParser.parseHour(html, '2026-10-22', 'vesperas'),
    ).toThrow(/Data do cabeçalho/);
  });

  it('correctly extracts hero date when eyebrow paragraph precedes the date paragraph', () => {
    const html = `<header class="liturgy-hour-hero"><div class="liturgy-hour-hero__content"><p class="eyebrow">Ofício das Leituras</p><h1>Ofício das Leituras</h1><p>Quinta-feira, 22 de outubro de 2026</p></div></header><div class="liturgy-reading__text" data-reading-text>${'Conteúdo litúrgico válido. '.repeat(10)}</div>`;
    const parsed = CanonicalHoursParser.parseHour(
      html,
      '2026-10-22',
      'oficio-das-leituras',
    );
    expect(parsed.title).toBe('Ofício das Leituras');
  });

  it('converts style="color:var(--liturgical-red)" on elements to class="liturgical-red" and preserves rubrics, sups, and emphasis tags', () => {
    const html = `<header class="liturgy-hour-hero"><div class="liturgy-hour-hero__content"><h1>Laudes</h1><p>Quinta-feira, 22 de outubro de 2026</p></div></header><div class="liturgy-reading__text" data-reading-text>
      <h2 style="color:var(--liturgical-red)">Salmo 62</h2>
      <p class="rub">(De pé)</p>
      <p class="liturgy-antiphon">Antífona com <b>negrito</b> e <i>itálico</i> e <em>ênfase</em> e <strong>forte</strong>.</p>
      <p><span style="color:var(--liturgical-red)">℣.</span> Vinde, ó Deus<sup style="color: var(--liturgical-red)">1</sup></p>
      <p>Texto litúrgico completo de preenchimento para garantir comprimento suficiente na validação.</p>
    </div>`;
    const parsed = CanonicalHoursParser.parseHour(html, '2026-10-22', 'laudes');

    expect(parsed.rawCleanText).toContain(
      '<h2 class="liturgical-red">Salmo 62</h2>',
    );
    expect(parsed.rawCleanText).toContain('<p class="rub">(De pé)</p>');
    expect(parsed.rawCleanText).toContain(
      '<span class="liturgical-red">℣.</span>',
    );
    expect(parsed.rawCleanText).toContain(
      '<sup class="liturgical-red">1</sup>',
    );
    expect(parsed.rawCleanText).toContain('<b>negrito</b>');
    expect(parsed.rawCleanText).toContain('<i>itálico</i>');
    expect(parsed.rawCleanText).toContain('<em>ênfase</em>');
    expect(parsed.rawCleanText).toContain('<strong>forte</strong>');
    expect(parsed.rawCleanText).not.toContain('style=');
  });

  it('ensures plainText separates adjacent block tags without word agglutination', () => {
    const html = `<header class="liturgy-hour-hero"><div class="liturgy-hour-hero__content"><h1>Completas</h1><p>Quinta-feira, 22 de outubro de 2026</p></div></header><div class="liturgy-reading__text" data-reading-text>
      <h2>Salmo 4</h2>
      <p>Amém. Aleluia.</p>
      <p>Esta introdução se omite quando o Invitatório precede.</p>
      <p>℣. Texto<br>continua na próxima linha.</p>
      <p>Texto longo para preenchimento litúrgico para atingir mais de cinquenta caracteres na validação.</p>
    </div>`;
    const parsed = CanonicalHoursParser.parseHour(
      html,
      '2026-10-22',
      'completas',
    );

    expect(parsed.plainText).toContain(
      'Salmo 4 Amém. Aleluia. Esta introdução',
    );
    expect(parsed.plainText).not.toContain('Salmo 4Amém');
    expect(parsed.plainText).not.toContain('Aleluia.Esta');
    expect(parsed.plainText).toContain('Texto continua na próxima linha.');
  });
});
