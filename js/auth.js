// auth.js — Supabase Auth helper (CDN version)
const SUPABASE_URL = 'https://wyhcttzscpjjdgzhtjqs.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind5aGN0dHpzY3BqamRnemh0anFzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkzNzMxNTYsImV4cCI6MjA5NDk0OTE1Nn0.oDlWyxyAY-OkXq6e7RxpJiCIAwPP4DkahUc469xtliY';

const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

console.log('[auth] Supabase client initialized');

async function checkSession() {
  console.log('[auth] checkSession called');
  try {
    const { data: { session }, error } = await _supabase.auth.getSession();
    if (error) throw error;
    return session;
  } catch (err) {
    console.error('[auth] checkSession error:', err.message);
    return null;
  }
}

async function requireAuth() {
  console.log('[auth] requireAuth called');
  const session = await checkSession();
  if (!session) {
    console.log('[auth] No session, redirecting to login');
    window.location.href = 'login.html';
    return null;
  }
  console.log('[auth] Session valid, user:', session.user.email);
  return session;
}

async function authLogin(email, password) {
  console.log('[auth] authLogin:', email);
  const { data, error } = await _supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  console.log('[auth] Login success');
  return data;
}

async function authSignup(email, password) {
  console.log('[auth] authSignup:', email);
  const { data, error } = await _supabase.auth.signUp({ email, password });
  if (error) throw error;
  console.log('[auth] Signup success');
  return data;
}

async function authLogout() {
  console.log('[auth] authLogout called');
  const { error } = await _supabase.auth.signOut();
  if (error) throw error;
  console.log('[auth] Logout success');
  window.location.href = 'login.html';
}

async function getToken() {
  const session = await checkSession();
  return session?.access_token || null;
}
