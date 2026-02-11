pipeline {
    agent any

    stages {
        stage('Hazirlik') {
            steps {
                echo 'Jenkins ise basliyor...'
                // Kodlarin gelip gelmedigini kontrol edelim
                sh 'ls -la' 
            }
        }
        
        stage('Backend Test') {
            steps {
                echo 'Burada ileride Python testleri kosacak...'
            }
        }
    }
}