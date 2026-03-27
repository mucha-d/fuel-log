## Instalacja projektu po sklonowaniu repozytorium

### Wymagania globalne
- Node.js (LTS) 
- Ionic CLI (globalnie): npm install -g @ionic/cli
- Android Studio 

### 1. Sklonuj repozytorium
git clone https://github.com/mucha-d/fuel-log.git
cd fuel-log

### 2. Zainstaluj zależności Node
npm install

### 3. Zbuduj projekt
ionic build

### 4. Zsynchronizuj projekt z Capacitor
npx cap sync

### 5. Otwórz projekt w Android Studio
npx cap open android

