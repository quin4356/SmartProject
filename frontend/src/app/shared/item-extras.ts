import { Component, OnInit, inject, input, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Attachment, HistoryEntry, ItemExtras } from '../core/item-extras';
import { ItemType, STATUS_LABELS } from '../core/models';

const MAX_PDF_BYTES = 52_428_800;

@Component({
  selector: 'app-item-extras',
  imports: [DatePipe, DecimalPipe, FormsModule, MatButtonModule, MatFormFieldModule, MatInputModule],
  template: `
    <section class="extras">
      <h2>Notitie</h2>
      <mat-form-field appearance="outline" class="full">
        <mat-label>Notitie</mat-label>
        <textarea matInput [(ngModel)]="note" rows="6" maxlength="20000"></textarea>
      </mat-form-field>
      <button mat-stroked-button type="button" (click)="saveNote()">Notitie opslaan</button>

      <h2>Onderwerpen</h2>
      <mat-form-field appearance="outline" class="full">
        <mat-label>Onderwerpen (kommagescheiden)</mat-label>
        <input matInput [(ngModel)]="topics" />
      </mat-form-field>
      <button mat-stroked-button type="button" (click)="saveTopics()">Onderwerpen opslaan</button>

      <h2>PDF-bijlage</h2>
      @if (attachment(); as a) {
        <p>
          {{ a.file_name }} ({{ a.size_bytes / 1048576 | number: '1.1-1' }} MB)
          <button mat-button type="button" (click)="open(a)">Openen</button>
          <button mat-button type="button" (click)="remove(a)">Verwijderen</button>
        </p>
      }
      <input type="file" accept="application/pdf" (change)="upload($event)" />

      <h2>Geschiedenis</h2>
      @for (h of history(); track h.occurred_at) {
        <p>
          {{ h.occurred_at | date: 'd MMM y, HH:mm' }} —
          {{ h.old_status ? label(h.old_status) + ' → ' : '' }}{{ label(h.new_status) }}
        </p>
      } @empty {
        <p>Nog geen wijzigingen.</p>
      }

      @if (message()) {
        <p role="status">{{ message() }}</p>
      }
    </section>
  `,
  styles: `
    .extras { grid-column: 1 / -1; display: flex; flex-direction: column; align-items: flex-start; gap: 0.5rem; margin-top: 1.5rem; }
    .full { width: 100%; }
  `,
})
export class ItemExtrasPanel implements OnInit {
  private readonly extras = inject(ItemExtras);

  readonly itemId = input.required<string>();
  readonly itemTitle = input.required<string>();
  readonly type = input.required<ItemType>();

  protected note = '';
  protected topics = '';
  protected readonly attachment = signal<Attachment | null>(null);
  protected readonly history = signal<HistoryEntry[]>([]);
  protected readonly message = signal('');

  async ngOnInit(): Promise<void> {
    const id = this.itemId();
    try {
      const [note, topics, attachment, history] = await Promise.all([
        this.extras.getNote(id),
        this.extras.getTopics(id),
        this.extras.getAttachment(id),
        this.extras.history(id),
      ]);
      this.note = note;
      this.topics = topics.join(', ');
      this.attachment.set(attachment);
      this.history.set(history);
    } catch {
      this.message.set('Laden van notitie en bijlage is mislukt.');
    }
  }

  protected label(status: HistoryEntry['new_status']): string {
    return STATUS_LABELS[this.type()][status];
  }

  private async run(action: () => Promise<void>, ok: string): Promise<void> {
    try {
      await action();
      this.message.set(ok);
    } catch {
      this.message.set('Actie mislukt. Probeer het opnieuw.');
    }
  }

  protected saveNote(): Promise<void> {
    return this.run(() => this.extras.saveNote(this.itemId(), this.itemTitle() || 'Notitie', this.note), 'Notitie opgeslagen.');
  }

  protected saveTopics(): Promise<void> {
    const names = [...new Set(this.topics.split(',').map((t) => t.trim().slice(0, 100)).filter(Boolean))];
    return this.run(() => this.extras.setTopics(this.itemId(), names), 'Onderwerpen opgeslagen.');
  }

  protected async upload(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) {
      return;
    }
    if (file.type !== 'application/pdf' || file.size > MAX_PDF_BYTES) {
      this.message.set('Alleen PDF-bestanden tot 50 MB zijn toegestaan.');
      return;
    }
    await this.run(async () => this.attachment.set(await this.extras.uploadAttachment(this.itemId(), file)), 'PDF geüpload.');
  }

  protected async open(a: Attachment): Promise<void> {
    await this.run(async () => {
      window.open(await this.extras.attachmentUrl(a.storage_path), '_blank', 'noopener');
    }, '');
  }

  protected remove(a: Attachment): Promise<void> {
    return this.run(async () => {
      await this.extras.removeAttachment(this.itemId(), a.storage_path);
      this.attachment.set(null);
    }, 'PDF verwijderd.');
  }
}
