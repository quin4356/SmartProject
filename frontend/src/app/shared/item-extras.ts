import { Component, OnInit, inject, input, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Attachment, HistoryEntry, ItemExtras } from '../core/item-extras';
import { ItemType, STATUS_LABELS } from '../core/models';

const MAX_PDF_BYTES = 52_428_800;

@Component({
  selector: 'app-item-extras',
  imports: [DatePipe, DecimalPipe, FormsModule, MatFormFieldModule, MatInputModule],
  template: `
    <section class="extras" aria-label="Notitie, onderwerpen, bijlage en geschiedenis">
      <div class="box panel wide">
        <h2>Notitie</h2>
        <mat-form-field appearance="outline" class="full">
          <mat-label>Wat wil je onthouden?</mat-label>
          <textarea matInput [(ngModel)]="note" rows="6" maxlength="20000"></textarea>
        </mat-form-field>
        <button type="button" class="btn" (click)="saveNote()">Notitie opslaan</button>
      </div>

      <div class="box panel">
        <h2>Onderwerpen</h2>
        <mat-form-field appearance="outline" class="full">
          <mat-label>Kommagescheiden</mat-label>
          <input matInput [(ngModel)]="topics" />
        </mat-form-field>
        <button type="button" class="btn" (click)="saveTopics()">Onderwerpen opslaan</button>
      </div>

      <div class="box panel">
        <h2>PDF-bijlage</h2>
        @if (attachment(); as a) {
          <p>
            {{ a.file_name }}
            <span class="num muted">({{ a.size_bytes / 1048576 | number: '1.1-1' }} MB)</span>
          </p>
          <p class="row">
            <button type="button" class="btn" (click)="open(a)">Openen</button>
            <button type="button" class="btn" (click)="remove(a)">Verwijderen</button>
          </p>
        }
        <input
          class="file"
          type="file"
          accept="application/pdf"
          (change)="upload($event)"
          aria-label="PDF uploaden"
        />
      </div>

      <div class="box panel wide">
        <h2>Geschiedenis</h2>
        <ol class="history">
          @for (h of history(); track h.occurred_at) {
            <li>
              <time class="num">{{ h.occurred_at | date: 'd MMM y, HH:mm' }}</time>
              {{ h.old_status ? label(h.old_status) + ' → ' : '' }}{{ label(h.new_status) }}
            </li>
          } @empty {
            <li>Nog geen wijzigingen.</li>
          }
        </ol>
      </div>

      @if (message()) {
        <p class="status" role="status">{{ message() }}</p>
      }
    </section>
  `,
  styles: `
    .extras {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1.25rem;
      margin-top: 1.5rem;
    }
    .box {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: 0.5rem;
      min-width: 0;
    }
    .box h2 {
      font-size: 1.35rem;
    }
    .wide {
      grid-column: 1 / -1;
    }
    .full {
      width: 100%;
    }
    .row {
      display: flex;
      gap: 0.5rem;
      margin: 0;
    }
    .file {
      max-width: 100%;
      font-size: 0.85rem;
      color: var(--paper-dim);
    }
    .file::file-selector-button {
      margin-right: 0.75rem;
      padding: 0.5rem 1rem;
      border: 1px solid var(--line-strong);
      border-radius: 999px;
      background: transparent;
      color: var(--paper);
      font: inherit;
      cursor: pointer;
    }
    .history {
      list-style: none;
      margin: 0;
      padding: 0 0 0 1rem;
      border-left: 1px solid var(--line-strong);
    }
    .history li {
      position: relative;
      padding: 0.35rem 0;
      font-size: 0.9rem;
      color: var(--paper-dim);
    }
    .history li::before {
      content: '';
      position: absolute;
      left: calc(-1rem - 4px);
      top: 0.75rem;
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: var(--lamp);
    }
    .history time {
      display: block;
      font: 0.72rem var(--font-mono);
      color: var(--paper-faint);
    }
    .status {
      grid-column: 1 / -1;
      margin: 0;
      color: var(--lamp);
    }
    @media (max-width: 700px) {
      .extras {
        grid-template-columns: 1fr;
      }
    }
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
    return this.run(
      () => this.extras.saveNote(this.itemId(), this.itemTitle() || 'Notitie', this.note),
      'Notitie opgeslagen.',
    );
  }

  protected saveTopics(): Promise<void> {
    const names = [
      ...new Set(
        this.topics
          .split(',')
          .map((t) => t.trim().slice(0, 100))
          .filter(Boolean),
      ),
    ];
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
    await this.run(
      async () => this.attachment.set(await this.extras.uploadAttachment(this.itemId(), file)),
      'PDF geüpload.',
    );
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
