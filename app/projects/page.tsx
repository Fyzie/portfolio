"use client";

import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

// Reusable Carousel Component for the project cards
const ImageCarousel = ({ images, onImageClick }: { images: string[], onImageClick: (img: string) => void }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    if (images.length <= 1 || !isHovered) return;
    
    const timer = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
    }, 2000);

    return () => clearInterval(timer);
  }, [images.length, isHovered]);

  const nextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <div 
      className="relative w-full h-full group cursor-pointer" 
      onClick={() => onImageClick(images[currentIndex])}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Current Image */}
      <img 
        src={images[currentIndex]} 
        alt="Project Screenshot" 
        className="w-full h-full object-cover transition-opacity duration-500"
      />

      {images.length > 1 && (
        <>
          <button 
            onClick={prevImage}
            className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-black/40 hover:bg-black/70 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <ChevronLeft size={20} />
          </button>
          
          <button 
            onClick={nextImage}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-black/40 hover:bg-black/70 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <ChevronRight size={20} />
          </button>

          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
            {images.map((_, idx) => (
              <div 
                key={idx} 
                className={`w-2 h-2 rounded-full transition-colors ${idx === currentIndex ? 'bg-white' : 'bg-white/50'}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default function Project() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const lensImages = ["/lens_image.png"];
  const cellImages = ["/cell_image.png", "/cell_image_2.png", "/cell_image_3.png"];
  const trackerImages = ["/tracker.png"]; 
  const dcImages = ["/dc.png"];

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 px-4 py-8 sm:px-8 md:p-15 font-sans overflow-x-hidden">

      {/* Popup Modal (Lightbox) */}
      {selectedImage && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4"
          onClick={() => setSelectedImage(null)}
        >
          <button 
            className="absolute top-4 right-4 sm:top-6 sm:right-6 p-2 text-white/70 hover:text-white bg-black/50 hover:bg-black rounded-full transition-colors"
            onClick={() => setSelectedImage(null)}
          >
            <X size={28} />
          </button>
          <img 
            src={selectedImage} 
            alt="Enlarged view" 
            className="max-w-full max-h-[90vh] object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {/* Projects Section */}
      <section id="projects" className="max-w-5xl mx-auto mb-12 sm:mb-20">
        
        <h1 className="text-2xl sm:text-3xl md:text-5xl font-extrabold mb-8 sm:mb-12 text-center tracking-tight">Key Projects</h1>
        
        <div className="flex flex-col gap-8 sm:gap-12">
          
          {/* Card 1: Image Left */}
          <div className="flex flex-col md:flex-row bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
            <div className="w-full md:w-1/2 h-56 sm:h-64 md:h-90 bg-slate-200 relative border-b md:border-b-0 md:border-r border-slate-200">
              <ImageCarousel images={lensImages} onImageClick={setSelectedImage} />
            </div>
            <div className="w-full md:w-1/2 p-6 sm:p-8 md:p-12 flex flex-col justify-center">
              <div className="h-10 w-10 sm:h-12 sm:w-12 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center mb-3 sm:mb-4 font-bold text-sm sm:text-base">MV</div>
              <h3 className="text-xl sm:text-2xl font-bold mb-2 sm:mb-3 text-slate-900">Automated Lens Inspection</h3>
              <p className="text-sm sm:text-base text-slate-600 text-left sm:text-justify leading-relaxed">
                An end-to-end 3-station inspection pipeline for 360-unit lens frames.
                Synchronized vision processing across 3 NVIDIA Jetson devices with MDuino hardware
                controllers, unified by a custom centralized HMI and Raspberry Pi data server.
              </p>
            </div>
          </div>

          {/* Card 2: Image Right */}
          <div className="flex flex-col md:flex-row-reverse bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
            <div className="w-full md:w-1/2 h-56 sm:h-64 md:h-90 bg-slate-200 relative border-b md:border-b-0 md:border-l border-slate-200">
              <ImageCarousel images={cellImages} onImageClick={setSelectedImage} />
            </div>
            <div className="w-full md:w-1/2 p-6 sm:p-8 md:p-12 flex flex-col justify-center">
              <div className="h-10 w-10 sm:h-12 sm:w-12 bg-emerald-100 text-emerald-600 rounded-lg flex items-center justify-center mb-3 sm:mb-4 font-bold text-sm sm:text-base">AIoT</div>
              <h3 className="text-xl sm:text-2xl font-bold mb-2 sm:mb-3 text-slate-900">Cell Growth Monitoring</h3>
              <p className="text-sm sm:text-base text-slate-600 text-left sm:text-justify leading-relaxed">
                A closed-loop robotic handler for automated cell culturing.
                The architecture utilizes UNet-based confluency segmentation optimized
                with OpenVINO on a Raspberry Pi for real-time feedback, complete with
                Firebase-integrated mobile authorization.
              </p>
            </div>
          </div>

          {/* Card 3: Image Left */}
          <div className="flex flex-col md:flex-row bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
            <div className="w-full md:w-1/2 h-56 sm:h-64 md:h-90 bg-slate-200 relative border-b md:border-b-0 md:border-r border-slate-200">
              <ImageCarousel images={trackerImages} onImageClick={setSelectedImage} />
            </div>
            <div className="w-full md:w-1/2 p-6 sm:p-8 md:p-12 flex flex-col justify-center">
              <div className="h-10 w-10 sm:h-12 sm:w-12 bg-purple-100 text-purple-600 rounded-lg flex items-center justify-center mb-3 sm:mb-4 font-bold text-sm sm:text-base">IoT</div>
              <h3 className="text-xl sm:text-2xl font-bold mb-2 sm:mb-3 text-slate-900">Wearable Geofencing Tracker</h3>
              <p className="text-sm sm:text-base text-slate-600 text-left sm:text-justify leading-relaxed">
                A GPS-enabled wearable device for geofencing,
                enabling location monitoring and boundary 
                violation reporting through a LoRa-based server.
              </p>
            </div>
          </div>

          {/* Card 4: Image Right */}
          <div className="flex flex-col md:flex-row-reverse bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
            <div className="w-full md:w-1/2 h-56 sm:h-64 md:h-90 bg-slate-200 relative border-b md:border-b-0 md:border-l border-slate-200">
              <ImageCarousel images={dcImages} onImageClick={setSelectedImage} />
            </div>
            <div className="w-full md:w-1/2 p-6 sm:p-8 md:p-12 flex flex-col justify-center">
              <div className="h-10 w-10 sm:h-12 sm:w-12 bg-orange-100 text-orange-600 rounded-lg flex items-center justify-center mb-3 sm:mb-4 font-bold text-sm sm:text-base">ML</div>
              <h3 className="text-xl sm:text-2xl font-bold mb-2 sm:mb-3 text-slate-900">Driving Cycle Analysis</h3>
              <p className="text-sm sm:text-base text-slate-600 text-left sm:text-justify leading-relaxed">
                A localized driving cycle within Gombak district for
                electric motorcycles to analyze battery usage patterns using K-Means
                and Markov Chain methods.
              </p>
            </div>
          </div>
          
        </div>
      </section>
    </main>
  );
}