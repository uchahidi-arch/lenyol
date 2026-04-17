import { redirect } from 'next/navigation';

export default function ChroniquesModifierRedirect({ params }: { params: { slug: string } }) {
  redirect(`/racines/${params.slug}/modifier`);
}
