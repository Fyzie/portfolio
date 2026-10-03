"use client";

import { useState } from 'react';
import { MapPin, Mail, Phone } from 'lucide-react';

export default function Contact() {
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', message: '' });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');

    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';
      const response = await fetch(`${backendUrl}/api/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setStatus('success');
        setFormData({ name: '', email: '', phone: '', message: '' });
      } else {
        setStatus('error');
      }
    } catch (err) {
      setStatus('error');
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 px-4 py-8 sm:px-8 md:p-10 font-sans overflow-x-hidden">
      
      {/* Header Section */}
      <section className="max-w-3xl mx-auto text-center mb-12 sm:mb-16">
        <div className="flex justify-center mb-4 sm:mb-6">
          <img 
            src="/profile.png" 
            alt="Hafizi Malik" 
            className="w-28 h-28 sm:w-32 sm:h-32 md:w-40 md:h-40 rounded-full object-cover rotate-5 border-4 border-white shadow-md"
          />
        </div>
        <h1 className="text-2xl sm:text-3xl md:text-5xl font-extrabold mb-4 sm:mb-6 tracking-tight">Contact Me</h1>
        <p className="text-base sm:text-lg md:text-xl text-slate-600 leading-relaxed mb-8 sm:mb-12 px-2">
          Whether you have a question about a project or want to collaborate, feel free to reach out using the details below.
        </p>

        {/* Contact Info List */}
        <div className="flex flex-col gap-6 sm:gap-8 items-center justify-center text-slate-700 text-sm sm:text-base">
          
          <div className="flex flex-col items-center gap-1">
            <div className="flex gap-2 font-bold text-slate-900 mb-1">
              <MapPin size={20} className="text-blue-600 shrink-0" />
              <span>My Location:</span>
            </div>
            <p>Selangor, Malaysia</p>
          </div>

          <div className="flex flex-col items-center gap-1">
            <div className="flex gap-2 font-bold text-slate-900 mb-1">
              <Mail size={20} className="text-blue-600 shrink-0" />
              <span>Email:</span>
            </div>
            <a href="mailto:hafizimalik1998@gmail.com" className="hover:text-blue-600 transition-colors break-all">
              hafizimalik1998@gmail.com
            </a>
          </div>

          <div className="flex flex-col items-center gap-1">
            <div className="flex gap-2 font-bold text-slate-900 mb-1">
              <Phone size={20} className="text-blue-600 shrink-0" />
              <span>Phone/WhatsApp:</span>
            </div>
            <a 
                href="https://wa.me/60108175109" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="hover:text-blue-600 transition-colors"
              >
                +60 10-817 5109
              </a>
          </div>

          <div className="flex flex-col items-center gap-1">
            <div className="flex gap-2 font-bold text-slate-900 mb-1">
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                width="20" 
                height="20" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                className="text-blue-600 shrink-0"
              >
                <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
                <rect width="4" height="12" x="2" y="9" />
                <circle cx="4" cy="4" r="2" />
              </svg>
              <span>LinkedIn:</span>
            </div>
            <a href="https://www.linkedin.com/in/hafizi-malik/" target="_blank" rel="noopener noreferrer" className="hover:text-blue-600 transition-colors">
              Connect with me
            </a>
          </div>

        </div>
      </section>

      {/* Form Section */}
      <section className="max-w-4xl mx-auto text-center">
        <h2 className="text-2xl sm:text-3xl font-bold mb-3 sm:mb-4">Email Me</h2>
        <p className="text-sm sm:text-base text-slate-600 mb-6 sm:mb-8 px-2">
          Have a question? Complete the form below, and I will get back to you shortly.
        </p>

        <div className="bg-slate-100 p-4 sm:p-8 md:p-12 rounded-xl border border-slate-200">
          <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Input Fields Column */}
              <div className="flex flex-col gap-4 sm:gap-6">
                <input 
                  type="text" 
                  placeholder="Your Name" 
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full p-3.5 sm:p-4 bg-slate-800 text-white placeholder-slate-400 text-sm sm:text-base rounded-md outline-none focus:ring-2 focus:ring-blue-500 border-none"
                  required
                />
                <input 
                  type="email" 
                  placeholder="Your Email" 
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full p-3.5 sm:p-4 bg-slate-800 text-white placeholder-slate-400 text-sm sm:text-base rounded-md outline-none focus:ring-2 focus:ring-blue-500 border-none"
                  required
                />
                <input 
                  type="tel" 
                  placeholder="Your Phone (Optional)" 
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full p-3.5 sm:p-4 bg-slate-800 text-white placeholder-slate-400 text-sm sm:text-base rounded-md outline-none focus:ring-2 focus:ring-blue-500 border-none"
                />
              </div>

              {/* Textarea Column */}
              <div className="flex h-full">
                <textarea 
                  placeholder="Your Message" 
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="w-full h-40 sm:h-48 md:h-full p-3.5 sm:p-4 bg-slate-800 text-white placeholder-slate-400 text-sm sm:text-base rounded-md outline-none focus:ring-2 focus:ring-blue-500 resize-none border-none"
                  required
                ></textarea>
              </div>
            </div>

            {/* Submission Actions */}
            <div className="mt-2 sm:mt-4 flex flex-col items-center gap-3">
              <button 
                type="submit" 
                disabled={status === 'loading'}
                className="w-full sm:w-auto px-8 py-3 bg-slate-800 text-white font-medium rounded-full hover:bg-slate-900 transition-colors shadow-sm disabled:opacity-50 text-sm sm:text-base"
              >
                {status === 'loading' ? 'Sending...' : 'Send Message'}
              </button>

              <p className="text-xs text-slate-400 mt-2 text-center">
                Contact form data is used solely for professional communication.
              </p>

              {status === 'success' && <p className="text-emerald-600 font-medium text-sm sm:text-base">Message sent successfully! I will get back to you soon.</p>}
              {status === 'error' && <p className="text-red-600 font-medium text-sm sm:text-base">Failed to send message. Please try emailing me directly.</p>}
            </div>
          </form>
        </div>
      </section>
    </main>
  );
}