import { Injectable, inject } from '@angular/core';
import { Auth } from './auth';
import { Supabase } from './supabase';
import { ItemStatus } from './models';

export interface Attachment {
  storage_path: string;
  file_name: string;
  size_bytes: number;
}

export interface HistoryEntry {
  old_status: ItemStatus | null;
  new_status: ItemStatus;
  occurred_at: string;
}

/** Notitie, PDF-bijlage, onderwerpen en statusgeschiedenis van één bibliotheekitem. */
@Injectable({ providedIn: 'root' })
export class ItemExtras {
  private readonly supabase = inject(Supabase);
  private readonly auth = inject(Auth);

  private get db() {
    return this.supabase.client;
  }

  private userId(): string {
    const id = this.auth.user()?.id;
    if (!id) {
      throw new Error('Niet ingelogd');
    }
    return id;
  }

  async getNote(itemId: string): Promise<string> {
    const { data, error } = await this.db
      .from('notes')
      .select('content')
      .eq('item_id', itemId)
      .maybeSingle();
    if (error) {
      throw error;
    }
    return data?.content ?? '';
  }

  async saveNote(itemId: string, title: string, content: string): Promise<void> {
    const { error } = await this.db
      .from('notes')
      .upsert(
        { item_id: itemId, user_id: this.userId(), title: title.slice(0, 200), content },
        { onConflict: 'item_id' },
      );
    if (error) {
      throw error;
    }
  }

  async getAttachment(itemId: string): Promise<Attachment | null> {
    const { data, error } = await this.db
      .from('attachments')
      .select('storage_path, file_name, size_bytes')
      .eq('item_id', itemId)
      .maybeSingle();
    if (error) {
      throw error;
    }
    return data as Attachment | null;
  }

  async uploadAttachment(itemId: string, file: File): Promise<Attachment> {
    const userId = this.userId();
    const path = `${userId}/${itemId}.pdf`;
    const { error: uploadError } = await this.db.storage
      .from('attachments')
      .upload(path, file, { upsert: true, contentType: 'application/pdf' });
    if (uploadError) {
      throw uploadError;
    }
    const row = { storage_path: path, file_name: file.name, size_bytes: file.size };
    const { error } = await this.db
      .from('attachments')
      .upsert({ ...row, item_id: itemId, user_id: userId, mime_type: 'application/pdf' }, { onConflict: 'item_id' });
    if (error) {
      throw error;
    }
    return row;
  }

  async attachmentUrl(path: string): Promise<string> {
    const { data, error } = await this.db.storage.from('attachments').createSignedUrl(path, 60);
    if (error) {
      throw error;
    }
    return data.signedUrl;
  }

  async removeAttachment(itemId: string, path: string): Promise<void> {
    const { error: storageError } = await this.db.storage.from('attachments').remove([path]);
    if (storageError) {
      throw storageError;
    }
    const { error } = await this.db.from('attachments').delete().eq('item_id', itemId);
    if (error) {
      throw error;
    }
  }

  async getTopics(itemId: string): Promise<string[]> {
    const { data, error } = await this.db
      .from('item_topics')
      .select('topics(name)')
      .eq('item_id', itemId);
    if (error) {
      throw error;
    }
    return (data as unknown as { topics: { name: string } | null }[])
      .map((row) => row.topics?.name)
      .filter((name): name is string => !!name)
      .sort((a, b) => a.localeCompare(b));
  }

  async setTopics(itemId: string, names: string[]): Promise<void> {
    const userId = this.userId();
    const { data: existing, error } = await this.db.from('topics').select('id, name');
    if (error) {
      throw error;
    }
    const byName = new Map((existing ?? []).map((t) => [t.name.toLowerCase(), t.id as string]));
    const missing = names.filter((n) => !byName.has(n.toLowerCase()));
    if (missing.length) {
      const { data: created, error: insertError } = await this.db
        .from('topics')
        .insert(missing.map((name) => ({ name, user_id: userId })))
        .select('id, name');
      if (insertError) {
        throw insertError;
      }
      created?.forEach((t) => byName.set(t.name.toLowerCase(), t.id));
    }
    const { error: clearError } = await this.db.from('item_topics').delete().eq('item_id', itemId);
    if (clearError) {
      throw clearError;
    }
    if (names.length) {
      const links = names.map((n) => ({ item_id: itemId, topic_id: byName.get(n.toLowerCase()) }));
      const { error: linkError } = await this.db.from('item_topics').insert(links);
      if (linkError) {
        throw linkError;
      }
    }
  }

  async history(itemId: string): Promise<HistoryEntry[]> {
    const { data, error } = await this.db
      .from('activity_history')
      .select('old_status, new_status, occurred_at')
      .eq('item_id', itemId)
      .order('occurred_at', { ascending: false });
    if (error) {
      throw error;
    }
    return data as HistoryEntry[];
  }
}
