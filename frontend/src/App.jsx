import { useState, useEffect } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function App() {
  const API_URL = `http://${window.location.hostname}:8005`;

  const [isLoginMode, setIsLoginMode] = useState(true);
  const [loggedInUser, setLoggedInUser] = useState(null);

  const [showAppointmentForm, setShowAppointmentForm] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  const [myAppointments, setMyAppointments] = useState([]);
  const [doctorPatients, setDoctorPatients] = useState([]);

  const [sysData, setSysData] = useState(null);

  const [loginTc, setLoginTc] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [regTc, setRegTc] = useState('');
  const [regName, setRegName] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regGender, setRegGender] = useState('Kadın');
  const [regBirthDate, setRegBirthDate] = useState('');
  const [isDoctorRegister, setIsDoctorRegister] = useState(false);

  const [selProvince, setSelProvince] = useState('');
  const [selDistrict, setSelDistrict] = useState('');
  const [selClinic, setSelClinic] = useState('');
  const [selDoctor, setSelDoctor] = useState('');
  const [appDate, setAppDate] = useState('');
  const [appTime, setAppTime] = useState('');

  const resetAppointmentForm = () => {
    setSelProvince('');
    setSelDistrict('');
    setSelClinic('');
    setSelDoctor('');
    setAppDate('');
    setAppTime('');
  };

  const getTodayString = () => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  useEffect(() => {
    fetch(`${API_URL}/system-data/`)
      .then(res => res.json())
      .then(data => setSysData(data))
      .catch(err => console.error("Sistem verileri çekilemedi", err));
  }, []);

  const fetchAppointmentsFromDB = async (userId) => {
    try {
      const response = await fetch(`${API_URL}/appointments/${userId}`);
      const data = await response.json();
      if (response.ok) {
        const formattedData = data.map(appt => ({
          id: appt.id, date: appt.appointment_date, time: appt.appointment_time,
          clinic: appt.clinic, doctor: appt.doctor_name
        }));
        setMyAppointments(formattedData);
      }
    } catch (error) { toast.error("Randevular yüklenemedi!"); }
  };

  const fetchDoctorPatients = async (doctorName) => {
    try {
      const response = await fetch(`${API_URL}/doctor-appointments/Dr. ${doctorName}`);
      const data = await response.json();
      if (response.ok) {
        setDoctorPatients(data);
      }
    } catch (error) { toast.error("Hasta listesi yüklenemedi!"); }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_URL}/login/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tc_no: loginTc, password: loginPassword })
      });
      const data = await response.json();
      if (response.ok) {
        setLoggedInUser(data);
        toast.success("Giriş Başarılı! Hoş geldiniz.");
        if (data.is_doctor) {
          fetchDoctorPatients(data.name);
        } else {
          fetchAppointmentsFromDB(data.user_id);
        }
      } else {
        toast.error(data.detail);
      }
    } catch (error) { toast.error("Sunucuya bağlanılamadı!"); }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_URL}/users/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tc_no: regTc, name: regName, password: regPassword, is_doctor: isDoctorRegister, gender: regGender, birth_date: regBirthDate, department: isDoctorRegister ? "Genel" : null })
      });
      const data = await response.json();
      if (response.ok) {
        toast.success("Kayıt Başarılı! Giriş yapabilirsiniz.");
        setIsLoginMode(true);
      } else {
        toast.error(data.detail);
      }
    } catch (error) { toast.error("Sunucu hatası!"); }
  };

  const handleSaveAppointment = async () => {
    if (!selProvince || !selDistrict || !selClinic || !selDoctor || !appDate || !appTime) {
      toast.warning("Lütfen tüm alanları doldurun!");
      return;
    }

    const selectedDateTime = new Date(`${appDate}T${appTime}`);
    const now = new Date();
    if (selectedDateTime < now) {
      toast.error("Geçmiş bir tarih veya saate randevu alamazsınız!");
      return;
    }

    try {
      const response = await fetch(`${API_URL}/appointments/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patient_id: loggedInUser.user_id, doctor_id: 1, appointment_date: appDate, appointment_time: appTime, clinic: selClinic, doctor_name: selDoctor })
      });
      const data = await response.json();
      if (response.ok) {
        toast.success("Randevu başarıyla alındı!");
        fetchAppointmentsFromDB(loggedInUser.user_id);
        setShowAppointmentForm(false);
        resetAppointmentForm();
      } else {
        toast.error(data.detail || "Randevu alınamadı!");
      }
    } catch (err) { toast.error("Sunucu hatası!"); }
  };

  const handleCancelAppointment = async (id) => {
    if (!window.confirm("Bu randevuyu iptal etmek istediğinize emin misiniz?")) return;
    try {
      const response = await fetch(`${API_URL}/appointments/${id}`, { method: 'DELETE' });
      if (response.ok) {
        toast.info("Randevu iptal edildi.");
        setMyAppointments(myAppointments.filter(appt => appt.id !== id));
        if (loggedInUser.is_doctor) fetchDoctorPatients(loggedInUser.name);
      } else { toast.error("İptal işlemi başarısız."); }
    } catch (error) { toast.error("Sunucu hatası!"); }
  };

  const handleLogout = () => {
    setLoggedInUser(null); setLoginTc(''); setLoginPassword(''); setShowAppointmentForm(false); setShowProfile(false); setMyAppointments([]); setDoctorPatients([]);
    resetAppointmentForm();
    toast.info("Çıkış yapıldı.");
  };

  const isPast = (dateStr, timeStr) => {
    const today = new Date();
    const apptDate = new Date(dateStr + 'T' + timeStr);
    return apptDate < today;
  };

  const styles = {
    container: { display: 'flex', flexDirection: 'column', alignItems: 'center', backgroundColor: '#f0f2f5', minHeight: '100vh', fontFamily: '"Segoe UI", Roboto, Helvetica, Arial, sans-serif' },
    loginCard: { backgroundColor: 'white', padding: '40px', borderRadius: '12px', boxShadow: '0 8px 24px rgba(0,0,0,0.12)', width: '100%', maxWidth: '420px', textAlign: 'center', marginTop: '50px' },
    logoCircle: { backgroundColor: '#e30a17', color: 'white', borderRadius: '50%', width: '70px', height: '70px', display: 'flex', justifyContent: 'center', alignItems: 'center', margin: '0 auto 15px', fontSize: '28px', fontWeight: 'bold' },
    title: { color: '#333', marginBottom: '5px', fontSize: '22px', fontWeight: '600' },
    subtitle: { color: '#666', fontSize: '15px', marginBottom: '25px' },
    tabs: { display: 'flex', justifyContent: 'space-between', marginBottom: '25px', backgroundColor: '#f0f0f0', borderRadius: '10px', padding: '4px' },
    tabButton: (isActive) => ({ flex: 1, padding: '12px', cursor: 'pointer', fontWeight: '600', border: 'none', borderRadius: '8px', backgroundColor: isActive ? 'white' : 'transparent', color: isActive ? '#e30a17' : '#555' }),
    input: { width: '100%', padding: '14px', margin: '10px 0', border: '2px solid #eee', borderRadius: '10px', boxSizing: 'border-box', fontSize: '15px' },
    mainButton: { width: '100%', padding: '16px', backgroundColor: '#e30a17', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold', fontSize: '17px', marginTop: '20px' },
    dashboardContainer: { width: '100%', backgroundColor: '#f4f7f6', minHeight: '100vh' },
    dashboardHeader: { backgroundColor: '#e30a17', color: 'white', padding: '20px 0', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' },
    headerContent: { maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 20px' },
    headerTitle: { fontSize: '24px', fontWeight: 'bold' },
    userInfo: { display: 'flex', alignItems: 'center', gap: '15px', position: 'relative' },
    userNameBtn: { background: 'none', border: 'none', color: 'white', fontSize: '16px', cursor: 'pointer', fontWeight: 'bold' },
    logoutButton: { backgroundColor: 'rgba(255,255,255,0.2)', color: 'white', border: '1px solid rgba(255,255,255,0.4)', padding: '8px 15px', borderRadius: '6px', cursor: 'pointer' },
    profileDropdown: { position: 'absolute', top: '50px', right: '110px', backgroundColor: 'white', color: '#333', padding: '20px', borderRadius: '10px', boxShadow: '0 8px 24px rgba(0,0,0,0.15)', zIndex: 1000, minWidth: '220px' },
    profileItem: { marginBottom: '10px', fontSize: '14px', borderBottom: '1px solid #eee', paddingBottom: '8px' },
    mainContent: { maxWidth: '1200px', margin: '30px auto', padding: '0 20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '25px' },
    card: { backgroundColor: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', borderLeft: '5px solid #e30a17' },
    cardTitle: { fontSize: '20px', fontWeight: '600', color: '#333' },
    actionButton: { width: '100%', padding: '15px', backgroundColor: '#e30a17', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' },
    appFormContainer: { backgroundColor: 'white', padding: '30px', borderRadius: '12px', gridColumn: '1 / -1', borderTop: '5px solid #e30a17' },
    formGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginTop: '20px' },
    cancelButton: { backgroundColor: '#ff4d4d', color: 'white', border: 'none', padding: '8px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', transition: '0.2s', fontSize: '12px' },
    doctorBadge: { backgroundColor: '#28a745', color: 'white', padding: '2px 6px', borderRadius: '4px', fontSize: '12px', marginLeft: '5px' }
  };

  const provincesList = sysData?.provinces || [];
  const districtsList = sysData?.districts || {};
  const clinicsList = sysData?.clinics || [];
  const doctorsList = sysData?.doctors || {};
  const timeSlots = sysData?.timeSlots || [];

  if (loggedInUser) {
    if (loggedInUser.is_doctor) {
      return (
        <div style={styles.dashboardContainer}>
          <ToastContainer position="top-right" autoClose={3000} />
          <header style={{ ...styles.dashboardHeader, backgroundColor: '#2c3e50' }}>
            <div style={styles.headerContent}>
              <div style={styles.headerTitle}>🩺 MHRS | Doktor Paneli</div>
              <div style={styles.userInfo}>
                <button style={styles.userNameBtn} onClick={() => setShowProfile(!showProfile)}>Dr. {loggedInUser.name} ▼</button>
                <button onClick={handleLogout} style={styles.logoutButton}>Çıkış Yap</button>
                {showProfile && (
                  <div style={styles.profileDropdown}>
                    <h4 style={{ color: '#2c3e50', marginBottom: '10px' }}>Doktor Bilgileri</h4>
                    <div style={styles.profileItem}><strong>T.C.:</strong> {loggedInUser.tc_no}</div>
                    <div style={styles.profileItem}><strong>Ad:</strong> {loggedInUser.name}</div>
                    <div style={styles.profileItem}><strong>Cinsiyet:</strong> {loggedInUser.gender || 'Belirtilmedi'}</div>
                    <div style={{ ...styles.profileItem, borderBottom: 'none' }}><strong>Doğum:</strong> {loggedInUser.birth_date || 'Belirtilmedi'}</div>
                  </div>
                )}
              </div>
            </div>
          </header>
          <main style={styles.mainContent}>
            <div style={{ ...styles.card, borderLeft: '5px solid #2c3e50', gridColumn: '1 / -1' }}>
              <h3 style={styles.cardTitle}>📋 Hasta Randevu Listesi</h3>
              <div style={{ padding: '15px', backgroundColor: '#f9f9f9', borderRadius: '8px' }}>
                {doctorPatients.length === 0 ? <p style={{ color: '#888' }}>Henüz kayıtlı hasta randevunuz yok.</p> :
                  doctorPatients.map(patient => (
                    <div key={patient.id} style={{ borderBottom: '1px solid #ddd', padding: '15px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <strong style={{ color: '#2c3e50', fontSize: '18px' }}>📅 {patient.date} - ⏰ {patient.time}</strong>
                        <div style={{ marginTop: '5px', color: '#333', fontWeight: 'bold' }}>👤 Hasta: {patient.patient_name}</div>
                        <div style={{ color: '#555', fontSize: '14px' }}>T.C.: {patient.patient_tc}</div>
                      </div>
                    </div>
                  ))
                }
              </div>
            </div>
          </main>
        </div>
      );
    }

    const upcoming = myAppointments.filter(a => !isPast(a.date, a.time));
    const past = myAppointments.filter(a => isPast(a.date, a.time));

    return (
      <div style={styles.dashboardContainer}>
        <ToastContainer position="top-right" autoClose={3000} />
        <header style={styles.dashboardHeader}>
          <div style={styles.headerContent}>
            <div style={styles.headerTitle}>🏥 MHRS | Randevu Sistemi</div>
            <div style={styles.userInfo}>
              <button style={styles.userNameBtn} onClick={() => setShowProfile(!showProfile)}>👤 {loggedInUser.name} ▼</button>
              <button onClick={handleLogout} style={styles.logoutButton}>Çıkış Yap</button>
              {showProfile && (
                <div style={styles.profileDropdown}>
                  <h4 style={{ color: '#e30a17', marginBottom: '10px' }}>Kullanıcı Bilgileri</h4>
                  <div style={styles.profileItem}><strong>T.C.:</strong> {loggedInUser.tc_no}</div>
                  <div style={styles.profileItem}><strong>Ad:</strong> {loggedInUser.name}</div>
                  <div style={styles.profileItem}><strong>Cinsiyet:</strong> {loggedInUser.gender || 'Belirtilmedi'}</div>
                  <div style={{ ...styles.profileItem, borderBottom: 'none' }}><strong>Doğum:</strong> {loggedInUser.birth_date || 'Belirtilmedi'}</div>
                </div>
              )}
            </div>
          </div>
        </header>

        <main style={styles.mainContent}>
          {showAppointmentForm ? (
            <div style={styles.appFormContainer}>
              <h3 style={styles.cardTitle}>📅 Yeni Randevu Al</h3>
              <div style={styles.formGrid}>
                <select style={styles.input} value={selProvince} onChange={(e) => setSelProvince(e.target.value)}><option value="">İl Seçin...</option>{provincesList.map(p => <option key={p} value={p}>{p}</option>)}</select>
                <select style={styles.input} value={selDistrict} onChange={(e) => setSelDistrict(e.target.value)} disabled={!selProvince}><option value="">İlçe Seçin...</option>{selProvince && districtsList[selProvince]?.map(d => <option key={d} value={d}>{d}</option>)}</select>
                <select style={styles.input} value={selClinic} onChange={(e) => setSelClinic(e.target.value)} disabled={!selDistrict}><option value="">Klinik Seçin...</option>{clinicsList.map(c => <option key={c} value={c}>{c}</option>)}</select>
                <select style={styles.input} value={selDoctor} onChange={(e) => setSelDoctor(e.target.value)} disabled={!selClinic}><option value="">Doktor Seçin...</option>{selClinic && doctorsList[selClinic]?.map(doc => <option key={doc} value={doc}>{doc}</option>)}</select>

                <input style={styles.input} type="date" min={getTodayString()} value={appDate} onChange={(e) => setAppDate(e.target.value)} />

                <select style={styles.input} value={appTime} onChange={(e) => setAppTime(e.target.value)}><option value="">Saat Seçin...</option>{timeSlots.map(t => <option key={t} value={t}>{t}</option>)}</select>
              </div>
              <button style={styles.actionButton} onClick={handleSaveAppointment}>Randevuyu Kaydet</button>
              <button onClick={() => { setShowAppointmentForm(false); resetAppointmentForm(); }} style={{ ...styles.actionButton, backgroundColor: '#555', marginTop: '10px' }}>İptal</button>
            </div>
          ) : (
            <>
              <div style={styles.card}>
                <h3 style={styles.cardTitle}>📅 Randevu İşlemleri</h3>
                <button style={styles.actionButton} onClick={() => { resetAppointmentForm(); setShowAppointmentForm(true); }}>Randevu Al</button>
              </div>

              <div style={styles.card}>
                <h3 style={styles.cardTitle}>🕒 Aktif Randevularım</h3>
                <div style={{ padding: '15px', backgroundColor: '#f9f9f9', borderRadius: '8px' }}>
                  {upcoming.length === 0 ? <p style={{ color: '#888' }}>Aktif randevunuz yok.</p> :
                    upcoming.map(appt => (
                      <div key={appt.id} style={{ borderBottom: '1px solid #ddd', padding: '15px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <strong style={{ color: '#e30a17', fontSize: '18px' }}>📅 {appt.date} - ⏰ {appt.time}</strong>
                          <div style={{ marginTop: '5px', color: '#333' }}>🏥 {appt.clinic}</div>
                          <div style={{ color: '#555', fontSize: '14px' }}>🩺 {appt.doctor}</div>
                        </div>
                        <button style={styles.cancelButton} onClick={() => handleCancelAppointment(appt.id)}>İptal Et</button>
                      </div>
                    ))
                  }
                </div>
              </div>

              {past.length > 0 && (
                <div style={{ ...styles.card, borderLeft: '5px solid #aaa' }}>
                  <h3 style={{ ...styles.cardTitle, color: '#aaa' }}>🕰️ Geçmiş Randevular</h3>
                  <div style={{ padding: '15px', backgroundColor: '#f0f0f0', borderRadius: '8px', opacity: 0.7 }}>
                    {past.map(appt => (
                      <div key={appt.id} style={{ borderBottom: '1px solid #ddd', padding: '10px 0' }}>
                        <strong style={{ color: '#555' }}>📅 {appt.date} - {appt.time}</strong> | {appt.clinic}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <ToastContainer position="top-center" autoClose={2000} hideProgressBar={true} />
      <div style={styles.loginCard}>
        <div style={styles.logoCircle}>TR</div>
        <h2>Merkezi Hekim Randevu Sistemi</h2>
        <div style={styles.tabs}>
          <button style={styles.tabButton(isLoginMode)} onClick={() => setIsLoginMode(true)}>Giriş Yap</button>
          <button style={styles.tabButton(!isLoginMode)} onClick={() => setIsLoginMode(false)}>Üye Ol</button>
        </div>
        {isLoginMode ? (
          <form onSubmit={handleLogin}>
            <input style={styles.input} type="text" placeholder="T.C. Kimlik No" value={loginTc} onChange={(e) => setLoginTc(e.target.value)} required />
            <input style={styles.input} type="password" placeholder="Şifre" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} required />
            <button style={styles.mainButton} type="submit">Sisteme Giriş Yap</button>
          </form>
        ) : (
          <form onSubmit={handleRegister}>
            <input style={styles.input} type="text" placeholder="T.C. Kimlik No" value={regTc} onChange={(e) => setRegTc(e.target.value)} required />
            <input style={styles.input} type="text" placeholder="Ad Soyad" value={regName} onChange={(e) => setRegName(e.target.value)} required />
            <div style={{ display: 'flex', gap: '10px' }}>
              <select style={styles.input} value={regGender} onChange={(e) => setRegGender(e.target.value)}>
                <option value="Kadın">Kadın</option>
                <option value="Erkek">Erkek</option>
              </select>
              <input style={styles.input} type="date" value={regBirthDate} onChange={(e) => setRegBirthDate(e.target.value)} required />
            </div>
            <input style={styles.input} type="password" placeholder="Şifre" value={regPassword} onChange={(e) => setRegPassword(e.target.value)} required />
            <label style={{ display: 'flex', alignItems: 'center', color: '#555', fontSize: '14px', margin: '10px 0' }}>
              <input type="checkbox" checked={isDoctorRegister} onChange={(e) => setIsDoctorRegister(e.target.checked)} style={{ marginRight: '8px' }} />
              Ben Doktorum <span style={styles.doctorBadge}>Personel</span>
            </label>
            <button style={styles.mainButton} type="submit">Üye Ol</button>
          </form>
        )}
      </div>
    </div>
  );
}