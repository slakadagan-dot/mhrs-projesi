pipeline {
    agent any

    stages {
        stage('Gereksinimleri Kur') {
            steps {
                sh 'curl -sSL "https://github.com/docker/compose/releases/download/v2.24.5/docker-compose-linux-x86_64" -o ./docker-compose'
                sh 'chmod +x ./docker-compose'
            }
        }
        
        stage('Sistemi Temizle') {
            steps {
                sh './docker-compose down || true'
            }
        }
        
        stage('Derleme (Build)') {
            steps {
                sh './docker-compose build'
            }
        }
        
        stage('Yayına Al (Deploy)') {
            steps {
                sh './docker-compose up -d'
            }
        }
    }
}