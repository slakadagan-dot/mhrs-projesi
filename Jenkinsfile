pipeline {
    agent any

    stages {
        stage('Hazirlik') {
            steps {
                echo 'Kodlar GitHub\'dan cekiliyor...'
            }
        }
        
        stage('Build (Paketleme)') {
            steps {
                echo 'Docker Image olusturuluyor...'
                dir('backend') {
                    sh 'docker build -t mhrs-backend:v1 .'
                }
            }
        }

        stage('Deploy (Yayinlama)') {
            steps {
                echo 'Eski konteyner varsa durduruluyor ve yenisi baslatiliyor...'
                // Eski çalışan varsa durdur ve sil (Hata verirse yoksay "|| true")
                sh 'docker stop mhrs-backend-container || true'
                sh 'docker rm mhrs-backend-container || true'
                
                // Yenisini başlat (8000 portunda)
                sh 'docker run -d --restart=always --name mhrs-backend-container -p 8000:8000 mhrs-backend:v1'
            }
        }
    }
}