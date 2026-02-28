import DentalHealthOverview from "./DentalHealthOverview";
import NextAppointment from "./NextAppointment";

function ActivityOverview() {
  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-150 fill-mode-both">
      <DentalHealthOverview />
      <NextAppointment />
    </div>
  );
}
export default ActivityOverview;
