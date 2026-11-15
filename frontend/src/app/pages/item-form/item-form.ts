import { Component, computed, inject, input, signal } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { catchError, debounceTime, distinctUntilChanged, from, map, of, switchMap } from 'rxjs';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatOptionSelectionChange, provideNativeDateAdapter } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ItemStatus, ItemType, NewLibraryItem, STATUS_LABELS } from '../../core/models';
import { LibraryItems } from '../../core/library-items';
import { BookSearch, BookSuggestion } from '../../core/book-search';
import { DocumentarySearch } from '../../core/documentary-search';

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
    MatAutocompleteModule,
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
  private readonly bookSearch = inject(BookSearch);
  private readonly documentarySearch = inject(DocumentarySearch);

  readonly type = input.required<ItemType>();

  readonly saving = signal(false);
  readonly errorMessage = signal<string | null>(null);
  protected readonly coverUrl = signal('');

  readonly isBook = computed(() => this.type() === 'BOOK');
  readonly heading = computed(() => (this.isBook() ? 'Boek toevoegen' : 'Documentaire toevoegen'));
  readonly creatorLabel = computed(() => (this.isBook() ? 'Auteur' : 'Maker'));
  readonly statusOptions = computed(() =>
    (Object.keys(STATUS_LABELS[this.type()]) as ItemStatus[]).map((value) => ({
      value,
      label: STATUS_LABELS[this.type()][value],
    })),
  );
  readonly listRoute = '/dashboard';

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

  protected readonly suggestions = toSignal(
    this.form.controls.title.valueChanges.pipe(
      debounceTime(300),
      map((value) => value.trim()),
      distinctUntilChanged(),
      switchMap((query) =>
        query.length >= 2
          ? from(this.searchSuggestions(query)).pipe(catchError(() => of([] as BookSuggestion[])))
          : of([] as BookSuggestion[]),
      ),
    ),
    { initialValue: [] as BookSuggestion[] },
  );

  private async searchSuggestions(query: string): Promise<BookSuggestion[]> {
    if (this.isBook()) {
      return this.bookSearch.search(query);
    }
    const documentaries = await this.documentarySearch.search(query);
    return documentaries.map((documentary) => ({ ...documentary, authors: [] }));
  }

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
      cover_url: this.coverUrl() || null,
    };

    this.saving.set(true);
    try {
      await this.libraryItems.add(item);
      await this.router.navigateByUrl(this.listRoute);
    } catch {
      this.errorMessage.set('Opslaan is mislukt. Probeer het opnieuw.');
    } finally {
      this.saving.set(false);
    }
  }

  cancel(): void {
    void this.router.navigateByUrl(this.listRoute);
  }

  protected selectBook(book: BookSuggestion, event: MatOptionSelectionChange): void {
    if (!event.isUserInput) {
      return;
    }
    this.coverUrl.set(book.coverUrl);
    this.form.patchValue({
      creatorName: book.authors.length
        ? book.authors.join(', ').slice(0, MAX_TEXT_LENGTH)
        : this.form.controls.creatorName.value,
      description: book.description.replace(/<[^>]*>/g, '').slice(0, MAX_DESCRIPTION_LENGTH),
      startDate: this.form.controls.startDate.value ?? new Date(),
    });
  }
}
