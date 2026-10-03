'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { ChevronRight, X } from 'lucide-react';

interface AwardItem {
  date: string;
  title: string;
  organization: string;
  imageSrc: string;
}

const awardsData: AwardItem[] = [
  {
    date: 'Dec 2022',
    title: 'Second Runner Up in ZTE IoT Innovation Challenge 2022',
    organization: 'ZTE and Multimedia University (MMU)',
    imageSrc: '/zte_certificate.jpg',
  },
  {
    date: 'Nov 2022',
    title: 'First Place in Intel Industry-University Challenge 2022',
    organization: 'Intel PG7, Collaborative Research in Engineering, Science and Technology (CREST)',
    imageSrc: '/cell_certificate_1.jpeg',
  },
  {
    date: 'Nov 2022',
    title: 'Best Technical in Intel Industry-University Challenge 2022',
    organization: 'Intel PG7, Collaborative Research in Engineering, Science and Technology (CREST)',
    imageSrc: '/cell_certificate_2.jpeg',
  },
  {
    date: 'Mar 2022',
    title: 'Special Prize Winner in MRANTI Biomimicry Engineering Challenge',
    organization: 'Malaysian Research Accelerator for Technology and Innovation (MRANTI)',
    imageSrc: '/mranti_certificate.jpg',
  },
  {
    date: 'Dec 2021',
    title: 'First Place in Petrosains RBTX Innovation Varsity 2021',
    organization: 'Petrosains Sdn. Bhd.',
    imageSrc: '/rbtx_certificate.jpg',
  },
  {
    date: 'Oct 2021',
    title: 'Consolation in R10 HTC IEEE Bangalore Section Product Demo 2021',
    organization: 'IEEE Bangalore Section',
    imageSrc: '/bangalore_certificate.jpg',
  },
  {
    date: 'Sep 2021',
    title: 'Second Runner Up in IEEE Malaysia Section FYP Competition 2021',
    organization: 'IEEE Malaysia Section',
    imageSrc: '/dc_certificate.jpeg',
  },
  {
    date: 'Aug 2021',
    title: 'Third Place in Innovate Malaysia Design Competition (IMDC 2021)',
    organization: 'DreamCatcher',
    imageSrc: '/imdc_certificate.jpeg',
  },
  {
    date: 'Jun 2021',
    title: 'Gold Award in Malaysia Technology Expo (MTE 2021)',
    organization: 'MTE 2021 COVID-19 International Innovation Awards II',
    imageSrc: '/mte_certificate.jpg',
  },
];

export default function Award() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedTitle, setSelectedTitle] = useState<string>('');

  const handleOpenModal = (imageSrc: string, title: string) => {
    setSelectedImage(imageSrc);
    setSelectedTitle(title);
  };

  const handleCloseModal = () => {
    setSelectedImage(null);
    setSelectedTitle('');
  };

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 px-4 py-8 sm:px-6 md:p-16 font-sans overflow-x-hidden">
      <div className="max-w-4xl mx-auto">
        
        {/* Page Title */}
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-center mb-8 sm:mb-12 text-slate-800">
          Awards & Honours
        </h1>

        {/* Awards List Container */}
        <div className="space-y-4">
          {awardsData.map((award, index) => (
            <div
              key={index}
              onClick={() => handleOpenModal(award.imageSrc, award.title)}
              className="group flex flex-col sm:flex-row sm:items-center justify-between bg-white border border-slate-200 rounded-xl p-4 sm:p-5 md:p-6 hover:shadow-md hover:border-slate-300 transition-all cursor-pointer gap-3 sm:gap-0"
            >
              {/* Left Column: Date */}
              <div className="w-full sm:w-28 md:w-32 flex-shrink-0">
                <span className="inline-block px-3 py-1 bg-slate-100 text-slate-700 font-semibold text-xs md:text-sm rounded-full">
                  {award.date}
                </span>
              </div>

              {/* Middle Column: Details */}
              <div className="flex-grow sm:px-4">
                <h2 className="text-sm sm:text-base md:text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors leading-snug">
                  {award.title}
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 mt-1">
                  {award.organization}
                </p>
              </div>

              {/* Right Column: Arrow Icon (Hidden on small mobile view for extra space, or aligned) */}
              <div className="hidden sm:flex flex-shrink-0 pl-2 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all">
                <ChevronRight className="w-6 h-6" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Certificate Image Modal Viewer */}
      {selectedImage && (
        <div 
          onClick={handleCloseModal}
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
        >
          <div 
            onClick={(e) => e.stopPropagation()} 
            className="bg-white rounded-2xl max-w-3xl w-full p-4 sm:p-6 shadow-2xl relative flex flex-col max-h-[90vh]"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 sm:pb-4 border-b border-slate-100">
              <h3 className="text-base sm:text-lg font-bold text-slate-800 pr-8 line-clamp-1">
                {selectedTitle}
              </h3>
              <button
                onClick={handleCloseModal}
                className="p-2 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body (Certificate Image Container) */}
            <div className="relative my-4 flex-grow flex items-center justify-center min-h-[250px] sm:min-h-[300px] bg-slate-100 rounded-xl overflow-hidden">
              <div className="relative w-full h-[300px] sm:h-[400px]">
                <Image
                  src={selectedImage}
                  alt={selectedTitle}
                  fill
                  className="object-contain"
                  sizes="(max-width: 768px) 100vw, 700px"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end pt-2">
              <button
                onClick={handleCloseModal}
                className="px-4 py-2 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}