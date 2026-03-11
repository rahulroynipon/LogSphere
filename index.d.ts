import { Request, Response, NextFunction, Router } from 'express';

export interface LogSphereConfig {
  sensitiveKeys?: string[];
  enableConsoleLogs?: boolean;
  enableFileLogs?: boolean;
  enableRemoteLogs?: boolean;
  maxLogFiles?: number | false;
  maxExpireDays?: number | false;
  discordWebhookUrl?: string | null;
  logDir?: string;
}

export interface ExpressLoggerOptions extends LogSphereConfig {
  logHeaders?: boolean;
  logBody?: boolean;
  logQuery?: boolean;
  excludePaths?: string[];
  slowRequestThresholdMs?: number;
}

export interface DashboardOptions {
  username?: string;
  password?: string;
  logDir?: string;
}

export function configure(options: LogSphereConfig): void;
export function expressLogger(options?: ExpressLoggerOptions): (req: Request, res: Response, next: NextFunction) => void;
export function dashboard(options?: DashboardOptions): Router;

export function debug(message: string, meta?: any): void;
export function info(message: string, meta?: any): void;
export function warn(message: string, meta?: any): void;
export function error(message: string, err?: Error, meta?: any): void;
