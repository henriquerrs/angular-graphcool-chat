import { AUTHENTICATE_USER_MUTATION, SIGNUP_USER_MUTATION, LoggedInUserQuery, LOGGED_IN_USER_QUERY } from './auth.graphql';
import { Apollo } from 'apollo-angular';
import { Injectable } from '@angular/core';
import { Observable, ReplaySubject, throwError, of } from 'rxjs';
import { map, tap, catchError, mergeMap, take } from 'rxjs/operators';
import { StorageKeys } from 'src/app/storage-keys';
import { Router } from '@angular/router';
import { Base64 } from 'js-base64';
import { User } from '../models/user.model';
import { ApolloConfigModule } from 'src/app/apollo-config.module';
import { UserService } from './user.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  authUser: User;
  keepSigned: boolean;
  redirecturl: string;
  rememberMe: boolean;

  private _isAuthenticated = new ReplaySubject<boolean>(1);

  constructor(
    private apollo: Apollo,
    private apolloConfigModule: ApolloConfigModule,
    private router: Router,
    private userService: UserService
  ) {
    this.isAuthenticated.subscribe(is => console.log('authstate', is));
    this.init();
  }

  init(): void {
    this.keepSigned = JSON.parse(window.localStorage.getItem(StorageKeys.KEEP_SIGNED));
    this.rememberMe = JSON.parse(window.localStorage.getItem(StorageKeys.REMEMBER_ME));
  }

  get isAuthenticated(): Observable<boolean> {
    return this._isAuthenticated.asObservable();
  }

  entrarUser(variables: {email: string, password: string}): Observable<{id: string, token: string}> {
    return this.apollo.mutate({
      mutation: AUTHENTICATE_USER_MUTATION,
      variables
    }).pipe(
      map(res => res.data.authenticateUser),
      tap(res => this.setAuthState({id: res && res.id, token: res && res.token, isAuthenticated: res !== null})),
      catchError(err => {
        this.setAuthState({id: null, token: null, isAuthenticated: false});
        return throwError(err);
      })
    );
  }

  criarUser(variables: {name: string, email: string, password: string}): Observable<{id: string, token: string}> {
    return this.apollo.mutate({
      mutation: SIGNUP_USER_MUTATION,
      variables
    }).pipe(
      map(res => res.data.criarUser),
      tap(res => this.setAuthState({id: res && res.id, token: res && res.token, isAuthenticated: res !== null})),
      catchError(err => {
        this.setAuthState({id: null, token: null, isAuthenticated: false});
        return throwError(err);
      })
    );
  }

  toggleKeepSigned(): void {
    this.keepSigned = !this.keepSigned;
    window.localStorage.setItem(StorageKeys.KEEP_SIGNED, this.keepSigned.toString());
  }

  toggleRemember(): void {
    this.rememberMe = !this.rememberMe;
    window.localStorage.setItem(StorageKeys.REMEMBER_ME, this.rememberMe.toString());
    if (!this.rememberMe) {
      window.localStorage.removeItem(StorageKeys.USER_EMAIL);
      window.localStorage.removeItem(StorageKeys.USER_PASSWORD);
    }
  }

  setRememberMe(user: {email: string, password: string}): void {
    if (this.rememberMe) {
      window.localStorage.setItem(StorageKeys.USER_EMAIL, Base64.encode(user.email));
      window.localStorage.setItem(StorageKeys.USER_PASSWORD, Base64.encode(user.password));
    }
  }

  getRememberMe(): {email: string, password: string} {
    if (!this.rememberMe) { return null; }
    return {
      email: Base64.decode(window.localStorage.getItem(StorageKeys.USER_EMAIL)),
      password: Base64.decode(window.localStorage.getItem(StorageKeys.USER_PASSWORD))
    };
  }

  logout(): void {
    this.apolloConfigModule.closeWebSocketConnection();
    this.apolloConfigModule.cachePersistor.purge();
    window.localStorage.removeItem(StorageKeys.AUTH_TOKEN);
    window.localStorage.removeItem(StorageKeys.KEEP_SIGNED);
    this.keepSigned = false;
    this._isAuthenticated.next(false);
    this.router.navigate(['/login']);
    this.apollo.getClient().resetStore();
  }

  autoLogin(): Observable<void> {
    if (!this.keepSigned) {
      this._isAuthenticated.next(false);
      window.localStorage.removeItem(StorageKeys.AUTH_TOKEN);
      return of();
    }

    return this.validateToken()
      .pipe(
        tap(authData => {
          const token = window.localStorage.getItem(StorageKeys.AUTH_TOKEN);
          this.setAuthState({id: authData.id, token, isAuthenticated: authData.isAuthenticated}, true);
        }),
        mergeMap(res => of()),
        catchError(error => {
          this.setAuthState({id: null, token: null, isAuthenticated: false});
          return throwError(error);
        })
      );
  }

  private validateToken(): Observable<{id: string, isAuthenticated: boolean}> {
    return this.apollo.query<LoggedInUserQuery>({
      query: LOGGED_IN_USER_QUERY,
      fetchPolicy: 'network-only'
    }).pipe(
      map(res => {
        const user = res.data.loggedInUser;
        return {
          id: user && user.id,
          isAuthenticated: user !== null
        };
      }),
      mergeMap(authData => (authData.isAuthenticated) ? of(authData) : throwError(new Error('Token Inválido')))
    );
  }

  private setAuthUser(userId: string): Observable<User> {
    return this.userService.getUserById(userId)
      .pipe(
        take(1),
        tap((user: User) => {
          this.authUser = user;
        })
      );
  }

  private setAuthState(authData: {id: string, token: string, isAuthenticated: boolean}, isRefresh: boolean = false): void {
    if (authData.isAuthenticated) {
      window.localStorage.setItem(StorageKeys.AUTH_TOKEN, authData.token);
      this.setAuthUser(authData.id)
        .pipe(
          take(1),
          tap(() => this._isAuthenticated.next(authData.isAuthenticated))
        ).subscribe();
      if (!isRefresh) {
        this.apolloConfigModule.closeWebSocketConnection();
      }
      return;
    }
    this._isAuthenticated.next(authData.isAuthenticated);
  }

}
