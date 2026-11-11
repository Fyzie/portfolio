"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ExternalLink,
  Copy,
  Check,
  X,
  ChevronDown,
  ChevronUp,
  MapPin,
  Mail,
  Phone,
  Gamepad2,
  Sparkles,
  ArrowUpRight,
  Eye,
  ChevronRight,
  Briefcase,
  GraduationCap,
  ArrowRight
} from "lucide-react";
import Toolbox from "@/components/toolbox";

// Categorized Skills Data
const skillCategories = [
  { category: "Programming", skills: ["Python", "C++", "SQL", "TypeScript"] },
  { category: "AI & MLOps", skills: ["PyTorch", "TensorFlow", "HuggingFace", "MLflow", "Docker"] },
  { category: "Machine Vision", skills: ["Area Scan", "Line Scan", "Visible Light", "SWIR Imaging"] },
  { category: "Industrial Cameras", skills: ["Basler", "Allied Vision", "Baumer"] },
  { category: "NLP & GenAI", skills: ["LangChain", "LlamaIndex", "Qdrant"] },
  { category: "Hardware & Edge", skills: ["NVIDIA Jetson", "Raspberry Pi", "Arduino", "Industrial PCs"] },
  { category: "Analytics & UI", skills: ["Power BI", "Streamlit", "Next.js", "PySide6", "SolidWorks"] },
  { category: "Cloud & Dev", skills: ["Microsoft Azure", "Google AI Studio", "GitHub", "TCP/UDP", "MQTT"] },
];

// Flat Skills for Aahil-Khan style minimal badge cloud
const allSkills = [
  "Python", "C++", "PyTorch", "TensorFlow", "NVIDIA Jetson", "Machine Vision", 
  "Basler Cameras", "SWIR Imaging", "HuggingFace", "MLflow", "Docker", 
  "LangChain", "LlamaIndex", "Qdrant", "Raspberry Pi", "Arduino", "SQL", 
  "Streamlit", "Next.js", "Microsoft Azure", "Google AI Studio", "Power BI", 
  "PySide6", "SolidWorks", "TCP/UDP", "MQTT"
];

// Projects Data
type ProjectType = "Professional" | "Academic" | "Personal";

interface ProjectItem {
  id: string;
  title: string;
  dates: string;
  category: string;
  projectType: ProjectType;
  description: string;
  shortDescription?: string;
  images: string[];
  tags: string[];
  link?: string;
  linkLabel?: string;
  playgroundTab?: string;
  highlight?: boolean;
}

const projectsData: ProjectItem[] = [
  {
    id: "powercable-inspection",
    title: "Automated Power Cable Inspection",
    dates: "2026",
    category: "Machine Vision",
    projectType: "Professional",
    description: "An inspection system to measure the overlapping width of the cable during continuous operation. The system shall automatically capture measurements every 10 seconds and store the corresponding timestamp and overlap-width data for historical tracking, and process analysis.",
    shortDescription: "An inspection system to measure the overlapping width of the cable during continuous operation. The system shall automatically capture measurements every 10 seconds and store",
    images: ["/powercable_image.jpg"],
    tags: ["Jetson", "PyTorch", "PySide6", "Dimension Measurement"],
  },
  {
    id: "lens-inspection",
    title: "Automated Lens Inspection",
    dates: "2024",
    category: "Machine Vision",
    projectType: "Professional",
    description: "An end-to-end 3-station inspection pipeline (bottom green light, top white light, bottom white light) for 360-unit lens frames. Synchronized vision processing across 3 NVIDIA Jetson devices with MDuino hardware controllers, unified by a custom centralized HMI and Raspberry Pi data server.",
    shortDescription: "An end-to-end 3-station inspection pipeline for 360-unit lens frames. Synchronized vision processing across 3 NVIDIA Jetson devices with MDuino hardware controllers, unified by",
    images: ["/lens_image.png"],
    tags: ["Jetson", "PyTorch", "PySide6", "TCP/UDP", "Multi-ROI Defect Detection"],
  },
  {
    id: "cell-growth",
    title: "Cell Growth Monitoring",
    dates: "2023",
    category: "AIoT & Robotics",
    projectType: "Academic",
    description: "A closed-loop robotic handler for automated cell culturing. The architecture utilizes UNet-based confluency segmentation optimized with OpenVINO on a Raspberry Pi for real-time feedback with Firebase mobile authorization.",
    shortDescription: "A closed-loop robotic handler for automated cell culturing. The architecture utilizes UNet-based confluency segmentation optimized with OpenVINO on a Raspberry Pi for real-time",
    images: ["/cell_image.png", "/cell_image_2.png", "/cell_image_3.png"],
    tags: ["UNet", "OpenVINO", "Raspberry Pi", "Firebase", "Android Studio"],
    link: "https://www.tandfonline.com/doi/full/10.1080/23311916.2023.2240087",
    linkLabel: "Read Paper"
  },
  {
    id: "geofencing-tracker",
    title: "Wearable Geofencing Tracker",
    dates: "2022",
    category: "IoT",
    projectType: "Academic",
    description: "A GPS-enabled wearable device for geofencing, enabling location monitoring and boundary violation reporting through a LoRa-based server.",
    shortDescription: "A GPS-enabled wearable device for geofencing, enabling location monitoring and boundary violation reporting through",
    images: ["/tracker.png"],
    tags: ["LoRa", "GPS", "Embedded C++", "ESP32"],
    link: "https://github.com/Fyzie/geofencing_electronic_lora_tracker",
    linkLabel: "View on GitHub"
  },
  {
    id: "driving-cycle",
    title: "Driving Cycle Analysis",
    dates: "2021",
    category: "Machine Learning",
    projectType: "Academic",
    description: "A localized driving cycle within Gombak district for electric motorcycles to analyze battery usage patterns using K-Means and Markov Chain methods.",
    shortDescription: "A localized driving cycle within Gombak district for electric motorcycles to analyze battery usage patterns using",
    images: ["/dc.png"],
    tags: ["K-Means", "Markov Chain", "GPS", "Matlab"],
    link: "https://link.springer.com/chapter/10.1007/978-981-99-9833-3_9",
    linkLabel: "Springer Chapter"
  },
  {
    id: "agentic-maintenance-dispatcher",
    title: "Autonomous Maintenance Dispatch Agent",
    dates: "2026",
    category: "Agentic AI",
    projectType: "Personal",
    description: "Autonomous dispatch agent executing RAG manual queries combined with live Supabase ERP inventory tool calls (MCP). Diagnoses machinery breakdowns, verifies spare parts availability, updates stock, and generates automated work order dispatches.",
    shortDescription: "Autonomous dispatch agent executing RAG manual queries combined with live Supabase ERP inventory tool calls (MCP) to troubleshoot faults and dispatch",
    images: ["/agentic_ai.png"],
    tags: ["Agentic AI", "Qdrant", "Google AI Studio", "Supabase ERP"],
    playgroundTab: "agentic",
    link: "/playground?tab=agentic",
    linkLabel: "Try Me",
    highlight: false
  },
  {
    id: "rag-factory-assistant",
    title: "Factory SOP & Manual Assistant",
    dates: "2026",
    category: "RAG Systems",
    projectType: "Personal",
    description: "An intelligent Retrieval-Augmented Generation (RAG) assistant designed for industrial shop floors. It indexes standard operating procedures (SOPs) and equipment manuals, allowing maintenance crews to instantly query technical documentation, verify fault codes, and retrieve step-by-step resolution procedures.",
    shortDescription: "An AI assistant that helps factory personnel quickly query and retrieve guidance from equipment SOPs and technical manuals using vector",
    images: ["/rag_system.png"],
    tags: ["RAG", "Qdrant", "Google AI Studio"],
    playgroundTab: "rag",
    link: "/playground?tab=rag",
    linkLabel: "Try Me",
    highlight: false
  },
];

// Awards Data
interface AwardItem {
  date: string;
  title: string;
  organization: string;
  imageSrc: string;
  badge?: string;
}

const awardsData: AwardItem[] = [
  {
    date: 'Dec 2022',
    title: 'Second Runner Up in ZTE IoT Innovation Challenge 2022',
    organization: 'ZTE and Multimedia University (MMU)',
    imageSrc: '/zte_certificate.jpg',
    badge: '2nd Runner Up',
  },
  {
    date: 'Nov 2022',
    title: 'First Place in Intel Industry-University Challenge 2022',
    organization: 'Intel PG7, Collaborative Research in Engineering, Science and Technology (CREST)',
    imageSrc: '/cell_certificate_1.jpeg',
    badge: '1st Place Winner',
  },
  {
    date: 'Nov 2022',
    title: 'Best Technical in Intel Industry-University Challenge 2022',
    organization: 'Intel PG7, Collaborative Research in Engineering, Science and Technology (CREST)',
    imageSrc: '/cell_certificate_2.jpeg',
    badge: 'Best Technical',
  },
  {
    date: 'Mar 2022',
    title: 'Special Prize Winner in MRANTI Biomimicry Engineering Challenge',
    organization: 'Malaysian Research Accelerator for Technology and Innovation (MRANTI)',
    imageSrc: '/mranti_certificate.jpg',
    badge: 'Special Prize',
  },
  {
    date: 'Dec 2021',
    title: 'First Place in Petrosains RBTX Innovation Varsity 2021',
    organization: 'Petrosains Sdn. Bhd.',
    imageSrc: '/rbtx_certificate.jpg',
    badge: '1st Place Winner',
  },
  {
    date: 'Oct 2021',
    title: 'Consolation in R10 HTC IEEE Bangalore Section Product Demo 2021',
    organization: 'IEEE Bangalore Section',
    imageSrc: '/bangalore_certificate.jpg',
    badge: 'Consolation',
  },
  {
    date: 'Sep 2021',
    title: 'Second Runner Up in IEEE Malaysia Section FYP Competition 2021',
    organization: 'IEEE Malaysia Section',
    imageSrc: '/dc_certificate.jpeg',
    badge: '2nd Runner Up',
  },
  {
    date: 'Aug 2021',
    title: 'Third Place in Innovate Malaysia Design Competition (IMDC 2021)',
    organization: 'DreamCatcher',
    imageSrc: '/imdc_certificate.jpeg',
    badge: '3rd Place',
  },
  {
    date: 'Jun 2021',
    title: 'Gold Award in Malaysia Technology Expo (MTE 2021)',
    organization: 'MTE 2021 COVID-19 International Innovation Awards II',
    imageSrc: '/mte_certificate.jpg',
    badge: 'Gold Award',
  },
];

export default function Home() {
  // Modal states
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedTitle, setSelectedTitle] = useState<string>("");
  const [showIEEEPopup, setShowIEEEPopup] = useState(false);
  const [copiedIEEE, setCopiedIEEE] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [showMoreEducation, setShowMoreEducation] = useState(false);
  const [showMoreExperience, setShowMoreExperience] = useState(false);
  const [activePopupId, setActivePopupId] = useState<string | null>(null);
  const popupRef = useRef<HTMLDivElement>(null);

  // Project Type Tab Filter State ("Professional" | "Academic" | "Personal")
  const [activeProjectTab, setActiveProjectTab] = useState<ProjectType>("Professional");

  const projectTabs = [
    { id: "Professional" as const, label: "Professional", icon: Briefcase, count: projectsData.filter(p => p.projectType === "Professional").length },
    { id: "Academic" as const, label: "Academic", icon: GraduationCap, count: projectsData.filter(p => p.projectType === "Academic").length },
    { id: "Personal" as const, label: "Personal", icon: Sparkles, count: projectsData.filter(p => p.projectType === "Personal").length },
  ];

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setActivePopupId(null);
      }
    };
    const handleClickOutside = () => {
      setActivePopupId(null);
    };

    function adjustPopup() {
      if (!popupRef.current) return;
      const el = popupRef.current;
      el.style.transform = "";
      const rect = el.getBoundingClientRect();
      if (rect.left < 16) {
        el.style.transform = `translateX(${16 - rect.left}px)`;
      } else if (rect.right > window.innerWidth - 16) {
        el.style.transform = `translateX(${window.innerWidth - 16 - rect.right}px)`;
      }
    }

    if (activePopupId) {
      window.addEventListener("keydown", handleKeyDown);
      window.addEventListener("click", handleClickOutside);
      // Run position check after DOM render
      const frameId = requestAnimationFrame(adjustPopup);
      window.addEventListener("resize", adjustPopup);
      return () => {
        cancelAnimationFrame(frameId);
        window.removeEventListener("keydown", handleKeyDown);
        window.removeEventListener("click", handleClickOutside);
        window.removeEventListener("resize", adjustPopup);
      };
    }
  }, [activePopupId]);

  // Contact Form state
  const [formData, setFormData] = useState({ name: "", email: "", phone: "", message: "" });
  const [formStatus, setFormStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  const ieeeLink = "https://ieeexplore.ieee.org/document/10239394";
  const emailAddress = "hafizimalik1998@gmail.com";

  const handleCopyIEEE = () => {
    navigator.clipboard.writeText(ieeeLink);
    setCopiedIEEE(true);
    setTimeout(() => setCopiedIEEE(false), 2000);
  };

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(emailAddress);
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2000);
  };

  const handleOpenModal = (imageSrc: string, title: string) => {
    setSelectedImage(imageSrc);
    setSelectedTitle(title);
  };

  const handleCloseModal = () => {
    setSelectedImage(null);
    setSelectedTitle("");
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormStatus("loading");

    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";
      const response = await fetch(`${backendUrl}/api/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setFormStatus("success");
        setFormData({ name: "", email: "", phone: "", message: "" });
      } else {
        setFormStatus("error");
      }
    } catch {
      setFormStatus("error");
    }
  };

  return (
    <div className="max-w-4xl lg:max-w-5xl mx-auto px-4 sm:px-8 py-10 sm:py-16 space-y-16 sm:space-y-24 font-sans text-[#372C2E]">

      {/* ================= HERO SECTION ================= */}
      <section id="hero" className="flex flex-col-reverse sm:flex-row items-start sm:items-center justify-between gap-8 sm:gap-12 pt-2">
        
        {/* Left: Bio & Heading */}
        <div className="flex-1 space-y-4">
          
          {/* Status Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FDF6E9] border border-[#DE9E48]/40 text-[#7A431D] text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-[#DE9E48] animate-pulse" />
            <span>Industrial AI & Automation Specialist</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-[#372C2E] leading-tight">
            Hi, I'm Hafizi Malik 👋
          </h1>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-3 pt-3">
            <Link
              href="#contact"
              className="px-5 py-2.5 bg-[#372C2E] text-white rounded-lg text-sm font-semibold hover:bg-[#563727] transition-colors shadow-xs"
            >
              Get in Touch
            </Link>

            <a
              href="https://github.com/Fyzie"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-white text-[#563727] border border-[#EBDED2] rounded-lg text-sm font-medium hover:bg-[#F5EFEB] transition-colors"
            >
              <span>GitHub</span>
              <ArrowUpRight size={14} className="text-[#7A431D]" />
            </a>
          </div>
        </div>

        {/* Right: Round Headshot Avatar */}
        <div className="shrink-0 self-center sm:self-auto">
          <div className="relative w-32 h-32 sm:w-40 sm:h-40 lg:w-44 lg:h-44 rounded-full overflow-hidden ring-4 ring-[#EBDED2] shadow-md bg-white">
            <Image
              src="/profile.png"
              alt="Hafizi Malik"
              fill
              priority
              className="object-cover"
            />
          </div>
        </div>
      </section>

      {/* ================= ABOUT SECTION ================= */}
      <section id="about" className="space-y-4">
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#372C2E]">
          About
        </h2>
        
        <p className="text-[#563727] leading-relaxed text-sm sm:text-base text-justify">
          I am an AI and Mechatronics Engineer with 3+ years of experience specializing in manufacturing applications. 
          Currently focused on developing machine vision solutions for product anomaly inspection, predictive maintenance analytics, 
          and the integration of multi-device automation systems with real-time data infrastructure. Expanding into full 
          stack development and Agentic AI for end-to-end AI solutions from the factory floor to the cloud. 
        </p>

        {/* Quote Callout Card */}
        <div className="p-5 sm:p-6 rounded-xl bg-[#F9F6F0] border-l-4 border-l-[#DE9E48] border-y border-r border-[#EBDED2] relative">
          <p className="text-xs sm:text-sm text-[#563727] italic leading-relaxed">
            "They say mechatronics engineers are the ultimate 'jacks of all trades', and I definitely fit the bill. 
            I thrive on complex challenges and love engineering the right solutions from the ground up. 
            Whether it means leveraging the systems I already know or diving headfirst into completely new technology stacks, 
            I adapt readily to get the job done."
          </p>
        </div>
      </section>

      {/* ================= WORK EXPERIENCE SECTION ================= */}
      <section id="experience" className="space-y-6">
        <div className="space-y-1">
          <div className="inline-block px-2.5 py-0.5 rounded-md bg-[#FDF6E9] text-[#7A431D] text-xs font-semibold border border-[#DE9E48]/30">
            Work Experience
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#372C2E]">
            Where I've Worked
          </h2>
        </div>

        {/* Experience Timeline */}
        <div className="space-y-6 border-l-2 border-[#EBDED2] ml-3 sm:ml-4 pl-4 sm:pl-6">
          
          <div className="relative group">
            {/* Timeline Dot */}
            <div className="absolute -left-[23px] sm:-left-[31px] top-1.5 w-3.5 h-3.5 rounded-full bg-[#DE9E48] ring-4 ring-[#FDFBF7]" />
            
            <div className="space-y-3 bg-white border border-[#EBDED2] p-5 sm:p-6 rounded-2xl shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1">
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-[#372C2E]">
                    Machine Learning Engineer
                  </h3>
                  <div className="flex items-center gap-2 text-sm text-[#6E5A52] mt-0.5">
                    <Link 
                      href="https://www.irnow.com.my/" 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-[#7A431D] hover:underline font-semibold inline-flex items-center gap-1"
                    >
                      IRnow Sdn. Bhd. <ExternalLink size={12} />
                    </Link>
                    <span>•</span>
                    <span className="text-xs px-2.5 py-0.5 rounded-md bg-[#FDF6E9] text-[#7A431D] font-medium border border-[#DE9E48]/30">
                      Industrial AI
                    </span>
                  </div>
                </div>
                
                <span className="text-xs sm:text-sm font-semibold text-[#6E5A52] self-start sm:self-auto">
                  Jan 2024 – Present
                </span>
              </div>

              <ul className="list-disc ml-4 space-y-2 text-xs sm:text-sm text-[#563727] leading-relaxed">
                <li>
                  Developed scalable AI pipelines for automated inspection and analytics, integrating computer vision 
                  and machine learning models on on-premises platforms (NVIDIA Jetson & industrial PCs).
                </li>
                <li>
                  Fine-tuned open-source vision and analytics models (YOLO, YOLACT, Mask R-CNN, RF-DETR, Torchvision, 
                  PatchCore, Random Forest, SVM, LSTM) for production-ready pipelines.
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

              {/* Skills Tags for this role */}
              {/* <div className="flex flex-wrap gap-1.5 pt-2 border-t border-[#EBDED2]">
                {["Python", "PyTorch", "NVIDIA Jetson", "Basler", "YOLO", "RF-DETR", "Docker", "MQTT", "Streamlit"].map((tag) => (
                  <span 
                    key={tag} 
                    className="px-2.5 py-0.5 rounded-md bg-[#F5EFEB] text-[11px] font-medium text-[#563727] border border-[#EBDED2]"
                  >
                    {tag}
                  </span>
                ))}
              </div> */}
            </div>
          </div>

          {/* Expandable Earlier Experience */}
          {!showMoreExperience ? (
            <button
              type="button"
              onClick={() => setShowMoreExperience(true)}
              className="text-xs sm:text-sm font-semibold text-[#7A431D] hover:text-[#372C2E] flex items-center gap-1 transition-colors cursor-pointer pt-1"
            >
              <span>Show earlier experience</span>
              <ChevronDown size={15} />
            </button>
          ) : (
            <div className="space-y-6 pt-2">
              {/* Graduate Research Assistant */}
              <div className="relative group">
                {/* Timeline Dot */}
                <div className="absolute -left-[23px] sm:-left-[31px] top-1.5 w-3.5 h-3.5 rounded-full bg-[#DE9E48] ring-4 ring-[#FDFBF7]" />
                
                <div className="space-y-3 bg-white border border-[#EBDED2] p-5 sm:p-6 rounded-2xl shadow-xs">
                  <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1">
                    <div>
                      <h3 className="text-base sm:text-lg font-bold text-[#372C2E]">
                        Graduate Research Assistant
                      </h3>
                      <div className="flex items-center gap-2 text-sm text-[#6E5A52] mt-0.5">
                        <span className="text-[#7A431D] font-semibold">
                          Research Management Centre (RMC), IIUM Gombak
                        </span>
                        <span>•</span>
                        <span className="text-xs px-2.5 py-0.5 rounded-md bg-[#FDF6E9] text-[#7A431D] font-medium border border-[#DE9E48]/30">
                          Research &amp; Development
                        </span>
                      </div>
                    </div>
                    
                    <span className="text-xs sm:text-sm font-semibold text-[#6E5A52] self-start sm:self-auto">
                      Dec 2021 – Sep 2023
                    </span>
                  </div>

                  <ul className="list-disc ml-4 space-y-2 text-xs sm:text-sm text-[#563727] leading-relaxed">
                    <li>
                      Contributed to the complete life cycle of grant projects, from writing proposals, conceptual design, implementation to integration, and reporting.
                    </li>
                    <li>
                      Prepared multimedia materials, including infographics, presentation slides, and demonstration videos, for project presentations and academic programs.
                    </li>
                  </ul>

                  {/* Major Projects Involved */}
                  <div className="pt-2 border-t border-[#EBDED2]/70">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-[#7A431D] mb-2">
                      Major projects involved:
                    </h4>
                    <ul className="list-disc ml-4 space-y-1.5 text-xs sm:text-sm text-[#563727] leading-relaxed">
                      <li>
                        Automated 2D segmentation of coral species in the marine environment <span className="text-[#7A431D] font-medium">(Implementation)</span>
                      </li>
                      <li>
                        Towards zero-carbon autonomous connecting electric vehicle for public transportation <span className="text-[#7A431D] font-medium">(Proposal writing, conceptual design)</span>
                      </li>
                      <li>
                        Development of smart agrotech virtual and augmented reality system <span className="text-[#7A431D] font-medium">(Conceptual design)</span>
                      </li>
                      <li>
                        Smart IoT energy optimization and localization monitoring for e-bike sharing <span className="text-[#7A431D] font-medium">(Writing proposal, conceptual design, implementation)</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Intern */}
              <div className="relative group">
                {/* Timeline Dot */}
                <div className="absolute -left-[23px] sm:-left-[31px] top-1.5 w-3.5 h-3.5 rounded-full bg-[#DE9E48] ring-4 ring-[#FDFBF7]" />
                
                <div className="space-y-3 bg-white border border-[#EBDED2] p-5 sm:p-6 rounded-2xl shadow-xs">
                  <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1">
                    <div>
                      <h3 className="text-base sm:text-lg font-bold text-[#372C2E]">
                        Intern
                      </h3>
                      <div className="flex items-center gap-2 text-sm text-[#6E5A52] mt-0.5">
                        <span className="text-[#7A431D] font-semibold">
                          Ingenious International Sdn. Bhd. (M), Petaling Jaya
                        </span>
                        <span>•</span>
                        <span className="text-xs px-2.5 py-0.5 rounded-md bg-[#FDF6E9] text-[#7A431D] font-medium border border-[#DE9E48]/30">
                          M&amp;E Engineering
                        </span>
                      </div>
                    </div>
                    
                    <span className="text-xs sm:text-sm font-semibold text-[#6E5A52] self-start sm:self-auto">
                      Aug 2020 – Oct 2020
                    </span>
                  </div>

                  <ul className="list-disc ml-4 space-y-2 text-xs sm:text-sm text-[#563727] leading-relaxed">
                    <li>
                      Assisted in preparing bill of quantities and test reports for specific electrical and cable fittings using AutoCAD and Rivet (MRT Chan Sow Lin Station, Office Towers at TNB HQ Campus).
                    </li>
                    <li>
                      Participated in site inspection focused on electrical wiring connections (Malaysia Steel Works (KL) Bhd).
                    </li>
                  </ul>
                </div>
              </div>

              {/* Hide Button */}
              <button
                type="button"
                onClick={() => setShowMoreExperience(false)}
                className="text-xs font-semibold text-[#7A431D] hover:text-[#372C2E] flex items-center gap-1 transition-colors cursor-pointer"
              >
                <span>Hide</span>
                <ChevronUp size={15} />
              </button>
            </div>
          )}

        </div>
      </section>

      {/* ================= EDUCATION SECTION ================= */}
      <section id="education" className="space-y-6">
        <div className="space-y-1">
          <div className="inline-block px-2.5 py-0.5 rounded-md bg-[#FDF6E9] text-[#7A431D] text-xs font-semibold border border-[#DE9E48]/30">
            Education
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#372C2E]">
            My Education
          </h2>
        </div>

        {/* Education Timeline */}
        <div className="space-y-8 border-l-2 border-[#EBDED2] ml-3 sm:ml-4 pl-4 sm:pl-6">
          
          {/* Master's Degree */}
          <div className="relative group">
            <div className="absolute -left-[23px] sm:-left-[31px] top-1.5 w-3.5 h-3.5 rounded-full bg-[#7A431D] ring-4 ring-[#FDFBF7]" />
            
            <div className="space-y-3 bg-white border border-[#EBDED2] p-5 sm:p-6 rounded-2xl shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1">
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-[#372C2E]">
                    Master of Science in Mechatronics Engineering (Research Mode)
                  </h3>
                  <p className="text-sm text-[#6E5A52]">
                    International Islamic University Malaysia (IIUM) • <span className="font-semibold text-[#7A431D]">Specialization: Artificial Intelligence</span>
                  </p>
                </div>
                <span className="text-xs sm:text-sm font-semibold text-[#6E5A52]">
                  Oct 2021 – Dec 2023
                </span>
              </div>

              {/* Research Publications Sublist */}
              <div className="pt-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#7A431D] mb-2.5">
                  Paper Publications:
                </h4>
                <div className="space-y-2.5">
                  
                  {/* Pub 1 */}
                  <div className="flex items-start gap-2.5 text-xs sm:text-sm text-[#563727]">
                    <Link
                      href="https://pubmed.ncbi.nlm.nih.gov/37346656/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1 rounded bg-[#FDF6E9] text-[#7A431D] hover:bg-[#FAEAD1] shrink-0 mt-0.5 border border-[#DE9E48]/30"
                      title="View PubMed"
                    >
                      <ExternalLink size={13} />
                    </Link>
                    <span>
                      A review of open-source image analysis tools for mammalian cell culture: algorithms, features, and implementations.
                    </span>
                  </div>

                  {/* Pub 2 (IEEE modal) */}
                  <div className="flex items-start gap-2.5 text-xs sm:text-sm text-[#563727]">
                    <button
                      onClick={() => setShowIEEEPopup(true)}
                      className="p-1 rounded bg-[#FDF6E9] text-[#7A431D] hover:bg-[#FAEAD1] shrink-0 mt-0.5 border border-[#DE9E48]/30"
                      title="Copy IEEE Link"
                    >
                      <ExternalLink size={13} />
                    </button>
                    <span>
                      Deploying patch-based segmentation pipeline for fibroblast cell images at varying magnifications. (IEEE)
                    </span>
                  </div>

                  {/* Pub 3 */}
                  <div className="flex items-start gap-2.5 text-xs sm:text-sm text-[#563727]">
                    <Link
                      href="https://www.tandfonline.com/doi/full/10.1080/23311916.2023.2240087"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1 rounded bg-[#FDF6E9] text-[#7A431D] hover:bg-[#FAEAD1] shrink-0 mt-0.5 border border-[#DE9E48]/30"
                    >
                      <ExternalLink size={13} />
                    </Link>
                    <span>
                      An automated approach for fibroblast cell confluency characterisation and sample handling using AIoT for bio-research and bio-manufacturing.
                    </span>
                  </div>

                  {/* Pub 4 */}
                  <div className="flex items-start gap-2.5 text-xs sm:text-sm text-[#563727]">
                    <Link
                      href="https://link.springer.com/article/10.1007/s42452-025-07831-3"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1 rounded bg-[#FDF6E9] text-[#7A431D] hover:bg-[#FAEAD1] shrink-0 mt-0.5 border border-[#DE9E48]/30"
                    >
                      <ExternalLink size={13} />
                    </Link>
                    <span>
                      Advancing coral reef monitoring: a deep learning perspective on automated segmentation and classification. (Springer)
                    </span>
                  </div>

                  {/* Pub 5 */}
                  <div className="flex items-start gap-2.5 text-xs sm:text-sm text-[#563727]">
                    <Link
                      href="https://link.springer.com/chapter/10.1007/978-981-99-9833-3_9"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1 rounded bg-[#FDF6E9] text-[#7A431D] hover:bg-[#FAEAD1] shrink-0 mt-0.5 border border-[#DE9E48]/30"
                    >
                      <ExternalLink size={13} />
                    </Link>
                    <span>
                      IIUM Gombak driving cycle for motorcycle. (Springer)
                    </span>
                  </div>

                </div>
              </div>
            </div>
          </div>

          {/* Bachelor's Degree */}
          <div className="relative group">
            <div className="absolute -left-[23px] sm:-left-[31px] top-1.5 w-3.5 h-3.5 rounded-full bg-[#7A431D] ring-4 ring-[#FDFBF7]" />
            
            <div className="space-y-3 bg-white border border-[#EBDED2] p-5 sm:p-6 rounded-2xl shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1">
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-[#372C2E]">
                    Bachelor of Mechatronics Engineering (Honours)
                  </h3>
                  <p className="text-sm text-[#6E5A52]">
                    International Islamic University Malaysia (IIUM) • <span className="font-semibold text-[#7A431D]">CGPA: 3.48</span>
                  </p>
                </div>
                <span className="text-xs sm:text-sm font-semibold text-[#6E5A52]">
                  Sep 2017 – July 2021
                </span>
              </div>

              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#7A431D] mb-2">
                  Key Subjects:
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {["Software Engineering", "Intelligent Control", "Real Time Systems", "Robotics", "Digital Signal Processing"].map((subj) => (
                    <span 
                      key={subj} 
                      className="px-2.5 py-0.5 rounded-md bg-[#F5EFEB] text-[11px] font-medium text-[#563727] border border-[#EBDED2]"
                    >
                      {subj}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Expandable Foundation & High School */}
          {!showMoreEducation ? (
            <button
              onClick={() => setShowMoreEducation(true)}
              className="text-xs sm:text-sm font-semibold text-[#7A431D] hover:text-[#372C2E] flex items-center gap-1 transition-colors"
            >
              <span>Show earlier education</span>
              <ChevronDown size={15} />
            </button>
          ) : (
            <div className="space-y-4 pt-2 border-t border-[#EBDED2]">
              <div className="bg-white border border-[#EBDED2] p-4 rounded-xl space-y-1">
                <div className="flex justify-between items-baseline">
                  <h4 className="text-sm font-bold text-[#372C2E]">
                    Engineering Programmes (Foundation)
                  </h4>
                  <span className="text-xs text-[#6E5A52]">2016 – 2017</span>
                </div>
                <p className="text-xs text-[#563727]">
                  Centre for Foundation Studies (IIUM) • <span className="font-semibold text-[#7A431D]">CGPA: 3.93</span>
                </p>
              </div>

              <div className="bg-white border border-[#EBDED2] p-4 rounded-xl space-y-1">
                <div className="flex justify-between items-baseline">
                  <h4 className="text-sm font-bold text-[#372C2E]">
                    Sijil Pelajaran Malaysia (Aliran Sains Tulen)
                  </h4>
                  <span className="text-xs text-[#6E5A52]">2014 – 2015</span>
                </div>
                <p className="text-xs text-[#563727]">
                  Maktab Mahmud Alor Setar (MMAS) • <span className="font-semibold text-[#7A431D]">Result: 9A's 2B's</span>
                </p>
              </div>

              <button
                onClick={() => setShowMoreEducation(false)}
                className="text-xs font-semibold text-[#7A431D] hover:text-[#372C2E] flex items-center gap-1 transition-colors"
              >
                <span>Hide</span>
                <ChevronUp size={15} />
              </button>
            </div>
          )}

        </div>
      </section>

      {/* ================= SKILLS SECTION (TOOLBOX) ================= */}
      <Toolbox />

      {/* ================= PROJECTS SECTION ================= */}
      <section id="projects" className="space-y-6">
        <div className="text-center space-y-2 max-w-2xl mx-auto">
          <div className="inline-block px-2.5 py-0.5 rounded-md bg-[#FDF6E9] text-[#7A431D] text-xs font-semibold border border-[#DE9E48]/30">
            My Projects
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-[#372C2E]">
            Check out my work
          </h2>
          {/* <p className="text-sm sm:text-base text-[#6E5A52]">
            I've built end-to-end industrial machine vision inspection systems, AIoT robotics, edge intelligence devices, and data modeling pipelines.
          </p> */}
        </div>

        {/* Project Type Filter Tabs (Professional, Academic, Personal) */}
        <div className="flex justify-center pt-1 pb-1">
          <div 
            role="tablist"
            aria-label="Project Categories"
            className="inline-flex items-center p-1.5 rounded-2xl bg-[#F5EFEB] border border-[#EBDED2] shadow-xs gap-1 sm:gap-1.5"
          >
            {projectTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeProjectTab === tab.id;
              return (
                <button
                  key={tab.id}
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => {
                    setActiveProjectTab(tab.id);
                    setActivePopupId(null);
                  }}
                  className={`relative flex items-center gap-1.5 sm:gap-2 px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 cursor-pointer ${
                    isActive
                      ? "bg-white text-[#372C2E] shadow-sm border border-[#EBDED2] font-bold"
                      : "text-[#6E5A52] hover:text-[#372C2E] hover:bg-white/60"
                  }`}
                >
                  <Icon size={15} className={isActive ? "text-[#DE9E48]" : "text-[#A08E87]"} />
                  <span>{tab.label}</span>
                  <span
                    className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold leading-none transition-colors ${
                      isActive
                        ? "bg-[#FDF6E9] text-[#7A431D] border border-[#DE9E48]/40"
                        : "bg-[#EBDED2]/60 text-[#6E5A52]"
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Responsive Card Grid */}
        {(() => {
          const filteredProjects = projectsData.filter((p) => p.projectType === activeProjectTab);
          return (
            <div
              className={`grid gap-6 pt-2 animate-in fade-in duration-300 ${
                filteredProjects.length === 1
                  ? "grid-cols-1 md:max-w-xl md:mx-auto w-full"
                  : "grid-cols-1 md:grid-cols-2"
              }`}
            >
              {filteredProjects.map((project, index) => {
                const isLeftColumn = filteredProjects.length === 1 ? false : index % 2 === 0;
                return (
                  <div
                    key={project.id}
                    className={`group relative flex flex-col rounded-2xl border transition-all duration-300 ${
                      project.highlight
                        ? "border-[#DE9E48]/60 bg-gradient-to-b from-white via-white to-[#FDFBF7] ring-1 ring-[#DE9E48]/30 shadow-md hover:shadow-xl hover:border-[#DE9E48]"
                        : "border-[#EBDED2] bg-white hover:shadow-lg hover:border-[#DE9E48]"
                    } ${
                      activePopupId === project.id ? "z-30" : "z-0"
                    }`}
                  >
                    {/* Image Preview Banner */}
                    <div 
                      className="relative aspect-video w-full bg-[#F5EFEB] overflow-hidden rounded-t-2xl cursor-pointer"
                      onClick={() => handleOpenModal(project.images[0], project.title)}
                    >
                      <Image
                        src={project.images[0]}
                        alt={project.title}
                        fill
                        sizes="(max-width: 1024px) 100vw, 550px"
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-[#372C2E]/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        {project.playgroundTab ? (
                          <Link
                            href={`/playground?tab=${project.playgroundTab}`}
                            onClick={(e) => e.stopPropagation()}
                            className="px-3.5 py-1.5 rounded-full bg-[#372C2E]/80 text-white text-xs font-medium flex items-center gap-1.5 backdrop-blur-xs"
                          >
                            <Gamepad2 size={13} /> Try in Playground
                          </Link>
                        ) : (
                          <span className="px-3.5 py-1.5 rounded-full bg-[#372C2E]/80 text-white text-xs font-medium flex items-center gap-1.5 backdrop-blur-xs">
                            <Eye size={13} /> View Image
                          </span>
                        )}
                      </div>

                      {/* Highlight Badge for Personal Projects */}
                      {/* {project.highlight && (
                        <div className="absolute top-3 right-3 z-10 pointer-events-none">
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#372C2E]/85 text-[#DE9E48] border border-[#DE9E48]/50 shadow-md backdrop-blur-xs flex items-center gap-1">
                            <Sparkles size={11} className="text-[#DE9E48]" /> AI Playground
                          </span>
                        </div>
                      )} */}
                    </div>

                    {/* Card Body */}
                    <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs text-[#6E5A52]">
                          <span className="font-bold text-[#DE9E48] uppercase tracking-wider">{project.category}</span>
                          <span className="font-medium">{project.dates}</span>
                        </div>

                        <h3 className="text-lg font-bold text-[#372C2E] group-hover:text-[#7A431D] transition-colors">
                          {project.title}
                        </h3>

                        {/* Truncated Sentence with "Show More" Button */}
                        <p className="text-xs sm:text-sm text-[#563727] leading-relaxed">
                          {project.shortDescription ? (
                            <>
                              <span>{project.shortDescription}... </span>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActivePopupId(activePopupId === project.id ? null : project.id);
                                }}
                                className="text-[#DE9E48] hover:text-[#7A431D] font-bold text-xs underline underline-offset-2 transition-colors cursor-pointer inline-flex items-center gap-0.5 ml-0.5"
                              >
                                Show More
                              </button>
                            </>
                          ) : (
                            project.description
                          )}
                        </p>
                      </div>

                      {/* Tech Stack Badges and Action Footer */}
                      <div className="space-y-3 pt-2">
                        <div className="flex flex-wrap gap-1.5">
                          {project.tags.map((tag) => (
                            <span
                              key={tag}
                              className="px-2 py-0.5 text-[11px] font-medium rounded-md bg-[#F5EFEB] text-[#563727] border border-[#EBDED2]"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>

                        {/* Action Row */}
                        {(project.playgroundTab || project.link) && (
                          <div className="pt-2.5 border-t border-[#EBDED2] flex items-center justify-between">
                            {project.link ? (
                              <Link
                                href={project.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg bg-[#372C2E] text-white hover:bg-[#563727] transition-colors"
                              >
                                <span>{project.linkLabel || "Details"}</span>
                                <ExternalLink size={11} />
                              </Link>
                            ) : null}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Direction-Aware Full Paragraph Flyout Popup */}
                    {activePopupId === project.id && (
                      <div
                        ref={popupRef}
                        onClick={(e) => e.stopPropagation()}
                        className={`absolute z-50 p-5 sm:p-6 rounded-2xl bg-white/95 backdrop-blur-md border-2 border-[#DE9E48]/70 shadow-2xl transition-all duration-300 text-left animate-in fade-in zoom-in-95 ${
                          isLeftColumn
                            ? "xl:left-auto xl:right-[calc(100%+16px)] xl:top-0 xl:w-80 2xl:w-96 inset-x-2 top-2"
                            : "xl:left-[calc(100%+16px)] xl:right-auto xl:top-0 xl:w-80 2xl:w-96 inset-x-2 top-2"
                        }`}
                      >
                        {/* Directional Arrow Notch on Wide Screens */}
                        {isLeftColumn ? (
                          <div className="hidden xl:block absolute top-12 -right-3 w-0 h-0 border-y-8 border-y-transparent border-l-10 border-l-[#DE9E48]" />
                        ) : (
                          <div className="hidden xl:block absolute top-12 -left-3 w-0 h-0 border-y-8 border-y-transparent border-r-10 border-r-[#DE9E48]" />
                        )}

                        {/* Popup Header */}
                        <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-[#EBDED2]">
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-bold text-[#DE9E48] uppercase tracking-wider">
                              {project.category}
                            </span>
                            <span className="text-xs text-[#6E5A52]">• {project.dates}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setActivePopupId(null)}
                            className="p-1 rounded-md text-[#7A431D] hover:text-[#372C2E] hover:bg-[#F5EFEB] transition-colors cursor-pointer"
                            title="Close popup"
                          >
                            <X size={16} />
                          </button>
                        </div>

                        {/* Project Title */}
                        <h4 className="font-bold text-base sm:text-lg text-[#372C2E] mb-2 leading-snug">
                          {project.title}
                        </h4>

                        {/* Full Paragraph */}
                        <p className="text-xs sm:text-sm text-[#563727] leading-relaxed">
                          {project.description}
                        </p>

                        {/* Tech Badges */}
                        <div className="flex flex-wrap gap-1.5 mt-4 pt-3 border-t border-[#EBDED2]">
                          {project.tags.map((tag) => (
                            <span
                              key={tag}
                              className="px-2 py-0.5 text-[10px] font-medium rounded-md bg-[#F5EFEB] text-[#563727] border border-[#EBDED2]"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>

                        {/* Footer Close / Details Button */}
                        <div className="flex items-center justify-between mt-4 pt-2 border-t border-[#EBDED2]">
                          <button
                            type="button"
                            onClick={() => setActivePopupId(null)}
                            className="text-xs font-bold text-[#7A431D] hover:text-[#372C2E] underline underline-offset-2 transition-colors cursor-pointer"
                          >
                            Show less
                          </button>
                          {project.playgroundTab ? (
                            <Link
                              href={`/playground?tab=${project.playgroundTab}`}
                              className="px-3.5 py-1.5 text-xs font-bold rounded-lg bg-[#DE9E48] text-[#372C2E] hover:bg-[#c88b3b] shadow-xs hover:shadow-md transition-all flex items-center gap-1.5 group/popbtn cursor-pointer"
                            >
                              <span>Try Me</span>
                              <ArrowRight size={13} className="transition-transform group-hover/popbtn:translate-x-0.5" />
                            </Link>
                          ) : project.link ? (
                            <Link
                              href={project.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-3 py-1 text-xs font-semibold rounded-md bg-[#372C2E] text-white hover:bg-[#563727] transition-colors flex items-center gap-1"
                            >
                              <span>{project.linkLabel || "Details"}</span>
                              <ExternalLink size={11} />
                            </Link>
                          ) : null}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })()}
      </section>

      {/* ================= INTERACTIVE PLAYGROUND SPOTLIGHT ================= */}
      <section className="relative overflow-hidden rounded-3xl p-6 sm:p-10 bg-gradient-to-br from-[#372C2E] via-[#563727] to-[#7A431D] text-white shadow-xl">
        <div className="relative z-10 space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#DE9E48]/20 text-[#DE9E48] border border-[#DE9E48]/40 text-xs font-semibold backdrop-blur-xs">
            <Sparkles size={13} />
            <span>Interactive Industrial Sandbox</span>
          </div>

          <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white">
            Explore My AI Playground & Live Models
          </h2>

          <p className="text-sm sm:text-base text-[#F5EFEB] max-w-2xl leading-relaxed">
            Test various AI tools right in the browser
          </p>

          <div className="pt-2">
            <Link
              href="/playground"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#DE9E48] text-[#372C2E] font-extrabold rounded-xl text-sm hover:bg-[#ecc07b] transition-all duration-200 shadow-md group"
            >
              <Gamepad2 size={18} className="group-hover:rotate-12 transition-transform" />
              <span>Launch Playground Page</span>
              <ArrowUpRight size={16} className="text-[#372C2E] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </Link>
          </div>
        </div>
      </section>

      {/* ================= HACKATHONS & AWARDS SECTION ================= */}
      <section id="awards" className="space-y-6">
        <div className="space-y-1">
          <div className="inline-block px-2.5 py-0.5 rounded-md bg-[#FDF6E9] text-[#7A431D] text-xs font-semibold border border-[#DE9E48]/30">
            Hackathons & Awards
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#372C2E]">
            I like building & competing
          </h2>
          {/* <p className="text-xs sm:text-sm text-[#6E5A52]">
            Recognition from national and international engineering challenges, hackathons, and symposiums.
          </p> */}
        </div>

        {/* Awards Timeline List */}
        <div className="space-y-3 pt-2">
          {awardsData.map((award, index) => (
            <div
              key={index}
              onClick={() => handleOpenModal(award.imageSrc, award.title)}
              className="group flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-5 rounded-xl border border-[#EBDED2] bg-white hover:border-[#DE9E48] hover:shadow-xs transition-all cursor-pointer gap-2 sm:gap-4"
            >
              {/* Left Date / Badge */}
              <div className="flex items-center gap-2 sm:w-36 shrink-0">
                <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-[#F5EFEB] text-[#563727] border border-[#EBDED2]">
                  {award.date}
                </span>
                {award.badge && (
                  <span className="sm:hidden text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#FDF6E9] text-[#7A431D] border border-[#DE9E48]/30">
                    {award.badge}
                  </span>
                )}
              </div>

              {/* Title & Organization */}
              <div className="flex-1">
                <h3 className="text-xs sm:text-sm font-bold text-[#372C2E] group-hover:text-[#7A431D] transition-colors leading-snug">
                  {award.title}
                </h3>
                <p className="text-[11px] sm:text-xs text-[#6E5A52] mt-0.5">
                  {award.organization}
                </p>
              </div>

              {/* Certificate Action */}
              <div className="hidden sm:flex items-center gap-1.5 text-xs text-[#7A431D] font-medium group-hover:text-[#DE9E48] shrink-0">
                <span>View Certificate</span>
                <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ================= CERTIFICATIONS SECTION ================= */}
      <section id="certifications" className="space-y-6">
        <div className="space-y-1">
          <div className="inline-block px-2.5 py-0.5 rounded-md bg-[#FDF6E9] text-[#7A431D] text-xs font-semibold border border-[#DE9E48]/30">
            Certifications
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#372C2E]">
            Professional Credentials
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          
          {/* Azure AI Engineer */}
          <Link
            href="https://learn.microsoft.com/en-us/users/hafizimalik-4920/credentials/fa9a011f5ecf0c39?ref=https%3A%2F%2Fwww.linkedin.com%2F"
            target="_blank"
            rel="noopener noreferrer"
            className="p-5 rounded-xl border border-[#EBDED2] bg-white hover:border-[#DE9E48] hover:shadow-xs transition-all flex flex-col justify-between group"
          >
            <div>
              <div className="flex justify-between items-start gap-2">
                <h3 className="text-sm font-bold text-[#372C2E] group-hover:text-[#7A431D]">
                  Azure AI Engineer Associate (AI-102)
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#FDF6E9] text-[#7A431D] shrink-0 border border-[#DE9E48]/30">2024</span>
              </div>
              <p className="text-xs text-[#7A431D] font-semibold mt-1">Microsoft</p>
              <p className="text-xs text-[#563727] mt-2">
                API-Based AI Integration and Cloud AI Workflows
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-[#EBDED2] flex items-center justify-between text-xs text-[#7A431D] font-semibold group-hover:text-[#DE9E48]">
              <span>Verify Credential</span>
              <ExternalLink size={12} />
            </div>
          </Link>

          {/* Azure AI Fundamentals */}
          <Link
            href="https://learn.microsoft.com/en-us/users/hafizimalik-4920/credentials/3fb7b32295dc8d1b?ref=https%3A%2F%2Fwww.linkedin.com%2F"
            target="_blank"
            rel="noopener noreferrer"
            className="p-5 rounded-xl border border-[#EBDED2] bg-white hover:border-[#DE9E48] hover:shadow-xs transition-all flex flex-col justify-between group"
          >
            <div>
              <div className="flex justify-between items-start gap-2">
                <h3 className="text-sm font-bold text-[#372C2E] group-hover:text-[#7A431D]">
                  Azure AI Fundamentals (AI-900)
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#FDF6E9] text-[#7A431D] shrink-0 border border-[#DE9E48]/30">2024</span>
              </div>
              <p className="text-xs text-[#7A431D] font-semibold mt-1">Microsoft</p>
              <p className="text-xs text-[#563727] mt-2">
                Conceptual Knowledge of AI Solutions & Cloud Architecture
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-[#EBDED2] flex items-center justify-between text-xs text-[#7A431D] font-semibold group-hover:text-[#DE9E48]">
              <span>Verify Credential</span>
              <ExternalLink size={12} />
            </div>
          </Link>

          {/* Peneraju Teknologi PLUS */}
          <div className="p-5 rounded-xl border border-[#EBDED2] bg-white flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start gap-2">
                <h3 className="text-sm font-bold text-[#372C2E]">
                  Peneraju Teknologi PLUS AI & Machine Learning
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#FDF6E9] text-[#7A431D] shrink-0 border border-[#DE9E48]/30">2024</span>
              </div>
              <p className="text-xs text-[#7A431D] font-semibold mt-1">YPPB - KISMEC</p>
              <p className="text-xs text-[#563727] mt-2">
                Python, SQL, Azure AI Services, and Power BI
              </p>
            </div>
          </div>

          {/* CUTe IIUM Deep Learning */}
          <div
            onClick={() => handleOpenModal('/cute_certificate.jpg', 'Deep Learning in Intelligent Video Analytics and Computer Vision')}
            className="p-5 rounded-xl border border-[#EBDED2] bg-white hover:border-[#DE9E48] hover:shadow-xs transition-all flex flex-col justify-between cursor-pointer group"
          >
            <div>
              <div className="flex justify-between items-start gap-2">
                <h3 className="text-sm font-bold text-[#372C2E] group-hover:text-[#7A431D]">
                  Deep Learning in Video Analytics & Computer Vision
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#FDF6E9] text-[#7A431D] shrink-0 border border-[#DE9E48]/30">2023</span>
              </div>
              <p className="text-xs text-[#7A431D] font-semibold mt-1">CUTe IIUM</p>
              <p className="text-xs text-[#563727] mt-2">
                PyTorch and NVIDIA Jetson Deployment
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-[#EBDED2] flex items-center justify-between text-xs text-[#7A431D] font-semibold group-hover:text-[#DE9E48]">
              <span>View Certificate</span>
              <ChevronRight size={12} />
            </div>
          </div>

        </div>
      </section>

      {/* ================= CONTACT SECTION ================= */}
      <section id="contact" className="space-y-8 pt-4">
        <div className="text-center space-y-2 max-w-xl mx-auto">
          <div className="inline-block px-2.5 py-0.5 rounded-md bg-[#FDF6E9] text-[#7A431D] text-xs font-semibold border border-[#DE9E48]/30">
            Contact
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-[#372C2E]">
            Get in Touch
          </h2>
          <p className="text-sm sm:text-base text-[#6E5A52]">
            Want to discuss an industrial AI project, machine vision opportunity, or collaboration? Reach out directly.
          </p>
        </div>

        {/* Quick Contact Links / Badges */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3.5">
          
          {/* Email */}
          <div className="p-4 rounded-xl border border-[#EBDED2] bg-white flex flex-col justify-between gap-2 shadow-xs">
            <div className="flex items-center gap-2 text-[#7A431D]">
              <Mail size={16} className="text-[#DE9E48]" />
              <span className="text-xs font-bold text-[#372C2E]">Email</span>
            </div>
            <button
              onClick={handleCopyEmail}
              className="text-left text-xs text-[#563727] truncate hover:text-[#DE9E48] flex items-center justify-between gap-1"
            >
              <span className="truncate">{emailAddress}</span>
              {copiedEmail ? <Check size={13} className="text-[#DE9E48] shrink-0" /> : <Copy size={13} className="shrink-0 text-[#7A431D]" />}
            </button>
          </div>

          {/* WhatsApp */}
          <a
            href="https://wa.me/60108175109"
            target="_blank"
            rel="noopener noreferrer"
            className="p-4 rounded-xl border border-[#EBDED2] bg-white hover:border-[#DE9E48] transition-colors flex flex-col justify-between gap-2 shadow-xs"
          >
            <div className="flex items-center gap-2 text-[#7A431D]">
              <Phone size={16} className="text-[#DE9E48]" />
              <span className="text-xs font-bold text-[#372C2E]">WhatsApp</span>
            </div>
            <span className="text-xs text-[#563727]">+60 10-817 5109</span>
          </a>

          {/* LinkedIn */}
          <a
            href="https://www.linkedin.com/in/hafizi-malik/"
            target="_blank"
            rel="noopener noreferrer"
            className="p-4 rounded-xl border border-[#EBDED2] bg-white hover:border-[#DE9E48] transition-colors flex flex-col justify-between gap-2 shadow-xs"
          >
            <div className="flex items-center gap-2 text-[#7A431D]">
              <svg className="w-4 h-4 fill-[#DE9E48]" viewBox="0 0 24 24">
                <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
              </svg>
              <span className="text-xs font-bold text-[#372C2E]">LinkedIn</span>
            </div>
            <span className="text-xs text-[#563727] truncate">hafizi-malik</span>
          </a>

          {/* Location */}
          <div className="p-4 rounded-xl border border-[#EBDED2] bg-white flex flex-col justify-between gap-2 shadow-xs">
            <div className="flex items-center gap-2 text-[#7A431D]">
              <MapPin size={16} className="text-[#DE9E48]" />
              <span className="text-xs font-bold text-[#372C2E]">Location</span>
            </div>
            <span className="text-xs text-[#563727]">Selangor, Malaysia</span>
          </div>

        </div>

        {/* Minimal Clean Contact Form */}
        <div className="p-6 sm:p-8 rounded-2xl border border-[#EBDED2] bg-[#F9F6F0]">
          <form onSubmit={handleFormSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Your Name"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-3 rounded-lg border border-[#EBDED2] bg-white text-xs sm:text-sm text-[#372C2E] placeholder-[#A08E87] outline-none focus:ring-2 focus:ring-[#DE9E48] focus:border-[#DE9E48]"
              />
              <input
                type="email"
                placeholder="Your Email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-3 rounded-lg border border-[#EBDED2] bg-white text-xs sm:text-sm text-[#372C2E] placeholder-[#A08E87] outline-none focus:ring-2 focus:ring-[#DE9E48] focus:border-[#DE9E48]"
              />
            </div>

            <input
              type="tel"
              placeholder="Your Phone / WhatsApp (Optional)"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-4 py-3 rounded-lg border border-[#EBDED2] bg-white text-xs sm:text-sm text-[#372C2E] placeholder-[#A08E87] outline-none focus:ring-2 focus:ring-[#DE9E48] focus:border-[#DE9E48]"
            />

            <textarea
              placeholder="Your Message..."
              rows={4}
              required
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              className="w-full px-4 py-3 rounded-lg border border-[#EBDED2] bg-white text-xs sm:text-sm text-[#372C2E] placeholder-[#A08E87] outline-none focus:ring-2 focus:ring-[#DE9E48] focus:border-[#DE9E48] resize-none"
            />

            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
              <button
                type="submit"
                disabled={formStatus === "loading"}
                className="w-full sm:w-auto px-7 py-3 rounded-lg bg-[#372C2E] text-white font-bold text-xs sm:text-sm hover:bg-[#563727] transition-colors disabled:opacity-50 shadow-xs"
              >
                {formStatus === "loading" ? "Sending..." : "Send Message"}
              </button>

              {formStatus === "success" && (
                <p className="text-xs text-[#7A431D] font-bold">
                  Message sent successfully! I'll reply soon.
                </p>
              )}
              {formStatus === "error" && (
                <p className="text-xs text-red-600 font-medium">
                  Failed to send. Please email me at {emailAddress}
                </p>
              )}
            </div>
          </form>
        </div>
      </section>

      {/* ================= LIGHTBOX / IMAGE MODAL ================= */}
      {selectedImage && (
        <div
          onClick={handleCloseModal}
          className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl max-w-3xl w-full p-4 sm:p-6 shadow-2xl relative flex flex-col max-h-[90vh] border border-[#EBDED2]"
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#EBDED2]">
              <h3 className="text-sm sm:text-base font-bold text-[#372C2E] truncate pr-6">
                {selectedTitle}
              </h3>
              <button
                onClick={handleCloseModal}
                className="p-1.5 text-[#7A431D] hover:text-[#372C2E] rounded-full hover:bg-[#F5EFEB] transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="relative my-4 flex-grow flex items-center justify-center min-h-[250px] sm:min-h-[350px] bg-[#F5EFEB] rounded-xl overflow-hidden">
              <div className="relative w-full h-[300px] sm:h-[450px]">
                <Image
                  src={selectedImage}
                  alt={selectedTitle}
                  fill
                  className="object-contain"
                  sizes="(max-width: 1024px) 100vw, 800px"
                />
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <button
                onClick={handleCloseModal}
                className="px-5 py-2 bg-[#372C2E] text-white text-xs sm:text-sm font-semibold rounded-lg hover:bg-[#563727] transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= IEEE POPUP MODAL ================= */}
      {showIEEEPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white p-6 rounded-2xl shadow-xl max-w-md w-full border border-[#EBDED2]">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-bold text-base text-[#372C2E]">IEEE Xplore Publication</h3>
              <button
                onClick={() => setShowIEEEPopup(false)}
                className="p-1 text-[#7A431D] hover:text-[#372C2E] rounded-md transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            
            <p className="text-xs text-[#563727] mb-4 leading-relaxed">
              Due to institutional firewall restrictions on IEEE Xplore, direct linking can occasionally be blocked. 
              Please copy the URL below to view the paper directly:
            </p>

            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                readOnly
                value={ieeeLink}
                className="flex-1 bg-[#F5EFEB] border border-[#EBDED2] rounded-lg px-3 py-2 text-xs text-[#372C2E] outline-none truncate"
              />
              <button
                onClick={handleCopyIEEE}
                className="flex items-center justify-center gap-1.5 bg-[#372C2E] text-white px-4 py-2 rounded-lg text-xs font-semibold hover:bg-[#563727] transition-colors shrink-0"
              >
                {copiedIEEE ? <Check size={14} className="text-[#DE9E48]" /> : <Copy size={14} />}
                <span>{copiedIEEE ? "Copied" : "Copy"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= FOOTER ================= */}
      <footer className="pt-12 border-t border-[#EBDED2] text-center text-xs text-[#6E5A52] space-y-1">
        <p>© {new Date().getFullYear()} Hafizi Malik. Built with Next.js & Tailwind CSS.</p>
        <p className="text-[11px] text-[#A08E87]">Hafizi Malik Portfolio</p>
      </footer>

    </div>
  );
}
