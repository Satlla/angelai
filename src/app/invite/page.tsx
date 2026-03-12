import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import InviteClient from './InviteClient'

export default async function InvitePage() {
  const session = await getSession()
  if (!session) redirect('/')
  return <InviteClient />
}
