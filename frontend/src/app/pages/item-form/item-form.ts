import { Component, OnInit, computed, inject, input, signal } from '@angular/core';
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
import {
  ItemStatus,
  ItemType,
  LibraryItem,
  NewLibraryItem,
  datesForStatus,
  statusOptions,
  toIsoDate,
} from '../../core/models';
import { LibraryItems } from '../../core/library-items';
import { BookSearch, BookSuggestion } from '../../core/book-search';
import { DocumentarySearch } from '../../core/documentary-search';
import { ItemExtrasPanel } from '../../shared/item-extras';

const MAX_TEXT_LENGTH = 255;
const MAX_CREATOR_LENGTH = 200; // database: creator_name tot 200 tekens
const MAX_DESCRIPTION_LENGTH = 5000;

function endDateAfterStartDate(group: AbstractControl): ValidationErrors | null {
  const start = group.get('startDate')?.value as Date | null;
  const end = group.get('endDate')?.value as Date | null;
  if (start && end && end < start) {
    return { endBeforeStart: true };
  }
  return null;
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
    ItemExtrasPanel,
  ],
  providers: [provideNativeDateAdapter()],
  templateUrl: './item-form.html',
  styleUrl: './item-form.scss',
})
export class ItemForm implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly libraryItems = inject(LibraryItems);
  private readonly bookSearch = inject(BookSearch);
  private readonly documentarySearch = inject(DocumentarySearch);

  readonly type = input.required<ItemType>();
  readonly id = input<string>();
  private loaded: LibraryItem | null = null;

  readonly saving = signal(false);
  readonly errorMessage = signal<string | null>(null);
  protected readonly coverUrl = signal('');
  private category = '';
  private pageCount: number | null = null;

  readonly isBook = computed(() => this.type() === 'BOOK');
  readonly editing = computed(() => !!this.id());
  readonly heading = computed(() => {
    const noun = this.isBook() ? 'Boek' : 'Documentaire';
    return `${noun} ${this.editing() ? 'bewerken' : 'toevoegen'}`;
  });
  readonly creatorLabel = computed(() => (this.isBook() ? 'Auteur' : 'Maker'));
  readonly statusOptions = computed(() => statusOptions(this.type()));
  readonly listRoute = '/dashboard';

  async ngOnInit(): Promise<void> {
    const id = this.id();
    if (!id) {
      return;
    }
    try {
      const item = (this.loaded = await this.libraryItems.get(id));
      this.coverUrl.set(item.cover_url ?? '');
      this.category = item.category ?? '';
      this.pageCount = item.page_count;
      this.form.patchValue({
        title: item.title,
        creatorName: item.creator_name,
        status: item.status,
        startDate: this.fromIsoDate(item.start_date),
        endDate: this.fromIsoDate(item.end_date),
        rating: item.rating,
        description: item.description ?? '',
      });
      this.form.controls.status.valueChanges.subscribe((status) => {
        const start = this.form.controls.startDate.value;
        const dates = datesForStatus(
          this.loaded?.status ?? null,
          status,
          start && toIsoDate(start),
        );
        this.form.patchValue({
          startDate: this.fromIsoDate(dates.start_date),
          endDate: this.fromIsoDate(dates.end_date),
        });
      });
    } catch {
      this.errorMessage.set('Laden is mislukt.');
    }
  }

  private fromIsoDate(value: string | null): Date | null {
    if (!value) {
      return null;
    }
    const [y, m, d] = value.split('-').map(Number);
    return new Date(y, m - 1, d);
  }

  readonly ratingOptions = [1, 2, 3, 4, 5];

  readonly form = this.fb.nonNullable.group(
    {
      title: ['', [Validators.required, Validators.maxLength(MAX_TEXT_LENGTH)]],
      creatorName: ['', [Validators.required, Validators.maxLength(MAX_CREATOR_LENGTH)]],
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
    return documentaries.map((documentary) => ({
      ...documentary,
      authors: documentary.creator ? [documentary.creator] : [],
    }));
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
      ...(this.editing()
        ? {
            start_date: value.startDate && toIsoDate(value.startDate),
            end_date: value.endDate && toIsoDate(value.endDate),
          }
        : datesForStatus(null, value.status, null)),
      rating: value.rating,
      description: value.description.trim() || null,
      cover_url: this.coverUrl() || null,
      category: this.isBook() ? this.category || null : null,
      page_count: this.isBook() ? this.pageCount : null,
    };

    this.saving.set(true);
    try {
      const id = this.id();
      if (id) {
        const changes: Partial<NewLibraryItem> = { ...item };
        delete changes.type;
        await this.libraryItems.update(id, changes);
      } else {
        await this.libraryItems.add(item);
      }
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
    this.category = book.category ?? '';
    this.pageCount = book.pageCount || null; // Google Books geeft soms 0; de database eist > 0
    this.form.patchValue({
      creatorName: book.authors.length
        ? book.authors.join(', ').slice(0, MAX_CREATOR_LENGTH)
        : this.form.controls.creatorName.value,
      description: book.description.replace(/<[^>]*>/g, '').slice(0, MAX_DESCRIPTION_LENGTH),
    });
  }
}
