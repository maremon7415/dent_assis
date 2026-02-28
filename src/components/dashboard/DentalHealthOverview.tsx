import { currentUser } from "@clerk/nextjs/server";
import { format } from "date-fns";
import { BrainIcon, MessageSquareIcon } from "lucide-react";
import Link from "next/link";
import { getUserAppointmentStats } from "@/lib/actions/appointments";
import { Button } from "../ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";

async function DentalHealthOverview() {
  const appointmentStats = await getUserAppointmentStats();
  const user = await currentUser();

  return (
    <Card className="md:col-span-2 lg:col-span-2 overflow-hidden hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 border-2 hover:border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BrainIcon className="size-5 text-primary" />
          Your Dental Health
        </CardTitle>
        <CardDescription>
          Keep track of your dental care journey
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-3 sm:gap-6">
          <div className="text-center p-3 sm:p-4 bg-muted/30 rounded-xl">
            <div className="text-xl sm:text-2xl font-bold text-primary mb-1">
              {appointmentStats.completedAppointments}
            </div>
            <div className="text-xs sm:text-sm text-muted-foreground">
              Completed
            </div>
          </div>
          <div className="text-center p-3 sm:p-4 bg-muted/30 rounded-xl">
            <div className="text-xl sm:text-2xl font-bold text-primary mb-1">
              {appointmentStats.totalAppointments}
            </div>
            <div className="text-xs sm:text-sm text-muted-foreground">
              Total
            </div>
          </div>
          <div className="text-center p-3 sm:p-4 bg-muted/30 rounded-xl">
            <div className="text-xs sm:text-lg font-bold text-primary mb-1">
              {format(new Date(user?.createdAt!), "MMM yy")}
            </div>
            <div className="text-xs sm:text-sm text-muted-foreground">
              Member Since
            </div>
          </div>
        </div>

        <div className="mt-4 sm:mt-6 p-4 bg-gradient-to-r from-primary/10 to-primary/5 rounded-xl border border-primary/20">
          <div className="flex items-start gap-3">
            <div className="size-10 bg-primary/20 rounded-lg flex items-center justify-center shrink-0">
              <MessageSquareIcon className="size-5 text-primary" />
            </div>
            <div>
              <h4 className="font-semibold text-primary mb-1">
                Ready to get started?
              </h4>
              <p className="text-sm text-muted-foreground mb-3">
                Book your first appointment or try our AI voice assistant for
                instant dental advice.
              </p>
              <div className="flex flex-wrap gap-2">
                <Link href="/voice">
                  <Button size="sm" className="bg-primary hover:bg-primary/90">
                    Try AI Assistant
                  </Button>
                </Link>
                <Link href="/appointments">
                  <Button size="sm" variant="outline">
                    Book Appointment
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default DentalHealthOverview;
