import { Injectable, inject } from '@angular/core';
import { Supabase } from './supabase';

export interface BookSuggestion {
  id: string;
  title: string;
  authors: string[];
  description: string;
  coverUrl: string;
  category?: string;
  pageCount?: number | null;
}

@Injectable({ providedIn: 'root' })
export class BookSearch {
  private readonly supabase = inject(Supabase);

  async search(query: string): Promise<BookSuggestion[]> {
    const { data, error } = await this.supabase.client.functions.invoke('search-books', {
      body: { query },
    });
    if (error) {
      throw error;
    }
    return data as BookSuggestion[];
  }
}
