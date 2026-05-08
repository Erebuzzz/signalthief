interface LogContext {
  requestId?: string;
  method?: string;
  path?: string;
  duration?: number;
  [key: string]: unknown;
}

class StructuredLogger {
  private emit(level: 'info' | 'warn' | 'error', message: string, context?: LogContext) {
    const entry = {
      ts: new Date().toISOString(),
      level,
      msg: message,
      ...context,
    };

    const line = JSON.stringify(entry);
    if (level === 'error') {
      console.error(line);
    } else if (level === 'warn') {
      console.warn(line);
    } else {
      console.log(line);
    }
  }

  info(message: string, context?: LogContext) {
    this.emit('info', message, context);
  }

  warn(message: string, context?: LogContext) {
    this.emit('warn', message, context);
  }

  error(message: string, error: Error, context?: LogContext) {
    this.emit('error', message, {
      ...context,
      errorMessage: error.message,
      stack: process.env.NODE_ENV !== 'production' ? error.stack : undefined,
    });
  }
}

export const logger = new StructuredLogger();