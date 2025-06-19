import * as Sentry from '@sentry/react-native';
import { Platform } from 'react-native';

// Create the routing instrumentation for React Navigation tracking
export const routingInstrumentation = new Sentry.ReactNativeTracing();

// Custom error boundary component
export const SentryErrorBoundary = Sentry.withErrorBoundary;

// Performance monitoring helpers
export const startTransaction = (name: string, op: string) => {
  return Sentry.startTransaction({ name, op });
};

export const addBreadcrumb = (message: string, category: string, level: Sentry.SeverityLevel = 'info') => {
  Sentry.addBreadcrumb({
    message,
    category,
    level,
    timestamp: Date.now() / 1000,
  });
};

// User context helpers
export const setUser = (user: { id: string; email?: string; username?: string }) => {
  Sentry.setUser(user);
};

export const clearUser = () => {
  Sentry.setUser(null);
};

// Custom error reporting
export const captureException = (error: Error, context?: Record<string, any>) => {
  Sentry.withScope((scope) => {
    if (context) {
      Object.keys(context).forEach((key) => {
        scope.setContext(key, context[key]);
      });
    }
    Sentry.captureException(error);
  });
};

export const captureMessage = (message: string, level: Sentry.SeverityLevel = 'info') => {
  Sentry.captureMessage(message, level);
};

// Performance monitoring for specific operations
export const withPerformanceMonitoring = async <T>(
  operationName: string,
  operation: () => Promise<T>
): Promise<T> => {
  const transaction = startTransaction(operationName, 'function');
  
  try {
    const result = await operation();
    transaction.setStatus('ok');
    return result;
  } catch (error) {
    transaction.setStatus('internal_error');
    captureException(error as Error, { operation: operationName });
    throw error;
  } finally {
    transaction.finish();
  }
};

// Mental health specific monitoring
export const trackWellnessEvent = (eventName: string, properties?: Record<string, any>) => {
  addBreadcrumb(`Wellness Event: ${eventName}`, 'wellness', 'info');
  
  Sentry.withScope((scope) => {
    scope.setTag('event_type', 'wellness');
    scope.setContext('wellness_event', {
      name: eventName,
      properties,
      timestamp: new Date().toISOString(),
    });
    
    Sentry.captureMessage(`Wellness event: ${eventName}`, 'info');
  });
};

// Database operation monitoring
export const trackDatabaseOperation = async <T>(
  operation: string,
  table: string,
  fn: () => Promise<T>
): Promise<T> => {
  const transaction = startTransaction(`db.${operation}`, 'db');
  transaction.setTag('db.table', table);
  
  try {
    const result = await fn();
    transaction.setStatus('ok');
    addBreadcrumb(`Database ${operation} on ${table} succeeded`, 'database', 'info');
    return result;
  } catch (error) {
    transaction.setStatus('internal_error');
    addBreadcrumb(`Database ${operation} on ${table} failed`, 'database', 'error');
    captureException(error as Error, {
      database: {
        operation,
        table,
      },
    });
    throw error;
  } finally {
    transaction.finish();
  }
};

export default Sentry;