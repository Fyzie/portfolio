"use client";

import { MapPin, Mail, Phone } from 'lucide-react';

export default function Contact() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 p-8 md:p-10 font-sans">
      
      {/* Header & Contact Info Section */}
      <section className="max-w-3xl mx-auto text-center mb-16">
        
        {/* Profile Image */}
        <div className="flex justify-center mb-6">
          <img 
            src="/profile.png" 
            alt="Hafizi Malik" 
            className="w-32 h-32 md:w-40 md:h-40 rounded-full object-cover rotate-5 border-4 border-white shadow-md"
          />
        </div>

        <h1 className="text-3xl md:text-5xl font-extrabold mb-6 tracking-tight">Contact Me</h1>
        <p className="text-xl text-slate-600 leading-relaxed mb-12">
          Whether you have a question about a project 
          or want to collaborate, feel free to reach out using the details below.
        </p>

        {/* Stacked Contact Details */}
        <div className="flex flex-col gap-8 items-center justify-center text-slate-700">
          
          <div className="flex flex-col items-center gap-1">
            <div className="flex gap-2 font-bold text-slate-900 mb-1">
              <MapPin size={20} className="text-blue-600" />
              <span>My Location:</span>
            </div>
            <p>Selangor, Malaysia</p>
          </div>

          <div className="flex flex-col items-center gap-1">
            <div className="flex gap-2 font-bold text-slate-900 mb-1">
              <Mail size={20} className="text-blue-600" />
              <span>Email:</span>
            </div>
            <a href="mailto:hafizimalik1998@gmail.com" className="hover:text-blue-600 transition-colors">
              hafizimalik1998@gmail.com
            </a>
          </div>

          <div className="flex flex-col items-center gap-1">
            <div className="flex gap-2 font-bold text-slate-900 mb-1">
              <Phone size={20} className="text-blue-600" />
              <span>Phone/WhatsApp:</span>
            </div>
            <p>+60 10-817 5109</p>
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
                className="text-blue-600"
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
        <h2 className="text-3xl font-bold mb-4">Email Me</h2>
        <p className="text-slate-600 mb-8">
          Have a question? Complete the form below, and I will get back to you shortly. <br className="hidden md:block"/>
          You can also email me directly at <a href="mailto:hafizimalik1998@gmail.com" className="text-blue-600 font-medium hover:underline">hafizimalik1998@gmail.com</a>
        </p>

        {/* Form Container */}
        <div className="bg-slate-100 p-8 md:p-12 rounded-xl border border-slate-200 shadow-sm">
          <form className="flex flex-col gap-6" onSubmit={(e) => e.preventDefault()}>
            
            {/* 2-Column Grid matching the image */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Left Column - 3 Stacked Inputs */}
              <div className="flex flex-col gap-6">
                <input 
                  type="text" 
                  placeholder="Your Name" 
                  className="w-full p-4 bg-slate-800 text-white placeholder-slate-400 rounded-md outline-none focus:ring-2 focus:ring-blue-500 transition-all border-none"
                  required
                />
                <input 
                  type="email" 
                  placeholder="Your Email" 
                  className="w-full p-4 bg-slate-800 text-white placeholder-slate-400 rounded-md outline-none focus:ring-2 focus:ring-blue-500 transition-all border-none"
                  required
                />
                <input 
                  type="tel" 
                  placeholder="Your Phone" 
                  className="w-full p-4 bg-slate-800 text-white placeholder-slate-400 rounded-md outline-none focus:ring-2 focus:ring-blue-500 transition-all border-none"
                />
              </div>

              {/* Right Column - Textarea spanning full height */}
              <div className="flex h-full">
                <textarea 
                  placeholder="Your Message" 
                  className="w-full h-48 md:h-full p-4 bg-slate-800 text-white placeholder-slate-400 rounded-md outline-none focus:ring-2 focus:ring-blue-500 transition-all resize-none border-none"
                  required
                ></textarea>
              </div>
            </div>

            {/* Submit Button (Centered at bottom) */}
            <div className="mt-4 flex justify-center">
              <button 
                type="submit" 
                className="px-8 py-3 bg-slate-800 text-white font-medium rounded-full hover:bg-slate-900 transition-colors shadow-sm"
              >
                Send Message
              </button>
            </div>

          </form>
        </div>
      </section>

    </main>
  );
}