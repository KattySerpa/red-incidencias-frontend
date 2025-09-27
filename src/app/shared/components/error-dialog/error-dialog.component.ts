import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';

export interface ErrorDialogData {
  title?: string;
  messages: string[];
  status?: number;
  timestamp?: string;
}

@Component({
  standalone: true,
  selector: 'app-error-dialog',
  templateUrl: './error-dialog.component.html',
  styleUrls: ['./error-dialog.component.scss'],
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatListModule]
})
export class ErrorDialogComponent {
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: ErrorDialogData,
    private dialogRef: MatDialogRef<ErrorDialogComponent>
  ) {}

  close() {
    this.dialogRef.close();
  }
}
