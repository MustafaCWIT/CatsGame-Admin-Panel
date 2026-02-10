import { redirect } from 'next/navigation';

export default function RootPage() {
  // The middleware will handle redirects based on auth status
  // If it falls through, we default to the admin dashboard
  redirect('/admin');
}
