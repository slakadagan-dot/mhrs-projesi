pipeline {
    agent any

    stages {
        stage('Hazirlik') {
            steps {
                echo 'Kodlar GitHub\'dan cekiliyor...'
                sh 'ls -la'
            }
        }
        
        stage('Docker Build') {
            steps {
                echo 'Backend icin Docker Image olusturuluyor...'
                // backend klasorune girip build aliyoruz
                dir('backend') {
                    sh 'docker build -t mhrs-backend:v1 .'
                }
            }
        }
    }
}