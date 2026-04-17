import { redirect } from 'next/navigation';

export default function ChroniquesSlugRedirect({ params }: { params: { slug: string } }) {
  redirect(`/racines/${params.slug}`);
}
