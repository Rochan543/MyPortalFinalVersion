import React from "react";
import { Link } from "wouter";
import {
  BookOpen,
  GraduationCap,
  Brain,
  FileText,
  Trophy,
  Clock,
  ShieldCheck,
  BarChart3,
  Users,
  CheckCircle2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function Home() {
  const exams = [
    "SSC CGL",
    "SSC CHSL",
    "SSC MTS",
    "SSC GD",
    "Bank PO",
    "Bank Clerk",
    "IBPS",
    "SBI PO",
    "RRB NTPC",
    "RRB Group D",
    "UPSC",
    "Police Exams",
    "State PSC",
    "Defence Exams",
  ];

  const features = [
    {
      icon: Clock,
      title: "Real Exam Environment",
      desc: "Practice with real timed mock tests designed exactly like official exams.",
    },
    {
      icon: Brain,
      title: "Topic Wise Practice",
      desc: "Master every topic with dedicated chapter-wise and subject-wise mocks.",
    },
    {
      icon: BarChart3,
      title: "Performance Analytics",
      desc: "Track accuracy, speed, weak areas, and overall improvement.",
    },
    {
      icon: ShieldCheck,
      title: "Secure Exam System",
      desc: "Fullscreen monitoring and anti-cheating protection for realistic preparation.",
    },
    {
      icon: FileText,
      title: "Previous Year Papers",
      desc: "Access and practice previous year question papers with full solutions.",
    },
    {
      icon: Trophy,
      title: "Competitive Rankings",
      desc: "Compare your performance with thousands of aspirants.",
    },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur sticky top-0 z-50">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold text-primary">
              MyPortal
            </span>
          </div>

          <div className="flex items-center gap-4">
            <Button variant="ghost" asChild>
              <Link href="/login">Log in</Link>
            </Button>

            <Button asChild>
              <Link href="/register">Get Started</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="container py-24 lg:py-32">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center rounded-full border px-4 py-2 text-sm mb-6 bg-muted">
              <CheckCircle2 className="h-4 w-4 mr-2 text-green-500" />
              India's Smart Competitive Exam Preparation Platform
            </div>

            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight leading-tight mb-6">
              Crack Your Dream Government Exam with{" "}
              <span className="text-primary">MyPortal</span>
            </h1>

            <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed mb-10">
              Prepare for SSC, Banking, RRB, UPSC, Defence, Police, and State
              Government exams using full-length mock tests, topic-wise practice,
              previous year papers, analytics, explanations, and real exam
              simulations.
            </p>

            <div className="flex flex-wrap justify-center gap-4">
              <Button size="lg" className="text-lg px-10 py-6" asChild>
                <Link href="/register">Start Preparing Free</Link>
              </Button>

              <Button variant="outline" size="lg" className="text-lg px-10 py-6" asChild>
                <Link href="/login">Explore Mock Tests</Link>
              </Button>
            </div>
          </div>
        </div>

        <div className="absolute inset-0 -z-10 opacity-30">
          <div className="absolute top-20 left-10 h-72 w-72 rounded-full bg-primary/20 blur-3xl" />
          <div className="absolute bottom-10 right-10 h-72 w-72 rounded-full bg-blue-500/20 blur-3xl" />
        </div>
      </section>

      {/* Exams Section */}
      <section className="container py-16">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4">
            Exams We Support
          </h2>

          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Prepare for all major competitive exams with high-quality practice
            tests and previous year papers.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {exams.map((exam) => (
            <Card
              key={exam}
              className="hover:shadow-xl transition-all duration-300 border-primary/10 hover:border-primary/40"
            >
              <CardContent className="p-5 flex items-center justify-center text-center font-semibold">
                {exam}
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-muted/40 py-20">
        <div className="container">
          <div className="text-center mb-14">
            <h2 className="text-4xl font-bold mb-4">
              Why Aspirants Choose MyPortal
            </h2>

            <p className="text-muted-foreground text-lg max-w-3xl mx-auto">
              Everything you need to prepare smarter, improve faster, and succeed
              confidently in competitive exams.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;

              return (
                <Card
                  key={index}
                  className="border-0 shadow-lg hover:shadow-2xl transition-all duration-300 rounded-2xl"
                >
                  <CardContent className="p-8">
                    <div className="h-14 w-14 rounded-xl bg-primary/10 flex items-center justify-center mb-6">
                      <Icon className="h-7 w-7 text-primary" />
                    </div>

                    <h3 className="text-2xl font-semibold mb-3">
                      {feature.title}
                    </h3>

                    <p className="text-muted-foreground leading-relaxed">
                      {feature.desc}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Offerings Section */}
      <section className="container py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-4xl font-bold mb-6">
              Complete Preparation Ecosystem
            </h2>

            <div className="space-y-5">
              {[
                "Full-Length Mock Tests",
                "Topic Wise Mini Tests",
                "Detailed Explanations",
                "Section Wise Analytics",
                "Previous Year Papers",
                "Downloadable Resources",
                "Real Exam Simulation",
                "Daily Practice Questions",
                "Performance Tracking",
                "Adaptive Learning",
              ].map((item) => (
                <div key={item} className="flex items-start gap-3">
                  <CheckCircle2 className="h-6 w-6 text-green-500 mt-0.5" />
                  <p className="text-lg">{item}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <Card className="rounded-2xl shadow-xl">
              <CardContent className="p-8 text-center">
                <Users className="h-10 w-10 mx-auto text-primary mb-4" />
                <h3 className="text-3xl font-bold">50K+</h3>
                <p className="text-muted-foreground mt-2">
                  Active Aspirants
                </p>
              </CardContent>
            </Card>

            <Card className="rounded-2xl shadow-xl">
              <CardContent className="p-8 text-center">
                <BookOpen className="h-10 w-10 mx-auto text-primary mb-4" />
                <h3 className="text-3xl font-bold">10K+</h3>
                <p className="text-muted-foreground mt-2">
                  Practice Questions
                </p>
              </CardContent>
            </Card>

            <Card className="rounded-2xl shadow-xl">
              <CardContent className="p-8 text-center">
                <FileText className="h-10 w-10 mx-auto text-primary mb-4" />
                <h3 className="text-3xl font-bold">500+</h3>
                <p className="text-muted-foreground mt-2">
                  Previous Papers
                </p>
              </CardContent>
            </Card>

            <Card className="rounded-2xl shadow-xl">
              <CardContent className="p-8 text-center">
                <Trophy className="h-10 w-10 mx-auto text-primary mb-4" />
                <h3 className="text-3xl font-bold">95%</h3>
                <p className="text-muted-foreground mt-2">
                  Student Satisfaction
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="container text-center">
          <h2 className="text-5xl font-bold mb-6">
            Start Your Success Journey Today
          </h2>

          <p className="text-xl opacity-90 max-w-2xl mx-auto mb-10">
            Join thousands of aspirants preparing smarter with MyPortal’s
            advanced mock tests and learning resources.
          </p>

          <Button
            size="lg"
            variant="secondary"
            className="text-lg px-10 py-6"
            asChild
          >
            <Link href="/register">Create Free Account</Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-muted/30">
        <div className="container py-14">
          <div className="grid md:grid-cols-4 gap-10">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <GraduationCap className="h-7 w-7 text-primary" />
                <span className="text-2xl font-bold">MyPortal</span>
              </div>

              <p className="text-muted-foreground leading-relaxed">
                India's modern competitive exam preparation platform for SSC,
                Banking, RRB, UPSC, Defence, and Government job aspirants.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-4">Exams</h3>

              <ul className="space-y-3 text-muted-foreground">
                <li>SSC Exams</li>
                <li>Banking Exams</li>
                <li>RRB Exams</li>
                <li>UPSC</li>
                <li>State PSC</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-4">Features</h3>

              <ul className="space-y-3 text-muted-foreground">
                <li>Mock Tests</li>
                <li>Topic Tests</li>
                <li>Previous Papers</li>
                <li>Resources</li>
                <li>Analytics</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-4">Quick Links</h3>

              <ul className="space-y-3 text-muted-foreground">
                <li>
                  <Link href="/login">Login</Link>
                </li>

                <li>
                  <Link href="/register">Register</Link>
                </li>

                <li>About Us</li>
                <li>Contact</li>
                <li>Privacy Policy</li>
              </ul>
            </div>
          </div>

          <div className="border-t mt-12 pt-6 text-center text-muted-foreground">
            © 2026 MyPortal. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}