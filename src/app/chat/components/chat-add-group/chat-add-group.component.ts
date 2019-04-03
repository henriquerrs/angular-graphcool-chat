import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators, FormControl, FormArray } from '@angular/forms';
import { Observable, Subscription } from 'rxjs';
import { User } from 'src/app/core/models/user.model';
import { UserService } from 'src/app/core/services/user.service';
import { map } from 'rxjs/operators';
import { ChatService } from '../../services/chat.service';

@Component({
  selector: 'app-chat-add-group',
  templateUrl: './chat-add-group.component.html',
  styleUrls: ['./chat-add-group.component.scss']
})
export class ChatAddGroupComponent implements OnDestroy, OnInit {

  newGroupForm: FormGroup;
  users$: Observable<User[]>;
  private subscriptions: Subscription[] = [];

  constructor(
    private chatService: ChatService,
    private fb: FormBuilder,
    private userService: UserService
  ) { }

  ngOnInit(): void {
    this.users$ = this.userService.users$;
    this.createForm();
    this.listenMembersList();
  }

  private listenMembersList(): void {
    this.subscriptions.push(
      this.members.valueChanges
      .subscribe(() => {
        this.users$ = this.users$
          .pipe(
            map(users => users.filter(user => {
              return this.members.controls.every(c => c.value.id !== user.id);
            }))
          );
      })
    );
  }

  private createForm(): void {
    this.newGroupForm = this.fb.group({
      title: this.fb.control('', [Validators.required, Validators.minLength(3)]),
      members: this.fb.array([], Validators.required)
    });
  }

  get title(): FormControl { return this.newGroupForm.get('title') as FormControl; }
  get members(): FormArray { return this.newGroupForm.get('members') as FormArray; }

  addMember(user: User): void {
    this.members.push(this.fb.group(user));
    console.log(this.newGroupForm.value);
  }

  removeMember(index: number) {
    this.members.removeAt(index);
  }

  onSubmit(): void {
    console.log('Before: ', this.newGroupForm.value);

    const formValue = Object.assign({
      title: this.title.value,
      usersIds: this.members.value.map(m => m.id)
    });

    console.log('After: ', formValue);
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(s => s.unsubscribe());
  }

}
