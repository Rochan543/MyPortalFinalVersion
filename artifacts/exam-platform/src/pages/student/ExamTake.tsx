import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useLocation } from "wouter";
import { 
  useGetAttempt, 
  useSaveAnswer, 
  useSubmitAttempt,
  useToggleBookmark
} from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Bookmark, ChevronLeft, ChevronRight, Flag, Grid, Send, AlertTriangle, Maximize } from "lucide-react";
import { Question, getGetAttemptQueryKey } from "@workspace/api-client-react";
import { useExamSecurity } from "@/hooks/useExamSecurity";

export function ExamTake() {
  const { attemptId } = useParams();
  const id = parseInt(attemptId || "0");
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const { data: attempt, isLoading, isError } = useGetAttempt(id, {
    query: {
      enabled: !!id,
      queryKey: getGetAttemptQueryKey(id),
    }
  });

  const saveMutation = useSaveAnswer();
  const submitMutation = useSubmitAttempt();
  const bookmarkMutation = useToggleBookmark();

  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [showViolationWarning, setShowViolationWarning] = useState(false);
  const [violationMessage, setViolationMessage] = useState("");

  // Local state for answers to provide immediate UI feedback
  const [answers, setAnswers] = useState<Record<number, { selectedOption?: string, markedForReview: boolean }>>({});

  // Initialize state from server data
  const initialized = useRef(false);
  useEffect(() => {
    if (attempt && !initialized.current) {
      initialized.current = true;
      
      // Load saved answers
      const initialAnswers: Record<number, any> = {};
      if (attempt.savedAnswers) {
        attempt.savedAnswers.forEach(ans => {
          initialAnswers[ans.questionId] = {
            selectedOption: ans.selectedOption,
            markedForReview: ans.markedForReview || false
          };
        });
      }
      setAnswers(initialAnswers);

      // Load timer from local storage or server
      const localTime = localStorage.getItem(`exam_timer_${id}`);
      if (localTime) {
        setTimeLeft(parseInt(localTime));
      } else {
        setTimeLeft(attempt.timeRemaining);
      }
    }
  }, [attempt, id]);

  // Timer logic
  useEffect(() => {
    if (!initialized.current || timeLeft <= 0) return;
    
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        const next = prev - 1;
        if (next % 10 === 0) {
          localStorage.setItem(`exam_timer_${id}`, next.toString());
        }
        if (next <= 0) {
          clearInterval(timer);
          handleAutoSubmit();
        }
        return next;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [timeLeft, id]);

  // Exam Security — only for non-topic-mock exams
  const isTopicMock = !!(attempt?.exam as any)?.isTopicMock;
  const examId = attempt?.examId ?? 0;

  const handleFirstViolation = useCallback(() => {
    setViolationMessage(
      "⚠️ Warning: You have violated exam rules. If this happens again, your exam will be automatically submitted."
    );
    setShowViolationWarning(true);
    toast({
      title: "Exam Rule Violation",
      description: "Stay on the exam screen. Tab switching is not allowed.",
      variant: "destructive",
    });
  }, [toast]);

  const handleAutoSubmitViolation = useCallback(() => {
    toast({
      title: "Exam Auto-Submitted",
      description: "Your exam was submitted due to multiple screen violations.",
      variant: "destructive",
    });
    submitMutation.mutate({ attemptId: id }, {
      onSuccess: () => {
        localStorage.removeItem(`exam_timer_${id}`);
        setLocation(`/results/${id}`);
      }
    });
  }, [id, submitMutation, setLocation, toast]);

  useExamSecurity({
    examId,
    attemptId: id,
    isTopicMock,
    onFirstViolation: handleFirstViolation,
    onAutoSubmit: handleAutoSubmitViolation,
  });

  // Derived data
  const allQuestions = attempt?.exam?.sections?.flatMap(s => s.questions || []) || [];
  const currentQuestion = allQuestions[currentQuestionIndex];
  
  // Formatting time
  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleSaveAnswer = useCallback((questionId: number, option?: string, marked?: boolean) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: {
        selectedOption: option !== undefined ? option : prev[questionId]?.selectedOption,
        markedForReview: marked !== undefined ? marked : (prev[questionId]?.markedForReview || false)
      }
    }));
    
    saveMutation.mutate({
      attemptId: id,
      data: {
        questionId,
        selectedOption: option,
        markedForReview: marked
      }
    });
  }, [id, saveMutation]);

  const handleAutoSubmit = useCallback(() => {
    submitMutation.mutate({ attemptId: id }, {
      onSuccess: () => {
        localStorage.removeItem(`exam_timer_${id}`);
        toast({ title: "Exam auto-submitted", description: "Time is up!" });
        setLocation(`/results/${id}`);
      }
    });
  }, [id, submitMutation, setLocation, toast]);

  const handleSubmit = () => {
    submitMutation.mutate({ attemptId: id }, {
      onSuccess: () => {
        localStorage.removeItem(`exam_timer_${id}`);
        toast({ title: "Exam submitted successfully" });
        setLocation(`/results/${id}`);
      },
      onError: (err) => {
        toast({ title: "Submit failed", description: err.message, variant: "destructive" });
        setShowSubmitDialog(false);
      }
    });
  };

  const toggleBookmark = (questionId: number) => {
    bookmarkMutation.mutate({ data: { questionId } });
    toast({ title: "Bookmark toggled" });
  };

  if (isLoading || !attempt) {
    return <div className="min-h-screen flex items-center justify-center">Loading Exam...</div>;
  }
  
  if (isError) {
    return <div className="min-h-screen flex items-center justify-center text-red-500">Error loading exam.</div>;
  }

  const answeredCount = Object.values(answers).filter(a => a.selectedOption).length;
  const markedCount = Object.values(answers).filter(a => a.markedForReview).length;

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Top Bar */}
      <header className="flex-none h-16 border-b flex items-center justify-between px-4 sm:px-6 bg-card sticky top-0 z-10">
        <div className="font-bold text-lg hidden sm:block truncate w-1/3">
          {attempt.exam?.title}
          {isTopicMock && (
            <span className="ml-2 text-xs font-normal text-muted-foreground bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
              Topic Mock
            </span>
          )}
        </div>
        
        <div className="flex-1 flex justify-center">
          <div className={`px-4 py-2 rounded-full font-mono text-xl font-bold flex items-center gap-2 ${timeLeft < 300 ? 'bg-red-100 text-red-700 animate-pulse' : 'bg-primary/10 text-primary'}`}>
            {formatTime(timeLeft)}
          </div>
        </div>
        
        <div className="flex justify-end w-1/3 gap-2">
          {!isTopicMock && !document.fullscreenElement && (
            <Button variant="outline" size="sm" onClick={() => document.documentElement.requestFullscreen?.()}>
              <Maximize className="h-4 w-4" />
            </Button>
          )}
          <Button variant="destructive" onClick={() => setShowSubmitDialog(true)}>
            <Send className="mr-2 h-4 w-4 hidden sm:inline" />
            Submit
          </Button>
        </div>
      </header>

      {/* Security Banner for real exams */}
      {!isTopicMock && (
        <div className="flex-none bg-orange-50 border-b border-orange-200 px-4 py-1.5 flex items-center gap-2 text-xs text-orange-700">
          <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
          <span>This is a monitored exam. Tab switching and screen minimize are not allowed. Stay on this screen.</span>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left side: Question & Options */}
        <main className="flex-1 flex flex-col min-w-0 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {currentQuestion && (
            <div className="max-w-4xl mx-auto w-full flex-1 flex flex-col">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold">Question {currentQuestionIndex + 1} of {allQuestions.length}</h2>
                <div className="flex gap-2">
                  <Badge className="font-mono bg-green-100 text-green-800 hover:bg-green-100">+{currentQuestion.marks}</Badge>
                  {currentQuestion.negativeMarks > 0 && (
                    <Badge variant="destructive" className="font-mono bg-red-100 text-red-800 hover:bg-red-100">-{currentQuestion.negativeMarks}</Badge>
                  )}
                  <Button variant="ghost" size="icon" onClick={() => toggleBookmark(currentQuestion.id)}>
                    <Bookmark className="h-5 w-5" />
                  </Button>
                </div>
              </div>

              <Card className="flex-1 border-2 border-border shadow-sm mb-6">
                <CardContent className="pt-6">
                  <div className="mb-8 text-base leading-relaxed overflow-y-auto max-h-72 scroll-smooth">
                    <p className="whitespace-pre-wrap break-words">{currentQuestion.questionText}</p>
                  </div>

                  <RadioGroup 
                    value={answers[currentQuestion.id]?.selectedOption || ""} 
                    onValueChange={(val) => handleSaveAnswer(currentQuestion.id, val, answers[currentQuestion.id]?.markedForReview)}
                    className="space-y-4"
                  >
                    {[
                      { id: "A", text: currentQuestion.optionA },
                      { id: "B", text: currentQuestion.optionB },
                      { id: "C", text: currentQuestion.optionC },
                      { id: "D", text: currentQuestion.optionD },
                    ].map(opt => (
                      <div key={opt.id} className="flex items-start space-x-3 border p-4 rounded-lg hover:bg-muted/50 transition-colors [&:has([data-state=checked])]:border-primary [&:has([data-state=checked])]:bg-primary/5">
                        <RadioGroupItem value={opt.id} id={`opt-${opt.id}`} className="mt-1" />
                        <Label htmlFor={`opt-${opt.id}`} className="flex-1 cursor-pointer text-base leading-relaxed font-normal">
                          <span className="font-bold mr-2 text-muted-foreground">{opt.id}.</span> {opt.text}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </CardContent>
              </Card>

              {/* Action Buttons */}
              <div className="flex flex-wrap justify-between gap-4 mt-auto">
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    onClick={() => handleSaveAnswer(currentQuestion.id, answers[currentQuestion.id]?.selectedOption, !answers[currentQuestion.id]?.markedForReview)}
                    className={answers[currentQuestion.id]?.markedForReview ? "bg-orange-100 text-orange-800 hover:bg-orange-200 border-orange-200" : ""}
                  >
                    <Flag className="mr-2 h-4 w-4" />
                    {answers[currentQuestion.id]?.markedForReview ? "Unmark Review" : "Mark for Review"}
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => handleSaveAnswer(currentQuestion.id, undefined, answers[currentQuestion.id]?.markedForReview)}
                  >
                    Clear Response
                  </Button>
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="secondary" 
                    disabled={currentQuestionIndex === 0}
                    onClick={() => setCurrentQuestionIndex(prev => prev - 1)}
                  >
                    <ChevronLeft className="mr-2 h-4 w-4" /> Previous
                  </Button>
                  <Button 
                    onClick={() => {
                      if (currentQuestionIndex < allQuestions.length - 1) {
                        setCurrentQuestionIndex(prev => prev + 1);
                      } else {
                        setShowSubmitDialog(true);
                      }
                    }}
                  >
                    {currentQuestionIndex < allQuestions.length - 1 ? "Save & Next" : "Submit Exam"} <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </main>

        {/* Right side: Palette */}
        <aside className="w-80 border-l bg-card hidden lg:flex flex-col flex-none">
          <div className="p-4 border-b">
            <h3 className="font-semibold flex items-center gap-2">
              <Grid className="h-4 w-4" /> Question Palette
            </h3>
            <div className="grid grid-cols-2 gap-2 text-xs mt-4">
              <div className="flex items-center gap-2"><div className="w-4 h-4 rounded-sm bg-green-500 border border-green-600"></div> Answered ({answeredCount})</div>
              <div className="flex items-center gap-2"><div className="w-4 h-4 rounded-sm bg-muted border border-border"></div> Unanswered ({allQuestions.length - answeredCount})</div>
              <div className="flex items-center gap-2"><div className="w-4 h-4 rounded-sm bg-orange-500 border border-orange-600"></div> Marked ({markedCount})</div>
            </div>
          </div>
          
          <ScrollArea className="flex-1 p-4">
            <div className="grid grid-cols-5 gap-2">
              {allQuestions.map((q, idx) => {
                const ans = answers[q.id];
                const isAnswered = !!ans?.selectedOption;
                const isMarked = ans?.markedForReview;
                
                let btnClass = "border-border text-foreground hover:bg-accent";
                if (isMarked) {
                  btnClass = "bg-orange-500 hover:bg-orange-600 text-white border-orange-600";
                } else if (isAnswered) {
                  btnClass = "bg-green-500 hover:bg-green-600 text-white border-green-600";
                }

                if (idx === currentQuestionIndex) {
                  btnClass += " ring-2 ring-primary ring-offset-2 ring-offset-background";
                }

                return (
                  <Button
                    key={q.id}
                    variant="outline"
                    className={`h-10 w-full p-0 ${btnClass}`}
                    onClick={() => setCurrentQuestionIndex(idx)}
                  >
                    {idx + 1}
                  </Button>
                );
              })}
            </div>
          </ScrollArea>
        </aside>
      </div>

      {/* Violation Warning Dialog */}
      <Dialog open={showViolationWarning} onOpenChange={setShowViolationWarning}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-orange-600">
              <AlertTriangle className="h-5 w-5" /> Exam Rule Violation
            </DialogTitle>
          </DialogHeader>
          <div className="py-3 text-sm">{violationMessage}</div>
          <DialogFooter>
            <Button onClick={() => setShowViolationWarning(false)}>I Understand</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Submit Confirm Dialog */}
      <Dialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Submit Exam?</DialogTitle>
            <DialogDescription>
              Are you sure you want to submit the exam? You cannot change your answers after submission.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="flex flex-col items-center justify-center p-4 border rounded-lg bg-green-50">
              <span className="text-2xl font-bold text-green-700">{answeredCount}</span>
              <span className="text-sm text-green-600">Answered</span>
            </div>
            <div className="flex flex-col items-center justify-center p-4 border rounded-lg bg-orange-50">
              <span className="text-2xl font-bold text-orange-700">{allQuestions.length - answeredCount}</span>
              <span className="text-sm text-orange-600">Unanswered</span>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSubmitDialog(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={submitMutation.isPending}>
              {submitMutation.isPending ? "Submitting..." : "Yes, Submit Exam"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Badge({ children, className, variant = "default" }: any) {
  return <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${className}`}>{children}</span>
}
