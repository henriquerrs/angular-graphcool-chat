import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import {
  MatCardModule,
  MatToolbarModule,
  MatFormFieldModule,
  MatInputModule,
  MatButtonModule,
  MatSnackBarModule,
  MatProgressSpinnerModule,
  MatSlideToggleModule,
  MatListModule,
  MatIconModule,
  MatLineModule,
  MatSidenavModule,
  MatTabsModule,
  MatMenuModule,
  MatDialogModule
} from '@angular/material';
import { NoRecordComponent } from './components/no-record/no-record.component';
import { AvatarComponent } from './components/avatar/avatar.component';
import { FromNowPipe } from './pipes/from-now.pipe';
import { ImagePreviewComponent } from './components/image-preview/image-preview.component';

@NgModule({
  imports: [
    MatIconModule,
    MatCardModule,
    MatToolbarModule,
    CommonModule
  ],
  exports: [
    CommonModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatToolbarModule,
    MatSlideToggleModule,
    MatListModule,
    MatIconModule,
    MatLineModule,
    MatSidenavModule,
    MatTabsModule,
    NoRecordComponent,
    FormsModule,
    AvatarComponent,
    FromNowPipe,
    MatMenuModule,
    MatDialogModule,
    ImagePreviewComponent,
    ReactiveFormsModule
  ],
  declarations: [NoRecordComponent, AvatarComponent, FromNowPipe, ImagePreviewComponent]
})
export class SharedModule {}
