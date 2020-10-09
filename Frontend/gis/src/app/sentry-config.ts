import { ErrorHandler, Injectable } from '@angular/core';
import * as Sentry from '@sentry/browser';
import { EventHint } from '@sentry/browser';
import { environment } from '../environments/environment';


Sentry.init({
  dsn: environment.dsn,
  release: environment.version,
  environment: environment.env,
  beforeSend(event: Sentry.Event, hint?: EventHint): PromiseLike<Sentry.Event | null> | Sentry.Event | null {
    if (event.user) {
      delete event.user.ip_address;
      delete event.user;
    }
    return event;
  },
  ignoreErrors: [
    'Non-Error exception captured'
  ]
});

@Injectable()
export class SentryErrorHandler implements ErrorHandler {
  constructor() {}
  handleError(error) {
    Sentry.captureException(error.originalError || error);
    throw error;
  }
}
