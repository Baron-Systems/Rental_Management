import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getIronSession } from 'iron-session';
import { DashboardLayout } from '@/components/DashboardLayout';

const sessionOptions = {
  password: process.env.SESSION_SECRET!,
  cookieName: 'rental_session',
};

export default async function Layout({ children }: { children: React.ReactNode }) {
  const cookieStore = cookies();
  const session = await getIronSession(cookieStore, sessionOptions as any);

  const user = (session as any).user;
  if (!user) {
    redirect('/login');
  }

  return <DashboardLayout user={user}>{children}</DashboardLayout>;
}
