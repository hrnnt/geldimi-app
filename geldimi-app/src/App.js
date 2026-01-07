import React, { useState } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, signOut, createUserWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, getDoc, collection, query, where, getDocs, addDoc, updateDoc, setDoc, deleteDoc } from 'firebase/firestore';

// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyBT7WoatS-4gs8H8QwFQ0LzmxTXnKtJ4cQ",
  authDomain: "geldimi-5844c.firebaseapp.com",
  projectId: "geldimi-5844c",
  storageBucket: "geldimi-5844c.firebasestorage.app",
  messagingSenderId: "900892210524",
  appId: "1:900892210524:web:119241906a88a94a3bfd99"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Giriş Ekranı
function LoginScreen({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setError('');
    setLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      
      if (userDoc.exists()) {
        onLogin({ uid: user.uid, email: user.email, ...userDoc.data() });
      } else {
        setError('Kullanıcı profili bulunamadı!');
      }
    } catch (err) {
      if (err.code === 'auth/invalid-credential') {
        setError('Email veya şifre yanlış!');
      } else {
        setError('Giriş başarısız!');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
      <div style={{ background: 'white', padding: '40px', borderRadius: '20px', maxWidth: '400px', width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <div style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', width: '80px', height: '80px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: '40px' }}>✓</div>
          <h1 style={{ fontSize: '32px', fontWeight: 'bold', color: '#1a202c' }}>GeldiMi Pro</h1>
          <p style={{ color: '#718096', marginTop: '8px' }}>Okul Yönetim Sistemi</p>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#4a5568', marginBottom: '8px' }}>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
            style={{ width: '100%', padding: '12px', border: '2px solid #e2e8f0', borderRadius: '10px', fontSize: '16px' }}
            placeholder="ornek@mail.com"
          />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#4a5568', marginBottom: '8px' }}>Şifre</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
            style={{ width: '100%', padding: '12px', border: '2px solid #e2e8f0', borderRadius: '10px', fontSize: '16px' }}
            placeholder="••••••"
          />
        </div>

        {error && (
          <div style={{ background: '#fed7d7', border: '2px solid #fc8181', color: '#c53030', padding: '12px', borderRadius: '10px', fontSize: '14px', marginBottom: '20px' }}>
            {error}
          </div>
        )}

        <button
          onClick={handleLogin}
          disabled={loading}
          style={{ width: '100%', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', padding: '14px', borderRadius: '10px', border: 'none', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', opacity: loading ? 0.5 : 1 }}
        >
          {loading ? 'Giriş Yapılıyor...' : 'Giriş Yap'}
        </button>

        <div style={{ marginTop: '30px', paddingTop: '30px', borderTop: '2px solid #e2e8f0' }}>
          <p style={{ fontSize: '12px', color: '#718096', textAlign: 'center' }}>Test Hesapları:</p>
          <p style={{ fontSize: '11px', color: '#a0aec0', textAlign: 'center', marginTop: '8px' }}>
            mudur@okul.com / ogretmen@okul.com / veli@okul.com<br/>
            Şifre: 123456
          </p>
        </div>
      </div>
    </div>
  );
}

// Müdür Paneli
function AdminPanel({ user, onLogout }) {
  const [currentPage, setCurrentPage] = useState('home');
  const [students, setStudents] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Form state'leri
  const [studentForm, setStudentForm] = useState({
    name: '',
    class: '',
    no: '',
    gender: '',
    parentEmail: '',
    parentName: ''
  });
  
  const [teacherForm, setTeacherForm] = useState({
    name: '',
    email: '',
    password: '',
    branch: ''
  });

  // Öğrencileri yükle
  React.useEffect(() => {
    const loadStudents = async () => {
      const studentsRef = collection(db, 'students');
      const q = query(studentsRef, where('schoolId', '==', user.schoolId));
      const snapshot = await getDocs(q);
      const studentsList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setStudents(studentsList);
    };
    loadStudents();
  }, [user.schoolId]);

  // Öğretmenleri yükle
  React.useEffect(() => {
    const loadTeachers = async () => {
      const usersRef = collection(db, 'users');
      const q = query(
        usersRef, 
        where('schoolId', '==', user.schoolId),
        where('role', '==', 'teacher')
      );
      const snapshot = await getDocs(q);
      const teachersList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setTeachers(teachersList);
    };
    loadTeachers();
  }, [user.schoolId]);

  // Öğrenci ekle
  const addStudent = async () => {
    if (!studentForm.name || !studentForm.class || !studentForm.no) {
      alert('Lütfen zorunlu alanları doldurun!');
      return;
    }

    setLoading(true);
    try {
      // Önce veli hesabı oluştur (eğer email varsa)
      let parentId = null;
      if (studentForm.parentEmail && studentForm.password) {
        const parentCredential = await createUserWithEmailAndPassword(
          auth,
          studentForm.parentEmail,
          studentForm.password || '123456'
        );
        parentId = parentCredential.user.uid;

        // Veli profilini kaydet
        await setDoc(doc(db, 'users', parentId), {
          email: studentForm.parentEmail,
          name: studentForm.parentName || 'Veli',
          role: 'parent',
          schoolId: user.schoolId,
          createdAt: new Date().toISOString()
        });
      }

      // Öğrenciyi kaydet
      await addDoc(collection(db, 'students'), {
        name: studentForm.name,
        class: studentForm.class,
        no: parseInt(studentForm.no),
        gender: studentForm.gender || 'Belirtilmemiş',
        schoolId: user.schoolId,
        parentId: parentId,
        createdAt: new Date().toISOString()
      });

      alert('Öğrenci başarıyla eklendi! ✅');
      setStudentForm({ name: '', class: '', no: '', gender: '', parentEmail: '', parentName: '' });
      
      // Listeyi yenile
      const studentsRef = collection(db, 'students');
      const q = query(studentsRef, where('schoolId', '==', user.schoolId));
      const snapshot = await getDocs(q);
      const studentsList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setStudents(studentsList);
    } catch (error) {
      alert('Hata: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Öğretmen ekle
  const addTeacher = async () => {
    if (!teacherForm.name || !teacherForm.email || !teacherForm.password || !teacherForm.branch) {
      alert('Lütfen tüm alanları doldurun!');
      return;
    }

    setLoading(true);
    try {
      // Öğretmen hesabı oluştur
      const teacherCredential = await createUserWithEmailAndPassword(
        auth,
        teacherForm.email,
        teacherForm.password
      );

      // Öğretmen profilini kaydet
      await setDoc(doc(db, 'users', teacherCredential.user.uid), {
        email: teacherForm.email,
        name: teacherForm.name,
        role: 'teacher',
        branch: teacherForm.branch,
        schoolId: user.schoolId,
        createdAt: new Date().toISOString()
      });

      alert('Öğretmen başarıyla eklendi! ✅');
      setTeacherForm({ name: '', email: '', password: '', branch: '' });
      
      // Listeyi yenile
      const usersRef = collection(db, 'users');
      const q = query(
        usersRef, 
        where('schoolId', '==', user.schoolId),
        where('role', '==', 'teacher')
      );
      const snapshot = await getDocs(q);
      const teachersList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setTeachers(teachersList);
    } catch (error) {
      if (error.code === 'auth/email-already-in-use') {
        alert('Bu email adresi zaten kullanımda!');
      } else {
        alert('Hata: ' + error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  // Öğrenci sil
  const deleteStudent = async (studentId) => {
    if (!window.confirm('Bu öğrenciyi silmek istediğinizden emin misiniz?')) return;

    try {
      await deleteDoc(doc(db, 'students', studentId));
      alert('Öğrenci silindi! ✅');
      setStudents(students.filter(s => s.id !== studentId));
    } catch (error) {
      alert('Hata: ' + error.message);
    }
  };

  // Ana Sayfa
  if (currentPage === 'home') {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)', padding: '20px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          {/* Header */}
          <div style={{ background: 'white', padding: '30px', borderRadius: '15px', marginBottom: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
            <div>
              <h1 style={{ fontSize: '32px', fontWeight: 'bold', color: '#2d3748' }}>Müdür Paneli</h1>
              <p style={{ color: '#718096', marginTop: '5px' }}>Hoş geldiniz, {user.name}</p>
            </div>
            <button onClick={onLogout} style={{ background: '#f56565', color: 'white', padding: '12px 24px', borderRadius: '10px', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px' }}>
              Çıkış
            </button>
          </div>

          {/* İstatistikler */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '30px' }}>
            <div style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', padding: '30px', borderRadius: '15px', color: 'white', boxShadow: '0 8px 16px rgba(102,126,234,0.4)' }}>
              <div style={{ fontSize: '48px', fontWeight: 'bold', marginBottom: '10px' }}>{students.length}</div>
              <div style={{ fontSize: '18px', opacity: 0.9 }}>Toplam Öğrenci</div>
            </div>
            <div style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', padding: '30px', borderRadius: '15px', color: 'white', boxShadow: '0 8px 16px rgba(240,147,251,0.4)' }}>
              <div style={{ fontSize: '48px', fontWeight: 'bold', marginBottom: '10px' }}>{teachers.length}</div>
              <div style={{ fontSize: '18px', opacity: 0.9 }}>Toplam Öğretmen</div>
            </div>
            <div style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', padding: '30px', borderRadius: '15px', color: 'white', boxShadow: '0 8px 16px rgba(79,172,254,0.4)' }}>
              <div style={{ fontSize: '48px', fontWeight: 'bold', marginBottom: '10px' }}>🎓</div>
              <div style={{ fontSize: '18px', opacity: 0.9 }}>Aktif Sistem</div>
            </div>
          </div>

          {/* Hızlı İşlemler */}
          <div style={{ background: 'white', borderRadius: '15px', padding: '30px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
            <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#2d3748', marginBottom: '20px' }}>Hızlı İşlemler</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px' }}>
              <button 
                onClick={() => setCurrentPage('students')}
                style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', padding: '30px', borderRadius: '12px', border: 'none', cursor: 'pointer', fontSize: '18px', fontWeight: 'bold', boxShadow: '0 4px 12px rgba(102,126,234,0.3)' }}
              >
                👨‍🎓 Öğrenci Yönetimi
              </button>
              <button 
                onClick={() => setCurrentPage('teachers')}
                style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', color: 'white', padding: '30px', borderRadius: '12px', border: 'none', cursor: 'pointer', fontSize: '18px', fontWeight: 'bold', boxShadow: '0 4px 12px rgba(240,147,251,0.3)' }}
              >
                👨‍🏫 Öğretmen Yönetimi
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Öğrenci Yönetimi Sayfası
  if (currentPage === 'students') {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)', padding: '20px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ background: 'white', padding: '30px', borderRadius: '15px', marginBottom: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h1 style={{ fontSize: '28px', fontWeight: 'bold' }}>Öğrenci Yönetimi</h1>
            <button onClick={() => setCurrentPage('home')} style={{ background: '#e2e8f0', color: '#2d3748', padding: '10px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>
              ← Geri
            </button>
          </div>

          {/* Öğrenci Ekleme Formu */}
          <div style={{ background: 'white', borderRadius: '15px', padding: '30px', marginBottom: '30px' }}>
            <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '20px' }}>Yeni Öğrenci Ekle</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px' }}>
              <div>
                <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px', color: '#2d3748' }}>Ad Soyad *</label>
                <input
                  value={studentForm.name}
                  onChange={(e) => setStudentForm({...studentForm, name: e.target.value})}
                  style={{ width: '100%', padding: '12px', border: '2px solid #e2e8f0', borderRadius: '8px', fontSize: '16px' }}
                  placeholder="Ahmet Yılmaz"
                />
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px', color: '#2d3748' }}>Sınıf *</label>
                <select
                  value={studentForm.class}
                  onChange={(e) => setStudentForm({...studentForm, class: e.target.value})}
                  style={{ width: '100%', padding: '12px', border: '2px solid #e2e8f0', borderRadius: '8px', fontSize: '16px' }}
                >
                  <option value="">Seçin...</option>
                  <option value="5-A">5-A</option>
                  <option value="5-B">5-B</option>
                  <option value="6-A">6-A</option>
                  <option value="6-B">6-B</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px', color: '#2d3748' }}>Numara *</label>
                <input
                  type="number"
                  value={studentForm.no}
                  onChange={(e) => setStudentForm({...studentForm, no: e.target.value})}
                  style={{ width: '100%', padding: '12px', border: '2px solid #e2e8f0', borderRadius: '8px', fontSize: '16px' }}
                  placeholder="12"
                />
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px', color: '#2d3748' }}>Cinsiyet</label>
                <select
                  value={studentForm.gender}
                  onChange={(e) => setStudentForm({...studentForm, gender: e.target.value})}
                  style={{ width: '100%', padding: '12px', border: '2px solid #e2e8f0', borderRadius: '8px', fontSize: '16px' }}
                >
                  <option value="">Seçin...</option>
                  <option value="Erkek">Erkek</option>
                  <option value="Kız">Kız</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px', color: '#2d3748' }}>Veli Adı</label>
                <input
                  value={studentForm.parentName}
                  onChange={(e) => setStudentForm({...studentForm, parentName: e.target.value})}
                  style={{ width: '100%', padding: '12px', border: '2px solid #e2e8f0', borderRadius: '8px', fontSize: '16px' }}
                  placeholder="Mehmet Yılmaz"
                />
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px', color: '#2d3748' }}>Veli Email</label>
                <input
                  type="email"
                  value={studentForm.parentEmail}
                  onChange={(e) => setStudentForm({...studentForm, parentEmail: e.target.value})}
                  style={{ width: '100%', padding: '12px', border: '2px solid #e2e8f0', borderRadius: '8px', fontSize: '16px' }}
                  placeholder="veli@email.com"
                />
              </div>
            </div>
            <button
              onClick={addStudent}
              disabled={loading}
              style={{
                width: '100%',
                marginTop: '20px',
                padding: '15px',
                borderRadius: '10px',
                border: 'none',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                fontSize: '18px',
                fontWeight: 'bold',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.5 : 1
              }}
            >
              {loading ? 'Ekleniyor...' : '➕ Öğrenci Ekle'}
            </button>
          </div>

          {/* Öğrenci Listesi */}
          <div style={{ background: 'white', borderRadius: '15px', padding: '30px' }}>
            <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '20px' }}>Öğrenci Listesi ({students.length})</h3>
            {students.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#718096' }}>
                <div style={{ fontSize: '48px', marginBottom: '15px' }}>👨‍🎓</div>
                <p>Henüz öğrenci eklenmemiş</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: '15px' }}>
                {students.map(student => (
                  <div
                    key={student.id}
                    style={{
                      padding: '20px',
                      border: '2px solid #e2e8f0',
                      borderRadius: '12px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                      <div style={{
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        color: 'white',
                        width: '60px',
                        height: '60px',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '20px',
                        fontWeight: 'bold'
                      }}>
                        {student.no}
                      </div>
                      <div>
                        <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#2d3748' }}>{student.name}</div>
                        <div style={{ fontSize: '14px', color: '#718096', marginTop: '5px' }}>
                          {student.class} • {student.gender}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => deleteStudent(student.id)}
                      style={{
                        background: '#fed7d7',
                        color: '#c53030',
                        padding: '10px 20px',
                        borderRadius: '8px',
                        border: 'none',
                        cursor: 'pointer',
                        fontWeight: 'bold'
                      }}
                    >
                      🗑️ Sil
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Öğretmen Yönetimi Sayfası
  if (currentPage === 'teachers') {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)', padding: '20px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ background: 'white', padding: '30px', borderRadius: '15px', marginBottom: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h1 style={{ fontSize: '28px', fontWeight: 'bold' }}>Öğretmen Yönetimi</h1>
            <button onClick={() => setCurrentPage('home')} style={{ background: '#e2e8f0', color: '#2d3748', padding: '10px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>
              ← Geri
            </button>
          </div>

          {/* Öğretmen Ekleme Formu */}
          <div style={{ background: 'white', borderRadius: '15px', padding: '30px', marginBottom: '30px' }}>
            <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '20px' }}>Yeni Öğretmen Ekle</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px' }}>
              <div>
                <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px', color: '#2d3748' }}>Ad Soyad *</label>
                <input
                  value={teacherForm.name}
                  onChange={(e) => setTeacherForm({...teacherForm, name: e.target.value})}
                  style={{ width: '100%', padding: '12px', border: '2px solid #e2e8f0', borderRadius: '8px', fontSize: '16px' }}
                  placeholder="Ayşe Öğretmen"
                />
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px', color: '#2d3748' }}>Branş *</label>
                <select
                  value={teacherForm.branch}
                  onChange={(e) => setTeacherForm({...teacherForm, branch: e.target.value})}
                  style={{ width: '100%', padding: '12px', border: '2px solid #e2e8f0', borderRadius: '8px', fontSize: '16px' }}
                >
                  <option value="">Seçin...</option>
                  <option value="Matematik">Matematik</option>
                  <option value="Türkçe">Türkçe</option>
                  <option value="İngilizce">İngilizce</option>
                  <option value="Fen Bilgisi">Fen Bilgisi</option>
                  <option value="Sosyal Bilgiler">Sosyal Bilgiler</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px', color: '#2d3748' }}>Email *</label>
                <input
                  type="email"
                  value={teacherForm.email}
                  onChange={(e) => setTeacherForm({...teacherForm, email: e.target.value})}
                  style={{ width: '100%', padding: '12px', border: '2px solid #e2e8f0', borderRadius: '8px', fontSize: '16px' }}
                  placeholder="ogretmen@email.com"
                />
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px', color: '#2d3748' }}>Şifre *</label>
                <input
                  type="password"
                  value={teacherForm.password}
                  onChange={(e) => setTeacherForm({...teacherForm, password: e.target.value})}
                  style={{ width: '100%', padding: '12px', border: '2px solid #e2e8f0', borderRadius: '8px', fontSize: '16px' }}
                  placeholder="En az 6 karakter"
                />
              </div>
            </div>
            <button
              onClick={addTeacher}
              disabled={loading}
              style={{
                width: '100%',
                marginTop: '20px',
                padding: '15px',
                borderRadius: '10px',
                border: 'none',
                background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                color: 'white',
                fontSize: '18px',
                fontWeight: 'bold',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.5 : 1
              }}
            >
              {loading ? 'Ekleniyor...' : '➕ Öğretmen Ekle'}
            </button>
          </div>

          {/* Öğretmen Listesi */}
          <div style={{ background: 'white', borderRadius: '15px', padding: '30px' }}>
            <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '20px' }}>Öğretmen Listesi ({teachers.length})</h3>
            {teachers.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#718096' }}>
                <div style={{ fontSize: '48px', marginBottom: '15px' }}>👨‍🏫</div>
                <p>Henüz öğretmen eklenmemiş</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: '15px' }}>
                {teachers.map(teacher => (
                  <div
                    key={teacher.id}
                    style={{
                      padding: '20px',
                      border: '2px solid #e2e8f0',
                      borderRadius: '12px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#2d3748', marginBottom: '5px' }}>{teacher.name}</div>
                      <div style={{ fontSize: '14px', color: '#718096' }}>
                        {teacher.branch} • {teacher.email}
                      </div>
                    </div>
                    <div style={{
                      background: '#c6f6d5',
                      color: '#22543d',
                      padding: '8px 16px',
                      borderRadius: '20px',
                      fontSize: '14px',
                      fontWeight: 'bold'
                    }}>
                      ✓ Aktif
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return null;
}

// Öğretmen Paneli
function TeacherPanel({ user, onLogout }) {
  const [currentPage, setCurrentPage] = useState('home'); // 'home', 'attendance', 'homework'
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [loading, setLoading] = useState(false);
  
  // Ödev için state'ler
  const [homeworkForm, setHomeworkForm] = useState({ class: '', topic: '', dueDate: '' });
  const [homeworkList, setHomeworkList] = useState([]);
  const [selectedHomework, setSelectedHomework] = useState(null);
  const [homeworkStatus, setHomeworkStatus] = useState({});

  // Öğrencileri yükle
  React.useEffect(() => {
    const loadStudents = async () => {
      const studentsRef = collection(db, 'students');
      const q = query(studentsRef, where('schoolId', '==', user.schoolId));
      const snapshot = await getDocs(q);
      const studentsList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setStudents(studentsList);
    };
    loadStudents();
  }, [user.schoolId]);

  // Ödevleri yükle
  React.useEffect(() => {
    const loadHomework = async () => {
      const homeworkRef = collection(db, 'homework');
      const q = query(
        homeworkRef, 
        where('schoolId', '==', user.schoolId),
        where('teacherId', '==', user.uid)
      );
      const snapshot = await getDocs(q);
      const hwList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setHomeworkList(hwList);
    };
    loadHomework();
  }, [user.schoolId, user.uid]);

  const handleAttendance = (studentId, status) => {
    setAttendance(prev => ({ ...prev, [studentId]: status }));
  };

  const saveAttendance = async () => {
  setLoading(true);
  try {
    const today = new Date().toISOString().split('T')[0];
    let notifiedCount = 0;
    
    for (const student of students) {
      const status = attendance[student.id] || 'present';
      
      // Yoklamayı kaydet
      await addDoc(collection(db, 'attendance'), {
        studentId: student.id,
        studentName: student.name,
        class: student.class,
        schoolId: user.schoolId,
        date: today,
        status: status,
        teacherId: user.uid,
        createdAt: new Date().toISOString()
      });

      // Gelmedi veya geç geldiyse veliye bildirim oluştur
      if (status === 'absent' || status === 'late') {
        await addDoc(collection(db, 'notifications'), {
          parentId: student.parentId,
          studentId: student.id,
          studentName: student.name,
          type: 'attendance',
          status: status,
          message: status === 'absent' 
            ? `${student.name} bugün okula gelmedi.`
            : `${student.name} bugün okula geç geldi.`,
          date: today,
          createdAt: new Date().toISOString(),
          read: false
        });
        notifiedCount++;
      }
    }
    
    if (notifiedCount > 0) {
      alert(`Yoklama kaydedildi! ✅\n${notifiedCount} veliye bildirim gönderildi 📱`);
    } else {
      alert('Yoklama kaydedildi! ✅\nTüm öğrenciler geldi.');
    }
    
    setAttendance({});
    setCurrentPage('home');
  } catch (error) {
    alert('Hata: ' + error.message);
  } finally {
    setLoading(false);
  }
};

  // Ödev verme
  const saveHomework = async () => {
    if (!homeworkForm.class || !homeworkForm.topic || !homeworkForm.dueDate) {
      alert('Lütfen tüm alanları doldurun!');
      return;
    }

    setLoading(true);
    try {
      await addDoc(collection(db, 'homework'), {
        teacherId: user.uid,
        teacherName: user.name,
        schoolId: user.schoolId,
        class: homeworkForm.class,
        topic: homeworkForm.topic,
        dueDate: homeworkForm.dueDate,
        createdAt: new Date().toISOString(),
        checked: false
      });

      alert(`${homeworkForm.class} sınıfına ödev verildi! ✅`);
      setHomeworkForm({ class: '', topic: '', dueDate: '' });
      
      // Listeyi yenile
      const homeworkRef = collection(db, 'homework');
      const q = query(
        homeworkRef, 
        where('schoolId', '==', user.schoolId),
        where('teacherId', '==', user.uid)
      );
      const snapshot = await getDocs(q);
      const hwList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setHomeworkList(hwList);
    } catch (error) {
      alert('Hata: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Ödev kontrolü
  const handleHomeworkStatus = (studentId, status) => {
    setHomeworkStatus(prev => ({ ...prev, [studentId]: status }));
  };

  const saveHomeworkCheck = async () => {
    setLoading(true);
    try {
      const classStudents = students.filter(s => s.class === selectedHomework.class);
      
      for (const student of classStudents) {
        const status = homeworkStatus[student.id] || 'notDone';
        await addDoc(collection(db, 'homeworkResults'), {
          homeworkId: selectedHomework.id,
          studentId: student.id,
          studentName: student.name,
          class: student.class,
          parentId: student.parentId,
          topic: selectedHomework.topic,
          status: status,
          checkedAt: new Date().toISOString()
        });
      }

      // Homework'u checked olarak işaretle
      const homeworkRef = doc(db, 'homework', selectedHomework.id);
      await updateDoc(homeworkRef, { checked: true });

      alert('Ödev kontrolü kaydedildi! Velilere bildirim gitti! ✅');
      setHomeworkStatus({});
      setSelectedHomework(null);
      
      // Listeyi yenile
      const hwRef = collection(db, 'homework');
      const q = query(
        hwRef, 
        where('schoolId', '==', user.schoolId),
        where('teacherId', '==', user.uid)
      );
      const snapshot = await getDocs(q);
      const hwList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setHomeworkList(hwList);
    } catch (error) {
      alert('Hata: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Ana Sayfa
  if (currentPage === 'home') {
    return (
      <div style={{ minHeight: '100vh', background: '#f7fafc', padding: '20px' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          <div style={{ background: 'white', padding: '30px', borderRadius: '15px', marginBottom: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h1 style={{ fontSize: '28px', fontWeight: 'bold' }}>Öğretmen Paneli</h1>
              <p style={{ color: '#718096' }}>{user.name}</p>
            </div>
            <button onClick={onLogout} style={{ background: '#f56565', color: 'white', padding: '10px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>
              Çıkış
            </button>
          </div>

          <div style={{ background: 'linear-gradient(135deg, #4299e1 0%, #667eea 100%)', color: 'white', padding: '30px', borderRadius: '15px', marginBottom: '30px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '10px' }}>Hoş Geldiniz!</h2>
            <p>{students.length} öğrenci • {homeworkList.length} ödev</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <button 
              onClick={() => setCurrentPage('attendance')}
              style={{ background: 'white', padding: '40px', borderRadius: '15px', border: 'none', cursor: 'pointer', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}
            >
              <div style={{ fontSize: '48px', marginBottom: '15px' }}>✓</div>
              <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#2d3748' }}>Yoklama Al</div>
            </button>
            
            <button 
              onClick={() => setCurrentPage('homework')}
              style={{ background: 'white', padding: '40px', borderRadius: '15px', border: 'none', cursor: 'pointer', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}
            >
              <div style={{ fontSize: '48px', marginBottom: '15px' }}>📚</div>
              <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#2d3748' }}>Ödev İşlemleri</div>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Yoklama Sayfası
  if (currentPage === 'attendance') {
    return (
      <div style={{ minHeight: '100vh', background: '#f7fafc', padding: '20px' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          <div style={{ background: 'white', padding: '30px', borderRadius: '15px', marginBottom: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h1 style={{ fontSize: '28px', fontWeight: 'bold' }}>Yoklama Sistemi</h1>
            <button onClick={() => setCurrentPage('home')} style={{ background: '#e2e8f0', color: '#2d3748', padding: '10px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>
              ← Geri
            </button>
          </div>

          <div style={{ background: 'white', borderRadius: '15px', padding: '20px' }}>
            {students.map(student => (
              <div key={student.id} style={{ padding: '20px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                  <div style={{ background: '#e2e8f0', width: '50px', height: '50px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                    {student.no}
                  </div>
                  <div>
                    <div style={{ fontWeight: 'bold', fontSize: '18px' }}>{student.name}</div>
                    <div style={{ color: '#718096', fontSize: '14px' }}>{student.class}</div>
                  </div>
                </div>
                
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    onClick={() => handleAttendance(student.id, 'present')}
                    style={{
                      padding: '10px 20px',
                      borderRadius: '8px',
                      border: 'none',
                      cursor: 'pointer',
                      fontWeight: 'bold',
                      background: attendance[student.id] === 'present' ? '#48bb78' : '#e2e8f0',
                      color: attendance[student.id] === 'present' ? 'white' : '#4a5568'
                    }}
                  >
                    ✓ Geldi
                  </button>
                  <button
                    onClick={() => handleAttendance(student.id, 'absent')}
                    style={{
                      padding: '10px 20px',
                      borderRadius: '8px',
                      border: 'none',
                      cursor: 'pointer',
                      fontWeight: 'bold',
                      background: attendance[student.id] === 'absent' ? '#f56565' : '#e2e8f0',
                      color: attendance[student.id] === 'absent' ? 'white' : '#4a5568'
                    }}
                  >
                    ✗ Gelmedi
                  </button>
                  <button
                    onClick={() => handleAttendance(student.id, 'late')}
                    style={{
                      padding: '10px 20px',
                      borderRadius: '8px',
                      border: 'none',
                      cursor: 'pointer',
                      fontWeight: 'bold',
                      background: attendance[student.id] === 'late' ? '#ed8936' : '#e2e8f0',
                      color: attendance[student.id] === 'late' ? 'white' : '#4a5568'
                    }}
                  >
                    ⏰ Geç
                  </button>
                </div>
              </div>
            ))}
            
            <button
              onClick={saveAttendance}
              disabled={loading}
              style={{
                width: '100%',
                marginTop: '20px',
                padding: '15px',
                borderRadius: '10px',
                border: 'none',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                fontSize: '18px',
                fontWeight: 'bold',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.5 : 1
              }}
            >
              {loading ? 'Kaydediliyor...' : '💾 Yoklamayı Kaydet'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Ödev Sayfası - Kontrol Ekranı
  if (currentPage === 'homework' && selectedHomework) {
    const classStudents = students.filter(s => s.class === selectedHomework.class);
    
    return (
      <div style={{ minHeight: '100vh', background: '#f7fafc', padding: '20px' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          <div style={{ background: 'white', padding: '30px', borderRadius: '15px', marginBottom: '30px' }}>
            <button onClick={() => setSelectedHomework(null)} style={{ background: '#e2e8f0', color: '#2d3748', padding: '10px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 'bold', marginBottom: '20px' }}>
              ← Geri
            </button>
            <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '10px' }}>{selectedHomework.class}</h1>
            <p style={{ color: '#718096', fontSize: '16px' }}>{selectedHomework.topic}</p>
            <p style={{ color: '#718096', fontSize: '14px', marginTop: '5px' }}>Teslim: {new Date(selectedHomework.dueDate).toLocaleDateString('tr-TR')}</p>
          </div>

          <div style={{ background: 'white', borderRadius: '15px', padding: '20px' }}>
            {classStudents.map(student => (
              <div key={student.id} style={{ padding: '20px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                  <div style={{ background: '#e2e8f0', width: '50px', height: '50px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                    {student.no}
                  </div>
                  <div style={{ fontWeight: 'bold', fontSize: '18px' }}>{student.name}</div>
                </div>
                
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    onClick={() => handleHomeworkStatus(student.id, 'done')}
                    style={{
                      padding: '10px 20px',
                      borderRadius: '8px',
                      border: 'none',
                      cursor: 'pointer',
                      fontWeight: 'bold',
                      background: homeworkStatus[student.id] === 'done' ? '#48bb78' : '#e2e8f0',
                      color: homeworkStatus[student.id] === 'done' ? 'white' : '#4a5568'
                    }}
                  >
                    ✓ Yaptı
                  </button>
                  <button
                    onClick={() => handleHomeworkStatus(student.id, 'notDone')}
                    style={{
                      padding: '10px 20px',
                      borderRadius: '8px',
                      border: 'none',
                      cursor: 'pointer',
                      fontWeight: 'bold',
                      background: homeworkStatus[student.id] === 'notDone' ? '#f56565' : '#e2e8f0',
                      color: homeworkStatus[student.id] === 'notDone' ? 'white' : '#4a5568'
                    }}
                  >
                    ✗ Yapmadı
                  </button>
                  <button
                    onClick={() => handleHomeworkStatus(student.id, 'absent')}
                    style={{
                      padding: '10px 20px',
                      borderRadius: '8px',
                      border: 'none',
                      cursor: 'pointer',
                      fontWeight: 'bold',
                      background: homeworkStatus[student.id] === 'absent' ? '#a0aec0' : '#e2e8f0',
                      color: homeworkStatus[student.id] === 'absent' ? 'white' : '#4a5568'
                    }}
                  >
                    👤 Gelmedi
                  </button>
                </div>
              </div>
            ))}
            
            <button
              onClick={saveHomeworkCheck}
              disabled={loading}
              style={{
                width: '100%',
                marginTop: '20px',
                padding: '15px',
                borderRadius: '10px',
                border: 'none',
                background: 'linear-gradient(135deg, #9f7aea 0%, #667eea 100%)',
                color: 'white',
                fontSize: '18px',
                fontWeight: 'bold',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.5 : 1
              }}
            >
              {loading ? 'Kaydediliyor...' : '💾 Kaydet ve Velilere Bildir'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Ödev Ana Sayfası
  return (
    <div style={{ minHeight: '100vh', background: '#f7fafc', padding: '20px' }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        <div style={{ background: 'white', padding: '30px', borderRadius: '15px', marginBottom: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 style={{ fontSize: '28px', fontWeight: 'bold' }}>Ödev İşlemleri</h1>
          <button onClick={() => setCurrentPage('home')} style={{ background: '#e2e8f0', color: '#2d3748', padding: '10px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>
            ← Geri
          </button>
        </div>

        {/* Ödev Verme Formu */}
        <div style={{ background: 'white', borderRadius: '15px', padding: '30px', marginBottom: '30px' }}>
          <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '20px' }}>Yeni Ödev Ver</h3>
          
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px', color: '#2d3748' }}>Sınıf</label>
            <select
              value={homeworkForm.class}
              onChange={(e) => setHomeworkForm({...homeworkForm, class: e.target.value})}
              style={{ width: '100%', padding: '12px', border: '2px solid #e2e8f0', borderRadius: '8px', fontSize: '16px' }}
            >
              <option value="">Sınıf seçin...</option>
              <option value="5-A">5-A</option>
              <option value="6-B">6-B</option>
            </select>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px', color: '#2d3748' }}>Ödev Konusu</label>
            <textarea
              value={homeworkForm.topic}
              onChange={(e) => setHomeworkForm({...homeworkForm, topic: e.target.value})}
              style={{ width: '100%', padding: '12px', border: '2px solid #e2e8f0', borderRadius: '8px', fontSize: '16px', minHeight: '80px' }}
              placeholder="Ödev konusunu yazın..."
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px', color: '#2d3748' }}>Teslim Tarihi</label>
            <input
              type="date"
              value={homeworkForm.dueDate}
              onChange={(e) => setHomeworkForm({...homeworkForm, dueDate: e.target.value})}
              style={{ width: '100%', padding: '12px', border: '2px solid #e2e8f0', borderRadius: '8px', fontSize: '16px' }}
            />
          </div>

          <button
            onClick={saveHomework}
            disabled={loading}
            style={{
              width: '100%',
              padding: '15px',
              borderRadius: '10px',
              border: 'none',
              background: 'linear-gradient(135deg, #9f7aea 0%, #667eea 100%)',
              color: 'white',
              fontSize: '18px',
              fontWeight: 'bold',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.5 : 1
            }}
          >
            {loading ? 'Kaydediliyor...' : '📚 Ödevi Ver'}
          </button>
        </div>

        {/* Ödev Listesi */}
        <div style={{ background: 'white', borderRadius: '15px', padding: '30px' }}>
          <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '20px' }}>Verilen Ödevler</h3>
          
          {homeworkList.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#718096' }}>
              <div style={{ fontSize: '48px', marginBottom: '15px' }}>📋</div>
              <p>Henüz ödev verilmemiş</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '15px' }}>
              {homeworkList.map(hw => (
                <div
                  key={hw.id}
                  onClick={() => !hw.checked && setSelectedHomework(hw)}
                  style={{
                    padding: '20px',
                    border: '2px solid #e2e8f0',
                    borderRadius: '12px',
                    cursor: hw.checked ? 'default' : 'pointer',
                    background: hw.checked ? '#f7fafc' : 'white',
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '10px' }}>
                    <div>
                      <div style={{ fontWeight: 'bold', fontSize: '18px', color: '#2d3748', marginBottom: '5px' }}>
                        {hw.class} - {hw.topic}
                      </div>
                      <div style={{ fontSize: '14px', color: '#718096' }}>
                        Teslim: {new Date(hw.dueDate).toLocaleDateString('tr-TR')}
                      </div>
                    </div>
                    <div style={{
                      padding: '8px 16px',
                      borderRadius: '20px',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      background: hw.checked ? '#c6f6d5' : '#feebc8',
                      color: hw.checked ? '#22543d' : '#7c2d12'
                    }}>
                      {hw.checked ? '✓ Kontrol Edildi' : '⏱ Bekliyor'}
                    </div>
                  </div>
                  {!hw.checked && (
                    <div style={{ fontSize: '14px', color: '#9f7aea', fontWeight: '600' }}>
                      → Kontrol etmek için tıklayın
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Veli Paneli
function ParentPanel({ user, onLogout }) {
  const [students, setStudents] = useState([]);
  const [attendanceData, setAttendanceData] = useState([]);
  const [homeworkData, setHomeworkData] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('attendance'); // 'attendance', 'homework', 'notifications'

  React.useEffect(() => {
    const loadData = async () => {
      try {
        // Velinin çocuklarını bul
        const studentsRef = collection(db, 'students');
        const q = query(studentsRef, where('parentId', '==', user.uid));
        const studentsSnapshot = await getDocs(q);
        const studentsList = studentsSnapshot.docs.map(doc => ({ 
          id: doc.id, 
          ...doc.data() 
        }));
        setStudents(studentsList);

        if (studentsList.length > 0) {
          const studentIds = studentsList.map(s => s.id);
          
          // Yoklamaları çek
          const attendanceRef = collection(db, 'attendance');
          const attendanceQuery = query(
            attendanceRef, 
            where('studentId', 'in', studentIds)
          );
          const attendanceSnapshot = await getDocs(attendanceQuery);
          const attendanceList = attendanceSnapshot.docs.map(doc => doc.data());
          attendanceList.sort((a, b) => new Date(b.date) - new Date(a.date));
          setAttendanceData(attendanceList);

          // Ödevleri çek
          const homeworkRef = collection(db, 'homeworkResults');
          const homeworkQuery = query(
            homeworkRef,
            where('studentId', 'in', studentIds)
          );
          const homeworkSnapshot = await getDocs(homeworkQuery);
          const homeworkList = homeworkSnapshot.docs.map(doc => doc.data());
          homeworkList.sort((a, b) => new Date(b.checkedAt) - new Date(a.checkedAt));
          setHomeworkData(homeworkList);

          // Bildirimleri çek
          const notifRef = collection(db, 'notifications');
          const notifQuery = query(
            notifRef,
            where('parentId', '==', user.uid)
          );
          const notifSnapshot = await getDocs(notifQuery);
          const notifList = notifSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          notifList.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
          setNotifications(notifList);
        }
      } catch (error) {
        console.error('Veri yükleme hatası:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [user.uid]);

  const getStatusColor = (status) => {
    if (status === 'present' || status === 'done') return { bg: '#c6f6d5', border: '#48bb78', text: '#22543d' };
    if (status === 'late') return { bg: '#feebc8', border: '#ed8936', text: '#7c2d12' };
    return { bg: '#fed7d7', border: '#f56565', text: '#742a2a' };
  };

  const getStatusText = (status, type = 'attendance') => {
    if (type === 'homework') {
      if (status === 'done') return '✓ Yaptı';
      if (status === 'notDone') return '✗ Yapmadı';
      return '👤 Gelmedi';
    }
    if (status === 'present') return '✓ Geldi';
    if (status === 'late') return '⏰ Geç Geldi';
    return '✗ Gelmedi';
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #e0f2fe 0%, #ddd6fe 100%)' }}>
        <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#667eea' }}>Yükleniyor...</div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #e0f2fe 0%, #ddd6fe 100%)', padding: '20px' }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ background: 'white', padding: '30px', borderRadius: '15px', marginBottom: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: '28px', fontWeight: 'bold' }}>Veli Paneli</h1>
            <p style={{ color: '#718096' }}>{user.name}</p>
            {students.map(student => (
              <p key={student.id} style={{ fontSize: '14px', color: '#667eea', fontWeight: '600' }}>
                {student.name} - {student.class}
              </p>
            ))}
          </div>
          <button onClick={onLogout} style={{ background: '#f56565', color: 'white', padding: '10px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>
            Çıkış
          </button>
        </div>

        {/* Bildirim Kartı */}
        {notifications.filter(n => !n.read).length > 0 && (
          <div style={{ background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)', color: 'white', padding: '20px', borderRadius: '15px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '15px' }}>
            <div style={{ fontSize: '32px' }}>🔔</div>
            <div>
              <div style={{ fontWeight: 'bold', fontSize: '18px' }}>{notifications.filter(n => !n.read).length} Yeni Bildirim</div>
              <div style={{ opacity: 0.9, fontSize: '14px' }}>Bildirimler sekmesine tıklayarak görüntüleyin</div>
            </div>
          </div>
        )}

        {/* Sekmeler */}
        <div style={{ background: 'white', padding: '10px', borderRadius: '15px', marginBottom: '20px', display: 'flex', gap: '10px' }}>
          <button
            onClick={() => setActiveTab('attendance')}
            style={{
              flex: 1,
              padding: '15px',
              borderRadius: '10px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 'bold',
              background: activeTab === 'attendance' ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : '#f7fafc',
              color: activeTab === 'attendance' ? 'white' : '#4a5568'
            }}
          >
            📊 Yoklama
          </button>
          <button
            onClick={() => setActiveTab('homework')}
            style={{
              flex: 1,
              padding: '15px',
              borderRadius: '10px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 'bold',
              background: activeTab === 'homework' ? 'linear-gradient(135deg, #9f7aea 0%, #667eea 100%)' : '#f7fafc',
              color: activeTab === 'homework' ? 'white' : '#4a5568'
            }}
          >
            📚 Ödevler
          </button>
          <button
            onClick={() => setActiveTab('notifications')}
            style={{
              flex: 1,
              padding: '15px',
              borderRadius: '10px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 'bold',
              background: activeTab === 'notifications' ? 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)' : '#f7fafc',
              color: activeTab === 'notifications' ? 'white' : '#4a5568',
              position: 'relative'
            }}
          >
            🔔 Bildirimler
            {notifications.filter(n => !n.read).length > 0 && (
              <span style={{
                position: 'absolute',
                top: '5px',
                right: '5px',
                background: '#ef4444',
                color: 'white',
                width: '20px',
                height: '20px',
                borderRadius: '50%',
                fontSize: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 'bold'
              }}>
                {notifications.filter(n => !n.read).length}
              </span>
            )}
          </button>
        </div>

        {/* Yoklama Sekmesi */}
        {activeTab === 'attendance' && (
          <div>
            {attendanceData.length === 0 ? (
              <div style={{ background: 'white', padding: '60px', borderRadius: '15px', textAlign: 'center' }}>
                <div style={{ fontSize: '48px', marginBottom: '20px' }}>📋</div>
                <h3 style={{ fontSize: '20px', fontWeight: 'bold', color: '#4a5568', marginBottom: '10px' }}>
                  Henüz Yoklama Kaydı Yok
                </h3>
                <p style={{ color: '#718096' }}>Öğretmen yoklama aldığında burada görünecek</p>
              </div>
            ) : (
              <div style={{ background: 'white', borderRadius: '15px', padding: '20px' }}>
                <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '20px', color: '#2d3748' }}>
                  Yoklama Geçmişi
                </h3>
                {attendanceData.map((record, index) => {
                  const colors = getStatusColor(record.status);
                  return (
                    <div 
                      key={index}
                      style={{
                        padding: '20px',
                        marginBottom: '15px',
                        borderRadius: '12px',
                        background: colors.bg,
                        border: `2px solid ${colors.border}`
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                        <div>
                          <div style={{ fontWeight: 'bold', fontSize: '18px', color: colors.text }}>
                            {record.studentName}
                          </div>
                          <div style={{ fontSize: '14px', color: '#718096', marginTop: '5px' }}>
                            {record.class} • {new Date(record.date).toLocaleDateString('tr-TR', { 
                              day: 'numeric', 
                              month: 'long', 
                              year: 'numeric' 
                            })}
                          </div>
                        </div>
                        <div style={{
                          padding: '10px 20px',
                          borderRadius: '8px',
                          background: 'white',
                          fontWeight: 'bold',
                          fontSize: '16px',
                          color: colors.text
                        }}>
                          {getStatusText(record.status)}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Ödev Sekmesi */}
        {activeTab === 'homework' && (
          <div>
            {homeworkData.length === 0 ? (
              <div style={{ background: 'white', padding: '60px', borderRadius: '15px', textAlign: 'center' }}>
                <div style={{ fontSize: '48px', marginBottom: '20px' }}>📚</div>
                <h3 style={{ fontSize: '20px', fontWeight: 'bold', color: '#4a5568', marginBottom: '10px' }}>
                  Henüz Ödev Kaydı Yok
                </h3>
                <p style={{ color: '#718096' }}>Öğretmen ödev kontrolü yaptığında burada görünecek</p>
              </div>
            ) : (
              <div style={{ background: 'white', borderRadius: '15px', padding: '20px' }}>
                <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '20px', color: '#2d3748' }}>
                  Ödev Durumları
                </h3>
                {homeworkData.map((record, index) => {
                  const colors = getStatusColor(record.status);
                  return (
                    <div 
                      key={index}
                      style={{
                        padding: '20px',
                        marginBottom: '15px',
                        borderRadius: '12px',
                        background: colors.bg,
                        border: `2px solid ${colors.border}`
                      }}
                    >
                      <div style={{ marginBottom: '10px' }}>
                        <div style={{ fontWeight: 'bold', fontSize: '18px', color: colors.text, marginBottom: '8px' }}>
                          {record.studentName} - {record.class}
                        </div>
                        <div style={{ fontSize: '16px', color: '#2d3748', marginBottom: '5px' }}>
                          📝 {record.topic}
                        </div>
                        <div style={{ fontSize: '14px', color: '#718096' }}>
                          Kontrol: {new Date(record.checkedAt).toLocaleDateString('tr-TR', { 
                            day: 'numeric', 
                            month: 'long', 
                            year: 'numeric' 
                          })}
                        </div>
                      </div>
                      <div style={{
                        padding: '10px 20px',
                        borderRadius: '8px',
                        background: 'white',
                        fontWeight: 'bold',
                        fontSize: '16px',
                        color: colors.text,
                        display: 'inline-block'
                      }}>
                        {getStatusText(record.status, 'homework')}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Bildirimler Sekmesi */}
        {activeTab === 'notifications' && (
          <div>
            {notifications.length === 0 ? (
              <div style={{ background: 'white', padding: '60px', borderRadius: '15px', textAlign: 'center' }}>
                <div style={{ fontSize: '48px', marginBottom: '20px' }}>🔔</div>
                <h3 style={{ fontSize: '20px', fontWeight: 'bold', color: '#4a5568', marginBottom: '10px' }}>
                  Henüz Bildirim Yok
                </h3>
                <p style={{ color: '#718096' }}>Yeni bildirimler burada görünecek</p>
              </div>
            ) : (
              <div style={{ background: 'white', borderRadius: '15px', padding: '20px' }}>
                <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '20px', color: '#2d3748' }}>
                  Bildirimler
                </h3>
                {notifications.map((notif) => (
                  <div 
                    key={notif.id}
                    style={{
                      padding: '20px',
                      marginBottom: '15px',
                      borderRadius: '12px',
                      background: notif.read ? '#f7fafc' : '#fef3c7',
                      border: `2px solid ${notif.read ? '#e2e8f0' : '#fbbf24'}`
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'start', gap: '15px' }}>
                      <div style={{ fontSize: '32px' }}>
                        {notif.type === 'attendance' ? '📊' : '📚'}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 'bold', fontSize: '16px', color: '#2d3748', marginBottom: '5px' }}>
                          {notif.studentName}
                        </div>
                        <div style={{ fontSize: '15px', color: '#4a5568', marginBottom: '8px' }}>
                          {notif.message}
                        </div>
                        <div style={{ fontSize: '13px', color: '#718096' }}>
                          {new Date(notif.createdAt).toLocaleDateString('tr-TR', { 
                            day: 'numeric', 
                            month: 'long',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </div>
                      {!notif.read && (
                        <div style={{
                          width: '12px',
                          height: '12px',
                          borderRadius: '50%',
                          background: '#ef4444'
                        }} />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Ana Uygulama
export default function App() {
  const [currentUser, setCurrentUser] = useState(null);

  const handleLogout = async () => {
    await signOut(auth);
    setCurrentUser(null);
  };

  if (!currentUser) {
    return <LoginScreen onLogin={setCurrentUser} />;
  }

  if (currentUser.role === 'school_admin') {
    return <AdminPanel user={currentUser} onLogout={handleLogout} />;
  }
  if (currentUser.role === 'teacher') {
    return <TeacherPanel user={currentUser} onLogout={handleLogout} />;
  }
  if (currentUser.role === 'parent') {
    return <ParentPanel user={currentUser} onLogout={handleLogout} />;
  }

  return <LoginScreen onLogin={setCurrentUser} />;
}