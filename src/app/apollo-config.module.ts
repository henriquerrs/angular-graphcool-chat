import { NgModule, inject, Inject } from '@angular/core';
import { HttpClientModule, HttpHeaders } from '@angular/common/http';

import { ApolloModule, Apollo } from 'apollo-angular';
import { HttpLinkModule, HttpLink } from 'apollo-angular-link-http';
import { InMemoryCache } from 'apollo-cache-inmemory';
import { persistCache, CachePersistor } from 'apollo-cache-persist';
import { onError } from 'apollo-link-error';
import { ApolloLink, Operation } from 'apollo-link';
import { StorageKeys } from './storage-keys';
import { GRAPHCOOL_CONFIG, GraphcoolConfig } from './core/providers/graphcool-config.provider';
import { environment } from 'src/environments/environment';
import { WebSocketLink } from 'apollo-link-ws';
import { getOperationAST } from 'graphql';
import { SubscriptionClient } from 'subscriptions-transport-ws';

@NgModule({
  imports: [
    HttpClientModule,
    ApolloModule,
    HttpLinkModule
  ]
})

export class ApolloConfigModule {

  cachePersistor: CachePersistor<any>;
  private subscriptionClient: SubscriptionClient;

  constructor(
    private apollo: Apollo,
    @Inject(GRAPHCOOL_CONFIG) private graphcoolConfig: GraphcoolConfig,
    private httpLink: HttpLink
  ) {
    const uri = this.graphcoolConfig.simpleAPI;
    const http = httpLink.create({uri});

    const authMiddleware: ApolloLink = new ApolloLink((operation, forward) => {
      operation.setContext({
        headers: new HttpHeaders({
          'Authorization': `Bearer ${this.getAuthToken()}`
        })
      });
      return forward(operation);
    });

    const ws = new WebSocketLink({
      uri: graphcoolConfig.subscritionAPI,
      options: {
        reconnect: true,
        timeout: 30000,
        connectionParams: () => {
          return {
            'Authorization': `Bearer ${this.getAuthToken()}`
          };
        }
      }
    });

    this.subscriptionClient = (<any>ws).subscriptionClient;

    const cache = new InMemoryCache();

    this.cachePersistor = new CachePersistor({
      cache,
      storage: window.localStorage
    });

    const linkError = onError(({ graphQLErrors, networkError }) => {
      if (graphQLErrors) {
        graphQLErrors.map(({ message, locations, path }) =>
          console.log(
            `[GraphQL error]: Message: ${message}, Location: ${locations}, Path: ${path}`,
          ),
        );
        }
      if (networkError) { console.log(`[Network error]: ${networkError}`); }
    });
    apollo.create({
      link: ApolloLink.from([
        linkError,
        ApolloLink.split(
          (operation: Operation) => {
            const operationAST = getOperationAST(operation.query, operation.operationName);
            return !!operationAST && operationAST.operation === 'subscription';
          },
          ws,
          authMiddleware.concat(http)
        )
      ]),
      cache: new InMemoryCache(),
      connectToDevTools: !environment.production
    });
  }

  closeWebSocketConnection(): void {
    this.subscriptionClient.close(true, true);
  }

  private getAuthToken(): string {
    return window.localStorage.getItem(StorageKeys.AUTH_TOKEN);
  }
}
