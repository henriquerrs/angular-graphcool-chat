import { Message } from './../models/message.model';
import { Injectable } from '@angular/core';
import { Observable, Subscription } from 'rxjs';
import { Chat } from '../models/chat.model';
import { Apollo, QueryRef } from 'apollo-angular';
import { AuthService } from 'src/app/core/services/auth.service';
import { AllChatsQuery, USER_CHATS_QUERY, ChatQuery, CHAT_BY_ID_OR_BY_USERS_QUERY, CREATE_PRIVATE_CHAT_MUTATION } from './chat.graphql';
import { map } from 'rxjs/operators';
import { DataProxy } from 'apollo-cache';
import { Router, RouterEvent, NavigationEnd } from '@angular/router';
import { USER_MESSAGES_SUBSCRIPTION, AllMessagesQuery, GET_CHAT_MESSAGES_QUERY } from './message.graphql';

@Injectable({
  providedIn: 'root'
})
export class ChatService {

  chats$: Observable<Chat[]>;
  private queryRef: QueryRef<AllChatsQuery>;
  private subscriptions: Subscription[] = [];

  constructor(
    private apollo: Apollo,
    private authService: AuthService,
    private router: Router
  ) { }

  startChatsMonitoring(): void {
    if (!this.chats$) {
      console.log('New Subscribe');
      this.chats$ = this.getUserChats();
      this.subscriptions.push(this.chats$.subscribe());
      this.router.events.subscribe((event: RouterEvent) => {
        if (event instanceof NavigationEnd && !this.router.url.includes('chat')) {
          this.onDestroy();
        }
      });
    }
  }

  getUserChats(): Observable<Chat[]> {
    this.queryRef = this.apollo.watchQuery<AllChatsQuery>({
      query: USER_CHATS_QUERY,
      variables: {
        loggedUserId: this.authService.authUser.id
      }
    });
    this.queryRef.subscribeToMore({
      document: USER_MESSAGES_SUBSCRIPTION,
      variables: { loggedUserId: this.authService.authUser.id },
      updateQuery: (previous: AllChatsQuery, { subscriptionData }): AllChatsQuery => {

        const newMessage: Message = subscriptionData.data.Message.node;
        try {
          if (newMessage.sender.id !== this.authService.authUser.id) {
            const apolloClient = this.apollo.getClient();
            const chatMessagesVariables = { chatId: newMessage.chat.id };
            const chatMessagesData = apolloClient.readQuery<AllMessagesQuery>({
              query: GET_CHAT_MESSAGES_QUERY,
              variables: chatMessagesVariables
            });
            chatMessagesData.allMessages = [...chatMessagesData.allMessages, newMessage];
            apolloClient.writeQuery({
              query: GET_CHAT_MESSAGES_QUERY,
              variables: chatMessagesVariables,
              data: chatMessagesData
            });
          }
        } catch (e) {
          console.log('allMessagesQuery not found!');
        }
        const chatToUpdateIndex: number =
          (previous.allChats)
            ? previous.allChats.findIndex(chat => chat.id === newMessage.chat.id)
            : -1
          ;
        if (chatToUpdateIndex > -1) {
          const newAllChats = [...previous.allChats];
          const chatToUpdate: Chat = Object.assign({}, newAllChats[chatToUpdateIndex]);
          chatToUpdate.messages = [newMessage];
          newAllChats[chatToUpdateIndex] = chatToUpdate;
          return {
            ...previous,
            allChats: newAllChats
          };
        }
        return previous;
      }
    });
    return this.queryRef.valueChanges
      .pipe(
        map(res => res.data.allChats),
        map((chats: Chat[]) => {
          const chatsToSort = chats.slice();
          return chatsToSort.sort((a, b) => {
            const valueA = (a.messages.length > 0) ? new Date(a.messages[0].createdAt).getTime() : new Date(a.createdAt).getTime();
            const valueB = (b.messages.length > 0) ? new Date(b.messages[0].createdAt).getTime() : new Date(b.createdAt).getTime();
            return valueB - valueA;
          });
        })
      );
  }

  getChatByIdOrByUsers(chatOrUserId: string): Observable<Chat> {
  return this.apollo.query<ChatQuery | AllChatsQuery>({
      query: CHAT_BY_ID_OR_BY_USERS_QUERY,
      variables: {
        chatId: chatOrUserId,
        targetUserId: chatOrUserId,
        loggedUserId: this.authService.authUser.id
      }
    }).pipe(
      map(res => (res.data['Chat']) ? res.data['Chat'] : res.data['allChats'][0])
    );
  }

  createPrivateChat(targetUserId: string): Observable<Chat> {
    return this.apollo.mutate({
      mutation: CREATE_PRIVATE_CHAT_MUTATION,
      variables: {
        loggedUserId: this.authService.authUser.id,
        targetUserId
      },
      update: (store: DataProxy, {data: { createChat } }) => {

        const userChatsVariables = { loggedUserId: this.authService.authUser.id };
        const userChatsData = store.readQuery<AllChatsQuery>({
          query: USER_CHATS_QUERY,
          variables: userChatsVariables
        });
        userChatsData.allChats = [ createChat, ...userChatsData.allChats ];
        store.writeQuery({
          query: USER_CHATS_QUERY,
          variables: userChatsVariables,
          data: userChatsData
        });

        const variables = {
          chatId: targetUserId,
          loggedUserId: this.authService.authUser.id,
          targetUserId
        };
        const data = store.readQuery<AllChatsQuery>({
          query: CHAT_BY_ID_OR_BY_USERS_QUERY,
          variables
        });
        data.allChats = [createChat];
        store.writeQuery({
          query: CHAT_BY_ID_OR_BY_USERS_QUERY,
          variables,
          data
        });
      }
    }).pipe(
      map(res => res.data.createChat)
    );
  }

  private onDestroy(): void {
    this.subscriptions.forEach(s => s.unsubscribe());
    this.subscriptions = [];
  }
}