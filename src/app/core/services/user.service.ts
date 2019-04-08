import { Injectable } from '@angular/core';
import { Apollo, QueryRef } from 'apollo-angular';
import { Observable, Subscription } from 'rxjs';
import { User } from '../models/user.model';
import { ALL_USERS_QUERY,
  AllUsersQuery,
  UserQuery,
  GET_USER_BY_ID_QUERY,
  NEW_USER_SUBSCRIPTION,
  UPDATE_USER_MUTATION } from './user.graphql';
import { map } from 'rxjs/operators';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class UserService {

  users$: Observable<User[]>;
  private queryRef: QueryRef<AllUsersQuery>;
  private userSubscription: Subscription;
  private authService: AuthService;

  constructor(
    private apollo: Apollo
  ) { }

  startUsersMonitoring(idToExclude: string): void {
    if (!this.users$) {
      this.users$ = this.allUsers(idToExclude);
      this.userSubscription = this.users$.subscribe();
    }
  }

  stopUserMonitoring(): void {
    if (this.userSubscription) {
      this.userSubscription.unsubscribe();
      this.userSubscription = null;
      this.users$ = null;
    }
  }

  allUsers(idToExclude: string): Observable<User[]> {
    this.queryRef = this.apollo
      .watchQuery<AllUsersQuery>({
        query: ALL_USERS_QUERY,
        variables: {
          idToExclude
        },
        fetchPolicy: 'network-only'
      });

      this.queryRef.subscribeToMore({
        document: NEW_USER_SUBSCRIPTION,
        updateQuery: (previous: AllUsersQuery, { subscriptionData }): AllUsersQuery => {

          const newUser: User = subscriptionData.data.User.node;

          return {
            ...previous,
            allUsers: ([newUser, ...previous.allUsers]).sort((uA, uB) => {
              if (uA.name < uB.name) { return -1; }
              if (uA.name < uB.name) { return 1; }
              return 0;
            })
          };
        }
      });

      return this.queryRef.valueChanges
        .pipe(
          map(res => res.data.allUsers)
        );
  }

  getUserById(id: string): Observable<User> {
    return this.apollo
      .query<UserQuery>({
        query: GET_USER_BY_ID_QUERY,
        variables: { userId: id }
      }).pipe(
        map(res => res.data.User)
      );
  }

  updateUser(user: User): Observable<User> {
    return this.apollo.mutate({
      mutation: UPDATE_USER_MUTATION,
      variables: {
        id: user.id,
        name: user.name,
        email: user.email
      }
    }).pipe(
      map(res => res.data.updateUser)
    );
  }
}
