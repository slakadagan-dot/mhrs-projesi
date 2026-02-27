pipeline {
    agent any

    stages {
        stage('Sistemi Temizle') {
            steps {
                echo 'Eski sistem temizleniyor...'
                sh 'docker compose down'
            }
        }
        
        stage('Derleme (Build)') {
            steps {
                echo 'Tüm projeler derleniyor...'
                sh 'docker compose build'
            }
        }
        
        stage('Yayına Al (Deploy)') {
            steps {
                echo 'Sistem ayağa kaldırılıyor...'
                sh 'docker compose up -d'
            }
        }
    }
}