import { Injectable, inject } from '@angular/core';
import { Supabase } from './supabase';

export interface DocumentarySuggestion {
  id: string;
  title: string;
  creator: string;
  description: string;
  coverUrl: string;
}

@Injectable({ providedIn: 'root' })
export class DocumentarySearch {
  private readonly supabase = inject(Supabase);

  async search(query: string): Promise<DocumentarySuggestion[]> {
    const { data, error } = await this.supabase.client.functions.invoke('search-documentaries', {
      body: { query },
    });
    if (error) {
      throw error;
    }
    return data as DocumentarySuggestion[];
  }
}
