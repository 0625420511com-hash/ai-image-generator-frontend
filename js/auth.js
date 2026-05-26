// auth.js — Supabase Auth helper (CDN version)
const SUPABASE_URL = 'https://wyhcttzscpjjdgzhtjqs.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind5aGN0dHpzY3BqamRnemh0anFzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkzNzMxNTYsImV4cCI6MjA5NDk0OTE1Nn0.oDlWyxyAY-OkXq6e7RxpJiCIAwPP4DkahUc469xtliY';

const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

console.log('🔐 [DEBUG AUTH] Supabase client initialized with URL:', SUPABASE_URL);

async function checkSession() {
  console.group('🔍 [DEBUG AUTH] -> checkSession()');
  console.log(`[${new Date().toLocaleTimeString()}] กำลังตรวจสอบสถานะ Session ของผู้ใช้ในปัจจุบัน...`);
  try {
    const { data: { session }, error } = await _supabase.auth.getSession();
    if (error) throw error;
    
    if (session) {
      console.log('✅ พบ Session ปกติของผู้ใช้:', session.user?.email);
      console.log('🎫 Token หมดอายุวันที่:', new Date(session.expires_at * 1000).toLocaleString());
    } else {
      console.warn('⚠️ ไม่พบ Session ใดๆ ในระบบ (ผู้ใช้อาจยังไม่ได้ Login)');
    }
    console.groupEnd();
    return session;
  } catch (err) {
    console.error('❌ เกิดข้อผิดพลาดใน checkSession:', err.message);
    console.groupEnd();
    return null;
  }
}

async function requireAuth() {
  console.group('🛡️ [DEBUG AUTH] -> requireAuth()');
  console.log(`[${new Date().toLocaleTimeString()}] เริ่มทำการตรวจสอบการบังคับเข้าสู่ระบบ (Enforcement Check)`);
  const session = await checkSession();
  if (!session) {
    console.warn('🚫 ไม่พบ Session สิทธิ์ไม่ผ่าน! กำลังเปลี่ยนเส้นทางไปหน้า login.html');
    console.groupEnd();
    window.location.href = 'login.html';
    return null;
  }
  console.log('✅ ยืนยันสิทธิ์เข้าใช้งานสำเร็จสำหรับ:', session.user.email);
  console.groupEnd();
  return session;
}

async function authLogin(email, password) {
  console.group('🔑 [DEBUG AUTH] -> authLogin()');
  console.log(`[${new Date().toLocaleTimeString()}] กำลังพยายามล็อกอินสำหรับอีเมล:`, email);
  try {
    const { data, error } = await _supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    console.log('✅ เข้าสู่ระบบสำเร็จ! User ID ที่ได้:', data.user?.id);
    console.groupEnd();
    return data;
  } catch (err) {
    console.error('❌ การเข้าสู่ระบบล้มเหลว:', err.message);
    console.groupEnd();
    throw err;
  }
}

async function authSignup(email, password) {
  console.group('📝 [DEBUG AUTH] -> authSignup()');
  console.log(`[${new Date().toLocaleTimeString()}] กำลังพยายามลงทะเบียนสำหรับอีเมล:`, email);
  try {
    const { data, error } = await _supabase.auth.signUp({ email, password });
    if (error) throw error;
    console.log('✅ ลงทะเบียนบัญชีสำเร็จ! Identity ID:', data.user?.id);
    console.groupEnd();
    return data;
  } catch (err) {
    console.error('❌ การลงทะเบียนล้มเหลว:', err.message);
    console.groupEnd();
    throw err;
  }
}

async function authLogout() {
  console.group('🚪 [DEBUG AUTH] -> authLogout()');
  console.log(`[${new Date().toLocaleTimeString()}] กำลังเรียกกระบวนการออกจากระบบ...`);
  try {
    const { error } = await _supabase.auth.signOut();
    if (error) throw error;
    console.log('✅ ออกจากระบบเสร็จสิ้น! กำลังเด้งหน้าไป login.html');
    console.groupEnd();
    window.location.href = 'login.html';
  } catch (err) {
    console.error('❌ การออกจากระบบขัดข้อง:', err.message);
    console.groupEnd();
  }
}

async function getToken() {
  console.group('🎫 [DEBUG AUTH] -> getToken()');
  console.log(`[${new Date().toLocaleTimeString()}] ดึงข้อมูล Access Token สำหรับแนบไปกับ API Header...`);
  const session = await checkSession();
  const token = session?.access_token || null;
  if (token) {
    console.log(`✅ ดึง Token สำเร็จ (ความยาวสัญญารหัส: ${token.length} ตัวอักษร)`);
  } else {
    console.warn('❌ ไม่สามารถดึง Token ได้: Session เป็นค่าว่างหรือหมดอายุการล็อกอินแล้ว');
  }
  console.groupEnd();
  return token;
}