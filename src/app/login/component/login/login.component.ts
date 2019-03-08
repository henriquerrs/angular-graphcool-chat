import { ErrorService } from './../../../core/services/error.service';
import { AuthService } from './../../../core/services/auth.service';
import { Component, OnInit, OnDestroy, HostBinding } from '@angular/core';
import { MatSnackBar } from '@angular/material/';
import { FormGroup, FormBuilder, Validators, FormControl } from '@angular/forms';
import { takeWhile } from 'rxjs/operators';
import { Router } from '@angular/router';

@Component({
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit, OnDestroy {

  loginForm: FormGroup;
  configs = {
    isLogin: true,
    actionText: 'Entrar',
    buttonActionText: 'Criando conta',
    isLoading: false
  };
  private nameControl = new FormControl('', [Validators.required, Validators.minLength(5)]);
  private alive = true;

  @HostBinding('class.app-login-spinner') private applySpinnerClass = true;

  constructor(
    public authService: AuthService,
    private formBuilder: FormBuilder,
    private errorService: ErrorService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {  }

  ngOnInit() {
    this.createForm();
    const userData = this.authService.getRememberMe();
    if (userData) {
      this.email.setValue(userData.email);
      this.password.setValue(userData.password);
    }
  }

  createForm(): void {
    this.loginForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(5)]]
    });
  }

  onSubmit(): void {
    console.log(this.loginForm.value);

    this.configs.isLoading = true;

    const operation =
      (this.configs.isLogin)
        ? this.authService.entrarUser(this.loginForm.value)
        : this.authService.criarUser(this.loginForm.value);
    operation
      .pipe(
        takeWhile(() => this.alive)
      )
      .subscribe(
        res => {
          this.authService.setRememberMe(this.loginForm.value);
          const redirect: string = this.authService.redirecturl || '/dashboard';
          console.log('rota', redirect);
          this.router.navigate([redirect]);
          this.authService.redirecturl = null;
          this.configs.isLoading = false;
        },
        err => {
          console.log(this.errorService.getErrorMessage(err));
          this.configs.isLoading = false;
          this.snackBar.open(this.errorService.getErrorMessage(err), 'Pronto', {duration: 5000, verticalPosition: 'top'});
        },
        () => console.log('Observable completo')
      );
  }

  onKeepSigned(): void {
    this.authService.toggleKeepSigned();
  }

  onRememberMe(): void {
    this.authService.toggleRemember();
  }

  changeAction(): void {
    this.configs.isLogin = !this.configs.isLogin;
    this.configs.actionText = !this.configs.isLogin ? 'Criar conta' : 'Entrar';
    this.configs.buttonActionText = !this.configs.isLogin ? 'Já tenho uma conta' : 'Criando conta';
    !this.configs.isLogin ? this.loginForm.addControl('name', this.nameControl) : this.loginForm.removeControl('name');
  }

  get name(): FormControl { return <FormControl>this.loginForm.get('name'); }
  get email(): FormControl { return <FormControl>this.loginForm.get('email'); }
  get password(): FormControl { return <FormControl>this.loginForm.get('password'); }

  ngOnDestroy(): void {
    this.alive = false;
  }

}
