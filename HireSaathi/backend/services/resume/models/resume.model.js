import mongoose from "mongoose";

const educationSchema = new mongoose.Schema(
  {
    institution: {
      type: String,
      default: "",
    },
    degree: {
      type: String,
      default: "",
    },
    duration: {
      type: String,
      default: "",
    },
    cgpa: {
      type: String,
      default: "",
    },
    grade: {
      type: String,
      default: "",
    },
    year: {
      type: String,
      default: "",
    },
  },
  { _id: false },
);

const projectSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      default: "",
    },
    technologies: {
      type: [String],
      default: [],
    },
    description: {
      type: String,
      default: "",
    },
  },
  { _id: false },
);

const experienceSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      default: "",
    },
    company: {
      type: String,
      default: "",
    },
    duration: {
      type: String,
      default: "",
    },
    responsibilities: {
      type: [String],
      default: [],
    },
  },
  { _id: false },
);

const resumeSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      unique: true,
    },

    name: {
      type: String,
      default: "",
    },

    email: {
      type: String,
      default: "",
    },

    phone: {
      type: String,
      default: "",
    },

    summary: {
      type: String,
      default: "",
    },

    skills: {
      type: [String],
      default: [],
    },

    education: {
      type: [educationSchema],
      default: [],
    },

    projects: {
      type: [projectSchema],
      default: [],
    },

    experience: {
      type: [experienceSchema],
      default: [],
    },

    certifications: {
      type: [String],
      default: [],
    },

    extractedText: {
      type: String,
      default: "",
    },
    score: {
      type: Number,
      default: 0,
    },
    suggestedRole: {
      type: String,
      default: "",
    },
    strengths: {
      type: [String],
      default: [],
    },
    weaknesses: {
      type: [String],
      default: [],
    },
    missingSkills: {
      type: [String],
      default: [],
    },
    recommendations: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  },
);

const Resume = mongoose.model("Resume", resumeSchema);

export default Resume;
