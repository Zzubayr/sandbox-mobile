import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { connectToDatabase } from '@/lib/db/connection';
import Admin from '@/lib/db/models/admin';

export async function getServerSession() {
const session = await auth.api.getSession({
headers: await headers(),
});
return session; // null or { user, session, ... }
}

export async function requireUser() {
const session = await getServerSession();
if (!session?.user) throw new Error('Unauthorized');
return session;
}

export async function requireAdmin() {
const session = await requireUser();
await connectToDatabase();
const admin = await Admin.findOne({ user_id: session.user.id }).lean();
if (!admin) throw new Error('Forbidden');
return { session, admin };
}