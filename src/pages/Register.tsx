import React from 'react'
import RegisterForm from '../components/auth/RegisterForm'
import '../components/auth/register-form.css'

const RegisterPage: React.FC = () => {
  return (
    <main className="register-page">
      <div className="register-inner">
        <section aria-labelledby="register-heading">
          <h1 id="register-heading" className="register-heading">Create an account</h1>
          <p className="lead">Create an account to save preferences, log activity, and try the template features.</p>
        </section>
        <aside>
          <RegisterForm />
        </aside>
      </div>
    </main>
  )
}

export default RegisterPage
