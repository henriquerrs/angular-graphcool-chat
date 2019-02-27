import { NgModule, Optional, SkipSelf } from '@angular/core';
import { ApolloConfigModule } from './../apollo-config.module';
import { AppRoutingModule } from './../app-routing.module';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { BrowserModule } from '@angular/platform-browser';

@NgModule({
  exports: [
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    ApolloConfigModule
  ]
})
export class CoreModule {

  constructor(
    @Optional() @SkipSelf() parentModule: CoreModule
  ) {
    if ( parentModule ) {
      throw new Error('CoreModule já foi lido, Import esse cara somente no AppModule');
    }
  }
}
