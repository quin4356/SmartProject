import { Injectable, inject } from '@angular/core';
import { Auth } from './auth';
import { Supabase } from './supabase';
import { ItemType, LibraryItem, NewLibraryItem } from './models';

type LibraryItemChanges = Partial<Omit<LibraryItem, 'id' | 'user_id' | 'created_at' | 'updated_at'>>;

@Injectable({ providedIn: 'root' })
export class LibraryItems {
  private readonly supabase = inject(Supabase);
  private readonly auth = inject(Auth);

  async list(type?: ItemType): Promise<LibraryItem[]> {
    let query = this.supabase.client
      .from('library_items')
      .select('*')
      .order('created_at', { ascending: false });
    if (type) {
      query = query.eq('type', type);
    }
    const { data, error } = await query;
    if (error) {
      throw error;
    }
    return data as LibraryItem[];
  }

  async get(id: string): Promise<LibraryItem> {
    const { data, error } = await this.supabase.client
      .from('library_items')
      .select('*')
      .eq('id', id)
      .single();
    if (error) {
      throw error;
    }
    return data as LibraryItem;
  }

  async add(item: NewLibraryItem): Promise<LibraryItem> {
    const userId = this.auth.user()?.id;
    if (!userId) {
      throw new Error('Niet ingelogd');
    }
    const { data, error } = await this.supabase.client
      .from('library_items')
      .insert({ ...item, user_id: userId })
      .select()
      .single();
    if (error) {
      throw error;
    }
    return data as LibraryItem;
  }

  async update(id: string, changes: LibraryItemChanges): Promise<LibraryItem> {
    const { data, error } = await this.supabase.client
      .from('library_items')
      .update(changes)
      .eq('id', id)
      .select()
      .single();
    if (error) {
      throw error;
    }
    return data as LibraryItem;
  }

  async remove(id: string): Promise<void> {
    const { error } = await this.supabase.client.from('library_items').delete().eq('id', id);
    if (error) {
      throw error;
    }
  }
}