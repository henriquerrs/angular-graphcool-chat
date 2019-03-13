import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, ParamMap } from '@angular/router';
import { Chat } from '../../models/chat.model';
import { Subscription, Observable } from 'rxjs';
import { map, mergeMap, tap, take } from 'rxjs/operators';
import { Title } from '@angular/platform-browser';
import { UserService } from 'src/app/core/services/user.service';
import { User } from 'src/app/core/models/user.model';
import { Message } from '../../models/message.model';
import { MessageService } from '../../services/message.service';
import { AuthService } from 'src/app/core/services/auth.service';
import authenticate from 'graphcool/src/email-password/authenticate';
import { ChatService } from '../../services/chat.service';

@Component({
  selector: 'app-chat-window',
  templateUrl: './chat-window.component.html',
  styleUrls: ['./chat-window.component.scss']
})
export class ChatWindowComponent implements OnInit, OnDestroy {

  chat: Chat;
  messages$: Observable<Message[]>;
  newMessage = '';
  recipientId: string = null;
  private subscriptions: Subscription[] = [];

  constructor(
    private authService: AuthService,
    private chatService: ChatService,
    private messageService: MessageService,
    private route: ActivatedRoute,
    private title: Title,
    private userService: UserService
  ) { }

  ngOnInit(): void {
    this.title.setTitle('Loading...');
    this.subscriptions.push(
    this.route.data
      .pipe(
        map(routeData => this.chat = routeData.chat),
        mergeMap(() => this.route.paramMap),
        tap((params: ParamMap) => {
          if (!this.chat) {
            this.recipientId = params.get('id');
            this.userService.getUserById(this.recipientId)
              .pipe(take(1))
              .subscribe((user: User) => this.title.setTitle(user.name));
          } else {
            this.title.setTitle(this.chat.title || this.chat.users[0].name);
            this.messages$ = this.messageService.getChatMessage(this.chat.id);
          }
        })
      )
      .subscribe()
    );
  }

  sendMessage(): void {
    this.newMessage = this.newMessage.trim();
    if (this.newMessage) {
      if (this.chat) {
        this.messageService.createMessage({
          text: this.newMessage,
          chatId: this.chat.id,
          senderId: this.authService.authUser.id
        }).pipe(take(1)).subscribe(console.log);
        this.newMessage = '';
      } else {
        this.createPrivateChat();
      }
    }
  }

  private createPrivateChat(): void {
    this.chatService.createPrivateChat(this.recipientId)
      .pipe(
        take(1),
        tap((chat: Chat) => {
          this.chat = chat;
          this.sendMessage();
        })
      ).subscribe();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(s => s.unsubscribe());
    this.title.setTitle('Angular Graphcool Chat');
  }

}
