import React, { useState } from "react";
import ResumeForm from "../components/resume/ResumeForm";
import initialData from "../components/resume/initialData";
import { motion } from "motion/react";
import {
  FiArrowDownLeft,
  FiArrowLeft,
  FiArrowRight,
  FiEye,
} from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import PreviewResume from "../components/resume/PreviewResume";

const STEPS = [
  {
    step: 1,
    title: "Personal Information",
    subtitle: "Your basic contact details",
  },
  {
    step: 2,
    title: "Professional Summary",
    subtitle: "A quick intro about yourself",
  },
  {
    step: 3,
    title: "Skills",
    subtitle: "Your technical skills",
  },
  {
    step: 4,
    title: "Work Experience",
    subtitle: "Your past jobs and interviews",
  },
  {
    step: 5,
    title: "Projects",
    subtitle: "Projects you have built",
  },
  {
    step: 6,
    title: "Education",
    subtitle: "Your academic background",
  },
];

const TOTAL_STEPS = STEPS.length;

function ResumeBuilder({ user, setUser }) {
  const [currentStep, setCurrentStep] = useState(1);
  const [data, setData] = useState(initialData);
  const [showPreview, setShowPreview] = useState(false);
  const navigate = useNavigate();
  const progressPct = (currentStep / TOTAL_STEPS) * 100;
  const activeStep = STEPS.find((s) => s.step === currentStep);
  const goPrev = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };
  const goNext = () => {
    if (currentStep < TOTAL_STEPS) {
      setCurrentStep(currentStep + 1);
    }
  };

  const isLastStep = currentStep === STEPS.length;
  if (showPreview) {
    return (
      <PreviewResume
        data={data}
        user={user}
        setUser={setUser}
        onBack={() => setShowPreview(false)}
      />
    );
  }
  return (
    <div className="min-h-screen bg-white text-[#0A0A0A] flex flex-col">
      <motion.nav
        initial={{ y: -60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="sticky  top-0 z-20 border-b border-black/8 bg-white/80 backdrop-blur-xl"
      >
        <div className="mx-auto flex h-12 max-w-7xl items-center justify-between px-3 sm:px-5">
          <div
            onClick={() => navigate("/dashboard")}
            className="flex cursor-pointer items-center gap-1.5"
          >
            <span className="text-sm font-extrabold sm:text-base text-[#0A0A0A]">
              HireSaathi
            </span>
            <span className="hidden rounded bg-black/5 px-1.5 py-0.5 text-[10px] text-black/50 sm:block">
              Resume Builder
            </span>
          </div>
          <button
            onClick={() => setShowPreview(true)}
            className="flex h-8 items-center justify-center gap-2 rounded-lg border border-black/15 text-black/60 transition px-2 hover:border-[#0A0A0A] hover:text-[#0A0A0A]"
          >
            <FiEye size={20} />
          </button>
        </div>
      </motion.nav>
      {/* main container */}
      <div className="flex-1 px-3 py-4 sm:px-6 sm:py-8">
        <div className="mx-auto w-full max-w-2xl">
          <div className="mb-4">
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-[10px] text-black/40 font-medium">
                STEP {currentStep} OF {TOTAL_STEPS}
              </p>

              <p className="hidden text-[10px] text-black/40 sm:block">
                {Math.round(progressPct)}% complete
              </p>
            </div>
            <div className="w-full h-1 bg-black/8 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#0A0A0A] rounded-full transition-all duration-300"
                style={{ width: `${progressPct}%` }}
              />
            </div>

            <div className="mt-3">
              <h2 className="text-xl font-bold sm:text-2xl">
                {activeStep.title}
              </h2>
              <p className="mt-1 text-xs text-black/45 sm:text-sm">
                {activeStep.subtitle}
              </p>
            </div>
          </div>

          <div className="border-t border-black/8 mb-4" />
          <ResumeForm step={currentStep} data={data} setData={setData} />
          <div className="border-t border-black/8 mt-6 mt-4" />
          {/* navigation buttons */}
          {/* navigation buttons */}
          <div className="grid grid-cols-3 items-center mt-3">
            {/* Previous */}
            <div className="justify-self-start">
              <button
                onClick={goPrev}
                disabled={currentStep === 1}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-medium border transition-all ${
                  currentStep === 1
                    ? "border-black/8 text-black/25 cursor-not-allowed"
                    : "border-black/20 text-black/60 hover:border-black/40 hover:text-[#0A0A0A]"
                }`}
              >
                <FiArrowLeft size={15} />
                <span>Previous</span>
              </button>
            </div>

            {/* Step indicators */}
            <div className="flex items-center justify-center gap-1.5">
              {STEPS.map((s) => (
                <button
                  key={s.step}
                  onClick={() => setCurrentStep(s.step)}
                  className={`rounded-full transition-all ${
                    s.step === currentStep
                      ? "w-4 h-1.5 bg-[#0A0A0A]"
                      : s.step < currentStep
                        ? "w-1.5 h-1.5 bg-black/35"
                        : "w-1.5 h-1.5 bg-black/[0.12]"
                  }`}
                />
              ))}
            </div>

            {/* Preview */}
            <div className="justify-self-end">
              {isLastStep ? (
                <button
                  onClick={() => setShowPreview(true)}
                  className="flex items-center gap-1.5 whitespace-nowrap px-3.5 py-2 rounded-lg text-xs font-semibold bg-[#000000]/90 backdrop-blur-2xl border border-white/10 text-white shadow-[0_8px_24px_rgba(0,0,0,0.25)] hover:border-white/20 transition-all"
                >
                  <FiEye size={13} />
                  <span>Preview Resume</span>
                </button>
              ) : (
                <button
                  onClick={goNext}
                  className="flex items-center gap-1.5 whitespace-nowrap px-3.5 py-2 rounded-lg text-xs font-semibold bg-[#000000]/90 backdrop-blur-2xl border border-white/10 text-white shadow-[0_8px_24px_rgba(0,0,0,0.25)] hover:border-white/20 transition-all"
                >
                  <span className="flex items-center gap-1.5 whitespace-nowrap">
                    Next
                    <FiArrowRight size={13} />
                  </span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ResumeBuilder;
