"use client";

import { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  AlertTriangle,
  Download,
  Edit,
  Loader2,
  Monitor,
  Save,
} from "lucide-react";
import { toast } from "sonner";
import MDEditor from "@uiw/react-md-editor";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { saveResume } from "@/actions/resume";
import { EntryForm } from "./entry-form";
import useFetch from "@/hooks/use-fetch";
import { useUser } from "@clerk/nextjs";
import { entriesToMarkdown } from "@/app/lib/helper";
import { resumeSchema } from "@/app/lib/schema";

export default function ResumeBuilder({ initialContent }) {
  const { user } = useUser();
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState("edit");
  const [previewContent, setPreviewContent] = useState(initialContent);
  const [resumeMode, setResumeMode] = useState("preview");
  const [isGenerating, setIsGenerating] = useState(false);

  const {
    control,
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(resumeSchema),
    defaultValues: {
      contactInfo: {},
      summary: "",
      skills: "",
      experience: [],
      education: [],
      projects: [],
    },
  });

  const { loading: isSaving, fn: saveResumeFn, data: saveResult, error: saveError } =
    useFetch(saveResume);

  const formValues = watch();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (initialContent) setActiveTab("preview");
  }, [initialContent]);

  useEffect(() => {
    if (activeTab === "edit") {
      const newContent = getCombinedContent();
      setPreviewContent(newContent || initialContent);
    }
  }, [formValues, activeTab]);

  useEffect(() => {
    if (saveResult && !isSaving) {
      toast.success("Resume saved successfully!");
    }
    if (saveError) {
      toast.error(saveError.message || "Failed to save resume");
    }
  }, [saveResult, saveError, isSaving]);

  const getContactMarkdown = () => {
    if (!user) return "";
    const { contactInfo } = formValues;
    const parts = [];
    if (contactInfo.email) parts.push(`📧 ${contactInfo.email}`);
    if (contactInfo.mobile) parts.push(`📱 ${contactInfo.mobile}`);
    if (contactInfo.linkedin) parts.push(`💼 [LinkedIn](${contactInfo.linkedin})`);
    if (contactInfo.twitter) parts.push(`🐦 [Twitter](${contactInfo.twitter})`);

    return parts.length > 0
      ? `## <div align="center">${user.fullName}</div>
<div align="center">
${parts.join(" | ")}
</div>`
      : "";
  };

  const getCombinedContent = () => {
    const { summary, skills, experience, education, projects } = formValues;
    return [
      getContactMarkdown(),
      summary && `## Professional Summary\n\n${summary}`,
      skills && `## Skills\n\n${skills}`,
      entriesToMarkdown(experience, "Work Experience"),
      entriesToMarkdown(education, "Education"),
      entriesToMarkdown(projects, "Projects"),
    ]
      .filter(Boolean)
      .join("\n\n");
  };

  const generatePDF = async () => {
    if (!previewContent) {
      toast.error("Nothing to generate!");
      return;
    }

    setIsGenerating(true);
    try {
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF();
      doc.setFontSize(12);
      const lines = previewContent.split('\n');
      let y = 20;
      const pageHeight = 297; // A4 height in mm
      const marginBottom = 20;

      lines.forEach(line => {
        if (line.trim() === '') {
          y += 10;
        } else {
          // Check for page break
          if (y > pageHeight - marginBottom) {
            doc.addPage();
            y = 20;
          }

          // Handle headers
          if (line.startsWith('## ')) {
            doc.setFontSize(16);
            doc.setFont("helvetica", "bold");
            doc.text(line.replace('## ', ''), 20, y);
            doc.setFontSize(12);
            doc.setFont("helvetica", "normal");
          } else if (line.startsWith('# ')) {
            doc.setFontSize(18);
            doc.setFont("helvetica", "bold");
            doc.text(line.replace('# ', ''), 20, y);
            doc.setFontSize(12);
            doc.setFont("helvetica", "normal");
          } else {
            doc.text(line, 20, y);
          }
          y += 6;
        }
      });

      doc.save("resume.pdf");
    } catch (err) {
      console.error("PDF generation error:", err);
      toast.error("Failed to generate PDF");
    } finally {
      setIsGenerating(false);
    }
  };

  async function onSubmit() {
    try {
      await saveResumeFn(previewContent);
    } catch (err) {
      console.error(err);
    }
  }

  if (!mounted) return null; // Prevent SSR hydration mismatch

  return (
    <div data-color-mode="light" className="space-y-4">
      <div className="flex flex-col md:flex-row justify-between items-center gap-2">
        <h1 className="font-bold gradient-title text-5xl md:text-6xl">
          Resume Builder
        </h1>
        <div className="space-x-2">
          <Button variant="destructive" onClick={handleSubmit(onSubmit)} disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Save
              </>
            )}
          </Button>
          <Button onClick={generatePDF} disabled={isGenerating}>
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating PDF...
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                Download PDF
              </>
            )}
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="edit">Form</TabsTrigger>
          <TabsTrigger value="preview">Markdown</TabsTrigger>
        </TabsList>

        <TabsContent value="edit">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            {/* Contact Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Contact Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded-lg bg-muted/50">
                <div className="space-y-2">
                  <label>Email</label>
                  <Input {...register("contactInfo.email")} placeholder="your@email.com" />
                  {errors.contactInfo?.email && (
                    <p className="text-sm text-red-500">{errors.contactInfo.email.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <label>Mobile Number</label>
                  <Input {...register("contactInfo.mobile")} placeholder="+1 234 567 8900" />
                </div>
                <div className="space-y-2">
                  <label>LinkedIn URL</label>
                  <Input {...register("contactInfo.linkedin")} placeholder="https://linkedin.com/in/your-profile" />
                </div>
                <div className="space-y-2">
                  <label>Twitter/X Profile</label>
                  <Input {...register("contactInfo.twitter")} placeholder="https://twitter.com/your-handle" />
                </div>
              </div>
            </div>

            {/* Summary */}
            <div className="space-y-4">
              <h3>Professional Summary</h3>
              <Controller
                name="summary"
                control={control}
                render={({ field }) => <Textarea {...field} className="h-32" />}
              />
            </div>

            {/* Skills */}
            <div className="space-y-4">
              <h3>Skills</h3>
              <Controller
                name="skills"
                control={control}
                render={({ field }) => <Textarea {...field} className="h-32" />}
              />
            </div>

            {/* Experience */}
            <div className="space-y-4">
              <h3>Work Experience</h3>
              <Controller
                name="experience"
                control={control}
                render={({ field }) => <EntryForm type="Experience" entries={field.value} onChange={field.onChange} />}
              />
            </div>

            {/* Education */}
            <div className="space-y-4">
              <h3>Education</h3>
              <Controller
                name="education"
                control={control}
                render={({ field }) => <EntryForm type="Education" entries={field.value} onChange={field.onChange} />}
              />
            </div>

            {/* Projects */}
            <div className="space-y-4">
              <h3>Projects</h3>
              <Controller
                name="projects"
                control={control}
                render={({ field }) => <EntryForm type="Project" entries={field.value} onChange={field.onChange} />}
              />
            </div>
          </form>
        </TabsContent>

        <TabsContent value="preview">
          <Button
            variant="link"
            type="button"
            className="mb-2"
            onClick={() => setResumeMode(resumeMode === "preview" ? "edit" : "preview")}
          >
            {resumeMode === "preview" ? (
              <>
                <Edit className="h-4 w-4" />
                Edit Resume
              </>
            ) : (
              <>
                <Monitor className="h-4 w-4" />
                Show Preview
              </>
            )}
          </Button>

          {resumeMode !== "preview" && (
            <div className="flex p-3 gap-2 items-center border-2 border-yellow-600 text-yellow-600 rounded mb-2">
              <AlertTriangle className="h-5 w-5" />
              <span className="text-sm">
                You will lose edited markdown if you update the form data.
              </span>
            </div>
          )}

          <div className="border rounded-lg">
            <MDEditor value={previewContent} onChange={setPreviewContent} height={800} preview={resumeMode} />
          </div>

          <div className="hidden">
            <div id="resume-pdf">
              <MDEditor.Markdown
                source={previewContent}
                style={{ background: "white", color: "black" }}
              />
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
