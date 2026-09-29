'use client'

import { useParams } from 'next/navigation';
import ImovelForm from '@/components/admin/ImovelForm';

export default function EditarImovel() {
  const { id } = useParams<{ id: string }>();
  return <ImovelForm imovelId={id} />;
}
