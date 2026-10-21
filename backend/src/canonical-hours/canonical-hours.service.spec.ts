import { CanonicalHoursService } from './canonical-hours.service';
import { EXPECTED_ORATIO_HOURS } from './canonical-hours-parser';

describe('CanonicalHoursService Oratio synchronization', () => {
  const upsert = jest.fn();
  const previousEq = jest.fn().mockResolvedValue({ data: [], error: null });
  const previousSelect = jest.fn(() => ({ eq: previousEq }));
  const client = { from: jest.fn(() => ({ select: previousSelect, upsert })) };
  const service = new CanonicalHoursService({ getClient: () => client } as any);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('does not touch existing rows when any hour fails validation', async () => {
    jest.spyOn(service as any, 'fetchCompleteDay').mockRejectedValueOnce(new Error('hour missing'));
    const result = await (service as any).syncDates(['2026-10-22']);
    expect(upsert).not.toHaveBeenCalled();
    expect(result).toEqual({
      complete: false, status: 'failed', expectedCount: 7, missingCount: 7,
      failedCount: 1, syncedCount: 0, dates: ['2026-10-22'],
    });
  });

  it('writes one complete seven-hour batch and returns the agreed response contract', async () => {
    const records = EXPECTED_ORATIO_HOURS.map((hour) => ({ date: '2026-10-22', hour_type: hour.type }));
    jest.spyOn(service as any, 'fetchCompleteDay').mockResolvedValueOnce(records);
    const selectSaved = jest.fn().mockResolvedValue({ data: records, error: null });
    upsert.mockReturnValue({ select: selectSaved });
    const result = await (service as any).syncDates(['2026-10-22']);
    expect(upsert).toHaveBeenCalledWith(records, { onConflict: 'date,hour_type' });
    expect(result).toEqual({
      complete: true, status: 'complete', expectedCount: 7, missingCount: 0,
      failedCount: 0, syncedCount: 7, dates: ['2026-10-22'],
    });
  });

  it('limits weekly dates to the selected day through Saturday', () => {
    expect((service as any).getDatesThroughSaturday('2026-10-22')).toEqual([
      '2026-10-22', '2026-10-23', '2026-10-24',
    ]);
  });

  it('recognizes only explicit rank signals and leaves ordinary labels unknown', () => {
    expect((service as any).classifyRank('Festa de São Tiago Maior')).toBe('feast');
    expect((service as any).classifyRank('Memória obrigatória de São N.')).toBe('obligatory_memorial');
    expect((service as any).classifyRank('Quinta-feira da 29ª semana do Tempo Comum')).toBe('unknown');
  });

  it('refuses a final response URL outside the exact Oratio route', async () => {
    const fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValueOnce({
      url: 'https://evil.example/redirected', redirected: false, ok: true,
      headers: new Headers({ 'content-type': 'text/html' }),
    } as Response);
    await expect((service as any).fetchOratio('https://oratioapp.com.br/liturgia-das-horas/2026/10/22/'))
      .rejects.toThrow(/Redirecionamento Oratio/);
    expect(fetchSpy).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({ redirect: 'manual' }));
    fetchSpy.mockRestore();
  });
});
