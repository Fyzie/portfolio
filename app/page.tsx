"use client";

import { useState } from 'react';
import Link from 'next/link';
import { ExternalLink, Copy, X, ChevronDown, ChevronUp } from 'lucide-react'; // icons

// Chevron use for arrow icon for collapsible effect for More...

const skillCategories = [
  { category: "Programming", skills: ["Python", "C++", "SQL"] },
  { category: "AI & MLOps", skills: ["PyTorch", "TensorFlow", "MLflow"] },
  { category: "Machine Vision", skills: ["Area Scan", "Line Scan", "Visible Light", "SWIR Imaging"] },
  { category: "Industrial Cameras", skills: ["Basler", "Allied Vision", "Baumer"] },
  { category: "NLP", skills: ["LangChain", "LlamaIndex", "Qdrant"] },
  { category: "Hardware & Deployment", skills: ["NVIDIA Jetson", "Raspberry Pi", "Arduino", "Docker"] },
  { category: "Data Visualization", skills: ["Power BI", "Streamlit"] },
  { category: "Cloud AI & Version Control", skills: ["Microsoft Azure", "Google AI Studio", "GitHub"] },
  { category: "UI Development", skills: ["PySide6", "Next.js"] },
  { category: "3D Design", skills: ["SolidWorks"] },
  { category: "Languages", skills: ["Malay", "English"] }
];

export default function Home() {

  const [showIEEEPopup, setShowIEEEPopup] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showMorePubs, setShowMorePubs] = useState(false);
  const [showMoreEducation, setShowMoreEducation] = useState(false);

  const ieeeLink = "https://ieeexplore.ieee.org/document/10239394";

  const handleCopy = () => {
    navigator.clipboard.writeText(ieeeLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000); // Reset "Copied" word
  };

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 p-8 md:p-15 font-sans">
      
{/* Summary Section */}
      <section className="max-w-5xl mx-auto mb-18">
        <h1 className="text-5xl font-extrabold mb-6 tracking-tight">
          Artificial Intelligence Engineer
        </h1>
        <p className=" text-justify text-xl mb-4 text-slate-600 max-w-5xl leading-relaxed">
          AI and Mechatronics Engineer with 3+ years of experience specializing in manufacturing applications. 
          Currently focused on developing machine vision solutions for product anomaly inspection, predictive 
          maintenance analytics, and the integration of multi-device automation systems with data infrastructure. Have 
          foundational experience in NLP and Generative AI and am actively expanding into full stack development to 
          deliver comprehensive end-to-end AI applications. 
        </p>

        <div className="flex gap-4 mb-20">
          <Link href="https://github.com/Fyzie" className="px-6 py-3 bg-slate-900 text-white rounded-lg hover:bg-slate-800 font-medium transition-colors">
            GitHub Profile
          </Link>
          <Link href="/projects" className="px-6 py-3 bg-white text-slate-900 border border-slate-300 rounded-lg hover:bg-slate-100 font-medium transition-colors">
            View My Work
          </Link>
        </div>

        {/* Chat Bubble / Informal Intro */}
        <div className="max-w-5xl">
          
          {/* Chat Bubble Label */}
          <h2 className="text-m font-bold text-slate-600 uppercase tracking-widest mb-2">
            How I Describe Myself
          </h2>
          
          {/* The Chat Bubble Box */}
          <div className="bg-blue-50 border border-blue-100 p-6 md:p-8 rounded-3xl rounded-tl-sm shadow-sm relative">
            <p className="text-justify md:text-xl text-blue-900 leading-relaxed italic">
              "They say mechatronics engineers are the ultimate 'jacks of all trades', and I definitely fit the bill. 
              I thrive on complex challenges and love engineering the right solutions from the ground up. 
              Whether it means leveraging the systems I already know, or diving headfirst into completely
              new technology stacks, I adapt readily to get the job done."
            </p>
          </div>
        </div>

      </section>

{/* Work Experience Section */}
      <section id="education" className="max-w-5xl mx-auto mb-20">
        <h2 className="text-3xl font-bold mb-8">Work Experience</h2>
        
        <div className="flex flex-col gap-6">
          
          {/* IRnow Card */}
          <div className="p-6 bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md transition-shadow">
            <div className="flex flex-col md:flex-row md:justify-between md:items-start mb-4">
              <div>
                <h3 className="text-xl font-bold text-slate-900">Machine Learning Engineer</h3>
                <p className="text-slate-600 font-semibold mt-1">Specialization: Industrial Automation</p>
                
                <Link href='https://www.irnow.com.my/'>
                  <p className="text-slate-700 mt-1">IRnow Sdn. Bhd.</p>
                </Link>
              </div>
              <div className="mt-3 md:mt-0 px-4 py-1.5 bg-slate-100 text-slate-700 text-sm font-bold rounded-md shrink-0 border border-slate-200">
                Jan 2024 - Present
              </div>
            </div>

                
            <div className="mt-6 border-t border-slate-100 pt-4">
              {/* Responsibilities */}
              <ul className="text-justify list-disc ml-5 text-slate-700 font-medium leading-snug space-y-3 pr-4">
                <li>
                  Developed scalable AI pipelines for automated inspection and analytics, integrating computer vision 
                  and machine learning models on on-premises platforms, including NVIDIA Jetson devices and 
                  industrial PCs.
                </li>
                <li>
                  Experienced in fine-tuning open-source vision and analytics models, including YOLO, YOLACT, Mask 
                  R-CNN, RF-DETR, Torchvision, PatchCore, Random Forest, SVM, and LSTM, for production-ready pipelines.
                </li>
                <li>
                  Designed Python-based custom HMIs to interface inspection systems with automated production 
                  machines via TCP/UDP and MQTT protocols, integrating them with local data infrastructure.
                </li>
                <li>
                  Developed Streamlit-based manufacturing analytics tools integrating regression and forecasting 
                  models for production monitoring and process optimization.
                </li>
              </ul>
            </div>

          </div>
        </div>
      </section>

{/* Skills Section */}
      <section id="skills" className="max-w-5xl mx-auto mb-20">
        <h2 className="text-3xl font-bold mb-8">Experienced Skills</h2>
        
        {/* The Grid Container for the Category Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* Loop through each category block */}
          {skillCategories.map((group, index) => (
            <div key={index} className="p-6 bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md transition-shadow">
              
              {/* Category Title */}
              <h3 className="font-bold text-slate-800 mb-4">{group.category}</h3>
              
              {/* The Container for the small Skill Boxes */}
              <div className="flex flex-wrap gap-2">
                
                {/* Loop through the individual skills inside this specific category */}
                {group.skills.map((skill, skillIndex) => (
                  <div 
                    key={skillIndex} 
                    className="px-3 py-1 bg-slate-100 text-slate-700 text-sm font-medium rounded-md border border-slate-200 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 transition-colors"
                  >
                    {skill}
                  </div>
                ))}

              </div>
            </div>
          ))}

        </div>
      </section>

{/* Education Section */}
      <section id="education" className="max-w-5xl mx-auto mb-20">
        <h2 className="text-3xl font-bold mb-8">My Education</h2>
        
        <div className="flex flex-col gap-6">
          
          {/* Master's Degree Card */}
          <div className="p-6 bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md transition-shadow">
            <div className="flex flex-col md:flex-row md:justify-between md:items-start mb-4">
              <div>
                <h3 className="text-xl font-bold text-slate-900">Master of Science in Mechatronics Engineering (Research Mode)</h3>
                <p className="text-slate-600 font-semibold mt-1">Specialization: Artificial Intelligence</p>
                <p className="text-slate-700 mt-1">International Islamic University Malaysia (IIUM)</p>
              </div>
              <div className="mt-3 md:mt-0 px-4 py-1.5 bg-slate-100 text-slate-700 text-sm font-bold rounded-md shrink-0 border border-slate-200">
                Oct 2021 - Dec 2023
              </div>
            </div>
            
            <div className="mt-6 border-t border-slate-100 pt-4">
              <h4 className="font-bold text-slate-800 mb-3">Paper Publications:</h4>
              <div className="flex flex-col gap-3">
                
                {/* Publication 1 */}
                <div className="flex items-center gap-3">
                  <Link 
                    href="https://pubmed.ncbi.nlm.nih.gov/37346656/" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="p-1.5 bg-white text-slate-500 hover:text-blue-600 hover:bg-blue-50 border border-slate-200 rounded-md transition-colors shrink-0 shadow-sm"
                  >
                    <ExternalLink size={18} />
                  </Link>
                  <p className="text-slate-700 font-medium leading-snug">
                    A review of open-source image analysis tools for mammalian cell culture: algorithms, features, and implementations.
                  </p>
                </div>

                {/* Publication 2 */}
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setShowIEEEPopup(true)}
                    className="p-1.5 bg-white text-slate-500 hover:text-blue-600 hover:bg-blue-50 border border-slate-200 rounded-md transition-colors shrink-0 shadow-sm"
                  >
                    <ExternalLink size={18} />
                  </button>
                  <p className="text-slate-700 font-medium leading-snug">
                    Deploying patch-based segmentation pipeline for fibroblast cell images at varying magnifications.
                  </p>
                </div>

                {/* Minor Publications Section */}
                <div className="mt-2">
                  
                  {/* The Toggle Button */}
                  <button 
                    onClick={() => setShowMorePubs(!showMorePubs)}
                    className="text-sm flex items-center gap-1 font-bold text-slate-800 hover:text-blue-600 transition-colors mb-3"
                  >
                    {showMorePubs ? "Less" : "More.."}
                    {showMorePubs ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>

                  {/* The Collapsible List */}
                  {showMorePubs && (
                    <div className="flex flex-col gap-3">
                      
                      {/* Minor Publication 1 */}
                      <div className="flex items-center gap-3">
                        <Link 
                          href="https://www.tandfonline.com/doi/full/10.1080/23311916.2023.2240087" 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="p-1.5 bg-white text-slate-500 hover:text-blue-600 hover:bg-blue-50 border border-slate-200 rounded-md transition-colors shrink-0 shadow-sm"
                        >
                          <ExternalLink size={18} />
                        </Link>
                        <p className="text-slate-700 font-medium leading-snug">
                          An automated approach for fibroblast cell confluency characterisation and sample handling using AIoT for bio-research and bio-manufacturing
                        </p>
                      </div>

                      {/* Minor Publication 2 */}
                      <div className="flex items-center gap-3">
                        <Link 
                          href="https://link.springer.com/article/10.1007/s42452-025-07831-3" 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="p-1.5 bg-white text-slate-500 hover:text-blue-600 hover:bg-blue-50 border border-slate-200 rounded-md transition-colors shrink-0 shadow-sm"
                        >
                          <ExternalLink size={18} />
                        </Link>
                        <p className="text-slate-700 font-medium leading-snug">
                          Advancing coral reef monitoring: a deep learning perspective on automated segmentation and classification
                        </p>
                      </div>

                      {/* Minor Publication 3 */}
                      <div className="flex items-center gap-3">
                        <Link 
                          href="https://link.springer.com/chapter/10.1007/978-981-99-9833-3_9" 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="p-1.5 bg-white text-slate-500 hover:text-blue-600 hover:bg-blue-50 border border-slate-200 rounded-md transition-colors shrink-0 shadow-sm"
                        >
                          <ExternalLink size={18} />
                        </Link>
                        <p className="text-slate-700 font-medium leading-snug">
                          IIUM Gombak driving cycle for motorcycle
                        </p>
                      </div>

                    </div>
                  )}
                </div>

              </div>
            </div>
          </div>

          {/* The IEEE Link Popup Modal */}
          {showIEEEPopup && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm">
              <div className="bg-white p-6 rounded-xl shadow-lg max-w-lg w-full mx-4 border border-slate-200">
                
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-lg text-slate-900">IEEE Xplore Publication</h3>
                  {/* Color-coded X button for better visibility */}
                  <button 
                    onClick={() => setShowIEEEPopup(false)}
                    className="p-1 bg-red-100 text-red-600 hover:bg-red-200 rounded-md transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>
                
                <p className="text-sm text-slate-600 mb-4">
                  Due to strict firewall restrictions on IEEE Xplore, direct linking is occasionally blocked. Please copy the URL below to view the publication.
                </p>
                
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    readOnly 
                    value={ieeeLink}
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 outline-none"
                  />
                  <button 
                    onClick={handleCopy}
                    className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-lg hover:bg-slate-800 transition-colors text-sm font-medium shrink-0"
                  >
                    {copied ? "Copied!" : (
                      <>
                        <Copy size={16} /> Copy
                      </>
                    )}
                  </button>
                </div>

              </div>
            </div>
          )}

          {/* Bachelor's Degree Card */}
          <div className="p-6 bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md transition-shadow">
            <div className="flex flex-col md:flex-row md:justify-between md:items-start mb-4">
              <div>
                <h3 className="text-xl font-bold text-slate-900">Bachelor of Mechatronics Engineering (Honours)</h3>
                <p className="text-slate-600 font-semibold mt-1">CGPA: 3.48</p>
                <p className="text-slate-700 mt-1">International Islamic University Malaysia (IIUM)</p>
              </div>
              <div className="mt-3 md:mt-0 px-4 py-1.5 bg-slate-100 text-slate-700 text-sm font-bold rounded-md shrink-0 border border-slate-200">
                Sep 2017 - July 2021
              </div>
            </div>
            
            <div className="mt-6 border-t border-slate-100 pt-4">
              <h4 className="font-bold text-slate-800 mb-3">Subjects Taken:</h4>
              <div className="flex flex-wrap gap-2">
                {["Software Engineering", "Intelligent Control", "Real Time Systems", "Digital Signal Processing", "Robotics"].map((subject, idx) => (
                  <div key={idx} className="px-3 py-1 bg-slate-100 text-slate-700 text-sm font-medium rounded-md border border-slate-200">
                    {subject}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Older Education Toggle */}
          <div>
            <button 
              onClick={() => setShowMoreEducation(!showMoreEducation)}
              className="text-sm flex items-center gap-1 font-bold text-slate-800 hover:text-blue-600 transition-colors"
            >
              {showMoreEducation ? "Less" : "More.."}
              {showMoreEducation ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
          </div>

          {/* Collapsible Older Education Cards */}
          {showMoreEducation && (
            <>
              {/* Foundation Degree Card */}
              <div className="p-6 bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                <div className="flex flex-col md:flex-row md:justify-between md:items-start">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">Engineering Programmes (Foundation)</h3>
                    <p className="text-slate-600 font-semibold mt-1">CGPA : 3.93</p>
                    <p className="text-slate-700 mt-1">Centre for Foundation Studies (IIUM) • Petaling Jaya & Gambang</p>
                  </div>
                  <div className="mt-3 md:mt-0 px-4 py-1.5 bg-slate-100 text-slate-700 text-sm font-bold rounded-md shrink-0 border border-slate-200">
                    Jun 2016 - May 2017
                  </div>
                </div>
              </div>

              {/* High School Card */}
              <div className="p-6 bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                <div className="flex flex-col md:flex-row md:justify-between md:items-start">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">Sijil Pelajaran Malaysia (Aliran Sains Tulen)</h3>
                    <p className="text-slate-600 font-semibold mt-1">Result : 9A's 2B's</p>
                    <p className="text-slate-700 mt-1">Maktab Mahmud Alor Setar (MMAS) • Alor Setar</p>
                  </div>
                  <div className="mt-3 md:mt-0 px-4 py-1.5 bg-slate-100 text-slate-700 text-sm font-bold rounded-md shrink-0 border border-slate-200">
                    Jan 2014 - Dec 2015
                  </div>
                </div>
              </div>
            </>
          )}

        </div>
      </section>

{/* Training & Certifications Section */}
      <section id="certifications" className="max-w-5xl mx-auto mb-20">
        <h2 className="text-3xl font-bold mb-8">Training & Certifications</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Cert 1: Azure AI-102 */}
          <div className="p-6 bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md transition-shadow flex flex-col">
            <div className="flex justify-between items-start mb-1 gap-4">
              <Link
              href="https://learn.microsoft.com/en-us/users/hafizimalik-4920/credentials/fa9a011f5ecf0c39?ref=https%3A%2F%2Fwww.linkedin.com%2F"
              target="_blank"
              rel="noopener noreferrer"
              className="group"
              >
              <h3 className="text-lg font-bold text-slate-900 leading-tight">Azure AI Engineer Associate (AI-102)</h3>
              </Link>
              <span className="px-3 py-1 bg-slate-100 text-slate-700 text-xs font-bold rounded-md shrink-0 border border-slate-200">2024</span>
            </div>
            <p className="text-slate-700 font-medium mb-4">Microsoft</p>
            <div className="mt-auto border-t border-slate-100 pt-3">
              <p className="text-sm text-slate-600 leading-relaxed">
                <span className="font-bold text-slate-800">Focus Areas:</span> API-Based AI Integration and Cloud AI Workflows
              </p>
            </div>
          </div>

          {/* Cert 2: Azure AI-900 */}
          <div className="p-6 bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md transition-shadow flex flex-col">
            <div className="flex justify-between items-start mb-1 gap-4">
              <Link
              href="https://learn.microsoft.com/en-us/users/hafizimalik-4920/credentials/3fb7b32295dc8d1b?ref=https%3A%2F%2Fwww.linkedin.com%2F"
              target="_blank"
              rel="noopener noreferrer"
              className="group"
              >
              <h3 className="text-lg font-bold text-slate-900 leading-tight">Azure AI Fundamentals (AI-900)</h3>
              </Link>
              
              <span className="px-3 py-1 bg-slate-100 text-slate-700 text-xs font-bold rounded-md shrink-0 border border-slate-200">2024</span>
            </div>
            <p className="text-slate-700 font-medium">Microsoft</p>
            <div className="mt-auto border-t border-slate-100 pt-3">
              <p className="text-sm text-slate-600 leading-relaxed">
                <span className="font-bold text-slate-800">Focus Areas:</span> Conceptual Knowledge of AI Solutions
              </p>
            </div>
          </div>

          {/* Cert 3: Peneraju Teknologi */}
          <div className="p-6 bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md transition-shadow flex flex-col">
            <div className="flex justify-between items-start mb-1 gap-4">
              <h3 className="text-lg font-bold text-slate-900 leading-tight">Peneraju Teknologi PLUS AI and Machine Learning</h3>
              <span className="px-3 py-1 bg-slate-100 text-slate-700 text-xs font-bold rounded-md shrink-0 border border-slate-200">2024</span>
            </div>
            <p className="text-slate-700 font-medium mb-4">YPPB-KISMEC</p>
            <div className="mt-auto border-t border-slate-100 pt-3">
              <p className="text-sm text-slate-600 leading-relaxed">
                <span className="font-bold text-slate-800">Focus Areas:</span> Python, SQL, Azure AI Services, and Power BI
              </p>
            </div>
          </div>

          {/* Cert 4: Deep Learning */}
          <div className="p-6 bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md transition-shadow flex flex-col">
            <div className="flex justify-between items-start mb-1 gap-4">
              <h3 className="text-lg font-bold text-slate-900 leading-tight">Deep Learning in Intelligent Video Analytics and Computer Vision</h3>
              <span className="px-3 py-1 bg-slate-100 text-slate-700 text-xs font-bold rounded-md shrink-0 border border-slate-200">2023</span>
            </div>
            <p className="text-slate-700 font-medium mb-4">CUTe IIUM</p>
            <div className="mt-auto border-t border-slate-100 pt-3">
              <p className="text-sm text-slate-600 leading-relaxed">
                <span className="font-bold text-slate-800">Focus Areas:</span> PyTorch and NVIDIA Jetson
              </p>
            </div>
          </div>

        </div>
      </section>
      
    </main>
  );
}