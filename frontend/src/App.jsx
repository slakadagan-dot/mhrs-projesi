import { useState, useEffect } from 'react'
import axios from 'axios'

function App() {
  const [users, setUsers] = useState([])
  const [formData, setFormData] = useState({
    tc_no: '',
    name: '',
    password: '',
    is_doctor: false
  })

  // Kullanıcıları Listeleme
  const fetchUsers = () => {
    axios.get('http://localhost:8000/users/')
      .then(response => setUsers(response.data))
      .catch(err => console.error("Hata:", err))
  }

  useEffect(() => { fetchUsers() }, [])

  // Yeni Kullanıcı Kaydetme
  const handleSubmit = (e) => {
    e.preventDefault()
    axios.post('http://localhost:8000/users/', formData)
      .then(() => {
        alert("Kayıt Başarılı!")
        fetchUsers() // Listeyi güncelle
        setFormData({ tc_no: '', name: '', password: '', is_doctor: false }) // Formu sıfırla
      })
      .catch(err => alert("Hata: " + err.response.data.detail))
  }

  return (
    <div style={{ padding: '40px', maxWidth: '600px', margin: 'auto', fontFamily: 'Segoe UI' }}>
      <h1>🏥 MHRS Randevu Sistemi</h1>

      {/* KAYIT FORMU */}
      <div style={{ background: '#f4f4f4', padding: '20px', borderRadius: '10px', marginBottom: '30px' }}>
        <h3>Yeni Kullanıcı Kaydı</h3>
        <form onSubmit={handleSubmit}>
          <input type="text" placeholder="TC Kimlik No" value={formData.tc_no} onChange={e => setFormData({ ...formData, tc_no: e.target.value })} style={{ display: 'block', marginBottom: '10px', width: '100%' }} required />
          <input type="text" placeholder="Ad Soyad" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} style={{ display: 'block', marginBottom: '10px', width: '100%' }} required />
          <input type="password" placeholder="Şifre" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} style={{ display: 'block', marginBottom: '10px', width: '100%' }} required />
          <label>
            <input type="checkbox" checked={formData.is_doctor} onChange={e => setFormData({ ...formData, is_doctor: e.target.checked })} /> Doktor musunuz?
          </label>
          <button type="submit" style={{ display: 'block', marginTop: '15px', width: '100%', padding: '10px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>Kaydet</button>
        </form>
      </div>

      <h2>Kayıtlı Kullanıcılar</h2>
      <ul style={{ listStyleType: 'none', padding: 0 }}>
        {users.map(user => (
          <li key={user.id} style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>
            <strong>{user.name}</strong> - {user.is_doctor ? "👨‍⚕️ Doktor" : "🤒 Hasta"} <br />
            <small style={{ color: '#666' }}>TC: {user.tc_no}</small>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default App