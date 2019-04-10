import { Component, OnInit, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material';

@Component({
  selector: 'app-image-preview',
  templateUrl: './image-preview.component.html',
  styles: [
    `
      img {
        max-width: 100%;
        margin: auto;
        display: block;
      }

      img[mat-card-image] {
        margin-top: 0;
      }

      mat-card {
        padding: 0;
      }
    `
  ]
})
export class ImagePreviewComponent implements OnInit {

  selectedImage: File;

  constructor(
    @Inject(MAT_DIALOG_DATA) private data: any,
    private dialogRef: MatDialogRef<ImagePreviewComponent>
  ) { }

  ngOnInit() {
    this.selectedImage = this.data.image;
  }

  onSave() {
    this.dialogRef.close({

    });
  }

}
