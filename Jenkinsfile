pipeline {
    agent any

    stages {
        stage('Sistemi Temizle') {
            steps {
                sh 'docker-compose down || true'
            }
        }
        stage('Derleme (Build)') {
            steps {
                sh 'docker-compose build'
            }
        }
        stage('Yayına Al (Deploy)') {
            steps {
                sh 'docker-compose up -d'
            }
        }
    }
}