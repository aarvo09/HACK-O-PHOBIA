import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { analyzeClassroomImage } from "@/lib/gemini";
import { sendAttendanceWarning } from "@/lib/mailer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

let prisma: PrismaClient | null = null;

function getPrismaClient(): PrismaClient {
  if (!prisma) prisma = new PrismaClient();
  return prisma;
}

export async function POST(req: NextRequest) {
  try {
    const prisma = getPrismaClient();
    const {
      sessionId,
      base64Image,
      mimeType,
      intervalString,
    }: {
      sessionId?: string;
      base64Image?: string;
      mimeType?: string;
      intervalString?: "first_10_min" | "last_10_min";
    } = await req.json();

    if (!sessionId || !base64Image) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const normalizedInterval = intervalString === "last_10_min" ? "last_10_min" : "first_10_min";

    // 1. Get Session & Expected Students
    const session = await prisma.classSession.findUnique({
      where: { id: sessionId },
      include: { 
        subject: { include: { course: true } },
        classroom: { include: { students: true } } 
      }
    });

    if (!session) return NextResponse.json({ error: "Session not found" }, { status: 404 });

    const expectedStudents = session.classroom.students;
    const emailDispatchDetails: Array<{
      studentName: string;
      studentEmail: string;
      attendancePercentage: number;
      targetEmail: string;
      sent: boolean;
      reason?: string;
    }> = [];

    // 2. Analyze with Gemini
    const aiResult = await analyzeClassroomImage(base64Image, mimeType || "image/jpeg", expectedStudents);

    // 3. Save Capture
    await prisma.attendanceCapture.create({
      data: {
        sessionId,
        intervalString: normalizedInterval,
        headcount: aiResult.presentStudentIds.length,
        status: aiResult.discrepancyFound ? "warning" : "good",
        aiNotes: aiResult.analysis,
        rawAiResponse: aiResult as any
      }
    });

    // 4. Update Student Attendance
    for (const rollNumber of aiResult.presentStudentIds) {
      const student = expectedStudents.find((s: any) => s.rollNumber === rollNumber);
      if (student) {
        await prisma.studentAttendance.upsert({
          where: { id: `att-${sessionId}-${student.id}` }, // Simplified unique key for demo
          update: { isPresent: true },
          create: {
            id: `att-${sessionId}-${student.id}`,
            studentId: student.id,
            sessionId,
            isPresent: true
          }
        });
      }
    }

    // 5. Attendance Summary & Email Logic (Automation Requirement)
    if (normalizedInterval === "last_10_min") {
      // Check for students who were at start but missing at end
      const firstCapture = await prisma.attendanceCapture.findFirst({
        where: { sessionId, intervalString: "first_10_min" }
      });

      if (firstCapture) {
         // Logic to identify students needing a warning
         // For this demo, we check students with < 75% attendance across all sessions
         for (const student of expectedStudents) {
            const totalSessions = await prisma.classSession.count({
              where: { subjectId: session.subjectId }
            });
            const attendeeSessions = await prisma.studentAttendance.count({
              where: { studentId: student.id, isPresent: true, session: { subjectId: session.subjectId } }
            });

            const attendancePercentage = (attendeeSessions / totalSessions) * 100;

            if (attendancePercentage < 75 && !aiResult.presentStudentIds.includes(student.rollNumber)) {
               // Student is absent AND under 75% -> Send Automated Warning
               console.log(`Triggering warning for ${student.name}: ${attendancePercentage}%`);
               const studentEmail = `${student.rollNumber.toLowerCase()}@university.edu`;
               const dispatch = await sendAttendanceWarning(
                 studentEmail, // Mock email
                 student.name,
                 attendancePercentage
               );
               emailDispatchDetails.push({
                 studentName: student.name,
                 studentEmail,
                 attendancePercentage,
                 ...dispatch,
               });
            }
         }
      }
    }

    return NextResponse.json({ 
      success: true, 
      presentCount: aiResult.presentStudentIds.length,
      analysis: aiResult.analysis,
      emailDispatch: {
        configuredForwardEmail: process.env.FORWARD_EMAIL?.trim() || null,
        attempted: emailDispatchDetails.length,
        sent: emailDispatchDetails.filter((entry) => entry.sent).length,
        details: emailDispatchDetails,
      },
    });

  } catch (error) {
    console.error("Webhook Error:", error);
    return NextResponse.json({ error: "Failed to process attendance" }, { status: 500 });
  }
}
