import { AUTHENTICATE_USER_MUTATION, SIGNUP_USER_MUTATION } from './auth.graphql';
import { Apollo } from 'apollo-angular';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  constructor(
    private apollo: Apollo
  ) {}

  entrarUser(variables: {email: string, password: string}): Observable<{id: string, token: string}> {
    return this.apollo.mutate({
      mutation: AUTHENTICATE_USER_MUTATION,
      variables
    }).pipe(
      map(res => res.data.authenticateUser)
    );
  }

  criarUser(variables: {name: string, email: string, password: string}): Observable<{id: string, token: string}> {
    return this.apollo.mutate({
      mutation: SIGNUP_USER_MUTATION,
      variables
    }).pipe(
      map(res => res.data.criarUser)
    );
  }

}
