import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { neon } from '@neondatabase/serverless';

@Injectable()
export class DatabaseService implements OnModuleInit {
  private readonly logger = new Logger(DatabaseService.name);
  private sql: ReturnType<typeof neon> | null = null;

  onModuleInit() {
    const url = process.env.DATABASE_URL;
    if (!url) {
      this.logger.warn('DATABASE_URL not set — running without database');
      return;
    }
    this.sql = neon(url);
    this.logger.log('Connected to Neon database');
  }

  get isConnected(): boolean {
    return this.sql !== null;
  }

  async query<T = Record<string, unknown>>(
    strings: TemplateStringsArray,
    ...values: unknown[]
  ): Promise<T[]> {
    if (!this.sql) throw new Error('Database not configured');
    return this.sql(strings, ...values) as Promise<T[]>;
  }

  /* Helper para queries com string direta (sem template literal) */
  async raw<T = Record<string, unknown>>(
    query: string,
    params: unknown[] = [],
  ): Promise<T[]> {
    if (!this.sql) throw new Error('Database not configured');
    return this.sql.transaction([{ query, params }]) as unknown as T[];
  }
}
