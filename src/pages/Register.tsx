import React from 'react'
import RegisterForm from '../components/auth/RegisterForm'
import '../components/auth/register-form.css'
import { useAuth } from '../hooks/useAuth'

const RegisterPage: React.FC = () => {
  const { signIn } = useAuth()

  return (
    <main className="register-page">
      <div className="register-inner">
        <section aria-labelledby="register-heading">
          <h1 id="register-heading" className="register-heading">Create an account</h1>
          <p className="lead">Create an account to save preferences, log activity, and try the template features.</p>
        </section>
        <aside>
          <div className="social-ctas">
            <p className="social-ctas-lead">Sign up with</p>
            <div className="social-ctas-row">
              <button className="btn-social btn-ms" onClick={() => signIn('microsoft')} aria-label="Sign in with Microsoft">Microsoft</button>
              <button className="btn-social" onClick={() => signIn('google')} aria-label="Sign in with Google">Google</button>
              <button className="btn-social" onClick={() => signIn('facebook')} aria-label="Sign in with Facebook">Facebook</button>
            </div>
          </div>
          <RegisterForm />
        </aside>
      </div>
    </main>
  )
}

export default RegisterPage
