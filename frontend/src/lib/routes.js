export function homeFor(user) {
  if (!user) return '/login'
  if (user.kind === 'recruiter') return '/recruiter/inbox'
  if (user.kind === 'admin') return '/admin/companies'
  return '/candidate/browse'
}
