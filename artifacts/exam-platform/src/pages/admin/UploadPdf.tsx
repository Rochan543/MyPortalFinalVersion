import React, { useState, useRef } from "react";
import { Link } from "wouter";
import { useUploadPdf, useGetExams } from "@workspace/api-client-react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { UploadCloud, FileType, CheckCircle2 } from "lucide-react";
import { Question } from "@workspace/api-client-react";

export function AdminUploadPdf() {
  const [file, setFile] = useState<File | null>(null);
  const [examId, setExamId] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  
  const [extractedData, setExtractedData] = useState<{count: number, questions: Question[]} | null>(null);

  const { data: examsData } = useGetExams({ limit: 100 });
  const uploadMutation = useUploadPdf();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selected = e.target.files[0];
      if (selected.type !== "application/pdf") {
        toast({ title: "Invalid file", description: "Please upload a PDF file", variant: "destructive" });
        return;
      }
      setFile(selected);
    }
  };

  const handleUpload = () => {
    if (!file) return;
    
    // Create FormData manually since useUploadPdf expects PdfUploadRequest
    // In a real scenario, orval handles multipart if configured properly
    // This is a simulation since we mock the endpoint
    uploadMutation.mutate(
      { data: { file: file as any, examId: examId ? parseInt(examId) : undefined } },
      {
        onSuccess: (res) => {
          setExtractedData({ count: res.extractedCount, questions: res.questions });
          toast({ title: "Extraction complete", description: `Found ${res.extractedCount} questions` });
        },
        onError: (err) => {
          toast({ title: "Upload failed", description: err.message, variant: "destructive" });
        }
      }
    );
  };

  const exams = examsData?.exams || [];

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-4xl">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Upload Questions from PDF</h2>
          <p className="text-muted-foreground mt-2">
            Our AI will extract questions, options, and answers from structured PDF files.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>File Upload</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Target Exam (Optional)</Label>
                <Select value={examId} onValueChange={setExamId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select an exam to attach questions to" />
                  </SelectTrigger>
                  <SelectContent>
                    {exams.map(e => (
                      <SelectItem key={e.id} value={e.id.toString()}>{e.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">If not selected, questions will just be extracted for review.</p>
              </div>

              <div 
                className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${file ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/50 hover:border-primary/50'}`}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                    if (e.dataTransfer.files[0].type === "application/pdf") {
                      setFile(e.dataTransfer.files[0]);
                    }
                  }
                }}
              >
                <input 
                  type="file" 
                  accept="application/pdf" 
                  className="hidden" 
                  ref={fileInputRef}
                  onChange={handleFileChange}
                />
                
                {file ? (
                  <div className="flex flex-col items-center">
                    <FileType className="h-12 w-12 text-primary mb-4" />
                    <p className="font-medium text-lg">{file.name}</p>
                    <p className="text-sm text-muted-foreground mb-4">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                    <Button variant="outline" size="sm" onClick={() => setFile(null)}>Change File</Button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                    <UploadCloud className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="font-medium text-lg">Click or drag PDF here</p>
                    <p className="text-sm text-muted-foreground mt-1">Maximum file size: 10MB</p>
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter className="flex justify-end bg-muted/50">
              <Button onClick={handleUpload} disabled={!file || uploadMutation.isPending}>
                {uploadMutation.isPending ? "Processing PDF..." : "Extract Questions"}
              </Button>
            </CardFooter>
          </Card>

          {extractedData && (
            <Card className="md:col-span-2 border-green-200">
              <CardHeader className="bg-green-50 border-b border-green-100 pb-4">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  <CardTitle className="text-green-800">Extraction Successful</CardTitle>
                </div>
                <CardDescription className="text-green-700 font-medium">
                  Successfully extracted {extractedData.count} questions from the PDF.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y max-h-[500px] overflow-y-auto">
                  {extractedData.questions.map((q, idx) => (
                    <div key={idx} className="p-4 hover:bg-muted/50">
                      <div className="font-medium mb-2">{idx + 1}. {q.questionText}</div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className={`${q.correctAnswer === 'A' ? 'font-bold text-green-700' : ''}`}>A. {q.optionA}</div>
                        <div className={`${q.correctAnswer === 'B' ? 'font-bold text-green-700' : ''}`}>B. {q.optionB}</div>
                        <div className={`${q.correctAnswer === 'C' ? 'font-bold text-green-700' : ''}`}>C. {q.optionC}</div>
                        <div className={`${q.correctAnswer === 'D' ? 'font-bold text-green-700' : ''}`}>D. {q.optionD}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
              <CardFooter className="bg-muted/50 justify-between">
                <p className="text-sm text-muted-foreground">Review the questions above.</p>
                <Button>
                  {examId ? "Confirm & Save to Exam" : "Save to Question Bank"}
                </Button>
              </CardFooter>
            </Card>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
