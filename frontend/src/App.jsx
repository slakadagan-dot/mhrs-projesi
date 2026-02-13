import { useState, useEffect } from 'react'
import axios from 'axios'

function App() {
  const [users, setUsers] = useState([])

  // Sayfa yüklendiğinde Backend'den (FastAPI) verileri çek
  useEffect(() => {
    axios.get('http://localhost:8000/users/')
      .then(response => {
        setUsers(response.data)
      })
      .catch(error => {
        console.error("Veri çekilirken hata oluştu:", error)
      })
  }, [])

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h1>🏥 MHRS Randevu Sistemi</h1>
      <h2>Kayıtlı Kullanıcılar (Hastalar ve Doktorlar)</h2>

      <ul>
        {users.map(user => (
          <li key={user.id} style={{ margin: '10px 0', fontSize: '18px' }}>
            <strong>{user.name}</strong> - {user.is_doctor ? "👨‍⚕️ Doktor" : "🤒 Hasta"} (TC: {user.tc_no})
          </li>
        ))}
      </ul>
    </div>
  )
}

export default App