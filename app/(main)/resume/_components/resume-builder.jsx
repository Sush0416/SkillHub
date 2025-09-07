"use client";

import { Button } from "@/components/ui/button";
import { Download, Save } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { resumeSchema } from "@/app/lib/schema";
import { saveResume } from "@/actions/resume";
import useFetch from "@/hooks/use-fetch";
import { useEffect } from "react";

const ResumeBuilder = ({initialContent}) => {
      const [activeTab, setActiveTab] = useState("edit");

 const {
    control,
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
        resolver:zodResolver(resumeSchema),
    defaultValues: {
      contactInfo: {},
      summary: "",
      skills: "",
      experience: [],
      education: [],
      projects: [],
    },
});

const {
    loading: isSaving,
    fn: saveResumeFn,
    data: saveResult,
    error: saveError,
  } = useFetch(saveResume);

    const formValues=watch();

    useEffect(() => {
    if (initialContent) setActiveTab("preview");
  }, [initialContent]);

    
  return (
    <div className="space-y-4">
     <div className="flex flex-col md:flex-row justify-between items-center gap-2">
        <h1 className="font-bold gradient-title text-5xl md:text-6xl">
            Resume Builder
        </h1>
     

     <div className="space-x-2">
        <Button variant="destructive">
            <Save className = "h-4 w-4"/>
                Save
        </Button>
        <Button >
            <Download className = "h-4 w-4"/>
                Download
        </Button>
     </div>
    </div>
     <Tabs value={activeTab} onValueChange={setActiveTab} >
        <TabsList>
          <TabsTrigger value="edit">Form</TabsTrigger>
          <TabsTrigger value="preview">Markdown</TabsTrigger>
        </TabsList>
        <TabsContent value="edit"> Make changes</TabsContent>
        <form >
            <div>
                <h3 className="text-lg font-medium">
                Contact Information
                </h3>
                <div>
                  
                </div>
            </div>
        </form>
        <TabsContent value="preview">change your </TabsContent>

     
        <TabsContent value="preview">Chnage</TabsContent>
      </Tabs>
     </div>
  )
}

export default ResumeBuilder;
