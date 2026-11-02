import { toObservable } from '@angular/core/rxjs-interop';
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { filter, map, take } from 'rxjs';
import { Auth } from './auth';

function whenLoaded(auth: Auth) {
  return toObservable(auth.loading).pipe(
    filter((loading) => !loading),
    take(1),
  );
}

export const authGuard: CanActivateFn = () => {
  const auth = inject(Auth);
  const router = inject(Router);
  return whenLoaded(auth).pipe(
    map(() => (auth.user() ? true : router.createUrlTree(['/login']))),
  );
};

export const guestGuard: CanActivateFn = () => {
  const auth = inject(Auth);
  const router = inject(Router);
  return whenLoaded(auth).pipe(
    map(() => (auth.user() ? router.createUrlTree(['/dashboard']) : true)),
  );
};