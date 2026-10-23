import { CanonicalHoursService } from './canonical-hours.service';
import {
  CanonicalHoursParser,
  EXPECTED_ORATIO_HOURS,
} from './canonical-hours-parser';

describe('CanonicalHoursService Oratio synchronization', () => {
  const upsert = jest.fn();
  const previousEq = jest.fn().mockResolvedValue({ data: [], error: null });
  const previousSelect = jest.fn(() => ({ eq: previousEq }));
  const client = { from: jest.fn(() => ({ select: previousSelect, upsert })) };
  const service = new CanonicalHoursService({ getClient: () => client } as any);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('does not touch existing rows when any hour fails validation', async () => {
    jest
      .spyOn(service as any, 'fetchCompleteDay')
      .mockRejectedValueOnce(new Error('hour missing'));
    const result = await (service as any).syncDates(['2026-10-22']);
    expect(upsert).not.toHaveBeenCalled();
    expect(result).toEqual({
      complete: false,
      status: 'failed',
      expectedCount: 7,
      missingCount: 7,
      failedCount: 1,
      syncedCount: 0,
      dates: ['2026-10-22'],
    });
  });

  it('writes one complete seven-hour batch and returns the agreed response contract', async () => {
    const records = EXPECTED_ORATIO_HOURS.map((hour) => ({
      date: '2026-10-22',
      hour_type: hour.type,
    }));
    jest
      .spyOn(service as any, 'fetchCompleteDay')
      .mockResolvedValueOnce(records);
    const selectSaved = jest
      .fn()
      .mockResolvedValue({ data: records, error: null });
    upsert.mockReturnValue({ select: selectSaved });
    const result = await (service as any).syncDates(['2026-10-22']);
    expect(upsert).toHaveBeenCalledWith(records, {
      onConflict: 'date,hour_type',
    });
    expect(result).toEqual({
      complete: true,
      status: 'complete',
      expectedCount: 7,
      missingCount: 0,
      failedCount: 0,
      syncedCount: 7,
      dates: ['2026-10-22'],
    });
  });

  it('limits weekly dates to the selected day through Saturday', () => {
    expect((service as any).getDatesThroughSaturday('2026-10-22')).toEqual([
      '2026-10-22',
      '2026-10-23',
      '2026-10-24',
    ]);
  });

  it('recognizes only explicit rank signals and leaves ordinary labels unknown', () => {
    expect((service as any).classifyRank('Festa de São Tiago Maior')).toBe(
      'feast',
    );
    expect((service as any).classifyRank('Memória obrigatória de São N.')).toBe(
      'obligatory_memorial',
    );
    expect(
      (service as any).classifyRank(
        'Solenidade de São N. - Quinta-feira da 29ª semana do Tempo Comum',
      ),
    ).toBe('solemnity');
    expect((service as any).classifyRank('Memória facultativa de São N.')).toBe(
      'optional_memorial',
    );
    expect(
      (service as any).classifyRank(
        'Quinta-feira da 29ª semana do Tempo Comum',
      ),
    ).toBe('ferial');
    expect((service as any).classifyRank('')).toBe('unknown');
    expect((service as any).classifyRank('Quinta-feira de São N.')).toBe(
      'unknown',
    );
  });

  it('synchronizes the explicit Oratio weekday feria rank and marks it known despite old unknown rows', async () => {
    const day = {
      calendarTitle: 'Quinta-feira da 29ª semana do Tempo Comum',
      dateLabel: 'Quinta-feira, 22 de outubro de 2026',
      celebration: 'Quinta-feira da 29ª semana do Tempo Comum',
      hours: EXPECTED_ORATIO_HOURS.map((hour) => ({
        ...hour,
        url: `https://oratioapp.com.br/liturgia-das-horas/2026/10/22/${hour.slug}/`,
      })),
      metadata: {
        calendarTitle: 'Quinta-feira da 29ª semana do Tempo Comum',
        dateLabel: 'Quinta-feira, 22 de outubro de 2026',
        season: 'Tempo Comum',
        week: '29ª semana',
        psalter: '1ª semana',
        cycle: 'Ano A',
        color: 'Verde',
        celebration: 'Quinta-feira da 29ª semana do Tempo Comum',
        rankKnown: false,
        memorialKnown: false,
        abstinence: false,
      },
    };
    jest.spyOn(CanonicalHoursParser, 'parseDayIndex').mockReturnValue(day);
    jest.spyOn(CanonicalHoursParser, 'parseHour').mockReturnValue({
      title: 'Laudes',
      rawCleanText: '<p>Texto</p>',
      plainText: 'Texto',
    });
    jest
      .spyOn(service as any, 'fetchOratio')
      .mockResolvedValue({ text: async () => '' });
    const previous = new Map(
      EXPECTED_ORATIO_HOURS.map((hour) => [
        hour.type,
        {
          liturgical_rank: 'unknown',
          has_memorial: true,
        },
      ]),
    );

    const records = await (service as any).fetchCompleteDay(
      '2026-10-22',
      previous,
    );

    expect(records).toHaveLength(7);
    expect(records.map((record: any) => record.liturgical_rank)).toEqual(
      Array(7).fill('ferial'),
    );
    expect(
      records.every((record: any) => record.content.dayMetadata.rankKnown),
    ).toBe(true);
    expect(
      records.every((record: any) => record.content.dayMetadata.memorialKnown),
    ).toBe(true);
    expect(records.every((record: any) => record.has_memorial)).toBe(false);
  });

  it('does not reuse a stale ferial rank when seven previous rows have no valid source rank', async () => {
    const day = {
      calendarTitle: 'Calendário sem classificação',
      dateLabel: 'Quinta-feira, 22 de outubro de 2026',
      celebration: 'Calendário sem classificação',
      hours: EXPECTED_ORATIO_HOURS.map((hour) => ({
        ...hour,
        url: `https://oratioapp.com.br/liturgia-das-horas/2026/10/22/${hour.slug}/`,
      })),
      metadata: {
        calendarTitle: 'Calendário sem classificação',
        dateLabel: 'Quinta-feira, 22 de outubro de 2026',
        season: 'Tempo Comum',
        color: 'Verde',
        celebration: 'Calendário sem classificação',
        rankKnown: false,
        memorialKnown: false,
        abstinence: false,
      },
    };
    jest.spyOn(CanonicalHoursParser, 'parseDayIndex').mockReturnValue(day);
    jest.spyOn(CanonicalHoursParser, 'parseHour').mockReturnValue({
      title: 'Laudes',
      rawCleanText: '<p>Texto</p>',
      plainText: 'Texto',
    });
    jest
      .spyOn(service as any, 'fetchOratio')
      .mockResolvedValue({ text: async () => '' });
    const previous = new Map(
      EXPECTED_ORATIO_HOURS.map((hour) => [
        hour.type,
        {
          liturgical_rank: 'ferial',
          has_memorial: false,
        },
      ]),
    );

    const records = await (service as any).fetchCompleteDay(
      '2026-10-22',
      previous,
    );

    expect(records.map((record: any) => record.liturgical_rank)).toEqual(
      Array(7).fill('unknown'),
    );
    expect(
      records.every(
        (record: any) => record.content.dayMetadata.rankKnown === false,
      ),
    ).toBe(true);
    expect(
      records.every(
        (record: any) => record.content.dayMetadata.memorialKnown === false,
      ),
    ).toBe(true);
  });

  it('refuses a final response URL outside the exact Oratio route', async () => {
    const fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValueOnce({
      url: 'https://evil.example/redirected',
      redirected: false,
      ok: true,
      headers: new Headers({ 'content-type': 'text/html' }),
    } as Response);
    await expect(
      (service as any).fetchOratio(
        'https://oratioapp.com.br/liturgia-das-horas/2026/10/22/',
      ),
    ).rejects.toThrow(/Redirecionamento Oratio/);
    expect(fetchSpy).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ redirect: 'manual' }),
    );
    fetchSpy.mockRestore();
  });
});

describe('CanonicalHoursService persistent Completas reuse', () => {
  const rows: any[] = [];

  function makePersistentClient() {
    const matches = (row: any, filters: Array<[string, unknown]>) =>
      filters.every(([field, value]) => row[field] === value);
    const from = jest.fn(() => ({
      select: jest.fn(() => {
        const filters: Array<[string, unknown]> = [];
        const query: any = {
          eq(field: string, value: unknown) {
            filters.push([field, value]);
            return query;
          },
          order() {
            return query;
          },
          limit() {
            return query;
          },
          then(
            resolve: (value: any) => unknown,
            reject?: (reason: unknown) => unknown,
          ) {
            return Promise.resolve({
              data: rows.filter((row) => matches(row, filters)),
              error: null,
            }).then(resolve, reject);
          },
        };
        return query;
      }),
      upsert: jest.fn((records: any[]) => {
        for (const record of records) {
          const index = rows.findIndex(
            (row) =>
              row.date === record.date && row.hour_type === record.hour_type,
          );
          if (index >= 0) rows[index] = { ...rows[index], ...record };
          else rows.push({ ...record });
        }
        return {
          select: jest.fn(async () => ({ data: records, error: null })),
        };
      }),
    }));
    return { from };
  }

  const weekdayTitles: Record<number, string> = {
    0: 'II Completas de Domingo',
    1: 'Completas de Segunda-feira',
    2: 'Completas de Terça-feira',
    3: 'Completas de Quarta-feira',
    4: 'Completas de Quinta-feira',
    5: 'Completas de Sexta-feira',
    6: 'I Completas de Domingo',
  };

  function dayFor(
    date: string,
    options: {
      season?: string;
      rank?: string;
      variant?: string;
      psalter?: string;
      celebration?: string;
    } = {},
  ) {
    const weekday = new Date(`${date}T00:00:00Z`).getUTCDay();
    const celebration =
      options.celebration || `${options.rank || 'ferial'} ${date}`;
    return {
      calendarTitle: `Calendário ${date}`,
      dateLabel: date,
      celebration,
      hours: EXPECTED_ORATIO_HOURS.map((hour) => ({
        ...hour,
        url: `https://oratioapp.com.br/liturgia-das-horas/${date.replaceAll('-', '/')}/${hour.slug}/`,
        ...(hour.type === 'compline'
          ? { variantTitle: options.variant || weekdayTitles[weekday] }
          : {}),
      })),
      metadata: {
        calendarTitle: `Calendário ${date}`,
        dateLabel: date,
        season: Object.prototype.hasOwnProperty.call(options, 'season')
          ? options.season
          : 'Tempo Comum',
        week: '29ª semana',
        psalter: options.psalter ?? '1ª semana do Saltério',
        cycle: 'Ano A',
        celebration,
        color: 'Verde',
        celebration,
        rankKnown: false,
        memorialKnown: false,
        abstinence: false,
      },
    };
  }

  function makeService(
    client: any,
    dates: Map<string, ReturnType<typeof dayFor>>,
  ) {
    const service = new CanonicalHoursService({
      getClient: () => client,
    } as any);
    jest
      .spyOn(CanonicalHoursParser, 'parseDayIndex')
      .mockImplementation((_html, date) => dates.get(date)!);
    jest
      .spyOn(CanonicalHoursParser, 'parseHour')
      .mockImplementation((_html, date, slug) => ({
        title:
          slug === 'completas'
            ? weekdayTitles[new Date(`${date}T00:00:00Z`).getUTCDay()]
            : slug,
        rawCleanText:
          slug === 'completas'
            ? `<p>Texto da Completas suficientemente longo para validar a estrutura e manter o conteúdo litúrgico completo. <a href="https://oratioapp.com.br/liturgia-das-horas/${date.replaceAll('-', '/')}/completas/">Referência</a></p>`
            : `<p>Texto litúrgico suficientemente longo para validar a estrutura desta hora canônica.</p>`,
        plainText:
          'Texto da oração suficientemente longo para preservar a hora canônica completa.',
      }));
    jest
      .spyOn(service as any, 'classifyRank')
      .mockImplementation((celebration: string) => {
        if (/^Domingo da/i.test(celebration)) return 'unknown';
        const rank = celebration.split(' ')[0];
        return rank === 'memorial' ? 'obligatory_memorial' : rank;
      });
    const fetchSpy = jest
      .spyOn(service as any, 'fetchOratio')
      .mockImplementation(
        async (url: string) =>
          ({
            text: async () => url,
          }) as any,
      );
    return { service, fetchSpy };
  }

  beforeEach(() => {
    rows.splice(0, rows.length);
    jest.restoreAllMocks();
  });

  afterEach(() => jest.restoreAllMocks());

  it('fetches Completas on first miss and reuses the persistent same-weekday, same-season variant in a new service instance', async () => {
    const client = makePersistentClient();
    const dates = new Map([
      ['2026-10-22', dayFor('2026-10-22')],
      ['2026-10-29', dayFor('2026-10-29')],
    ]);
    const first = makeService(client, dates);
    const firstResult = await first.service.syncFromOratio('2026-10-22');
    expect(firstResult.complete).toBe(true);
    expect(
      first.fetchSpy.mock.calls.filter(([url]) => /\/completas\/$/.test(url)),
    ).toHaveLength(1);
    expect(rows).toHaveLength(7);

    const second = makeService(client, dates);
    const secondResult = await second.service.syncFromOratio('2026-10-29');
    expect(secondResult.complete).toBe(true);
    expect(
      second.fetchSpy.mock.calls.filter(([url]) => /\/completas\/$/.test(url)),
    ).toHaveLength(0);
    expect(second.fetchSpy).toHaveBeenCalledTimes(7); // index plus six non-Completas detail pages
    const copied = rows.find(
      (row) => row.date === '2026-10-29' && row.hour_type === 'compline',
    );
    expect(copied.source_url).toContain('/2026/10/29/completas/');
    expect(copied.celebration_title).toBe('Completas de Quinta-feira');
    expect(copied.content.dayMetadata).toMatchObject({
      calendarTitle: 'Calendário 2026-10-29',
      dateLabel: '2026-10-29',
      season: 'Tempo Comum',
    });
    expect(copied.content.rawCleanText).toContain('/2026/10/29/completas/');
    expect(copied.content.rawCleanText).not.toContain('/2026/10/22/completas/');
  });

  it('does not reuse across weekdays, missing seasons, unknown ranks, or solemnity variants', async () => {
    const client = makePersistentClient();
    const dates = new Map([
      ['2026-10-22', dayFor('2026-10-22')],
      ['2026-10-27', dayFor('2026-10-27')],
      ['2026-10-29', dayFor('2026-10-29', { season: undefined })],
      ['2026-11-05', dayFor('2026-11-05', { rank: 'unknown' })],
      [
        '2026-11-12',
        dayFor('2026-11-12', {
          rank: 'solemnity',
          variant: 'I Completas de Solenidade',
        }),
      ],
    ]);
    const first = makeService(client, dates);
    await first.service.syncFromOratio('2026-10-22');

    for (const date of [
      '2026-10-27',
      '2026-10-29',
      '2026-11-05',
      '2026-11-12',
    ]) {
      const next = makeService(client, dates);
      await next.service.syncFromOratio(date);
      expect(
        next.fetchSpy.mock.calls.filter(([url]) => /\/completas\/$/.test(url)),
      ).toHaveLength(1);
    }
  });

  it('reuses an explicitly identified ordinary Sunday II only with the same psalter week', async () => {
    const client = makePersistentClient();
    const dates = new Map([
      [
        '2026-10-18',
        dayFor('2026-10-18', {
          rank: 'unknown',
          variant: 'II Completas de Domingo',
          psalter: '1ª semana do Saltério',
          celebration: 'Domingo da 29ª semana do Tempo Comum',
        }),
      ],
      [
        '2026-11-15',
        dayFor('2026-11-15', {
          rank: 'unknown',
          variant: 'II Completas de Domingo',
          psalter: '1ª semana do Saltério',
          celebration: 'Domingo da 33ª semana do Tempo Comum',
        }),
      ],
      [
        '2026-10-25',
        dayFor('2026-10-25', {
          rank: 'unknown',
          variant: 'II Completas de Domingo',
          psalter: '2ª semana do Saltério',
          celebration: 'Domingo da 30ª semana do Tempo Comum',
        }),
      ],
    ]);
    const first = makeService(client, dates);
    await first.service.syncFromOratio('2026-10-18');
    expect(
      rows.find(
        (row) => row.date === '2026-10-18' && row.hour_type === 'compline',
      ).liturgical_rank,
    ).toBe('unknown');

    const sameVariant = makeService(client, dates);
    await sameVariant.service.syncFromOratio('2026-11-15');
    expect(
      sameVariant.fetchSpy.mock.calls.filter(([url]) =>
        /\/completas\/$/.test(url),
      ),
    ).toHaveLength(0);

    const differentPsalter = makeService(client, dates);
    await differentPsalter.service.syncFromOratio('2026-10-25');
    expect(
      differentPsalter.fetchSpy.mock.calls.filter(([url]) =>
        /\/completas\/$/.test(url),
      ),
    ).toHaveLength(1);
  });

  it('rejects a candidate whose calendar celebration says solemnity even when its stored rank says feria', async () => {
    const client = makePersistentClient();
    const dates = new Map([
      ['2026-10-22', dayFor('2026-10-22')],
      ['2026-10-29', dayFor('2026-10-29')],
    ]);
    const first = makeService(client, dates);
    await first.service.syncFromOratio('2026-10-22');
    const candidate = rows.find(
      (row) => row.date === '2026-10-22' && row.hour_type === 'compline',
    );
    candidate.content.dayMetadata.celebration = 'Solenidade de Nossa Senhora';
    candidate.liturgical_rank = 'ferial';

    const next = makeService(client, dates);
    await next.service.syncFromOratio('2026-10-29');
    expect(
      next.fetchSpy.mock.calls.filter(([url]) => /\/completas\/$/.test(url)),
    ).toHaveLength(1);
  });

  it('reuses Saturday I Completas across a known memorial and feria, while Sunday II keys also include the psalter week', async () => {
    const client = makePersistentClient();
    const dates = new Map([
      [
        '2026-10-17',
        dayFor('2026-10-17', {
          rank: 'memorial',
          variant: 'I Completas de Domingo',
          psalter: '4ª semana do Saltério',
        }),
      ],
      [
        '2026-10-24',
        dayFor('2026-10-24', {
          rank: 'ferial',
          variant: 'I Completas de Domingo',
          psalter: '1ª semana do Saltério',
        }),
      ],
      [
        '2026-10-18',
        dayFor('2026-10-18', {
          rank: 'unknown',
          variant: 'II Completas de Domingo',
          celebration: 'Domingo da 29ª semana do Tempo Comum',
        }),
      ],
    ]);
    const first = makeService(client, dates);
    await first.service.syncFromOratio('2026-10-17');
    const second = makeService(client, dates);
    await second.service.syncFromOratio('2026-10-24');
    expect(
      second.fetchSpy.mock.calls.filter(([url]) => /\/completas\/$/.test(url)),
    ).toHaveLength(0);

    const sunday = makeService(client, dates);
    await sunday.service.syncFromOratio('2026-10-18');
    expect(
      sunday.fetchSpy.mock.calls.filter(([url]) => /\/completas\/$/.test(url)),
    ).toHaveLength(1);
    expect(
      (sunday.service as any).complineVariantKey(
        '2026-10-18',
        'Tempo Comum',
        'II Completas de Domingo',
        '1ª semana',
      ),
    ).not.toBe(
      (sunday.service as any).complineVariantKey(
        '2026-10-18',
        'Tempo Comum',
        'II Completas de Domingo',
        '2ª semana',
      ),
    );
  });
});
