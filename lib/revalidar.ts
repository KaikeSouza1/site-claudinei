// lib/revalidar.ts
// Depois de salvar no painel, descarta o cache das páginas públicas afetadas
// para a alteração aparecer na hora no site.
import { revalidatePath } from 'next/cache';

export function revalidarImovel(id: number | string) {
  revalidatePath(`/imovel/${id}`);
  revalidatePath('/sitemap.xml');
}
