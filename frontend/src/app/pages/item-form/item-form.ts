import { Component, computed, inject, input, signal } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { provideNativeDateAdapter } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ItemStatus, ItemType, NewLibraryItem, STATUS_LABELS } from '../../core/models';
import { LibraryItems } from '../../core/library-items';

const MAX_TEXT_LENGTH = 255;
const MAX_DESCRIPTION_LENGTH = 5000;

function endDateAfterStartDate(group: AbstractControl): ValidationErrors | null {
  const start = group.get('startDate')?.value as Date | null;
  const end = group.get('endDate')?.value as Date | null;
  if (start && end && end < start) {
    return { endBeforeStart: true };
  }
  return null;
}

function toIsoDate(date: Date | null): string | null {
  if (!date) {
    return null;
  }
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

@Component({
  selector: 'app-item-form',
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatProgressSpinnerModule,
  ],
  providers: [provideNativeDateAdapter()],
  templateUrl: './item-form.html',
  styleUrl: './item-form.scss',
})
export class ItemForm {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly libraryItems = inject(LibraryItems);

  readonly type = input.required<ItemType>();

  readonly saving = signal(false);
  readonly errorMessage = signal<string | null>(null);

  readonly isBook = computed(() => this.type() === 'BOOK');
  readonly heading = computed(() => (this.isBook() ? 'Boek toevoegen' : 'Documentaire toevoegen'));
  readonly creatorLabel = computed(() => (this.isBook() ? 'Auteur' : 'Maker'));
  readonly statusOptions = computed(() =>
    (Object.keys(STATUS_LABELS[this.type()]) as ItemStatus[]).map((value) => ({
      value,
      label: STATUS_LABELS[this.type()][value],
    })),
  );
  readonly listRoute = computed(() =>
    this.isBook() ? '/library/books' : '/library/documentaries',
  );

  readonly ratingOptions = [1, 2, 3, 4, 5];

  readonly form = this.fb.nonNullable.group(
    {
      title: ['', [Validators.required, Validators.maxLength(MAX_TEXT_LENGTH)]],
      creatorName: ['', [Validators.required, Validators.maxLength(MAX_TEXT_LENGTH)]],
      status: ['TO_DO' as ItemStatus, Validators.required],
      startDate: [null as Date | null],
      endDate: [null as Date | null],
      rating: [null as number | null],
      description: ['', Validators.maxLength(MAX_DESCRIPTION_LENGTH)],
    },
    { validators: endDateAfterStartDate },
  );

  async submit(): Promise<void> {
    this.errorMessage.set(null);
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    const item: NewLibraryItem = {
      type: this.type(),
      title: value.title.trim(),
      creator_name: value.creatorName.trim(),
      status: value.status,
      start_date: toIsoDate(value.startDate),
      end_date: toIsoDate(value.endDate),
      rating: value.rating,
      description: value.description.trim() || null,
    };

    this.saving.set(true);
    try {
      await this.libraryItems.add(item);
      await this.router.navigateByUrl(this.listRoute());
    } catch {
      this.errorMessage.set('Opslaan is mislukt. Probeer het opnieuw.');
    } finally {
      this.saving.set(false);
    }
  }

  cancel(): void {
    void this.router.navigateByUrl(this.listRoute());
  }
}
