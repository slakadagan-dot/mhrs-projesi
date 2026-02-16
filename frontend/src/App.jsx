import { useState, useEffect } from 'react'
import axios from 'axios'

function App() {
  const [isLoginView, setIsLoginView] = useState(true)
  const [token, setToken] = useState(null)
  const [user, setUser] = useState(null) // Giriş yapan kullanıcının tüm bilgilerini tutacağız
  const [appointments, setAppointments] = useState([])
  const [doctors, setDoctors] = useState([])
  const [showAppointmentForm, setShowAppointmentForm] = useState(false)

  const [loginData, setLoginData] = useState({ tc_no: '', password: '' })
  const [registerData, setRegisterData] = useState({ tc_no: '', name: '', password: '', is_doctor: false })

  const [newAppointment, setNewAppointment] = useState({
    doctor_id: '',
    appointment_date: ''
  })

  useEffect(() => {
    if (token) {
      fetchAppointments()
      fetchDoctors()
    }
  }, [token])

  const fetchAppointments = () => {
    axios.get('http://localhost:8000/appointments/')
      .then(response => setAppointments(response.data))
      .catch(err => console.error("Randevular yüklenemedi", err))
  }

  const fetchDoctors = () => {
    axios.get('http://localhost:8000/users/')
      .then(response => {
        setDoctors(response.data.filter(u => u.is_doctor === true))
      })
      .catch(err => console.error("Doktorlar listelenemedi", err))
  }

  const handleLoginChange = (e) => setLoginData({ ...loginData, [e.target.name]: e.target.value })
  const handleRegisterChange = (e) => setRegisterData({ ...registerData, [e.target.name]: e.target.value })
  const handleCheckboxChange = (e) => setRegisterData({ ...registerData, is_doctor: e.target.checked })

  // --- GİRİŞ YAPILDIĞINDA BİLGİLERİ HAFIZAYA AL ---
  const handleLogin = (e) => {
    e.preventDefault()
    axios.post('http://localhost:8000/login/', loginData)
      .then(response => {
        setToken(response.data.access_token)
        // Backend'den gelen temiz verileri kaydediyoruz
        setUser({
          id: response.data.user_id,
          name: response.data.name,
          is_doctor: response.data.is_doctor
        })
        setLoginData({ tc_no: '', password: '' })
      })
      .catch(err => alert("Giriş Başarısız: TC No veya Şifre Hatalı!"))
  }

  const handleRegister = (e) => {
    e.preventDefault()
    axios.post('http://localhost:8000/users/', registerData)
      .then(() => {
        alert("Kayıt Başarılı! Hoş geldiniz.")
        setRegisterData({ tc_no: '', name: '', password: '', is_doctor: false })
        setIsLoginView(true)
      })
      .catch(err => alert("Kayıt Hatası!"))
  }

  // --- RANDEVUYU OLUŞTURURKEN SENİN ID'Nİ GÖNDERİYORUZ ---
  const handleCreateAppointment = (e) => {
    e.preventDefault()

    // Randevuyu alan kişinin (senin) ID'ni ekliyoruz
    const finalAppointmentData = {
      patient_id: user.id, // SİHİRLİ DOKUNUŞ BURASI!
      doctor_id: newAppointment.doctor_id,
      appointment_date: newAppointment.appointment_date
    }

    axios.post('http://localhost:8000/appointments/', finalAppointmentData)
      .then(() => {
        alert("✅ Randevu Başarıyla Alındı!")
        setShowAppointmentForm(false)
        fetchAppointments()
      })
      .catch(err => alert("❌ Randevu alınamadı! (Tarih formatı veya eksik bilgi olabilir)"))
  }

  const handleCancelAppointment = (id) => {
    if (window.confirm("Bu randevuyu iptal etmek istediğinize emin misiniz?")) {
      axios.delete(`http://localhost:8000/appointments/${id}`)
        .then(() => {
          alert("Randevu başarıyla iptal edildi!")
          fetchAppointments()
        })
        .catch(err => alert("İptal Hatası!"))
    }
  }

  const handleLogout = () => {
    setToken(null)
    setUser(null)
    setAppointments([])
    setDoctors([])
    setShowAppointmentForm(false)
  }

  // --- DASHBOARD (GİRİŞ YAPILDIKTAN SONRA) ---
  if (token) {
    return (
      <div style={styles.body}>
        <div style={styles.dashboardCard}>
          <div style={styles.dashHeader}>
            <div>
              <h1 style={styles.title}>🏥 MHRS Portal</h1>
              {/* İsmini backend'den aldığımız güvenilir veriden çekiyoruz */}
              <p style={{ margin: 0, color: '#2ecc71', fontWeight: 'bold' }}>Hoş geldin, {user?.name || 'Kullanıcı'} 👋</p>
            </div>
            <button onClick={handleLogout} style={styles.logoutBtnSmall}>Güvenli Çıkış</button>
          </div>

          {!showAppointmentForm ? (
            <div style={styles.appointmentList}>
              {/* Rolüne göre başlık */}
              <h3 style={{ color: '#2c3e50', marginBottom: '15px' }}>
                {user?.is_doctor ? "🩺 Size Alınan Randevular" : "📅 Aktif Randevularınız"}
              </h3>

              {appointments.length > 0 ? (
                appointments.map((apt) => (
                  <div key={apt.id} style={styles.appointmentItem}>
                    <div>
                      <strong style={{ display: 'block' }}>Randevu #{apt.id}</strong>
                      <small style={{ color: '#7f8c8d' }}>Tarih: {apt.appointment_date}</small>
                    </div>
                    {/* Doktorlar randevu iptal edemez, hastalar eder */}
                    {!user?.is_doctor && (
                      <button onClick={() => handleCancelAppointment(apt.id)} style={styles.cancelBtn}>İptal Et</button>
                    )}
                  </div>
                ))
              ) : (
                <div style={{ textAlign: 'center', padding: '20px', backgroundColor: '#fdfefe', borderRadius: '15px' }}>
                  <p style={{ color: '#95a5a6', margin: 0 }}>Kayıtlı randevu bulunamadı.</p>
                </div>
              )}

              {/* Doktorlar randevu alamaz, sadece hastalar alır */}
              {!user?.is_doctor && (
                <div style={{ textAlign: 'center', marginTop: '30px' }}>
                  <button onClick={() => setShowAppointmentForm(true)} style={styles.fancyBtn}>+ Yeni Randevu Oluştur</button>
                </div>
              )}
            </div>
          ) : (
            <div style={styles.formContainer}>
              <h3 style={{ color: '#2c3e50', marginBottom: '20px' }}>Randevu Detayları</h3>
              <form onSubmit={handleCreateAppointment} style={styles.form}>
                <label style={styles.label}>Doktor Seçiniz</label>
                <select
                  style={styles.fancyInput}
                  onChange={e => setNewAppointment({ ...newAppointment, doctor_id: e.target.value })}
                  required
                >
                  <option value="">Lütfen bir doktor seçin...</option>
                  {doctors.map(doc => (
                    <option key={doc.id} value={doc.id}>🩺 {doc.name}</option>
                  ))}
                </select>
                <label style={styles.label}>Randevu Tarihi</label>
                <input type="datetime-local" style={styles.fancyInput}
                  onChange={e => setNewAppointment({ ...newAppointment, appointment_date: e.target.value })} required />
                <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                  <button type="submit" style={styles.fancyBtn}>Randevuyu Onayla</button>
                  <button type="button" onClick={() => setShowAppointmentForm(false)} style={styles.cancelBtnLarge}>Vazgeç</button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    )
  }

  // --- GİRİŞ / KAYIT EKRANI ---
  return (
    <div style={styles.body}>
      <div style={styles.glassCard}>
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <div style={styles.iconCircle}>🩺</div>
          <h1 style={styles.title}>T.C. Sağlık Bakanlığı</h1>
          <p style={styles.subtitle}>Merkezi Hekim Randevu Sistemi</p>
        </div>

        <div style={styles.tabWrapper}>
          <button style={isLoginView ? styles.activeTab : styles.inactiveTab} onClick={() => setIsLoginView(true)}>Giriş Yap</button>
          <button style={!isLoginView ? styles.activeTab : styles.inactiveTab} onClick={() => setIsLoginView(false)}>Kayıt Ol</button>
        </div>

        {isLoginView ? (
          <form onSubmit={handleLogin} style={styles.form}>
            <div style={styles.inputGroup}>
              <span style={styles.inputIcon}>👤</span>
              <input type="text" name="tc_no" placeholder="T.C. Kimlik No" value={loginData.tc_no} onChange={handleLoginChange} style={styles.fancyInputWithIcon} required />
            </div>
            <div style={styles.inputGroup}>
              <span style={styles.inputIcon}>🔒</span>
              <input type="password" name="password" placeholder="Şifre" value={loginData.password} onChange={handleLoginChange} style={styles.fancyInputWithIcon} required />
            </div>
            <button type="submit" style={styles.fancyBtn}>Sisteme Giriş</button>
          </form>
        ) : (
          <form onSubmit={handleRegister} style={styles.form}>
            <input type="text" name="tc_no" placeholder="T.C. Kimlik No" value={registerData.tc_no} onChange={handleRegisterChange} style={styles.fancyInput} required />
            <input type="text" name="name" placeholder="Ad Soyad" value={registerData.name} onChange={handleRegisterChange} style={styles.fancyInput} required />
            <input type="password" name="password" placeholder="Şifre" value={registerData.password} onChange={handleRegisterChange} style={styles.fancyInput} required />
            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', color: '#455a64', cursor: 'pointer' }}>
              <input type="checkbox" checked={registerData.is_doctor} onChange={handleCheckboxChange} />
              <span>Doktor Hesabı Oluştur</span>
            </label>
            <button type="submit" style={styles.fancyBtnRegister}>Hesap Oluştur</button>
          </form>
        )}
      </div>
    </div>
  )
}

const styles = {
  body: { margin: 0, padding: 0, width: '100vw', minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: 'linear-gradient(135deg, #00d2ff 0%, #3a7bd5 100%)', fontFamily: "'Inter', sans-serif", overflowX: 'hidden' },
  glassCard: { background: 'white', padding: '50px', borderRadius: '30px', boxShadow: '0 20px 40px rgba(0,0,0,0.15)', width: '90%', maxWidth: '440px' },
  dashboardCard: { background: 'white', padding: '40px', borderRadius: '30px', boxShadow: '0 20px 40px rgba(0,0,0,0.2)', width: '95%', maxWidth: '550px' },
  dashHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', borderBottom: '2px solid #eee', paddingBottom: '15px' },
  title: { fontSize: '24px', fontWeight: '800', color: '#1a2a3a', margin: 0 },
  subtitle: { fontSize: '14px', color: '#546e7a', marginTop: '8px' },
  form: { display: 'flex', flexDirection: 'column', gap: '18px' },
  label: { fontSize: '14px', fontWeight: 'bold', color: '#546e7a' },
  inputGroup: { position: 'relative', display: 'flex', alignItems: 'center' },
  inputIcon: { position: 'absolute', left: '15px', fontSize: '18px', color: '#b0bec5', pointerEvents: 'none' },
  fancyInput: { width: '100%', padding: '15px', borderRadius: '12px', border: '2px solid #edf2f7', outline: 'none', fontSize: '14px', boxSizing: 'border-box' },
  fancyInputWithIcon: { width: '100%', padding: '15px 15px 15px 45px', borderRadius: '12px', border: '2px solid #edf2f7', outline: 'none', fontSize: '14px', boxSizing: 'border-box' },
  fancyBtn: { width: '100%', padding: '15px', borderRadius: '12px', border: 'none', background: 'linear-gradient(to right, #3a7bd5, #00d2ff)', color: 'white', fontWeight: '700', cursor: 'pointer', fontSize: '16px' },
  cancelBtn: { padding: '8px 12px', backgroundColor: '#ffebee', color: '#ef5350', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' },
  cancelBtnLarge: { flex: 1, padding: '15px', borderRadius: '12px', border: '2px solid #ccc', background: 'white', color: '#666', fontWeight: '700', cursor: 'pointer' },
  fancyBtnRegister: { padding: '15px', borderRadius: '12px', border: 'none', background: '#263238', color: 'white', fontWeight: '700', cursor: 'pointer', fontSize: '16px' },
  appointmentItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '12px', borderLeft: '5px solid #3a7bd5', marginBottom: '10px' },
  logoutBtnSmall: { padding: '8px 15px', borderRadius: '10px', border: '1px solid #ef5350', color: '#ef5350', background: 'transparent', cursor: 'pointer', fontWeight: 'bold' },
  tabWrapper: { display: 'flex', gap: '5px', marginBottom: '30px', backgroundColor: '#f5f7f9', padding: '6px', borderRadius: '15px' },
  activeTab: { flex: 1, padding: '12px', borderRadius: '10px', border: 'none', background: 'white', color: '#3a7bd5', fontWeight: '700', boxShadow: '0 4px 10px rgba(0,0,0,0.05)', cursor: 'pointer' },
  inactiveTab: { flex: 1, padding: '12px', borderRadius: '10px', border: 'none', background: 'transparent', color: '#90a4ae', cursor: 'pointer' },
  iconCircle: { width: '70px', height: '70px', background: '#e3f2fd', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', margin: '0 auto 15px', fontSize: '35px' }
}

export default App