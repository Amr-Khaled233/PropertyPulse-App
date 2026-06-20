// Entry route — bounce to the right place based on auth status. The auth gate in
// _layout also enforces this, but redirecting here avoids a blank first frame.

import { Redirect } from 'expo-router';
import { useAuthStore } from '../store/authStore';
import { Loader } from '../components/common/Loader';

export default function Index() {
  const status = useAuthStore((s) => s.status);
  const role = useAuthStore((s) => s.user?.role);
  if (status === 'loading') return <Loader />;
  if (status !== 'authenticated') return <Redirect href="/landing" />;
  return <Redirect href={role === 'admin' ? '/admin' : '/home'} />;
}
