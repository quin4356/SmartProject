import { Component, inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogTitle } from '@angular/material/dialog';
import { MatDialogContent } from '@angular/material/dialog';
import { MatDialogActions } from '@angular/material/dialog';

interface ConfirmDialogData {
  title: string;
  message: string;
}

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [MatButtonModule, MatIconModule, MatDialogTitle, MatDialogContent, MatDialogActions],
  template: `
    <h2 mat-dialog-title>{{ data.title }}</h2>
    <mat-dialog-content>{{ data.message }}</mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-stroked-button cdkFocusInitial (click)="onCancel()">Annuleren</button>
      <button mat-flat-button color="warn" (click)="onConfirm()">Verwijderen</button>
    </mat-dialog-actions>
  `,
  styles: [],
})
export class ConfirmDialog {
  readonly data = inject<ConfirmDialogData>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject<MatDialogRef<boolean>>(MatDialogRef);

  protected onCancel(): void {
    this.dialogRef.close(false);
  }

  protected onConfirm(): void {
    this.dialogRef.close(true);
  }
}
