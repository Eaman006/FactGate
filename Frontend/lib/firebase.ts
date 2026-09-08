import { getApp, getApps, initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'

const cleanEnv = (val: string | undefined): string | undefined => {
  if (!val) return undefined
  // Strip quotes and trailing commas/whitespace if env file had syntax traps
  return val.replace(/^["']|["'],?$/g, '').trim()
}

const apiKey = cleanEnv(process.env.NEXT_PUBLIC_FIREBASE_API_KEY) || 'AIzaSyDemoKeyForFactGateFactLayerAuth'
const authDomain = cleanEnv(process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN) || 'factgate-app.firebaseapp.com'
const projectId = cleanEnv(process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) || 'factgate-app'
const storageBucket = cleanEnv(process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET) || 'factgate-app.appspot.com'
const messagingSenderId = cleanEnv(process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID) || '123456789012'
const appId = cleanEnv(process.env.NEXT_PUBLIC_FIREBASE_APP_ID) || '1:123456789012:web:demo1234567890'

const firebaseConfig = {
  apiKey,
  authDomain,
  projectId,
  storageBucket,
  messagingSenderId,
  appId,
}

// Inject Diagnostics right before initializeApp call
console.log("Diagnostic - API Key:", process.env.NEXT_PUBLIC_FIREBASE_API_KEY);

// Prevent Re-initialization using exact single-instance pattern
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app)
const googleProvider = new GoogleAuthProvider()

googleProvider.setCustomParameters({
  prompt: 'select_account',
})

export { app, auth, googleProvider }
