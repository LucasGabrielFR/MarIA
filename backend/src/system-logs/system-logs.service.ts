import { Injectable, Logger } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

export type LogLevel = 'info' | 'warn' | 'error' | 'critical';

export interface LogEntry {
  level: LogLevel;
  source: string;
  message: string;
  stack_trace?: string;
  metadata?: Record<string, any>;
}

@Injectable()
export class SystemLogsService {
  private readonly consoleLogger = new Logger(SystemLogsService.name);

  constructor(private readonly supabaseService: SupabaseService) {}

  async log(entry: LogEntry): Promise<void> {
    try {
      const supabase = this.supabaseService.getClient();
      const { error } = await supabase.from('system_logs').insert({
        level: entry.level,
        source: entry.source,
        message: entry.message,
        stack_trace: entry.stack_trace || null,
        metadata: entry.metadata || {},
      });

      if (error) {
        this.consoleLogger.error(
          `Falha ao persistir log no Supabase: ${error.message}`,
        );
      }
    } catch (err: any) {
      this.consoleLogger.error(
        `Exceção ao persistir log no banco: ${err?.message || err}`,
      );
    }
  }

  async logError(
    source: string,
    message: string,
    error?: any,
    metadata?: Record<string, any>,
  ): Promise<void> {
    const stack = error?.stack || (error instanceof Error ? error.stack : undefined);
    const errorDetails = error ? {
      name: error?.name,
      message: error?.message || String(error),
      ...(typeof error === 'object' ? error : {}),
    } : undefined;

    this.consoleLogger.error(`[${source}] ${message}`, stack);

    await this.log({
      level: 'error',
      source,
      message,
      stack_trace: stack,
      metadata: { ...metadata, ...(errorDetails ? { error: errorDetails } : {}) },
    });
  }

  async logCritical(
    source: string,
    message: string,
    error?: any,
    metadata?: Record<string, any>,
  ): Promise<void> {
    const stack = error?.stack || (error instanceof Error ? error.stack : undefined);
    this.consoleLogger.error(`[CRITICAL][${source}] ${message}`, stack);

    await this.log({
      level: 'critical',
      source,
      message,
      stack_trace: stack,
      metadata: { ...metadata, ...(error ? { error: error?.message || error } : {}) },
    });
  }

  async logWarn(
    source: string,
    message: string,
    metadata?: Record<string, any>,
  ): Promise<void> {
    this.consoleLogger.warn(`[${source}] ${message}`);

    await this.log({
      level: 'warn',
      source,
      message,
      metadata,
    });
  }

  async logInfo(
    source: string,
    message: string,
    metadata?: Record<string, any>,
  ): Promise<void> {
    this.consoleLogger.log(`[${source}] ${message}`);

    await this.log({
      level: 'info',
      source,
      message,
      metadata,
    });
  }
}
